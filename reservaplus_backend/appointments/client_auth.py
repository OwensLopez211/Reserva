# appointments/client_auth.py

import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from organizations.models import Organization, Client


class ClientAuthService:
    """
    Servicio de autenticación para clientes públicos
    """
    
    @staticmethod
    def generate_client_token(client):
        """
        Generar JWT token para cliente registrado
        """
        payload = {
            'client_id': str(client.id),
            'organization_id': str(client.organization.id),
            'client_type': client.client_type,
            'exp': timezone.now() + timedelta(days=30),  # Expira en 30 días
            'iat': timezone.now(),
            'type': 'client_access'
        }
        
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    
    @staticmethod
    def verify_client_token(token):
        """
        Verificar y decodificar JWT token de cliente
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            
            if payload.get('type') != 'client_access':
                return None
            
            client = Client.objects.get(
                id=payload['client_id'],
                organization_id=payload['organization_id'],
                client_type='registered',
                is_active=True
            )
            
            return client
            
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Client.DoesNotExist):
            return None


class ClientLoginView(APIView):
    """
    Vista para login de clientes registrados
    """
    permission_classes = [AllowAny]
    
    def post(self, request, org_slug):
        """
        Login de cliente registrado
        
        Body:
        {
            "email": "cliente@email.com",
            "password": "password123"
        }
        """
        try:
            organization = Organization.objects.get(
                slug=org_slug,
                is_active=True
            )
        except Organization.DoesNotExist:
            return Response(
                {'error': 'Organización no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'Email y contraseña son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(
                organization=organization,
                email=email,
                client_type='registered',
                is_active=True
            )
        except Client.DoesNotExist:
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not client.check_password(password):
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generar token
        token = ClientAuthService.generate_client_token(client)
        
        return Response({
            'success': True,
            'token': token,
            'client': {
                'id': str(client.id),
                'full_name': client.full_name,
                'email': client.email,
                'phone': client.phone,
                'email_verified': client.email_verified,
                'created_at': client.created_at.isoformat()
            },
            'organization': {
                'name': organization.name,
                'slug': organization.slug
            }
        })


class ClientVerifyEmailView(APIView):
    """
    Vista para verificar email de cliente registrado
    """
    permission_classes = [AllowAny]
    
    def post(self, request, org_slug):
        """
        Verificar email con token
        
        Body:
        {
            "email": "cliente@email.com",
            "verification_token": "token123"
        }
        """
        try:
            organization = Organization.objects.get(
                slug=org_slug,
                is_active=True
            )
        except Organization.DoesNotExist:
            return Response(
                {'error': 'Organización no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        email = request.data.get('email')
        verification_token = request.data.get('verification_token')
        
        if not email or not verification_token:
            return Response(
                {'error': 'Email y token de verificación son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            client = Client.objects.get(
                organization=organization,
                email=email,
                verification_token=verification_token,
                client_type='registered',
                is_active=True
            )
        except Client.DoesNotExist:
            return Response(
                {'error': 'Token de verificación inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if client.email_verified:
            return Response(
                {'message': 'Email ya verificado'},
                status=status.HTTP_200_OK
            )
        
        # Verificar email
        client.email_verified = True
        client.verification_token = None  # Limpiar token usado
        client.save()
        
        return Response({
            'success': True,
            'message': 'Email verificado exitosamente',
            'client': {
                'id': str(client.id),
                'email': client.email,
                'email_verified': True
            }
        })


class ClientProfileView(APIView):
    """
    Vista para obtener/actualizar perfil de cliente registrado
    """
    permission_classes = [AllowAny]
    
    def get(self, request, org_slug):
        """
        Obtener perfil de cliente autenticado
        """
        client = self._get_authenticated_client(request, org_slug)
        if isinstance(client, Response):
            return client
        
        # Obtener citas del cliente
        appointments = client.appointments.select_related(
            'service', 'professional'
        ).order_by('-start_datetime')[:10]
        
        return Response({
            'client': {
                'id': str(client.id),
                'full_name': client.full_name,
                'first_name': client.first_name,
                'last_name': client.last_name,
                'email': client.email,
                'phone': client.phone,
                'address': client.address,
                'emergency_contact': client.emergency_contact,
                'email_notifications': client.email_notifications,
                'sms_notifications': client.sms_notifications,
                'marketing_consent': client.marketing_consent,
                'email_verified': client.email_verified,
                'created_at': client.created_at.isoformat()
            },
            'appointments': [
                {
                    'id': str(apt.id),
                    'start_datetime': apt.start_datetime.isoformat(),
                    'status': apt.status,
                    'status_display': apt.get_status_display(),
                    'service': {
                        'name': apt.service.name,
                        'duration_minutes': apt.service.duration_minutes,
                        'price': float(apt.service.price)
                    },
                    'professional': {
                        'name': apt.professional.name,
                        'specialty': apt.professional.specialty
                    }
                }
                for apt in appointments
            ]
        })
    
    def put(self, request, org_slug):
        """
        Actualizar perfil de cliente
        """
        client = self._get_authenticated_client(request, org_slug)
        if isinstance(client, Response):
            return client
        
        # Campos actualizables
        updatable_fields = [
            'first_name', 'last_name', 'phone', 'address', 
            'emergency_contact', 'email_notifications', 
            'sms_notifications', 'marketing_consent'
        ]
        
        for field in updatable_fields:
            if field in request.data:
                setattr(client, field, request.data[field])
        
        client.save()
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente',
            'client': {
                'id': str(client.id),
                'full_name': client.full_name,
                'first_name': client.first_name,
                'last_name': client.last_name,
                'phone': client.phone,
                'address': client.address,
                'emergency_contact': client.emergency_contact,
                'email_notifications': client.email_notifications,
                'sms_notifications': client.sms_notifications,
                'marketing_consent': client.marketing_consent
            }
        })
    
    def _get_authenticated_client(self, request, org_slug):
        """
        Obtener cliente autenticado desde el token
        """
        try:
            organization = Organization.objects.get(
                slug=org_slug,
                is_active=True
            )
        except Organization.DoesNotExist:
            return Response(
                {'error': 'Organización no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener token del header Authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response(
                {'error': 'Token de autenticación requerido'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        token = auth_header.split(' ')[1]
        client = ClientAuthService.verify_client_token(token)
        
        if not client or client.organization != organization:
            return Response(
                {'error': 'Token de autenticación inválido'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return client


class ClientAppointmentsView(APIView):
    """
    Vista para gestionar citas de cliente registrado
    """
    permission_classes = [AllowAny]
    
    def get(self, request, org_slug):
        """
        Obtener citas del cliente autenticado
        """
        # Usar el mismo método de autenticación
        profile_view = ClientProfileView()
        client = profile_view._get_authenticated_client(request, org_slug)
        if isinstance(client, Response):
            return client
        
        # Filtros opcionales
        status_filter = request.query_params.get('status')
        limit = int(request.query_params.get('limit', 50))
        
        appointments_query = client.appointments.select_related(
            'service', 'professional', 'organization'
        ).order_by('-start_datetime')
        
        if status_filter:
            appointments_query = appointments_query.filter(status=status_filter)
        
        appointments = appointments_query[:limit]
        
        return Response({
            'appointments': [
                {
                    'id': str(apt.id),
                    'start_datetime': apt.start_datetime.isoformat(),
                    'end_datetime': apt.end_datetime.isoformat(),
                    'status': apt.status,
                    'status_display': apt.get_status_display(),
                    'notes': apt.notes,
                    'can_be_cancelled': apt.can_be_cancelled,
                    'time_until_appointment': apt.time_until_appointment,
                    'service': {
                        'name': apt.service.name,
                        'duration_minutes': apt.service.duration_minutes,
                        'price': float(apt.service.price),
                        'category': apt.service.category
                    },
                    'professional': {
                        'name': apt.professional.name,
                        'specialty': apt.professional.specialty
                    },
                    'organization': {
                        'name': apt.organization.name,
                        'address': apt.organization.address,
                        'phone': apt.organization.phone
                    }
                }
                for apt in appointments
            ],
            'total_count': client.appointments.count()
        })
    
    def post(self, request, org_slug):
        """
        Crear nueva cita para cliente registrado
        """
        profile_view = ClientProfileView()
        client = profile_view._get_authenticated_client(request, org_slug)
        if isinstance(client, Response):
            return client
        
        # Usar la misma lógica que PublicBookingView pero con cliente autenticado
        service_id = request.data.get('service_id')
        professional_id = request.data.get('professional_id')
        start_datetime_str = request.data.get('start_datetime')
        notes = request.data.get('notes', '')
        
        if not all([service_id, professional_id, start_datetime_str]):
            return Response(
                {'error': 'service_id, professional_id y start_datetime son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from datetime import datetime, timedelta
            from django.db import transaction
            from schedule.services import AvailabilityCalculationService
            
            service = Service.objects.get(
                id=service_id,
                organization=client.organization,
                is_active=True
            )
            professional = Professional.objects.get(
                id=professional_id,
                organization=client.organization,
                is_active=True
            )
            
            if not service.professionals.filter(id=professional.id).exists():
                return Response(
                    {'error': 'El profesional no puede realizar este servicio'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            start_datetime = datetime.fromisoformat(start_datetime_str.replace('Z', '+00:00'))
            
            # Verificar disponibilidad
            availability_service = AvailabilityCalculationService(professional)
            is_available, reason = availability_service.is_available_at_time(start_datetime, service)
            
            if not is_available:
                return Response(
                    {'error': f'Horario no disponible: {reason}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener usuario del sistema
            from users.models import User
            system_user = User.objects.filter(
                organization=client.organization,
                role='owner'
            ).first()
            
            with transaction.atomic():
                appointment = Appointment.objects.create(
                    organization=client.organization,
                    professional=professional,
                    service=service,
                    client=client,
                    start_datetime=start_datetime,
                    end_datetime=start_datetime + timedelta(minutes=service.duration_minutes),
                    duration_minutes=service.duration_minutes,
                    price=service.price,
                    status='pending',
                    notes=notes,
                    created_by=system_user
                )
                
                return Response({
                    'success': True,
                    'appointment': {
                        'id': str(appointment.id),
                        'start_datetime': appointment.start_datetime.isoformat(),
                        'end_datetime': appointment.end_datetime.isoformat(),
                        'status': appointment.status,
                        'notes': appointment.notes,
                        'service': {
                            'name': service.name,
                            'duration_minutes': service.duration_minutes,
                            'price': float(service.price)
                        },
                        'professional': {
                            'name': professional.name,
                            'specialty': professional.specialty
                        }
                    }
                }, status=status.HTTP_201_CREATED)
                
        except (Service.DoesNotExist, Professional.DoesNotExist):
            return Response(
                {'error': 'Servicio o profesional no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error interno: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )