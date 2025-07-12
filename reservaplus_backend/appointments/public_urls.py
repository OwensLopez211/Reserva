# appointments/public_urls.py

from django.urls import path
from . import public_views, client_auth

urlpatterns = [
    # Información pública de la organización
    path('org/<str:org_slug>/', public_views.PublicOrganizationDetailView.as_view(), name='public-organization-detail'),
    
    # Disponibilidad pública
    path('org/<str:org_slug>/availability/', public_views.PublicAvailabilityView.as_view(), name='public-availability'),
    
    # Booking público
    path('org/<str:org_slug>/book/', public_views.PublicBookingView.as_view(), name='public-booking'),
    
    # Estado y gestión de citas públicas
    path('org/<str:org_slug>/appointments/<uuid:appointment_id>/', public_views.PublicAppointmentStatusView.as_view(), name='public-appointment-status'),
    path('org/<str:org_slug>/appointments/<uuid:appointment_id>/cancel/', public_views.PublicAppointmentCancelView.as_view(), name='public-appointment-cancel'),
    
    # Autenticación de clientes registrados
    path('org/<str:org_slug>/auth/login/', client_auth.ClientLoginView.as_view(), name='client-login'),
    path('org/<str:org_slug>/auth/verify-email/', client_auth.ClientVerifyEmailView.as_view(), name='client-verify-email'),
    
    # Perfil y citas de clientes registrados
    path('org/<str:org_slug>/client/profile/', client_auth.ClientProfileView.as_view(), name='client-profile'),
    path('org/<str:org_slug>/client/appointments/', client_auth.ClientAppointmentsView.as_view(), name='client-appointments'),
]