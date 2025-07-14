# organizations/views.py - CON INFORMACIÓN DE LÍMITES

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.db import models
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from core.pagination import CustomPageNumberPagination
from plans.models import OrganizationSubscription
from plans.serializers import SubscriptionUsageSerializer
from .models import Organization, Professional, Service, Client, ClientNote, ClientFile
from .serializers import (
    OrganizationSerializer, 
    ProfessionalSerializer,
    ServiceSerializer,
    ClientSerializer,
    ClientNoteSerializer,
    ClientFileSerializer,
    MarketplaceOrganizationSerializer,
    MarketplaceOrganizationDetailSerializer
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
    
    def destroy(self, request, *args, **kwargs):
        """
        Eliminar servicio de forma segura verificando citas asociadas
        """
        service = self.get_object()
        force_delete = request.query_params.get('force', 'false').lower() == 'true'
        
        # Importar aquí para evitar imports circulares
        from appointments.models import Appointment
        
        # Si no es eliminación forzada, verificar si hay citas asociadas
        if not force_delete:
            appointments_count = Appointment.objects.filter(
                service=service,
                organization=request.user.organization
            ).count()
            
            if appointments_count > 0:
                # Informar al usuario sobre las citas que serán afectadas
                return Response({
                    'warning': f'Este servicio tiene {appointments_count} cita(s) asociada(s). '
                              'Al eliminar el servicio, las citas mantendrán su información pero '
                              'mostrarán "Servicio eliminado" en lugar del nombre del servicio.',
                    'appointments_count': appointments_count,
                    'can_delete': True
                }, status=status.HTTP_200_OK)
        
        # Proceder con la eliminación (normal o forzada)
        return super().destroy(request, *args, **kwargs)
    
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


# ===== MARKETPLACE VIEWS =====

class MarketplaceOrganizationListView(ListAPIView):
    """
    Vista pública para listar organizaciones en el marketplace
    """
    serializer_class = MarketplaceOrganizationSerializer
    permission_classes = [AllowAny]
    pagination_class = CustomPageNumberPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    # Filtros disponibles
    filterset_fields = ['industry_template', 'city', 'country']
    
    # Búsqueda por texto
    search_fields = ['name', 'description', 'services__name', 'professionals__name']
    
    # Ordenamiento
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """
        Obtener organizaciones públicas (activas y con onboarding completo)
        """
        return Organization.objects.filter(
            is_active=True,
            onboarding_completed=True
        ).prefetch_related('services', 'professionals')
    
    def get_serializer_context(self):
        """Agregar contexto adicional"""
        context = super().get_serializer_context()
        context['marketplace'] = True
        return context


class MarketplaceOrganizationDetailView(RetrieveAPIView):
    """
    Vista pública para obtener detalles de una organización específica
    """
    serializer_class = MarketplaceOrganizationDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    def get_queryset(self):
        """
        Obtener organizaciones públicas (activas y con onboarding completo)
        """
        return Organization.objects.filter(
            is_active=True,
            onboarding_completed=True
        ).prefetch_related(
            'services__professionals',
            'professionals'
        )
    
    def get_serializer_context(self):
        """Agregar contexto adicional"""
        context = super().get_serializer_context()
        context['marketplace'] = True
        context['detailed'] = True
        return context


class MarketplaceStatsView(APIView):
    """
    Vista para obtener estadísticas del marketplace
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Obtener estadísticas generales del marketplace
        """
        organizations = Organization.objects.filter(
            is_active=True,
            onboarding_completed=True
        )
        
        # Contar por industria
        industry_stats = {}
        for choice in Organization.INDUSTRY_CHOICES:
            industry_key = choice[0]
            industry_name = choice[1]
            count = organizations.filter(industry_template=industry_key).count()
            if count > 0:
                industry_stats[industry_key] = {
                    'name': industry_name,
                    'count': count
                }
        
        # Contar por ciudad
        city_stats = organizations.values('city').annotate(
            count=models.Count('id')
        ).order_by('-count')[:10]
        
        # Estadísticas generales
        total_organizations = organizations.count()
        total_services = Service.objects.filter(
            organization__in=organizations,
            is_active=True
        ).count()
        total_professionals = Professional.objects.filter(
            organization__in=organizations,
            is_active=True
        ).count()
        
        return Response({
            'total_organizations': total_organizations,
            'total_services': total_services,
            'total_professionals': total_professionals,
            'industry_stats': industry_stats,
            'city_stats': list(city_stats),
            'latest_organizations': MarketplaceOrganizationSerializer(
                organizations.order_by('-created_at')[:3],
                many=True
            ).data
        })


class ClientNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notas de clientes
    """
    serializer_class = ClientNoteSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'content']
    filterset_fields = ['category', 'is_private']
    ordering_fields = ['created_at', 'updated_at', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrar notas por organización del usuario"""
        user = self.request.user
        if not user.organization:
            return ClientNote.objects.none()
        
        queryset = ClientNote.objects.filter(organization=user.organization)
        
        # Filtrar por cliente si se proporciona
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Asignar organización y usuario al crear nota"""
        user = self.request.user
        client_id = self.request.data.get('client')
        
        # Validar que el cliente pertenece a la organización
        try:
            client = Client.objects.get(
                id=client_id,
                organization=user.organization
            )
        except Client.DoesNotExist:
            raise serializers.ValidationError("Cliente no encontrado o no pertenece a tu organización")
        
        serializer.save(
            organization=user.organization,
            client=client,
            created_by=user
        )


class ClientFileViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar archivos de clientes
    """
    serializer_class = ClientFileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    filterset_fields = ['category', 'file_type']
    ordering_fields = ['uploaded_at', 'name', 'file_size']
    ordering = ['-uploaded_at']
    
    def get_queryset(self):
        """Filtrar archivos por organización del usuario"""
        user = self.request.user
        if not user.organization:
            return ClientFile.objects.none()
        
        queryset = ClientFile.objects.filter(organization=user.organization)
        
        # Filtrar por cliente si se proporciona
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Asignar organización y usuario al crear archivo"""
        user = self.request.user
        client_id = self.request.data.get('client')
        
        # Validar que el cliente pertenece a la organización
        try:
            client = Client.objects.get(
                id=client_id,
                organization=user.organization
            )
        except Client.DoesNotExist:
            raise serializers.ValidationError("Cliente no encontrado o no pertenece a tu organización")
        
        serializer.save(
            organization=user.organization,
            client=client,
            uploaded_by=user
        )