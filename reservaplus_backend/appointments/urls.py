# appointments/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'history', views.AppointmentHistoryViewSet, basename='appointment-history')
router.register(r'recurring', views.RecurringAppointmentViewSet, basename='recurring-appointment')

urlpatterns = [
    # Vista de disponibilidad
    path('availability/', views.AvailabilityView.as_view(), name='availability'),
    
    # URLs del router
    path('', include(router.urls)),
]