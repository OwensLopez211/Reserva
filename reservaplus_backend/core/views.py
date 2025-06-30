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
        print(f"🔍 Recibidos datos de onboarding: {request.data}")
        
        serializer = OnboardingDataSerializer(data=request.data)
        
        if not serializer.is_valid():
            print(f"❌ Errores de validación: {serializer.errors}")
            return Response({
                'error': 'Datos inválidos',
                'details': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Obtener registro temporal validado
                registration = serializer.context['registration']
                print(f"✅ Token válido, registro encontrado: {registration.email}")
                
                # 1. Crear usuario principal (owner de la organización)
                user_data = registration.registration_data
                print(f"📝 Datos del usuario owner: {user_data}")
                
                user = User.objects.create_user(
                    username=user_data.get('email', registration.email),
                    email=registration.email,
                    password=user_data.get('password', ''),  # Usar la contraseña del registro
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    role='owner'
                )
                print(f"👤 Usuario owner creado: {user.email} (ID: {user.id})")
                
                # 2. Crear organización
                org_data = serializer.validated_data['organization']
                print(f"🏢 Datos de la organización: {org_data}")
                
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
                print(f"🏢 Organización creada: {organization.name} (ID: {organization.id})")
                
                # Asignar usuario a organización
                user.organization = organization
                user.save()
                print(f"🔗 Usuario asignado a organización")
                
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
                
                # 4. Crear miembros del equipo (usuarios)
                team_members_data = serializer.validated_data['professionals']
                print(f"👥 Datos del equipo: {team_members_data}")
                created_users = []
                created_professionals = []
                
                for i, member_data in enumerate(team_members_data):
                    print(f"👤 Procesando miembro {i+1}: {member_data}")
                    # Crear usuario del sistema con el rol específico
                    member_role = member_data.get('role', 'staff')  # Rol por defecto
                    
                    # Verificar si el usuario ya existe
                    if User.objects.filter(email=member_data['email']).exists():
                        print(f"⚠️ Usuario con email {member_data['email']} ya existe, saltando...")
                        continue
                    
                    team_user = User.objects.create_user(
                        username=member_data['email'],  # Usar email como username
                        email=member_data['email'],
                        first_name=member_data['name'].split()[0] if member_data['name'] else '',
                        last_name=' '.join(member_data['name'].split()[1:]) if len(member_data['name'].split()) > 1 else '',
                        role=member_role,
                        organization=organization,
                        phone=member_data.get('phone', ''),
                        is_professional=member_data.get('is_professional', member_role == 'professional'),
                        is_active_in_org=True
                    )
                    created_users.append(team_user)
                    print(f"✅ Usuario creado: {team_user.email} con rol {member_role}")
                    
                    # Incrementar contadores específicos por rol
                    subscription.increment_users_count()
                    if member_role == 'professional':
                        subscription.increment_professionals_count()
                    elif member_role == 'reception':
                        subscription.increment_receptionists_count()
                    elif member_role == 'staff':
                        subscription.increment_staff_count()
                    
                    # Crear perfil Professional solo si es necesario para el sistema de citas
                    # (para profesionales y algunos staff que pueden dar servicios)
                    if member_role in ['professional', 'staff'] or member_data.get('is_professional', False):
                        professional = Professional.objects.create(
                            organization=organization,
                            user=team_user,
                            name=member_data['name'],
                            email=member_data['email'],
                            phone=member_data.get('phone', ''),
                            specialty=member_data.get('specialty', ''),
                            color_code=member_data.get('color_code', '#4CAF50'),
                            is_active=member_data.get('is_active', True),
                            accepts_walk_ins=member_data.get('accepts_walk_ins', True)
                        )
                        created_professionals.append(professional)
                
                # 5. Crear servicios
                services_data = serializer.validated_data['services']
                print(f"🛠️ Datos de servicios: {services_data}")
                created_services = []
                
                for i, serv_data in enumerate(services_data):
                    print(f"🛠️ Procesando servicio {i+1}: {serv_data}")
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
                
                print(f"🎉 Onboarding completado exitosamente para {organization.name}")
                
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
                        'team_members': [
                            {
                                'id': str(u.id),
                                'name': u.full_name,
                                'email': u.email,
                                'role': u.role
                            } for u in created_users
                        ],
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
            print(f"💥 Error grave en onboarding: {str(e)}")
            import traceback
            print(f"📋 Traceback completo: {traceback.format_exc()}")
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