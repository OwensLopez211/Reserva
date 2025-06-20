# organizations/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
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
        return Response(serializer.data)


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
    ViewSet para gestión de profesionales
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


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de servicios
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


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de clientes
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