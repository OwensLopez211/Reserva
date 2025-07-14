# onboarding/progress_views.py

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.http import JsonResponse
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .progress_service import OnboardingProgressService
from .models import OnboardingStep, OnboardingProgress, OnboardingSession
from .exceptions import OnboardingError, OnboardingValidationError, OnboardingTokenError
from plans.models import UserRegistration

logger = logging.getLogger(__name__)


class OnboardingProgressView(APIView):
    """
    Get comprehensive onboarding progress for a user registration
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Get onboarding progress status
        """
        try:
            token = request.GET.get('token')
            if not token:
                return Response({
                    'error': 'Token is required',
                    'error_code': 'TOKEN_REQUIRED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate token and get user registration
            try:
                user_registration = UserRegistration.objects.get(
                    temp_token=token,
                    is_expired=False,
                    is_completed=False
                )
                
                if not user_registration.is_valid:
                    raise OnboardingTokenError("Token has expired")
                    
            except UserRegistration.DoesNotExist:
                raise OnboardingTokenError("Invalid or expired token")
            
            # Get progress using service
            progress_service = OnboardingProgressService()
            progress_data = progress_service.get_onboarding_status(user_registration)
            
            logger.info(f"Retrieved onboarding progress for user {user_registration.email}")
            
            return Response(progress_data, status=status.HTTP_200_OK)
            
        except OnboardingTokenError as e:
            logger.warning(f"Token error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'TOKEN_ERROR'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        except OnboardingError as e:
            logger.error(f"Onboarding error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'ONBOARDING_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingStepView(APIView):
    """
    Manage individual onboarding steps
    """
    permission_classes = [AllowAny]
    
    def get(self, request, step_key):
        """
        Get details for a specific step
        """
        try:
            progress_service = OnboardingProgressService()
            step_details = progress_service.get_step_details(step_key)
            
            return Response(step_details, status=status.HTTP_200_OK)
            
        except OnboardingValidationError as e:
            return Response({
                'error': str(e),
                'error_code': 'STEP_NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
            
        except Exception as e:
            logger.error(f"Error getting step details: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def post(self, request, step_key):
        """
        Update progress for a specific step
        """
        try:
            token = request.data.get('token')
            if not token:
                return Response({
                    'error': 'Token is required',
                    'error_code': 'TOKEN_REQUIRED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate token
            try:
                user_registration = UserRegistration.objects.get(
                    temp_token=token,
                    is_expired=False,
                    is_completed=False
                )
                
                if not user_registration.is_valid:
                    raise OnboardingTokenError("Token has expired")
                    
            except UserRegistration.DoesNotExist:
                raise OnboardingTokenError("Invalid or expired token")
            
            # Extract step data and completion percentage
            step_data = request.data.get('data', {})
            completion_percentage = request.data.get('completion_percentage')
            
            # Update step progress
            progress_service = OnboardingProgressService()
            result = progress_service.update_step_progress(
                user_registration=user_registration,
                step_key=step_key,
                data=step_data,
                completion_percentage=completion_percentage
            )
            
            logger.info(f"Updated step {step_key} for user {user_registration.email}")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except OnboardingTokenError as e:
            logger.warning(f"Token error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'TOKEN_ERROR'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        except OnboardingValidationError as e:
            logger.warning(f"Validation error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'VALIDATION_ERROR',
                'step_key': step_key
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except OnboardingError as e:
            logger.error(f"Onboarding error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'ONBOARDING_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"Unexpected error updating step: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingStepCompleteView(APIView):
    """
    Complete a specific onboarding step
    """
    permission_classes = [AllowAny]
    
    def post(self, request, step_key):
        """
        Complete a specific step
        """
        try:
            token = request.data.get('token')
            if not token:
                return Response({
                    'error': 'Token is required',
                    'error_code': 'TOKEN_REQUIRED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate token
            try:
                user_registration = UserRegistration.objects.get(
                    temp_token=token,
                    is_expired=False,
                    is_completed=False
                )
                
                if not user_registration.is_valid:
                    raise OnboardingTokenError("Token has expired")
                    
            except UserRegistration.DoesNotExist:
                raise OnboardingTokenError("Invalid or expired token")
            
            # Extract step data
            step_data = request.data.get('data', {})
            
            # Complete step
            progress_service = OnboardingProgressService()
            result = progress_service.complete_step(
                user_registration=user_registration,
                step_key=step_key,
                data=step_data
            )
            
            logger.info(f"Completed step {step_key} for user {user_registration.email}")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except OnboardingTokenError as e:
            logger.warning(f"Token error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'TOKEN_ERROR'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        except OnboardingValidationError as e:
            logger.warning(f"Validation error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'VALIDATION_ERROR',
                'step_key': step_key
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except OnboardingError as e:
            logger.error(f"Onboarding error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'ONBOARDING_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"Unexpected error completing step: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingStepSkipView(APIView):
    """
    Skip a specific onboarding step
    """
    permission_classes = [AllowAny]
    
    def post(self, request, step_key):
        """
        Skip a specific step
        """
        try:
            token = request.data.get('token')
            if not token:
                return Response({
                    'error': 'Token is required',
                    'error_code': 'TOKEN_REQUIRED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate token
            try:
                user_registration = UserRegistration.objects.get(
                    temp_token=token,
                    is_expired=False,
                    is_completed=False
                )
                
                if not user_registration.is_valid:
                    raise OnboardingTokenError("Token has expired")
                    
            except UserRegistration.DoesNotExist:
                raise OnboardingTokenError("Invalid or expired token")
            
            # Extract skip reason
            reason = request.data.get('reason', '')
            
            # Skip step
            progress_service = OnboardingProgressService()
            result = progress_service.skip_step(
                user_registration=user_registration,
                step_key=step_key,
                reason=reason
            )
            
            logger.info(f"Skipped step {step_key} for user {user_registration.email}. Reason: {reason}")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except OnboardingTokenError as e:
            logger.warning(f"Token error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'TOKEN_ERROR'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        except OnboardingValidationError as e:
            logger.warning(f"Validation error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'VALIDATION_ERROR',
                'step_key': step_key
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except OnboardingError as e:
            logger.error(f"Onboarding error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'ONBOARDING_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"Unexpected error skipping step: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingResetView(APIView):
    """
    Reset onboarding progress
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Reset onboarding progress for a user registration
        """
        try:
            token = request.data.get('token')
            if not token:
                return Response({
                    'error': 'Token is required',
                    'error_code': 'TOKEN_REQUIRED'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate token
            try:
                user_registration = UserRegistration.objects.get(
                    temp_token=token,
                    is_expired=False
                )
                
                if not user_registration.is_valid and not user_registration.is_completed:
                    raise OnboardingTokenError("Token has expired")
                    
            except UserRegistration.DoesNotExist:
                raise OnboardingTokenError("Invalid token")
            
            # Reset onboarding
            progress_service = OnboardingProgressService()
            result = progress_service.reset_onboarding(user_registration)
            
            logger.info(f"Reset onboarding for user {user_registration.email}")
            
            return Response(result, status=status.HTTP_200_OK)
            
        except OnboardingTokenError as e:
            logger.warning(f"Token error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'TOKEN_ERROR'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        except OnboardingError as e:
            logger.error(f"Onboarding error: {e}")
            return Response({
                'error': str(e),
                'error_code': 'ONBOARDING_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        except Exception as e:
            logger.error(f"Unexpected error resetting onboarding: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingStepsListView(APIView):
    """
    Get list of all available onboarding steps
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Get list of all active onboarding steps
        """
        try:
            steps = OnboardingStep.objects.filter(is_active=True).order_by('display_order', 'step_number')
            
            steps_data = []
            for step in steps:
                steps_data.append({
                    'step_key': step.step_key,
                    'step_number': step.step_number,
                    'title': step.title,
                    'description': step.description,
                    'step_type': step.step_type,
                    'validation_type': step.validation_type,
                    'is_skippable': step.is_skippable,
                    'estimated_duration_minutes': step.estimated_duration_minutes,
                    'depends_on_steps': step.depends_on_steps,
                    'ui_config': step.ui_config
                })
            
            return Response({
                'steps': steps_data,
                'total_steps': len(steps_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting steps list: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingSessionView(APIView):
    """
    Get onboarding session information
    """
    permission_classes = [AllowAny]
    
    def get(self, request, session_id):
        """
        Get session information
        """
        try:
            session = get_object_or_404(OnboardingSession, id=session_id)
            
            return Response({
                'session_id': str(session.id),
                'status': session.status,
                'current_step': {
                    'step_key': session.current_step.step_key,
                    'title': session.current_step.title
                } if session.current_step else None,
                'completed_steps_count': session.completed_steps_count,
                'total_steps_count': session.total_steps_count,
                'overall_progress_percentage': session.overall_progress_percentage,
                'session_started_at': session.session_started_at.isoformat(),
                'last_activity_at': session.last_activity_at.isoformat(),
                'total_duration_seconds': session.total_duration_seconds,
                'error_count': session.error_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting session: {str(e)}")
            return Response({
                'error': 'Internal server error',
                'error_code': 'INTERNAL_ERROR'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)