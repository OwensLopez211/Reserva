# plans/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Plan, UserRegistration, OrganizationSubscription
from .serializers import (
    PlanPublicSerializer, 
    UserRegistrationCreateSerializer,
    UserRegistrationSerializer,
    SubscriptionUsageSerializer,
    OrganizationSubscriptionSerializer
)


class HealthCheckView(APIView):
    """
    Vista de verificación para comprobar que las URLs funcionan
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'OK',
            'message': 'Plans API is working correctly',
            'endpoints': [
                '/api/plans/health/',
                '/api/plans/subscription/me/',
                '/api/plans/subscription/me/usage/',
                '/api/plans/plans/'
            ],
            'timestamp': timezone.now()
        })


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar planes disponibles (solo lectura)
    """
    queryset = Plan.objects.filter(is_active=True).order_by('display_order', 'price_monthly')
    serializer_class = PlanPublicSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        """Filtrar planes activos y ordenados"""
        return Plan.objects.filter(is_active=True).order_by('display_order', 'price_monthly')
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Obtener planes destacados"""
        featured_plans = self.get_queryset().filter(is_popular=True)
        serializer = self.get_serializer(featured_plans, many=True)
        return Response(serializer.data)


class SignupView(APIView):
    """
    Vista para registro inicial de usuarios con selección de plan
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Crear registro temporal de usuario
        Payload esperado:
        {
            "email": "usuario@email.com",
            "plan_id": "uuid-del-plan",
            "user_data": {
                "first_name": "Nombre",
                "last_name": "Apellido",
                "organization_name": "Mi Negocio"
            }
        }
        """
        # Debug: Log the incoming request data
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"🔍 Signup request data: {request.data}")
        logger.info(f"🔍 Content type: {request.content_type}")
        
        serializer = UserRegistrationCreateSerializer(data=request.data)
        
        if serializer.is_valid():
            registration = serializer.save()
            
            # Preparar respuesta con token temporal
            response_data = {
                'message': 'Registro iniciado exitosamente',
                'registration_token': registration.temp_token,
                'expires_at': registration.expires_at,
                'selected_plan': {
                    'id': str(registration.selected_plan.id),
                    'name': registration.selected_plan.name,
                    'price_monthly': registration.selected_plan.price_monthly
                },
                'next_step': 'onboarding'
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        
        # Debug: Log validation errors
        logger.error(f"🔍 Signup validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegistrationStatusView(APIView):
    """
    Vista para verificar el estado de un registro temporal
    """
    permission_classes = [AllowAny]
    
    def get(self, request, token):
        """
        Verificar estado del registro temporal
        """
        try:
            registration = UserRegistration.objects.get(temp_token=token)
            
            if not registration.is_valid:
                return Response({
                    'error': 'Token de registro expirado o inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = UserRegistrationSerializer(registration)
            return Response(serializer.data)
            
        except UserRegistration.DoesNotExist:
            return Response({
                'error': 'Token de registro no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
    
    def patch(self, request, token):
        """
        Actualizar progreso del onboarding
        """
        try:
            registration = UserRegistration.objects.get(temp_token=token)
            
            if not registration.is_valid:
                return Response({
                    'error': 'Token de registro expirado o inválido'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            step = request.data.get('step')
            completed_steps = request.data.get('completed_steps', [])
            
            if step is not None:
                registration.update_progress(step, completed_steps)
            
            serializer = UserRegistrationSerializer(registration)
            return Response(serializer.data)
            
        except UserRegistration.DoesNotExist:
            return Response({
                'error': 'Token de registro no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)


class MySubscriptionView(APIView):
    """
    Vista para obtener información completa de la suscripción del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener suscripción completa del usuario actual
        """
        user = request.user
        print(f"DEBUG: Usuario autenticado: {user.username}")
        print(f"DEBUG: Organización del usuario: {user.organization}")
        
        if not user.organization:
            return Response({
                'error': 'Usuario no pertenece a ninguna organización',
                'debug': {
                    'user': user.username,
                    'organization': None
                }
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            subscription = OrganizationSubscription.objects.select_related('plan', 'organization').get(
                organization=user.organization
            )
            print(f"DEBUG: Suscripción encontrada: {subscription.plan.name}")
            serializer = OrganizationSubscriptionSerializer(subscription)
            return Response(serializer.data)
            
        except OrganizationSubscription.DoesNotExist:
            print(f"DEBUG: No se encontró suscripción para organización: {user.organization.name}")
            return Response({
                'error': 'No se encontró suscripción activa',
                'debug': {
                    'organization': user.organization.name,
                    'organization_id': str(user.organization.id)
                }
            }, status=status.HTTP_404_NOT_FOUND)


class MySubscriptionUsageView(APIView):
    """
    Vista para obtener información de uso de la suscripción del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener uso actual de la suscripción
        """
        user = request.user
        if not user.organization:
            return Response({
                'error': 'Usuario no pertenece a ninguna organización'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            subscription = OrganizationSubscription.objects.select_related('plan').get(
                organization=user.organization
            )
            serializer = SubscriptionUsageSerializer(subscription)
            return Response(serializer.data)
            
        except OrganizationSubscription.DoesNotExist:
            return Response({
                'error': 'No se encontró suscripción activa'
            }, status=status.HTTP_404_NOT_FOUND)