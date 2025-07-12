# core/urls.py

from django.urls import path, include
from . import views

urlpatterns = [
    # Onboarding completo (mantener compatibilidad)
    path('onboarding/complete/', views.OnboardingCompleteView.as_view(), name='onboarding-complete'),
    
    # Nuevo módulo de onboarding con más funcionalidades
    path('onboarding/', include('onboarding.urls')),
]