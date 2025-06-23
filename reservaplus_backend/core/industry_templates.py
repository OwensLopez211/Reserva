# core/industry_templates.py - NUEVO ARCHIVO
"""
Plantillas de configuración por industria para ReservaPlus
"""

INDUSTRY_TEMPLATES = {
    'salon': {
        'name': 'Peluquería/Salón de Belleza',
        'terminology': {
            'professional': {
                'singular': 'Estilista',
                'plural': 'Estilistas'
            },
            'client': {
                'singular': 'Cliente',
                'plural': 'Clientes'
            },
            'appointment': {
                'singular': 'Cita',
                'plural': 'Citas'
            },
            'service': {
                'singular': 'Servicio',
                'plural': 'Servicios'
            }
        },
        'business_rules': {
            'allow_walk_ins': True,
            'cancellation_window_hours': 2,
            'requires_confirmation': False,
            'advance_booking_days': 30,
            'buffer_between_appointments': 15,
            'send_reminders': True,
            'reminder_hours_before': 24
        },
        'default_services': [
            {
                'name': 'Corte de Cabello',
                'category': 'Cabello',
                'duration_minutes': 45,
                'price': 15000,
                'buffer_time_after': 10
            },
            {
                'name': 'Peinado',
                'category': 'Cabello',
                'duration_minutes': 30,
                'price': 12000,
                'buffer_time_after': 5
            },
            {
                'name': 'Tinte y Color',
                'category': 'Color',
                'duration_minutes': 90,
                'price': 35000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'tuesday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'wednesday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'thursday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'friday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'saturday': {'open': '09:00', 'close': '15:00', 'is_open': True},
            'sunday': {'open': '10:00', 'close': '14:00', 'is_open': False}
        }
    },
    'clinic': {
        'name': 'Clínica/Consultorio Médico',
        'terminology': {
            'professional': {
                'singular': 'Doctor',
                'plural': 'Doctores'
            },
            'client': {
                'singular': 'Paciente',
                'plural': 'Pacientes'
            },
            'appointment': {
                'singular': 'Consulta',
                'plural': 'Consultas'
            },
            'service': {
                'singular': 'Procedimiento',
                'plural': 'Procedimientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': False,
            'cancellation_window_hours': 24,
            'requires_confirmation': True,
            'advance_booking_days': 60,
            'buffer_between_appointments': 10,
            'send_reminders': True,
            'reminder_hours_before': 48
        },
        'default_services': [
            {
                'name': 'Consulta General',
                'category': 'Consultas',
                'duration_minutes': 30,
                'price': 25000,
                'buffer_time_after': 10
            },
            {
                'name': 'Control Médico',
                'category': 'Controles',
                'duration_minutes': 20,
                'price': 15000,
                'buffer_time_after': 5
            },
            {
                'name': 'Procedimiento Menor',
                'category': 'Procedimientos',
                'duration_minutes': 45,
                'price': 40000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'tuesday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'wednesday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'thursday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'friday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'saturday': {'open': '08:00', 'close': '12:00', 'is_open': True},
            'sunday': {'open': '09:00', 'close': '12:00', 'is_open': False}
        }
    },
    'spa': {
        'name': 'Spa/Centro de Bienestar',
        'terminology': {
            'professional': {
                'singular': 'Terapeuta',
                'plural': 'Terapeutas'
            },
            'client': {
                'singular': 'Cliente',
                'plural': 'Clientes'
            },
            'appointment': {
                'singular': 'Sesión',
                'plural': 'Sesiones'
            },
            'service': {
                'singular': 'Tratamiento',
                'plural': 'Tratamientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': False,
            'cancellation_window_hours': 24,
            'requires_confirmation': True,
            'advance_booking_days': 45,
            'buffer_between_appointments': 30,
            'send_reminders': True,
            'reminder_hours_before': 24
        },
        'default_services': [
            {
                'name': 'Masaje Relajante',
                'category': 'Masajes',
                'duration_minutes': 60,
                'price': 30000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            },
            {
                'name': 'Facial Hidratante',
                'category': 'Faciales',
                'duration_minutes': 45,
                'price': 25000,
                'buffer_time_before': 5,
                'buffer_time_after': 10,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'tuesday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'wednesday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'thursday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'friday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'saturday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'sunday': {'open': '10:00', 'close': '16:00', 'is_open': True}
        }
    },
    'dental': {
        'name': 'Clínica Dental',
        'terminology': {
            'professional': {
                'singular': 'Dentista',
                'plural': 'Dentistas'
            },
            'client': {
                'singular': 'Paciente',
                'plural': 'Pacientes'
            },
            'appointment': {
                'singular': 'Cita Dental',
                'plural': 'Citas Dentales'
            },
            'service': {
                'singular': 'Tratamiento',
                'plural': 'Tratamientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': False,
            'cancellation_window_hours': 48,
            'requires_confirmation': True,
            'advance_booking_days': 90,
            'buffer_between_appointments': 15,
            'send_reminders': True,
            'reminder_hours_before': 48
        },
        'default_services': [
            {
                'name': 'Consulta Dental',
                'category': 'Consultas',
                'duration_minutes': 30,
                'price': 20000,
                'buffer_time_after': 10
            },
            {
                'name': 'Limpieza Dental',
                'category': 'Prevención',
                'duration_minutes': 45,
                'price': 35000,
                'buffer_time_after': 15
            },
            {
                'name': 'Empaste',
                'category': 'Restauración',
                'duration_minutes': 60,
                'price': 50000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'tuesday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'wednesday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'thursday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'friday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'saturday': {'open': '08:00', 'close': '13:00', 'is_open': True},
            'sunday': {'open': '09:00', 'close': '12:00', 'is_open': False}
        }
    },
    'fitness': {
        'name': 'Entrenamiento Personal/Fitness',
        'terminology': {
            'professional': {
                'singular': 'Entrenador',
                'plural': 'Entrenadores'
            },
            'client': {
                'singular': 'Cliente',
                'plural': 'Clientes'
            },
            'appointment': {
                'singular': 'Sesión',
                'plural': 'Sesiones'
            },
            'service': {
                'singular': 'Entrenamiento',
                'plural': 'Entrenamientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': True,
            'cancellation_window_hours': 4,
            'requires_confirmation': False,
            'advance_booking_days': 14,
            'buffer_between_appointments': 0,
            'send_reminders': True,
            'reminder_hours_before': 12
        },
        'default_services': [
            {
                'name': 'Entrenamiento Personal',
                'category': 'Entrenamiento',
                'duration_minutes': 60,
                'price': 25000,
                'buffer_time_after': 5
            },
            {
                'name': 'Evaluación Física',
                'category': 'Evaluación',
                'duration_minutes': 45,
                'price': 20000,
                'buffer_time_before': 10,
                'buffer_time_after': 10,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'tuesday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'wednesday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'thursday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'friday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'saturday': {'open': '07:00', 'close': '20:00', 'is_open': True},
            'sunday': {'open': '08:00', 'close': '18:00', 'is_open': True}
        }
    }
}


# core/pagination.py - NUEVO ARCHIVO
"""
Configuración de paginación personalizada para ReservaPlus
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'pagination': {
                'count': self.page.paginator.count,
                'next': self.get_next_link(),
                'previous': self.get_previous_link(),
                'page_size': self.page_size,
                'total_pages': self.page.paginator.num_pages,
                'current_page': self.page.number,
            },
            'results': data
        })


# organizations/views.py - EXTENSIONES PARA ONBOARDING
# Agregar estas vistas a tu archivo existente

from rest_framework.decorators import action
from django.db import transaction
from rest_framework import status

class OrganizationViewSet(viewsets.ModelViewSet):
    # ... código existente ...
    
    @action(detail=False, methods=['post'])
    def setup_complete(self, request):
        """
        Endpoint para completar la configuración inicial de la organización
        """
        user = request.user
        if not user.organization:
            return Response({
                'error': 'Usuario no pertenece a ninguna organización'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                organization = user.organization
                
                # Actualizar configuraciones específicas de industria
                template_config = organization.get_business_config()
                
                # Merge con configuraciones existentes
                current_settings = organization.settings or {}
                updated_settings = {**template_config, **current_settings}
                
                organization.settings = updated_settings
                organization.save()
                
                # Verificar que tenga profesionales y servicios
                has_professionals = organization.professionals.filter(is_active=True).exists()
                has_services = organization.services.filter(is_active=True).exists()
                
                if not has_professionals:
                    return Response({
                        'error': 'Debe tener al menos un profesional activo'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                if not has_services:
                    return Response({
                        'error': 'Debe tener al menos un servicio activo'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response({
                    'message': 'Configuración completada exitosamente',
                    'organization': OrganizationSerializer(organization).data
                })
                
        except Exception as e:
            return Response({
                'error': f'Error al completar configuración: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def setup_status(self, request):
        """
        Verificar el estado de configuración de la organización
        """
        user = request.user
        if not user.organization:
            return Response({
                'needs_setup': True,
                'step': 'organization',
                'missing': ['organization']
            })
        
        organization = user.organization
        
        # Verificar profesionales
        professionals_count = organization.professionals.filter(is_active=True).count()
        has_professionals = professionals_count > 0
        
        # Verificar servicios
        services_count = organization.services.filter(is_active=True).count()
        has_services = services_count > 0
        
        # Determinar el paso actual
        if not has_professionals:
            current_step = 'professionals'
            missing = ['professionals']
        elif not has_services:
            current_step = 'services'
            missing = ['services']
        else:
            current_step = 'complete'
            missing = []
        
        needs_setup = len(missing) > 0
        
        return Response({
            'needs_setup': needs_setup,
            'step': current_step,
            'missing': missing,
            'progress': {
                'organization': True,
                'professionals': has_professionals,
                'services': has_services,
                'professionals_count': professionals_count,
                'services_count': services_count
            }
        })


# organizations/serializers.py - AGREGAR AL ARCHIVO EXISTENTE
# Nuevo serializer para onboarding

class OnboardingSetupSerializer(serializers.Serializer):
    """
    Serializer para el setup completo de onboarding
    """
    organization = serializers.DictField()
    professionals = serializers.ListField(child=serializers.DictField())
    services = serializers.ListField(child=serializers.DictField())
    
    def validate_organization(self, value):
        """Validar datos de organización"""
        required_fields = ['name', 'email', 'phone', 'industry_template']
        for field in required_fields:
            if not value.get(field):
                raise serializers.ValidationError(f"Campo '{field}' es requerido en organización")
        return value
    
    def validate_professionals(self, value):
        """Validar datos de profesionales"""
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un profesional")
        
        for i, prof in enumerate(value):
            if not prof.get('name'):
                raise serializers.ValidationError(f"Nombre requerido para profesional {i+1}")
            if not prof.get('email'):
                raise serializers.ValidationError(f"Email requerido para profesional {i+1}")
        
        return value
    
    def validate_services(self, value):
        """Validar datos de servicios"""
        if not value:
            raise serializers.ValidationError("Debe incluir al menos un servicio")
        
        for i, serv in enumerate(value):
            if not serv.get('name'):
                raise serializers.ValidationError(f"Nombre requerido para servicio {i+1}")
            if not serv.get('price') or serv.get('price') <= 0:
                raise serializers.ValidationError(f"Precio válido requerido para servicio {i+1}")
            if not serv.get('duration_minutes') or serv.get('duration_minutes') <= 0:
                raise serializers.ValidationError(f"Duración válida requerida para servicio {i+1}")
        
        return value


# core/views.py - NUEVA VISTA PARA ONBOARDING COMPLETO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from organizations.models import Organization, Professional, Service
from organizations.serializers import OnboardingSetupSerializer

class OnboardingCompleteView(APIView):
    """
    Vista para completar todo el proceso de onboarding en una sola llamada
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = OnboardingSetupSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Datos inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # 1. Actualizar organización
                user = request.user
                organization = user.organization
                
                if not organization:
                    return Response({
                        'error': 'Usuario no tiene organización asignada'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                org_data = serializer.validated_data['organization']
                for field, value in org_data.items():
                    if hasattr(organization, field):
                        setattr(organization, field, value)
                
                # Aplicar configuraciones de industria
                from core.industry_templates import INDUSTRY_TEMPLATES
                template = INDUSTRY_TEMPLATES.get(org_data.get('industry_template', 'salon'))
                if template:
                    organization.settings = {
                        **template.get('business_rules', {}),
                        **template.get('business_hours', {}),
                        **(organization.settings or {})
                    }
                
                organization.save()
                
                # 2. Crear profesionales
                professionals_data = serializer.validated_data['professionals']
                created_professionals = []
                
                for prof_data in professionals_data:
                    professional = Professional.objects.create(
                        organization=organization,
                        name=prof_data['name'],
                        email=prof_data['email'],
                        phone=prof_data.get('phone', ''),
                        specialty=prof_data.get('specialty', ''),
                        color_code=prof_data.get('color_code', '#4CAF50'),
                        is_active=prof_data.get('is_active', True),
                        accepts_walk_ins=prof_data.get('accepts_walk_ins', True)
                    )
                    created_professionals.append(professional)
                
                # 3. Crear servicios
                services_data = serializer.validated_data['services']
                created_services = []
                
                for serv_data in services_data:
                    service = Service.objects.create(
                        organization=organization,
                        name=serv_data['name'],
                        description=serv_data.get('description', ''),
                        category=serv_data.get('category', ''),
                        duration_minutes=serv_data['duration_minutes'],
                        price=serv_data['price'],
                        buffer_time_before=serv_data.get('buffer_time_before', 0),
                        buffer_time_after=serv_data.get('buffer_time_after', 10),
                        is_active=serv_data.get('is_active', True),
                        requires_preparation=serv_data.get('requires_preparation', False)
                    )
                    
                    # Asignar todos los profesionales al servicio
                    service.professionals.set(created_professionals)
                    created_services.append(service)
                
                return Response({
                    'message': 'Onboarding completado exitosamente',
                    'data': {
                        'organization': {
                            'id': str(organization.id),
                            'name': organization.name,
                            'industry_template': organization.industry_template
                        },
                        'professionals': [
                            {
                                'id': str(p.id),
                                'name': p.name,
                                'email': p.email
                            } for p in created_professionals
                        ],
                        'services': [
                            {
                                'id': str(s.id),
                                'name': s.name,
                                'price': s.price,
                                'duration_minutes': s.duration_minutes
                            } for s in created_services
                        ]
                    }
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': f'Error al completar onboarding: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# reservaplus_backend/urls.py - AGREGAR NUEVA RUTA
# Agregar esta línea a tus URLs principales

# En api routes:
# path('onboarding/', include([
#     path('complete/', OnboardingCompleteView.as_view(), name='onboarding-complete'),
# ])),


# core/test_base.py - EXTENSIÓN PARA TESTING DE ONBOARDING
# Agregar estos métodos a tu BaseAPITestCase existente

class BaseAPITestCase(TestCase):
    # ... código existente ...
    
    def create_complete_organization_setup(self, org_name="Test Org Complete", industry="salon"):
        """Crear una organización con setup completo para testing"""
        # Crear organización
        org = Organization.objects.create(
            name=org_name,
            industry_template=industry,
            email=f"test@{org_name.lower().replace(' ', '')}.com",
            phone="+56912345678",
            settings={'onboarding_completed': True}
        )
        
        # Crear usuario owner
        user = User.objects.create_user(
            username=f"owner_{org_name.lower().replace(' ', '_')}",
            email=f"owner@{org_name.lower().replace(' ', '')}.com",
            password='testpass123',
            organization=org,
            role='owner'
        )
        
        # Crear profesional
        professional = Professional.objects.create(
            organization=org,
            name="Test Professional",
            email=f"prof@{org_name.lower().replace(' ', '')}.com",
            phone="+56987654321",
            specialty="Test Specialty",
            color_code="#4CAF50"
        )
        
        # Crear servicio
        service = Service.objects.create(
            organization=org,
            name="Test Service",
            category="Test Category",
            duration_minutes=30,
            price=15000,
            buffer_time_after=10
        )
        
        # Asignar profesional al servicio
        service.professionals.add(professional)
        
        return {
            'organization': org,
            'user': user,
            'professional': professional,
            'service': service
        }
    
    def assert_onboarding_complete(self, organization):
        """Verificar que una organización tiene onboarding completo"""
        self.assertTrue(organization.professionals.filter(is_active=True).exists())
        self.assertTrue(organization.services.filter(is_active=True).exists())
        self.assertIsNotNone(organization.settings)
        
    def simulate_onboarding_process(self, user, org_data, professionals_data, services_data):
        """Simular el proceso completo de onboarding"""
        self.authenticate_user(user)
        
        # Datos de onboarding
        onboarding_data = {
            'organization': org_data,
            'professionals': professionals_data,
            'services': services_data
        }
        
        # Llamar al endpoint de onboarding completo
        response = self.client.post('/api/onboarding/complete/', onboarding_data)
        
        return response