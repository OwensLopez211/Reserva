# schedule/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router para ViewSets
router = DefaultRouter()
router.register(r'schedules', views.ProfessionalScheduleViewSet, basename='schedule')
router.register(r'weekly-schedules', views.WeeklyScheduleViewSet, basename='weekly-schedule')
router.register(r'breaks', views.ScheduleBreakViewSet, basename='schedule-break')
router.register(r'exceptions', views.ScheduleExceptionViewSet, basename='schedule-exception')
router.register(r'availability', views.AvailabilitySlotViewSet, basename='availability')

urlpatterns = [
    # Resumen general de horarios
    path('overview/', views.ScheduleOverviewView.as_view(), name='schedule-overview'),
    
    # Horarios específicos por profesional
    path('professional/<uuid:professional_id>/', views.ProfessionalScheduleDetailView.as_view(), name='professional-schedule-detail'),
    
    # ViewSets URLs
    path('', include(router.urls)),
] 