# core/urls.py

from django.urls import path
from . import views

urlpatterns = [
    # Onboarding completo
    path('onboarding/complete/', views.OnboardingCompleteView.as_view(), name='onboarding-complete'),
]