# organizations/urls.py - URLS COMPLETAS

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'organizations', views.OrganizationViewSet, basename='organization')
router.register(r'professionals', views.ProfessionalViewSet, basename='professional')
router.register(r'services', views.ServiceViewSet, basename='service')
router.register(r'clients', views.ClientViewSet, basename='client')

urlpatterns = [
    # Mi organización
    path('me/', views.MyOrganizationView.as_view(), name='my-organization'),
    
    # Router URLs
    path('', include(router.urls)),
]