# onboarding/urls.py
"""
URLs para el módulo de onboarding
"""

from django.urls import path
from . import views

urlpatterns = [
    # Onboarding completo (mantener compatibilidad)
    path('complete/', views.OnboardingCompleteView.as_view(), name='onboarding-complete'),
    
    # Validación de datos sin ejecutar
    path('validate/', views.OnboardingValidateView.as_view(), name='onboarding-validate'),
    
    # Health check
    path('health/', views.OnboardingHealthCheckView.as_view(), name='onboarding-health'),
] 