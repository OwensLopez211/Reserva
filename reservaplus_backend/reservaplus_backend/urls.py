# reservaplus_backend/urls.py - URLS ACTUALIZADAS

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/', include([
        # Autenticación
        path('auth/', include('users.urls')),
        
        # Planes y registro
        path('', include('plans.urls')),
        
        # Core (onboarding)
        path('', include('core.urls')),
        
        # Organizaciones
        path('organizations/', include('organizations.urls')),
        
        # Appointments
        path('appointments/', include('appointments.urls')),
        
        # Schedule
        path('schedule/', include('schedule.urls')),
        
        # API Rest Framework (para navegación)
        path('', include('rest_framework.urls')),
    ])),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)