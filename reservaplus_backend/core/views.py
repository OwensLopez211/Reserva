# core/views.py - VISTA ACTUALIZADA PARA ONBOARDING COMPLETO
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from organizations.models import Organization, Professional, Service
from plans.models import UserRegistration, OrganizationSubscription
from plans.serializers import OnboardingDataSerializer

User = get_user_model()

class OnboardingCompleteView(APIView):
    """
    Vista para completar todo el proceso de onboarding en una sola llamada
    """
    permission_classes = [AllowAny]  # Usa token temporal, no requiere autenticación
    
    def post(self, request):
        """
        Completar onboarding con todos los datos
        Payload esperado:
        {
            "registration_token": "token-temporal",
            "organization": {...},
            "professionals": [...],
            "services": [...]
        }
        """
        serializer = OnboardingDataSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'error': 'Datos inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Obtener registro temporal validado
                registration = serializer.context['registration']
                
                # 1. Crear usuario principal (owner de la organización)
                user_data = registration.registration_data
                user = User.objects.create_user(
                    username=user_data.get('email', registration.email),
                    email=registration.email,
                    password=user_data.get('password', ''),  # Usar la contraseña del registro
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    role='owner'
                )
                
                # 2. Crear organización
                org_data = serializer.validated_data['organization']
                organization = Organization.objects.create(
                    name=org_data['name'],
                    industry_template=org_data['industry_template'],
                    email=org_data['email'],
                    phone=org_data['phone'],
                    address=org_data.get('address', ''),
                    city=org_data.get('city', ''),
                    country=org_data.get('country', 'Chile'),
                    settings=self._get_industry_settings(org_data['industry_template'])
                )
                
                # Asignar usuario a organización
                user.organization = organization
                user.save()
                
                # 3. Crear suscripción
                subscription = OrganizationSubscription.objects.create(
                    organization=organization,
                    plan=registration.selected_plan,
                    status='trial',
                    trial_start=timezone.now(),
                    trial_end=timezone.now() + timedelta(days=14),
                    current_period_start=timezone.now(),
                    current_period_end=timezone.now() + timedelta(days=14),
                )
                
                # 4. Crear profesionales
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
                    subscription.increment_professionals_count()
                
                # 5. Crear servicios
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
                    subscription.increment_services_count()
                
                # 6. Marcar onboarding como completado
                organization.complete_onboarding()
                registration.mark_completed(user)
                
                return Response({
                    'message': 'Onboarding completado exitosamente',
                    'data': {
                        'organization': {
                            'id': str(organization.id),
                            'name': organization.name,
                            'industry_template': organization.industry_template
                        },
                        'user': {
                            'id': str(user.id),
                            'email': user.email,
                            'full_name': user.full_name
                        },
                        'subscription': {
                            'plan': registration.selected_plan.name,
                            'status': subscription.status,
                            'trial_end': subscription.trial_end
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
    
    def _get_industry_settings(self, industry_template):
        """Obtener configuraciones específicas de la industria"""
        from core.industry_templates import INDUSTRY_TEMPLATES
        
        template = INDUSTRY_TEMPLATES.get(industry_template, INDUSTRY_TEMPLATES['salon'])
        return {
            'business_rules': template.get('business_rules', {}),
            'business_hours': template.get('business_hours', {}),
            'terminology': template.get('terminology', {})
        }