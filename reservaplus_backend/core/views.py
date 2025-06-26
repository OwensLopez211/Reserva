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
