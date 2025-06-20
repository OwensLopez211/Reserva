# organizations/serializers.py - FIX FINAL UUID

from rest_framework import serializers
from .models import Organization, Professional, Service, Client


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Organization
    """
    terminology = serializers.ReadOnlyField()
    business_rules = serializers.ReadOnlyField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'description', 'industry_template',
            'email', 'phone', 'website', 'address', 'city', 'country',
            'subscription_plan', 'settings', 'terminology', 'business_rules',
            'is_active', 'is_trial', 'trial_ends_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class ProfessionalSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Professional
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    # CAMBIADO: Hacer organization como CharField para que siempre sea string
    organization = serializers.CharField(read_only=True)
    
    class Meta:
        model = Professional
        fields = [
            'id', 'name', 'email', 'phone', 'specialty', 'license_number',
            'bio', 'color_code', 'is_active', 'accepts_walk_ins',
            'organization', 'organization_name', 'user', 'user_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """
        Convertir UUIDs a strings para consistencia en pruebas
        """
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
        if instance.user:
            representation['user'] = str(instance.user.id)
        return representation


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Service
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    total_duration_minutes = serializers.ReadOnlyField()
    professionals_count = serializers.SerializerMethodField()
    # CAMBIADO: Hacer organization como CharField para que siempre sea string
    organization = serializers.CharField(read_only=True)
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'category', 'duration_minutes',
            'price', 'buffer_time_before', 'buffer_time_after',
            'total_duration_minutes', 'is_active', 'requires_preparation',
            'organization', 'organization_name', 'professionals',
            'professionals_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']
    
    def get_professionals_count(self, obj):
        """
        Contar cantidad de profesionales que pueden realizar este servicio
        """
        return obj.professionals.count()
    
    def to_representation(self, instance):
        """
        Convertir UUIDs a strings para consistencia en pruebas
        """
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
        # Convertir professionals list a strings
        representation['professionals'] = [str(p.id) for p in instance.professionals.all()]
        return representation


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Client
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    appointments_count = serializers.SerializerMethodField()
    # CAMBIADO: Hacer organization como CharField para que siempre sea string
    organization = serializers.CharField(read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'birth_date', 'notes', 'email_notifications', 'sms_notifications',
            'is_active', 'organization', 'organization_name',
            'appointments_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'full_name', 'created_at', 'updated_at']
    
    def get_appointments_count(self, obj):
        """
        Contar cantidad de citas del cliente
        """
        return getattr(obj, 'appointments', None).count() if hasattr(obj, 'appointments') else 0
    
    def to_representation(self, instance):
        """
        Convertir UUIDs a strings para consistencia en pruebas
        """
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
        return representation