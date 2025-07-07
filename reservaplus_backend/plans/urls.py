# plans/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'plans', views.PlanViewSet, basename='plan')

urlpatterns = [
    # Health check
    path('health/', views.HealthCheckView.as_view(), name='health-check'),
    
    # Endpoint de signup
    path('signup/', views.SignupView.as_view(), name='signup'),
    
    # Estado del registro temporal
    path('registration/<str:token>/', views.RegistrationStatusView.as_view(), name='registration-status'),
    
    # Mi suscripción
    path('subscription/me/', views.MySubscriptionView.as_view(), name='my-subscription'),
    path('subscription/me/usage/', views.MySubscriptionUsageView.as_view(), name='my-subscription-usage'),
    
    # Router URLs (incluye /plans/)
    path('', include(router.urls)),
]