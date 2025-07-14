# onboarding/urls.py
"""
URLs para el módulo de onboarding
"""

from django.urls import path
from . import views, progress_views

urlpatterns = [
    # Onboarding completo (mantener compatibilidad)
    path('complete/', views.OnboardingCompleteView.as_view(), name='onboarding-complete'),
    
    # Validación de datos sin ejecutar
    path('validate/', views.OnboardingValidateView.as_view(), name='onboarding-validate'),
    
    # Health check
    path('health/', views.OnboardingHealthCheckView.as_view(), name='onboarding-health'),
    
    # ==================== NEW PROGRESS TRACKING ENDPOINTS ====================
    
    # Get overall onboarding progress
    path('progress/', progress_views.OnboardingProgressView.as_view(), name='onboarding-progress'),
    
    # Reset onboarding progress
    path('reset/', progress_views.OnboardingResetView.as_view(), name='onboarding-reset'),
    
    # Get list of all steps
    path('steps/', progress_views.OnboardingStepsListView.as_view(), name='onboarding-steps-list'),
    
    # Step-specific operations
    path('steps/<str:step_key>/', progress_views.OnboardingStepView.as_view(), name='onboarding-step-detail'),
    path('steps/<str:step_key>/complete/', progress_views.OnboardingStepCompleteView.as_view(), name='onboarding-step-complete'),
    path('steps/<str:step_key>/skip/', progress_views.OnboardingStepSkipView.as_view(), name='onboarding-step-skip'),
    
    # Session management
    path('sessions/<uuid:session_id>/', progress_views.OnboardingSessionView.as_view(), name='onboarding-session'),
] 