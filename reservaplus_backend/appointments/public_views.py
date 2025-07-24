# appointments/public_views.py

from datetime import datetime, timedelta
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes
from organizations.models import Organization, Professional, Service, Client
from appointments.models import Appointment
from users.models import User
from schedule.services import AvailabilityCalculationService, MultiProfessionalAvailabilityService


class PublicOrganizationDetailView(APIView):
    """
    Vista pública para obtener detalles de una organización del marketplace
    """
    permission_classes = [AllowAny]
    
    def get(self, request, org_slug):
        """
        Obtener información pública de una organización
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
        
        # Obtener profesionales activos que aceptan reservas
        professionals = Professional.objects.filter(
            organization=organization,
            is_active=True,
            schedule__accepts_bookings=True,
            schedule__is_active=True
        ).order_by('name')
        
        # Obtener servicios activos
        services = Service.objects.filter(
            organization=organization,
            is_active=True
        ).prefetch_related('professionals').order_by('category', 'name')
        
        # Agrupar servicios por categoría
        services_by_category = {}
        for service in services:
            category = service.category or 'General'
            if category not in services_by_category:
                services_by_category[category] = []
            
            services_by_category[category].append({
                'id': str(service.id),
                'name': service.name,
                'description': service.description,
                'duration_minutes': service.total_duration_minutes,
                'price': float(service.price),
                'category': service.category,
                'professionals': [
                    {
                        'id': str(prof.id),
                        'name': prof.name,
                        'specialty': prof.specialty
                    }
                    for prof in service.professionals.filter(
                        is_active=True,
                        schedule__accepts_bookings=True,
                        schedule__is_active=True
                    )
                ]
            })
        
        return Response({
            'organization': {
                'id': str(organization.id),
                'name': organization.name,
                'slug': organization.slug,
                'description': organization.description,
                'industry': organization.get_industry_template_display(),
                'email': organization.email,
                'phone': organization.phone,
                'website': organization.website,
                'address': organization.address,
                'city': organization.city,
                'country': organization.country,
                'logo': organization.logo,
                'cover_image': organization.cover_image,
                'gallery_images': organization.gallery_images,
                'rating': float(organization.rating),
                'total_reviews': organization.total_reviews,
                'is_featured': organization.is_featured
            },
            'professionals': [
                {
                    'id': str(prof.id),
                    'name': prof.name,
                    'specialty': prof.specialty,
                    'bio': prof.bio,
                    'accepts_walk_ins': prof.accepts_walk_ins,
                    'color_code': prof.color_code
                }
                for prof in professionals
            ],
            'services_by_category': services_by_category,
            'booking_settings': {
                'terminology': organization.terminology,
                'business_rules': organization.business_rules
            }
        })


class PublicAvailabilityView(APIView):
    """
    Vista pública para obtener disponibilidad de citas
    """
    permission_classes = [AllowAny]
    
    def get(self, request, org_slug):
        """
        Obtener slots disponibles para booking público
        
        Parámetros:
        - service_id: ID del servicio (requerido)
        - professional_id: ID del profesional (opcional)
        - date: Fecha en formato YYYY-MM-DD (opcional, default: hoy)
        - days_ahead: Días hacia adelante (opcional, default: 7)
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
        
        service_id = request.query_params.get('service_id')
        professional_id = request.query_params.get('professional_id')
        date_str = request.query_params.get('date')
        days_ahead = int(request.query_params.get('days_ahead', 7))
        
        if not service_id:
            return Response(
                {'error': 'service_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener servicio
        try:
            service = Service.objects.get(
                id=service_id,
                organization=organization,
                is_active=True
            )
        except Service.DoesNotExist:
            return Response(
                {'error': 'Servicio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Determinar fecha de inicio
        if date_str:
            try:
                start_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            start_date = timezone.now().date()
        
        # Verificar que la fecha no sea en el pasado
        if start_date < timezone.now().date():
            start_date = timezone.now().date()
        
        # Determinar profesionales
        professional_ids = [professional_id] if professional_id else None
        
        # Calcular disponibilidad por días
        availability_by_date = {}
        current_date = start_date
        
        for day in range(days_ahead):
            date_key = current_date.isoformat()
            
            # Obtener disponibilidad para el día
            daily_availability = MultiProfessionalAvailabilityService.get_available_slots_for_service(
                service, current_date, professional_ids
            )
            
            # Formatear slots para la respuesta
            formatted_slots = []
            for prof_id, slots in daily_availability.items():
                available_slots = [slot for slot in slots if slot['is_available']]
                formatted_slots.extend([
                    {
                        'start_datetime': slot['start_datetime'].isoformat(),
                        'end_datetime': slot['end_datetime'].isoformat(),
                        'start_time': slot['start_time'].strftime('%H:%M'),
                        'end_time': slot['end_time'].strftime('%H:%M'),
                        'professional_id': slot['professional_id'],
                        'professional_name': slot['professional_name'],
                        'duration_minutes': slot['duration_minutes']
                    }
                    for slot in available_slots
                ])
            
            # Ordenar por hora
            formatted_slots.sort(key=lambda x: x['start_time'])
            
            availability_by_date[date_key] = {
                'date': date_key,
                'weekday': current_date.strftime('%A'),
                'total_slots': len(formatted_slots),
                'slots': formatted_slots
            }
            
            current_date += timedelta(days=1)
        
        return Response({
            'organization_slug': org_slug,
            'service': {
                'id': str(service.id),
                'name': service.name,
                'duration_minutes': service.total_duration_minutes,
                'price': float(service.price)
            },
            'professional_filter': professional_id,
            'date_range': {
                'start_date': start_date.isoformat(),
                'end_date': (start_date + timedelta(days=days_ahead-1)).isoformat(),
                'days_ahead': days_ahead
            },
            'availability': availability_by_date
        })


class PublicBookingView(APIView):
    """
    Vista para realizar booking público (guest o registrado)
    """
    permission_classes = [AllowAny]
    
    def post(self, request, org_slug):
        """
        Crear cita desde booking público
        
        Body:
        {
            "booking_type": "guest" | "registered",
            "service_id": "uuid",
            "professional_id": "uuid",
            "start_datetime": "2024-01-15T10:00:00Z",
            "client_data": {
                "first_name": "Juan",
                "last_name": "Pérez",
                "email": "juan@email.com",
                "phone": "+56912345678",
                "notes": "Alguna nota especial"
            },
            // Para clientes registrados:
            "password": "password123",
            // Para clientes guest adicional:
            "emergency_contact": "María: +56987654321",
            "marketing_consent": true
        }
        """
        print(f"\n=== PUBLIC BOOKING DEBUG ===")
        print(f"Looking for organization with slug: '{org_slug}'")
        
        try:
            organization = Organization.objects.get(
                slug=org_slug,
                is_active=True
            )
            print(f"✅ Found organization: {organization.name}")
        except Organization.DoesNotExist:
            print(f"❌ Organization not found with slug: '{org_slug}'")
            
            # Show available organizations for debugging
            available_orgs = Organization.objects.filter(is_active=True).values_list('slug', flat=True)[:5]
            print(f"💡 Available organizations: {list(available_orgs)}")
            
            # Check if organization exists but is inactive
            inactive_org = Organization.objects.filter(slug=org_slug).first()
            if inactive_org:
                return Response(
                    {'error': f'La organización "{org_slug}" está inactiva'},
                    status=status.HTTP_403_FORBIDDEN
                )
            else:
                return Response(
                    {'error': f'No se encontró una organización con el identificador "{org_slug}". Organizaciones disponibles: {list(available_orgs)}'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Debug: Log received data
        print(f"DEBUG: Received booking data: {request.data}")
        
        # Validar datos requeridos
        booking_type = request.data.get('booking_type', 'guest')
        service_id = request.data.get('service_id')
        professional_id = request.data.get('professional_id')
        start_datetime_str = request.data.get('start_datetime')
        client_data = request.data.get('client_data', {})
        
        print(f"DEBUG: Parsed fields - booking_type: {booking_type}, service_id: {service_id}, professional_id: {professional_id}, start_datetime: {start_datetime_str}, client_data: {client_data}")
        
        if not all([service_id, professional_id, start_datetime_str, client_data]):
            missing_fields = []
            if not service_id: missing_fields.append('service_id')
            if not professional_id: missing_fields.append('professional_id')
            if not start_datetime_str: missing_fields.append('start_datetime')
            if not client_data: missing_fields.append('client_data')
            
            return Response(
                {'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar datos del cliente
        required_client_fields = ['first_name', 'last_name', 'email', 'phone']
        missing_client_fields = [field for field in required_client_fields if field not in client_data]
        if missing_client_fields:
            return Response(
                {'error': f'client_data debe incluir: {", ".join(missing_client_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"DEBUG: All validations passed, proceeding with booking creation")
        
        try:
            # Obtener objetos
            print(f"DEBUG: Looking for service with ID: {service_id}")
            service = Service.objects.get(
                id=service_id,
                organization=organization,
                is_active=True
            )
            print(f"DEBUG: Found service: {service.name}")
            
            print(f"DEBUG: Looking for professional with ID: {professional_id}")
            professional = Professional.objects.get(
                id=professional_id,
                organization=organization,
                is_active=True
            )
            print(f"DEBUG: Found professional: {professional.name}")
            
            # Verificar que el profesional puede realizar el servicio
            print(f"DEBUG: Checking if professional can perform service...")
            can_perform = service.professionals.filter(id=professional.id).exists()
            print(f"DEBUG: Professional can perform service: {can_perform}")
            
            if not can_perform:
                print(f"DEBUG: Professional {professional.name} cannot perform service {service.name}")
                service_professionals = service.professionals.all()
                print(f"DEBUG: Service professionals: {[p.name for p in service_professionals]}")
                return Response(
                    {'error': 'El profesional no puede realizar este servicio'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Parsear fecha
            print(f"DEBUG: Parsing datetime: {start_datetime_str}")
            try:
                # Parse the datetime string with timezone awareness
                start_datetime_local = datetime.fromisoformat(start_datetime_str.replace('Z', '+00:00'))
                
                print(f"DEBUG: Parsed datetime (local): {start_datetime_local}")
                print(f"DEBUG: Timezone info: {start_datetime_local.tzinfo}")
                print(f"DEBUG: Is naive? {timezone.is_naive(start_datetime_local)}")
                
                # If the datetime is naive, make it timezone-aware using the organization's timezone
                if timezone.is_naive(start_datetime_local):
                    start_datetime_local = timezone.make_aware(start_datetime_local)
                    print(f"DEBUG: Made timezone-aware: {start_datetime_local}")
                
                print(f"DEBUG: Using local time for availability check: {start_datetime_local}")
            except Exception as e:
                print(f"DEBUG: Error parsing datetime: {str(e)}")
                return Response(
                    {'error': f'Error en formato de fecha: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verificar disponibilidad usando la hora local
            print(f"DEBUG: Checking availability for {start_datetime_local}")
            try:
                availability_service = AvailabilityCalculationService(professional)
                is_available, reason = availability_service.is_available_at_time(start_datetime_local, service)
                print(f"DEBUG: Availability check result: {is_available}, reason: {reason}")
            except Exception as e:
                print(f"DEBUG: Error checking availability: {str(e)}")
                import traceback
                print(f"DEBUG: Availability error traceback: {traceback.format_exc()}")
                return Response(
                    {'error': f'Error verificando disponibilidad: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not is_available:
                print(f"DEBUG: Slot not available: {reason}")
                return Response(
                    {'error': f'Horario no disponible: {reason}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            with transaction.atomic():
                print(f"DEBUG: Starting transaction for booking creation")
                
                # Crear o obtener cliente
                if booking_type == 'registered':
                    print(f"DEBUG: Creating registered client")
                    password = request.data.get('password')
                    if not password:
                        return Response(
                            {'error': 'password es requerido para clientes registrados'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Verificar si ya existe un cliente con este email
                    existing_client = Client.objects.filter(
                        organization=organization,
                        email=client_data['email']
                    ).first()
                    
                    if existing_client:
                        return Response(
                            {'error': 'Ya existe un cliente con este email'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Extract notes to avoid duplicate keyword argument
                    client_data_copy = client_data.copy()
                    notes = client_data_copy.pop('notes', '')
                    
                    client = Client.create_registered_client(
                        organization=organization,
                        password=password,
                        emergency_contact=request.data.get('emergency_contact', ''),
                        marketing_consent=request.data.get('marketing_consent', False),
                        notes=notes,
                        **client_data_copy
                    )
                    
                else:  # guest
                    print(f"DEBUG: Creating guest client with data: {client_data}")
                    
                    # Check if a guest client with this email already exists
                    existing_guest = Client.objects.filter(
                        organization=organization,
                        email=client_data['email'],
                        client_type='guest'
                    ).first()
                    
                    if existing_guest:
                        print(f"DEBUG: Found existing guest client: {existing_guest.full_name}")
                        # Update the existing guest client's token expiration for this new booking
                        existing_guest.generate_guest_token()
                        existing_guest.save()
                        client = existing_guest
                    else:
                        print(f"DEBUG: Creating new guest client")
                        # Extract notes to avoid duplicate keyword argument
                        client_data_copy = client_data.copy()
                        notes = client_data_copy.pop('notes', '')
                        
                        print(f"DEBUG: Client data after removing notes: {client_data_copy}")
                        print(f"DEBUG: Emergency contact: {request.data.get('emergency_contact', '')}")
                        print(f"DEBUG: Marketing consent: {request.data.get('marketing_consent', False)}")
                        
                        try:
                            client = Client.create_guest_client(
                                organization=organization,
                                emergency_contact=request.data.get('emergency_contact', ''),
                                marketing_consent=request.data.get('marketing_consent', False),
                                notes=notes,
                                **client_data_copy
                            )
                            print(f"DEBUG: Successfully created guest client: {client.full_name}")
                        except Exception as e:
                            print(f"DEBUG: Error creating guest client: {str(e)}")
                            import traceback
                            print(f"DEBUG: Traceback: {traceback.format_exc()}")
                            raise
                
                # Crear usuario sistema para la cita (owner de la organización)
                print(f"DEBUG: Looking for system user (owner) for organization")
                system_user = User.objects.filter(
                    organization=organization,
                    role='owner'
                ).first()
                
                if not system_user:
                    print(f"DEBUG: No owner user found for organization")
                    return Response(
                        {'error': 'No se pudo procesar la reserva'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                print(f"DEBUG: Found system user: {system_user.username}")
                
                # Crear la cita (convertir a naive datetime para almacenar hora local)
                # Django automáticamente convierte a UTC, así que removemos timezone info
                start_datetime_naive = start_datetime_local.replace(tzinfo=None)
                end_datetime_naive = start_datetime_naive + timedelta(minutes=service.total_duration_minutes)
                
                print(f"DEBUG: Creating appointment with:")
                print(f"  - Start datetime (local with tz): {start_datetime_local}")
                print(f"  - Start datetime (naive for DB): {start_datetime_naive}")
                print(f"  - End datetime (naive for DB): {end_datetime_naive}")
                print(f"  - Service duration: {service.total_duration_minutes} minutes")
                print(f"  - Service price: {service.price}")
                
                appointment = Appointment(
                    organization=organization,
                    professional=professional,
                    service=service,
                    client=client,
                    start_datetime=start_datetime_naive,
                    end_datetime=end_datetime_naive,
                    duration_minutes=service.total_duration_minutes,
                    price=service.price,
                    status='pending',
                    notes=client_data.get('notes', ''),
                    created_by=system_user
                )
                
                # Save the appointment with validation
                print(f"DEBUG: Saving appointment...")
                try:
                    # Temporarily disable timezone conversion by setting USE_TZ to False
                    from django.conf import settings
                    original_use_tz = settings.USE_TZ
                    settings.USE_TZ = False
                    
                    try:
                        # Now save with naive datetime - Django won't convert to UTC
                        appointment.save()
                        print(f"DEBUG: Successfully created appointment: {appointment.id}")
                    finally:
                        # Restore original timezone setting
                        settings.USE_TZ = original_use_tz
                        
                except ValidationError as ve:
                    print(f"DEBUG: Validation error saving appointment: {str(ve)}")
                    return Response(
                        {'error': f'Error de validación en la cita: {str(ve)}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                except Exception as e:
                    print(f"DEBUG: Unexpected error saving appointment: {str(e)}")
                    import traceback
                    print(f"DEBUG: Traceback: {traceback.format_exc()}")
                    raise
                
                # Preparar respuesta
                response_data = {
                    'success': True,
                    'appointment': {
                        'id': str(appointment.id),
                        'start_datetime': appointment.start_datetime.isoformat(),
                        'end_datetime': appointment.end_datetime.isoformat(),
                        'status': appointment.status,
                        'service': {
                            'name': service.name,
                            'duration_minutes': service.total_duration_minutes,
                            'price': float(service.price)
                        },
                        'professional': {
                            'name': professional.name,
                            'specialty': professional.specialty
                        },
                        'organization': {
                            'name': organization.name,
                            'address': organization.address,
                            'phone': organization.phone
                        }
                    },
                    'client': {
                        'id': str(client.id),
                        'type': client.client_type,
                        'full_name': client.full_name,
                        'email': client.email,
                        'phone': client.phone
                    }
                }
                
                # Agregar token para clientes guest
                if booking_type == 'guest':
                    response_data['guest_token'] = client.guest_token
                    response_data['guest_expires_at'] = client.guest_expires_at.isoformat()
                
                # Agregar token de verificación para clientes registrados
                elif booking_type == 'registered':
                    response_data['verification_token'] = client.verification_token
                    response_data['email_verified'] = client.email_verified
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
        except (Service.DoesNotExist, Professional.DoesNotExist):
            return Response(
                {'error': 'Servicio o profesional no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': f'Error en formato de fecha: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except ValidationError as e:
            return Response(
                {'error': f'Error de validación: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            import traceback
            error_detail = traceback.format_exc()
            print(f"ERROR en PublicBookingView: {error_detail}")  # Para debug
            return Response(
                {'error': f'Error interno: {str(e)}', 'detail': error_detail if settings.DEBUG else None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PublicAppointmentStatusView(APIView):
    """
    Vista para consultar estado de cita pública
    """
    permission_classes = [AllowAny]
    
    def get(self, request, org_slug, appointment_id):
        """
        Obtener estado de una cita pública
        Requiere token de guest o autenticación de cliente registrado
        """
        try:
            organization = Organization.objects.get(
                slug=org_slug,
                is_active=True
            )
            appointment = Appointment.objects.select_related(
                'client', 'professional', 'service'
            ).get(
                id=appointment_id,
                organization=organization
            )
        except (Organization.DoesNotExist, Appointment.DoesNotExist):
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar acceso
        client = appointment.client
        guest_token = request.query_params.get('guest_token')
        
        # Para clientes guest, verificar token
        if client.client_type == 'guest':
            if not guest_token or guest_token != client.guest_token:
                return Response(
                    {'error': 'Token de acceso inválido'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not client.is_guest_token_valid():
                return Response(
                    {'error': 'Token de acceso expirado'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Para clientes registrados, implementar autenticación apropiada
        # (por ahora permitimos acceso con email - en producción usar JWT)
        elif client.client_type == 'registered':
            # TODO: Implementar autenticación JWT para clientes
            pass
        
        return Response({
            'appointment': {
                'id': str(appointment.id),
                'start_datetime': appointment.start_datetime.isoformat(),
                'end_datetime': appointment.end_datetime.isoformat(),
                'status': appointment.status,
                'status_display': appointment.get_status_display(),
                'notes': appointment.notes,
                'can_be_cancelled': appointment.can_be_cancelled,
                'time_until_appointment': appointment.time_until_appointment,
                'service': {
                    'name': appointment.service.name,
                    'duration_minutes': appointment.service.total_duration_minutes,
                    'price': float(appointment.service.price),
                    'category': appointment.service.category
                },
                'professional': {
                    'name': appointment.professional.name,
                    'specialty': appointment.professional.specialty
                },
                'organization': {
                    'name': organization.name,
                    'address': organization.address,
                    'phone': organization.phone,
                    'email': organization.email
                }
            },
            'client': {
                'full_name': client.full_name,
                'email': client.email,
                'phone': client.phone,
                'type': client.client_type
            }
        })


class PublicAppointmentCancelView(APIView):
    """
    Vista para cancelar cita pública
    """
    permission_classes = [AllowAny]
    
    def post(self, request, org_slug, appointment_id):
        """
        Cancelar una cita pública
        """
        try:
            organization = Organization.objects.get(
                slug=org_slug,
                is_active=True
            )
            appointment = Appointment.objects.select_related('client').get(
                id=appointment_id,
                organization=organization
            )
        except (Organization.DoesNotExist, Appointment.DoesNotExist):
            return Response(
                {'error': 'Cita no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar acceso (similar a status view)
        client = appointment.client
        guest_token = request.data.get('guest_token')
        
        if client.client_type == 'guest':
            if not guest_token or guest_token != client.guest_token:
                return Response(
                    {'error': 'Token de acceso inválido'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            if not client.is_guest_token_valid():
                return Response(
                    {'error': 'Token de acceso expirado'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Verificar si se puede cancelar
        if not appointment.can_be_cancelled:
            return Response(
                {'error': 'Esta cita no puede ser cancelada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancelar la cita
        reason = request.data.get('reason', 'Cancelada por el cliente')
        appointment.cancel(reason=reason)
        
        return Response({
            'success': True,
            'message': 'Cita cancelada exitosamente',
            'appointment': {
                'id': str(appointment.id),
                'status': appointment.status,
                'cancelled_at': appointment.cancelled_at.isoformat() if appointment.cancelled_at else None,
                'cancellation_reason': appointment.cancellation_reason
            }
        })