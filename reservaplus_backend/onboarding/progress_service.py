# onboarding/progress_service.py

import logging
from typing import Dict, List, Optional, Tuple, Any
from django.db import transaction, models
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import OnboardingStep, OnboardingProgress, OnboardingSession
from .exceptions import OnboardingError, OnboardingValidationError, OnboardingTokenError
from plans.models import UserRegistration

logger = logging.getLogger(__name__)


class OnboardingProgressService:
    """
    Service for managing onboarding progress tracking and step-by-step navigation
    """
    
    def __init__(self):
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
    
    def initialize_onboarding_steps(self, user_registration: UserRegistration) -> Dict[str, Any]:
        """
        Initialize all onboarding steps for a user registration
        """
        try:
            with transaction.atomic():
                # Get all active onboarding steps
                steps = OnboardingStep.objects.filter(is_active=True).order_by('display_order', 'step_number')
                
                if not steps.exists():
                    raise OnboardingError("No active onboarding steps found")
                
                # Create progress records for each step
                progress_records = []
                for step in steps:
                    progress, created = OnboardingProgress.objects.get_or_create(
                        user_registration=user_registration,
                        step=step,
                        defaults={
                            'status': 'not_started',
                            'completion_percentage': 0,
                            'step_data': {},
                            'validation_errors': []
                        }
                    )
                    progress_records.append(progress)
                
                # Create initial session
                session = self._create_or_update_session(user_registration)
                
                self.logger.info(
                    f"Initialized {len(progress_records)} onboarding steps for user {user_registration.email}"
                )
                
                return {
                    'total_steps': len(progress_records),
                    'current_step': self._get_current_step(user_registration),
                    'progress_percentage': self._calculate_overall_progress(user_registration),
                    'session_id': str(session.id),
                    'steps': self._serialize_steps_progress(progress_records)
                }
                
        except Exception as e:
            self.logger.error(f"Failed to initialize onboarding steps: {str(e)}")
            raise OnboardingError(f"Failed to initialize onboarding: {str(e)}")
    
    def get_onboarding_status(self, user_registration: UserRegistration) -> Dict[str, Any]:
        """
        Get comprehensive onboarding status for a user registration
        """
        try:
            # Get or create progress records
            if not user_registration.progress_steps.exists():
                return self.initialize_onboarding_steps(user_registration)
            
            progress_records = user_registration.progress_steps.select_related('step').all()
            current_step = self._get_current_step(user_registration)
            overall_progress = self._calculate_overall_progress(user_registration)
            
            # Update session
            session = self._create_or_update_session(user_registration)
            
            return {
                'total_steps': progress_records.count(),
                'completed_steps': progress_records.filter(status__in=['completed', 'skipped']).count(),
                'current_step': current_step,
                'progress_percentage': overall_progress,
                'can_complete': self._can_complete_onboarding(user_registration),
                'session_id': str(session.id),
                'steps': self._serialize_steps_progress(progress_records),
                'next_step': self._get_next_available_step(user_registration),
                'estimated_time_remaining': self._estimate_time_remaining(user_registration)
            }
            
        except Exception as e:
            self.logger.error(f"Failed to get onboarding status: {str(e)}")
            raise OnboardingError(f"Failed to get onboarding status: {str(e)}")
    
    def update_step_progress(
        self, 
        user_registration: UserRegistration, 
        step_key: str, 
        data: Dict[str, Any],
        completion_percentage: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Update progress for a specific step
        """
        try:
            with transaction.atomic():
                # Get the step
                try:
                    step = OnboardingStep.objects.get(step_key=step_key, is_active=True)
                except OnboardingStep.DoesNotExist:
                    raise OnboardingValidationError(f"Step '{step_key}' not found or inactive")
                
                # Get or create progress record
                progress, created = OnboardingProgress.objects.get_or_create(
                    user_registration=user_registration,
                    step=step,
                    defaults={
                        'status': 'not_started',
                        'completion_percentage': 0,
                        'step_data': {},
                        'validation_errors': []
                    }
                )
                
                # Check if step is accessible
                if not step.is_accessible_for_registration(user_registration):
                    raise OnboardingValidationError(f"Step '{step_key}' is not accessible yet")
                
                # Update step data
                progress.step_data.update(data)
                
                # Validate the data
                validation_errors = step.validate_step_data(progress.step_data)
                progress.validation_errors = validation_errors
                
                # Update completion percentage
                if completion_percentage is not None:
                    progress.update_progress(completion_percentage, data)
                elif not validation_errors:
                    # If no validation errors and no explicit percentage, mark as complete
                    progress.complete_step(progress.step_data)
                else:
                    # Has validation errors, mark as in progress
                    progress.update_progress(50, data)
                
                # Update user registration basic progress
                self._update_user_registration_progress(user_registration)
                
                # Update session
                session = self._create_or_update_session(user_registration)
                session.update_progress()
                
                self.logger.info(
                    f"Updated step '{step_key}' for user {user_registration.email} - "
                    f"Status: {progress.status}, Percentage: {progress.completion_percentage}%"
                )
                
                return {
                    'step_key': step_key,
                    'status': progress.status,
                    'completion_percentage': progress.completion_percentage,
                    'validation_errors': validation_errors,
                    'is_valid': len(validation_errors) == 0,
                    'overall_progress': self._calculate_overall_progress(user_registration),
                    'next_step': self._get_next_available_step(user_registration)
                }
                
        except OnboardingValidationError:
            raise
        except Exception as e:
            self.logger.error(f"Failed to update step progress: {str(e)}")
            raise OnboardingError(f"Failed to update step progress: {str(e)}")
    
    def complete_step(
        self, 
        user_registration: UserRegistration, 
        step_key: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Complete a specific step
        """
        try:
            with transaction.atomic():
                # Get the step and progress
                step = OnboardingStep.objects.get(step_key=step_key, is_active=True)
                progress = OnboardingProgress.objects.get(
                    user_registration=user_registration,
                    step=step
                )
                
                # Validate data
                progress.step_data.update(data)
                validation_errors = step.validate_step_data(progress.step_data)
                
                if validation_errors:
                    progress.validation_errors = validation_errors
                    progress.save(update_fields=['validation_errors'])
                    raise OnboardingValidationError(
                        f"Cannot complete step '{step_key}': {', '.join(validation_errors)}"
                    )
                
                # Complete the step
                progress.complete_step(progress.step_data)
                
                # Update user registration progress
                self._update_user_registration_progress(user_registration)
                
                # Check if onboarding is complete
                if self._can_complete_onboarding(user_registration):
                    self._mark_onboarding_complete(user_registration)
                
                self.logger.info(f"Completed step '{step_key}' for user {user_registration.email}")
                
                return {
                    'step_completed': True,
                    'step_key': step_key,
                    'overall_progress': self._calculate_overall_progress(user_registration),
                    'onboarding_complete': user_registration.is_completed,
                    'next_step': self._get_next_available_step(user_registration)
                }
                
        except OnboardingStep.DoesNotExist:
            raise OnboardingValidationError(f"Step '{step_key}' not found")
        except OnboardingProgress.DoesNotExist:
            raise OnboardingValidationError(f"Progress record for step '{step_key}' not found")
        except OnboardingValidationError:
            raise
        except Exception as e:
            self.logger.error(f"Failed to complete step: {str(e)}")
            raise OnboardingError(f"Failed to complete step: {str(e)}")
    
    def skip_step(
        self, 
        user_registration: UserRegistration, 
        step_key: str, 
        reason: str = ""
    ) -> Dict[str, Any]:
        """
        Skip a step if it's skippable
        """
        try:
            with transaction.atomic():
                step = OnboardingStep.objects.get(step_key=step_key, is_active=True)
                progress = OnboardingProgress.objects.get(
                    user_registration=user_registration,
                    step=step
                )
                
                if not step.is_skippable:
                    raise OnboardingValidationError(f"Step '{step_key}' cannot be skipped")
                
                # Skip the step
                if progress.skip_step(reason):
                    # Update user registration progress
                    self._update_user_registration_progress(user_registration)
                    
                    self.logger.info(
                        f"Skipped step '{step_key}' for user {user_registration.email}. Reason: {reason}"
                    )
                    
                    return {
                        'step_skipped': True,
                        'step_key': step_key,
                        'overall_progress': self._calculate_overall_progress(user_registration),
                        'next_step': self._get_next_available_step(user_registration)
                    }
                else:
                    raise OnboardingValidationError(f"Failed to skip step '{step_key}'")
                    
        except OnboardingStep.DoesNotExist:
            raise OnboardingValidationError(f"Step '{step_key}' not found")
        except OnboardingProgress.DoesNotExist:
            raise OnboardingValidationError(f"Progress record for step '{step_key}' not found")
        except OnboardingValidationError:
            raise
        except Exception as e:
            self.logger.error(f"Failed to skip step: {str(e)}")
            raise OnboardingError(f"Failed to skip step: {str(e)}")
    
    def get_step_details(self, step_key: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific step
        """
        try:
            step = OnboardingStep.objects.get(step_key=step_key, is_active=True)
            
            return {
                'step_key': step.step_key,
                'step_number': step.step_number,
                'title': step.title,
                'description': step.description,
                'step_type': step.step_type,
                'validation_type': step.validation_type,
                'required_fields': step.required_fields,
                'is_skippable': step.is_skippable,
                'estimated_duration_minutes': step.estimated_duration_minutes,
                'ui_config': step.ui_config,
                'help_text': step.help_text,
                'depends_on_steps': step.depends_on_steps
            }
            
        except OnboardingStep.DoesNotExist:
            raise OnboardingValidationError(f"Step '{step_key}' not found")
    
    def reset_onboarding(self, user_registration: UserRegistration) -> Dict[str, Any]:
        """
        Reset onboarding progress for a user registration
        """
        try:
            with transaction.atomic():
                # Reset all progress records
                user_registration.progress_steps.all().delete()
                
                # Reset user registration fields
                user_registration.onboarding_step = 0
                user_registration.completed_steps = []
                user_registration.is_completed = False
                user_registration.completed_at = None
                user_registration.save(update_fields=[
                    'onboarding_step', 'completed_steps', 'is_completed', 'completed_at'
                ])
                
                # End current sessions
                user_registration.onboarding_sessions.filter(
                    status='active'
                ).update(status='abandoned', session_ended_at=timezone.now())
                
                # Reinitialize
                result = self.initialize_onboarding_steps(user_registration)
                
                self.logger.info(f"Reset onboarding for user {user_registration.email}")
                
                return result
                
        except Exception as e:
            self.logger.error(f"Failed to reset onboarding: {str(e)}")
            raise OnboardingError(f"Failed to reset onboarding: {str(e)}")
    
    # Private helper methods
    
    def _get_current_step(self, user_registration: UserRegistration) -> Optional[Dict[str, Any]]:
        """Get the current step for a user registration"""
        # First, try to find a step in progress
        current_progress = user_registration.progress_steps.filter(
            status='in_progress'
        ).select_related('step').first()
        
        if current_progress:
            return self._serialize_step_progress(current_progress)
        
        # If no step in progress, find the next available step
        next_progress = user_registration.progress_steps.filter(
            status='not_started'
        ).select_related('step').order_by('step__display_order', 'step__step_number').first()
        
        if next_progress:
            return self._serialize_step_progress(next_progress)
        
        return None
    
    def _get_next_available_step(self, user_registration: UserRegistration) -> Optional[Dict[str, Any]]:
        """Get the next available step"""
        next_progress = user_registration.progress_steps.filter(
            status='not_started'
        ).select_related('step').order_by('step__display_order', 'step__step_number').first()
        
        if next_progress and next_progress.step.is_accessible_for_registration(user_registration):
            return self._serialize_step_progress(next_progress)
        
        return None
    
    def _calculate_overall_progress(self, user_registration: UserRegistration) -> int:
        """Calculate overall progress percentage"""
        progress_records = user_registration.progress_steps.all()
        total_steps = progress_records.count()
        
        if total_steps == 0:
            return 0
        
        total_percentage = sum(record.completion_percentage for record in progress_records)
        return int(total_percentage / total_steps)
    
    def _can_complete_onboarding(self, user_registration: UserRegistration) -> bool:
        """Check if onboarding can be completed"""
        # All required steps must be completed or skipped
        required_steps = user_registration.progress_steps.filter(
            step__validation_type='required'
        )
        
        incomplete_required = required_steps.exclude(
            status__in=['completed', 'skipped']
        )
        
        return not incomplete_required.exists()
    
    def _update_user_registration_progress(self, user_registration: UserRegistration):
        """Update basic progress fields in user registration"""
        progress_records = user_registration.progress_steps.all()
        completed_steps = progress_records.filter(status__in=['completed', 'skipped'])
        
        # Update step number (current step)
        current_step = progress_records.filter(status='in_progress').first()
        if current_step:
            user_registration.onboarding_step = current_step.step.step_number
        else:
            next_step = progress_records.filter(status='not_started').first()
            if next_step:
                user_registration.onboarding_step = next_step.step.step_number
            else:
                user_registration.onboarding_step = progress_records.count()
        
        # Update completed steps list
        user_registration.completed_steps = list(
            completed_steps.values_list('step__step_key', flat=True)
        )
        
        user_registration.save(update_fields=['onboarding_step', 'completed_steps'])
    
    def _mark_onboarding_complete(self, user_registration: UserRegistration):
        """Mark onboarding as complete"""
        user_registration.is_completed = True
        user_registration.completed_at = timezone.now()
        user_registration.save(update_fields=['is_completed', 'completed_at'])
        
        # End all active sessions
        user_registration.onboarding_sessions.filter(
            status='active'
        ).update(status='completed', session_ended_at=timezone.now())
    
    def _create_or_update_session(self, user_registration: UserRegistration) -> OnboardingSession:
        """Create or update onboarding session"""
        # Try to get active session
        active_session = user_registration.onboarding_sessions.filter(
            status='active'
        ).first()
        
        if active_session:
            active_session.last_activity_at = timezone.now()
            active_session.save(update_fields=['last_activity_at'])
            return active_session
        
        # Create new session
        import secrets
        session_key = secrets.token_urlsafe(32)
        
        session = OnboardingSession.objects.create(
            user_registration=user_registration,
            session_key=session_key,
            status='active'
        )
        
        return session
    
    def _serialize_step_progress(self, progress: OnboardingProgress) -> Dict[str, Any]:
        """Serialize step progress for API response"""
        return {
            'step_key': progress.step.step_key,
            'step_number': progress.step.step_number,
            'title': progress.step.title,
            'description': progress.step.description,
            'step_type': progress.step.step_type,
            'status': progress.status,
            'completion_percentage': progress.completion_percentage,
            'is_skippable': progress.step.is_skippable,
            'estimated_duration_minutes': progress.step.estimated_duration_minutes,
            'required_fields': progress.step.required_fields,
            'validation_errors': progress.validation_errors,
            'step_data': progress.step_data,
            'ui_config': progress.step.ui_config,
            'help_text': progress.step.help_text,
            'started_at': progress.started_at.isoformat() if progress.started_at else None,
            'completed_at': progress.completed_at.isoformat() if progress.completed_at else None,
        }
    
    def _serialize_steps_progress(self, progress_records) -> List[Dict[str, Any]]:
        """Serialize multiple step progress records"""
        return [self._serialize_step_progress(progress) for progress in progress_records]
    
    def _estimate_time_remaining(self, user_registration: UserRegistration) -> int:
        """Estimate remaining time in minutes"""
        remaining_steps = user_registration.progress_steps.filter(
            status__in=['not_started', 'in_progress']
        ).select_related('step')
        
        total_minutes = sum(step.step.estimated_duration_minutes for step in remaining_steps)
        return total_minutes