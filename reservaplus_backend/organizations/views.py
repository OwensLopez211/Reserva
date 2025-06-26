# organizations/views.py - CON INFORMACIÓN DE LÍMITES

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from plans.models import OrganizationSubscription
from plans.serializers import SubscriptionUsageSerializer
from .models import Organization, Professional, Service, Client
from .serializers import (
    OrganizationSerializer, 
    ProfessionalSerializer,
    ServiceSerializer,
    ClientSerializer
)


class MyOrganizationView(APIView):
    """
    Vista para obtener información de la organización del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not user.organization:
            return Response({
                'error': 'Usuario no pertenece a ninguna organización'
            }, status=status.HTTP_404_NOT_FOUND)
        
        serializer = OrganizationSerializer(user.organization)
        
        # Agregar información de suscripción si existe
        response_data = serializer.data
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=user.organization
            )
            subscription_serializer = SubscriptionUsageSerializer(subscription)
            response_data['subscription'] = subscription_serializer.data
        except OrganizationSubscription.DoesNotExist:
            response_data['subscription'] = None
        
        return Response(response_data)


class OrganizationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de organizaciones
    """
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Organization.objects.all()
        elif user.organization:
            return Organization.objects.filter(id=user.organization.id)
        else:
            return Organization.objects.none()


class ProfessionalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de profesionales con validación de límites
    """
    serializer_class = ProfessionalSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return Professional.objects.filter(organization=user.organization)
        else:
            return Professional.objects.none()
    
    def perform_create(self, serializer):
        """
        Asignar la organización del usuario al crear un profesional
        """
        serializer.save(organization=self.request.user.organization)
    
    @action(detail=False, methods=['get'])
    def limits_info(self, request):
        """
        Obtener información de límites para profesionales
        """
        user = request.user
        if not user.organization:
            return Response({'error': 'No organization found'}, status=404)
        
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=user.organization
            )
            
            current_count = Professional.objects.filter(
                organization=user.organization
            ).count()
            
            return Response({
                'current_count': current_count,
                'max_allowed': subscription.plan.max_professionals,
                'can_add_more': subscription.can_add_professional(),
                'plan_name': subscription.plan.name
            })
        except OrganizationSubscription.DoesNotExist:
            return Response({'error': 'No subscription found'}, status=404)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de servicios con validación de límites
    """
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return Service.objects.filter(organization=user.organization)
        else:
            return Service.objects.none()
    
    def perform_create(self, serializer):
        """
        Asignar la organización del usuario al crear un servicio
        """
        serializer.save(organization=self.request.user.organization)
    
    @action(detail=False, methods=['get'])
    def limits_info(self, request):
        """
        Obtener información de límites para servicios
        """
        user = request.user
        if not user.organization:
            return Response({'error': 'No organization found'}, status=404)
        
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=user.organization
            )
            
            current_count = Service.objects.filter(
                organization=user.organization
            ).count()
            
            return Response({
                'current_count': current_count,
                'max_allowed': subscription.plan.max_services,
                'can_add_more': subscription.can_add_service(),
                'plan_name': subscription.plan.name
            })
        except OrganizationSubscription.DoesNotExist:
            return Response({'error': 'No subscription found'}, status=404)


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de clientes con validación de límites
    """
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return Client.objects.filter(organization=user.organization)
        else:
            return Client.objects.none()
    
    def perform_create(self, serializer):
        """
        Asignar la organización del usuario al crear un cliente
        """
        serializer.save(organization=self.request.user.organization)
    
    @action(detail=False, methods=['get'])
    def limits_info(self, request):
        """
        Obtener información de límites para clientes
        """
        user = request.user
        if not user.organization:
            return Response({'error': 'No organization found'}, status=404)
        
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=user.organization
            )
            
            current_count = Client.objects.filter(
                organization=user.organization
            ).count()
            
            return Response({
                'current_count': current_count,
                'max_allowed': subscription.plan.max_clients,
                'can_add_more': subscription.can_add_client(),
                'plan_name': subscription.plan.name
            })
        except OrganizationSubscription.DoesNotExist:
            return Response({'error': 'No subscription found'}, status=404)