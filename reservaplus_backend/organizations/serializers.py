# organizations/serializers.py - CON VALIDACIONES DE LÍMITES

from rest_framework import serializers
from .models import Organization, Professional, Service, Client
from core.validators import (
    validate_professional_limit,
    validate_service_limit, 
    validate_client_limit,
    validate_service_duration,
    validate_service_price,
    validate_business_hours
)


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
            'is_active', 'is_trial', 'trial_ends_at', 'onboarding_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'onboarding_completed']
    
    def validate_settings(self, value):
        """Validar configuraciones de la organización"""
        if 'business_hours' in value:
            validate_business_hours(value['business_hours'])
        return value


class ProfessionalSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Professional con validaciones de límites
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
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
    
    def validate_name(self, value):
        """Validar límites al crear profesional"""
        validate_professional_limit(value)
        return value
    
    def validate_email(self, value):
        """Validar email único en la organización"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'organization'):
            organization = request.user.organization
            
            # Excluir la instancia actual en caso de actualización
            queryset = Professional.objects.filter(
                organization=organization,
                email=value
            )
            
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError(
                    "Ya existe un profesional con este email en tu organización"
                )
        
        return value
    
    def validate_color_code(self, value):
        """Validar formato de color hex"""
        if not value.startswith('#') or len(value) != 7:
            raise serializers.ValidationError("El color debe estar en formato hex (#RRGGBB)")
        return value
    
    def to_representation(self, instance):
        """Convertir UUIDs a strings para consistencia"""
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
        if instance.user:
            representation['user'] = str(instance.user.id)
        return representation


class ServiceSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Service con validaciones de límites
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    total_duration_minutes = serializers.ReadOnlyField()
    professionals_count = serializers.SerializerMethodField()
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
    
    def validate_name(self, value):
        """Validar límites al crear servicio"""
        validate_service_limit(value)
        return value
    
    def validate_duration_minutes(self, value):
        """Validar duración del servicio"""
        validate_service_duration(value)
        return value
    
    def validate_price(self, value):
        """Validar precio del servicio"""
        validate_service_price(value)
        return value
    
    def validate_buffer_time_before(self, value):
        """Validar tiempo de buffer antes"""
        if value < 0:
            raise serializers.ValidationError("El tiempo de buffer no puede ser negativo")
        if value > 60:
            raise serializers.ValidationError("El tiempo de buffer máximo es 60 minutos")
        return value
    
    def validate_buffer_time_after(self, value):
        """Validar tiempo de buffer después"""
        if value < 0:
            raise serializers.ValidationError("El tiempo de buffer no puede ser negativo")
        if value > 60:
            raise serializers.ValidationError("El tiempo de buffer máximo es 60 minutos")
        return value
    
    def validate_professionals(self, value):
        """Validar que los profesionales pertenezcan a la organización"""
        request = self.context.get('request')
        if request and hasattr(request.user, 'organization'):
            organization = request.user.organization
            
            for professional in value:
                if professional.organization != organization:
                    raise serializers.ValidationError(
                        f"El profesional {professional.name} no pertenece a tu organización"
                    )
        
        return value
    
    def get_professionals_count(self, obj):
        """Contar cantidad de profesionales que pueden realizar este servicio"""
        return obj.professionals.count()
    
    def to_representation(self, instance):
        """Convertir UUIDs a strings para consistencia"""
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
        representation['professionals'] = [str(p.id) for p in instance.professionals.all()]
        return representation


class ClientSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Client con validaciones de límites
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    appointments_count = serializers.SerializerMethodField()
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
    
    def validate_first_name(self, value):
        """Validar límites al crear cliente"""
        validate_client_limit(value)
        return value
    
    def validate_email(self, value):
        """Validar email único en la organización (si se proporciona)"""
        if not value:  # Email es opcional
            return value
        
        request = self.context.get('request')
        if request and hasattr(request.user, 'organization'):
            organization = request.user.organization
            
            # Excluir la instancia actual en caso de actualización
            queryset = Client.objects.filter(
                organization=organization,
                email=value
            )
            
            if self.instance:
                queryset = queryset.exclude(pk=self.instance.pk)
            
            if queryset.exists():
                raise serializers.ValidationError(
                    "Ya existe un cliente con este email en tu organización"
                )
        
        return value
    
    def validate_phone(self, value):
        """Validar formato de teléfono"""
        if value and len(value) < 8:
            raise serializers.ValidationError("El teléfono debe tener al menos 8 dígitos")
        return value
    
    def get_appointments_count(self, obj):
        """Contar cantidad de citas del cliente"""
        return getattr(obj, 'appointments', None).count() if hasattr(obj, 'appointments') else 0
    
    def to_representation(self, instance):
        """Convertir UUIDs a strings para consistencia"""
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
        return representation


class MarketplaceServiceSerializer(serializers.ModelSerializer):
    """
    Serializer para servicios en el marketplace (información pública)
    """
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'category', 
            'duration_minutes', 'price', 'is_active'
        ]


class MarketplaceProfessionalSerializer(serializers.ModelSerializer):
    """
    Serializer para profesionales en el marketplace (información pública)
    """
    class Meta:
        model = Professional
        fields = [
            'id', 'name', 'specialty', 'bio', 'is_active'
        ]


class MarketplaceOrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer para organizaciones en el marketplace (solo información pública)
    """
    services = MarketplaceServiceSerializer(many=True, read_only=True)
    professionals = MarketplaceProfessionalSerializer(many=True, read_only=True)
    services_count = serializers.SerializerMethodField()
    professionals_count = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    is_open_now = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'description', 'industry_template',
            'phone', 'website', 'address', 'city', 'country',
            'logo', 'cover_image', 'gallery_images', 'is_featured',
            'rating', 'total_reviews', 'services', 'professionals', 
            'services_count', 'professionals_count', 'min_price', 
            'max_price', 'is_open_now', 'created_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at']
    
    def get_services_count(self, obj):
        """Contar servicios activos"""
        return obj.services.filter(is_active=True).count()
    
    def get_professionals_count(self, obj):
        """Contar profesionales activos"""
        return obj.professionals.filter(is_active=True).count()
    
    def get_min_price(self, obj):
        """Obtener precio mínimo de servicios"""
        services = obj.services.filter(is_active=True)
        if services.exists():
            return min(service.price for service in services)
        return None
    
    def get_max_price(self, obj):
        """Obtener precio máximo de servicios"""
        services = obj.services.filter(is_active=True)
        if services.exists():
            return max(service.price for service in services)
        return None
    
    def get_avg_rating(self, obj):
        """Obtener rating promedio"""
        return float(obj.rating) if obj.rating else 0.0
    
    def get_total_reviews(self, obj):
        """Obtener total de reseñas"""
        return obj.total_reviews
    
    def get_is_open_now(self, obj):
        """Determinar si está abierto ahora"""
        # TODO: Implementar lógica de horarios
        from datetime import datetime
        now = datetime.now()
        # Placeholder: abierto de 9 AM a 6 PM
        return 9 <= now.hour < 18


class MarketplaceOrganizationDetailSerializer(MarketplaceOrganizationSerializer):
    """
    Serializer detallado para una organización específica en el marketplace
    """
    business_hours = serializers.SerializerMethodField()
    featured_services = serializers.SerializerMethodField()
    
    class Meta(MarketplaceOrganizationSerializer.Meta):
        fields = MarketplaceOrganizationSerializer.Meta.fields + [
            'business_hours', 'featured_services'
        ]
    
    def get_business_hours(self, obj):
        """Obtener horarios de atención"""
        # TODO: Implementar horarios desde settings
        return {
            'monday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'tuesday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'wednesday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'thursday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'friday': {'open': '09:00', 'close': '18:00', 'closed': False},
            'saturday': {'open': '10:00', 'close': '16:00', 'closed': False},
            'sunday': {'open': '10:00', 'close': '16:00', 'closed': True}
        }
    
    def get_featured_services(self, obj):
        """Obtener servicios destacados (top 3 por precio)"""
        featured = obj.services.filter(is_active=True).order_by('-price')[:3]
        return MarketplaceServiceSerializer(featured, many=True).data