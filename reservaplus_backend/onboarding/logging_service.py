# onboarding/logging_service.py

import logging
import json
import traceback
from typing import Dict, Any, Optional
from datetime import datetime
from django.utils import timezone
from django.conf import settings

from .models import OnboardingSession


class OnboardingLogger:
    """
    Centralized logging service for onboarding operations with structured logging
    """
    
    def __init__(self, logger_name: str = __name__):
        self.logger = logging.getLogger(logger_name)
        self.logger.setLevel(logging.INFO)
        
        # Ensure we have console handler for development
        if settings.DEBUG and not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
    
    def log_onboarding_start(
        self, 
        user_email: str, 
        plan_name: str, 
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log the start of an onboarding process"""
        log_data = {
            'event': 'onboarding_started',
            'user_email': user_email,
            'plan_name': plan_name,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id,
            'metadata': metadata or {}
        }
        
        self.logger.info(
            f"🚀 Onboarding started for {user_email} with plan {plan_name}",
            extra={'structured_data': log_data}
        )
    
    def log_step_start(
        self, 
        user_email: str, 
        step_key: str, 
        step_title: str,
        session_id: Optional[str] = None
    ):
        """Log the start of a specific step"""
        log_data = {
            'event': 'step_started',
            'user_email': user_email,
            'step_key': step_key,
            'step_title': step_title,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        self.logger.info(
            f"📝 Step started: {step_key} ({step_title}) for {user_email}",
            extra={'structured_data': log_data}
        )
    
    def log_step_progress(
        self, 
        user_email: str, 
        step_key: str, 
        completion_percentage: int,
        validation_errors: Optional[list] = None,
        session_id: Optional[str] = None
    ):
        """Log progress update for a step"""
        log_data = {
            'event': 'step_progress_updated',
            'user_email': user_email,
            'step_key': step_key,
            'completion_percentage': completion_percentage,
            'has_validation_errors': bool(validation_errors),
            'validation_error_count': len(validation_errors) if validation_errors else 0,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        if validation_errors:
            self.logger.warning(
                f"⚠️ Step progress with errors: {step_key} for {user_email} - "
                f"{completion_percentage}% complete, {len(validation_errors)} errors",
                extra={'structured_data': log_data}
            )
        else:
            self.logger.info(
                f"📊 Step progress: {step_key} for {user_email} - {completion_percentage}% complete",
                extra={'structured_data': log_data}
            )
    
    def log_step_completed(
        self, 
        user_email: str, 
        step_key: str, 
        step_title: str,
        duration_seconds: Optional[int] = None,
        session_id: Optional[str] = None
    ):
        """Log successful completion of a step"""
        log_data = {
            'event': 'step_completed',
            'user_email': user_email,
            'step_key': step_key,
            'step_title': step_title,
            'duration_seconds': duration_seconds,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        duration_msg = f" in {duration_seconds}s" if duration_seconds else ""
        self.logger.info(
            f"✅ Step completed: {step_key} ({step_title}) for {user_email}{duration_msg}",
            extra={'structured_data': log_data}
        )
    
    def log_step_skipped(
        self, 
        user_email: str, 
        step_key: str, 
        reason: str,
        session_id: Optional[str] = None
    ):
        """Log when a step is skipped"""
        log_data = {
            'event': 'step_skipped',
            'user_email': user_email,
            'step_key': step_key,
            'skip_reason': reason,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        self.logger.info(
            f"⏭️ Step skipped: {step_key} for {user_email}. Reason: {reason}",
            extra={'structured_data': log_data}
        )
    
    def log_step_failed(
        self, 
        user_email: str, 
        step_key: str, 
        error_message: str,
        error_details: Optional[Dict[str, Any]] = None,
        session_id: Optional[str] = None
    ):
        """Log when a step fails"""
        log_data = {
            'event': 'step_failed',
            'user_email': user_email,
            'step_key': step_key,
            'error_message': error_message,
            'error_details': error_details or {},
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        self.logger.error(
            f"❌ Step failed: {step_key} for {user_email} - {error_message}",
            extra={'structured_data': log_data}
        )
    
    def log_onboarding_completed(
        self, 
        user_email: str, 
        total_duration_seconds: Optional[int] = None,
        total_steps_completed: Optional[int] = None,
        session_id: Optional[str] = None
    ):
        """Log successful completion of entire onboarding"""
        log_data = {
            'event': 'onboarding_completed',
            'user_email': user_email,
            'total_duration_seconds': total_duration_seconds,
            'total_steps_completed': total_steps_completed,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        duration_msg = f" in {total_duration_seconds}s" if total_duration_seconds else ""
        steps_msg = f" ({total_steps_completed} steps)" if total_steps_completed else ""
        
        self.logger.info(
            f"🎉 Onboarding completed for {user_email}{duration_msg}{steps_msg}",
            extra={'structured_data': log_data}
        )
    
    def log_onboarding_abandoned(
        self, 
        user_email: str, 
        last_step_key: Optional[str] = None,
        overall_progress_percentage: Optional[int] = None,
        session_id: Optional[str] = None
    ):
        """Log when onboarding is abandoned"""
        log_data = {
            'event': 'onboarding_abandoned',
            'user_email': user_email,
            'last_step_key': last_step_key,
            'overall_progress_percentage': overall_progress_percentage,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        progress_msg = f" at {overall_progress_percentage}%" if overall_progress_percentage else ""
        step_msg = f" (last step: {last_step_key})" if last_step_key else ""
        
        self.logger.warning(
            f"🚪 Onboarding abandoned by {user_email}{progress_msg}{step_msg}",
            extra={'structured_data': log_data}
        )
    
    def log_validation_error(
        self, 
        user_email: str, 
        step_key: str, 
        validation_errors: list,
        session_id: Optional[str] = None
    ):
        """Log validation errors with details"""
        log_data = {
            'event': 'validation_error',
            'user_email': user_email,
            'step_key': step_key,
            'validation_errors': validation_errors,
            'error_count': len(validation_errors),
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        self.logger.warning(
            f"⚠️ Validation errors in step {step_key} for {user_email}: {', '.join(validation_errors)}",
            extra={'structured_data': log_data}
        )
    
    def log_system_error(
        self, 
        error_type: str, 
        error_message: str, 
        user_email: Optional[str] = None,
        step_key: Optional[str] = None,
        session_id: Optional[str] = None,
        exception: Optional[Exception] = None
    ):
        """Log system errors with full details"""
        log_data = {
            'event': 'system_error',
            'error_type': error_type,
            'error_message': error_message,
            'user_email': user_email,
            'step_key': step_key,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        if exception:
            log_data['exception_type'] = type(exception).__name__
            log_data['traceback'] = traceback.format_exc()
        
        user_msg = f" for {user_email}" if user_email else ""
        step_msg = f" in step {step_key}" if step_key else ""
        
        self.logger.error(
            f"💥 System error: {error_type} - {error_message}{user_msg}{step_msg}",
            extra={'structured_data': log_data}
        )
    
    def log_token_error(
        self, 
        token: str, 
        error_message: str, 
        user_email: Optional[str] = None
    ):
        """Log token-related errors"""
        # Mask token for security (show only first 8 and last 4 characters)
        masked_token = f"{token[:8]}...{token[-4:]}" if len(token) > 12 else "***"
        
        log_data = {
            'event': 'token_error',
            'masked_token': masked_token,
            'error_message': error_message,
            'user_email': user_email,
            'timestamp': timezone.now().isoformat()
        }
        
        user_msg = f" for {user_email}" if user_email else ""
        
        self.logger.warning(
            f"🔑 Token error: {error_message}{user_msg} (token: {masked_token})",
            extra={'structured_data': log_data}
        )
    
    def log_performance_metric(
        self, 
        metric_name: str, 
        value: float, 
        unit: str = 'seconds',
        user_email: Optional[str] = None,
        step_key: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        """Log performance metrics"""
        log_data = {
            'event': 'performance_metric',
            'metric_name': metric_name,
            'value': value,
            'unit': unit,
            'user_email': user_email,
            'step_key': step_key,
            'timestamp': timezone.now().isoformat(),
            'session_id': session_id
        }
        
        context_msg = ""
        if user_email:
            context_msg += f" for {user_email}"
        if step_key:
            context_msg += f" in step {step_key}"
        
        self.logger.info(
            f"📈 Performance: {metric_name} = {value} {unit}{context_msg}",
            extra={'structured_data': log_data}
        )
    
    def log_session_created(self, session: OnboardingSession):
        """Log creation of new onboarding session"""
        log_data = {
            'event': 'session_created',
            'session_id': str(session.id),
            'user_email': session.user_registration.email,
            'session_key': session.session_key,
            'timestamp': session.session_started_at.isoformat()
        }
        
        self.logger.info(
            f"🔄 New onboarding session created for {session.user_registration.email}",
            extra={'structured_data': log_data}
        )
    
    def log_session_ended(
        self, 
        session: OnboardingSession, 
        end_reason: str = 'completed'
    ):
        """Log end of onboarding session"""
        log_data = {
            'event': 'session_ended',
            'session_id': str(session.id),
            'user_email': session.user_registration.email,
            'end_reason': end_reason,
            'total_duration_seconds': session.total_duration_seconds,
            'completed_steps_count': session.completed_steps_count,
            'overall_progress_percentage': session.overall_progress_percentage,
            'error_count': session.error_count,
            'timestamp': session.session_ended_at.isoformat() if session.session_ended_at else timezone.now().isoformat()
        }
        
        duration_msg = f" after {session.total_duration_seconds}s" if session.total_duration_seconds else ""
        
        self.logger.info(
            f"🏁 Session ended for {session.user_registration.email} - {end_reason}{duration_msg}",
            extra={'structured_data': log_data}
        )


class OnboardingErrorTracker:
    """
    Track and analyze onboarding errors for debugging and improvement
    """
    
    def __init__(self):
        self.logger = OnboardingLogger(f"{__name__}.ErrorTracker")
    
    def track_error(
        self, 
        error: Exception, 
        context: Dict[str, Any],
        user_email: Optional[str] = None,
        step_key: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        """Track an error with full context"""
        error_data = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context,
            'traceback': traceback.format_exc(),
            'timestamp': timezone.now().isoformat()
        }
        
        self.logger.log_system_error(
            error_type=error_data['error_type'],
            error_message=error_data['error_message'],
            user_email=user_email,
            step_key=step_key,
            session_id=session_id,
            exception=error
        )
        
        # Could also save to database for analysis
        # ErrorLog.objects.create(**error_data)
    
    def track_validation_error(
        self, 
        validation_errors: list, 
        context: Dict[str, Any],
        user_email: Optional[str] = None,
        step_key: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        """Track validation errors"""
        self.logger.log_validation_error(
            user_email=user_email,
            step_key=step_key,
            validation_errors=validation_errors,
            session_id=session_id
        )
        
        # Additional analysis could be done here
        # ValidationErrorAnalyzer.analyze(validation_errors, context)


# Global logger instances
onboarding_logger = OnboardingLogger()
error_tracker = OnboardingErrorTracker()