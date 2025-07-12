# plans/serializers.py

from rest_framework import serializers
from .models import Plan, UserRegistration, OrganizationSubscription


class PlanSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Plan
    """
    yearly_discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'slug', 'description',
            'price_monthly', 'price_yearly', 'original_price',
            'max_professionals', 'max_services', 'max_monthly_appointments', 'max_clients',
            'features', 'supports_integrations', 'supports_advanced_reports',
            'supports_multi_location', 'supports_custom_branding', 'priority_support',
            'is_active', 'is_popular', 'is_coming_soon',
            'color_scheme', 'badge_text', 'discount_text',
            'yearly_discount_percentage', 'display_order'
        ]
        read_only_fields = ['id', 'slug', 'yearly_discount_percentage']


class PlanPublicSerializer(serializers.ModelSerializer):
    """
    Serializer público para mostrar planes (sin información sensible)
    """
    yearly_discount_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'description',
            'price_monthly', 'price_yearly', 'original_price',
            'max_professionals', 'max_services', 'max_monthly_appointments',
            'features', 'is_popular', 'is_coming_soon',
            'color_scheme', 'badge_text', 'discount_text',
            'yearly_discount_percentage'
        ]


class UserRegistrationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear un registro de usuario temporal
    """
    plan_id = serializers.UUIDField(write_only=True)
    user_data = serializers.DictField(write_only=True)
    
    class Meta:
        model = UserRegistration
        fields = ['email', 'plan_id', 'user_data']
    
    def validate_email(self, value):
        """Validar que el email no esté ya registrado"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        
        # También verificar en registros temporales activos
        existing_registration = UserRegistration.objects.filter(
            email=value,
            is_completed=False,
            is_expired=False
        ).first()
        
        if existing_registration and existing_registration.is_valid:
            raise serializers.ValidationError("Ya existe un registro en proceso con este email")
        
        return value
    
    def validate_plan_id(self, value):
        """Validar que el plan existe y está activo"""
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            if plan.is_coming_soon:
                raise serializers.ValidationError("Este plan no está disponible aún")
            return value
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Plan no encontrado")
    
    def create(self, validated_data):
        """Crear registro temporal de usuario"""
        import secrets
        from django.utils import timezone
        from datetime import timedelta
        
        plan_id = validated_data.pop('plan_id')
        user_data = validated_data.pop('user_data')
        
        # Generar token temporal
        temp_token = secrets.token_urlsafe(32)
        
        # Crear registro con expiración de 24 horas
        registration = UserRegistration.objects.create(
            email=validated_data['email'],
            temp_token=temp_token,
            selected_plan_id=plan_id,
            registration_data=user_data,
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        return registration


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar información del registro
    """
    selected_plan = PlanPublicSerializer(read_only=True)
    is_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = UserRegistration
        fields = [
            'id', 'email', 'selected_plan', 'onboarding_step',
            'completed_steps', 'is_completed', 'is_expired', 'is_valid',
            'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at']


class OnboardingDataSerializer(serializers.Serializer):
    """
    Serializer para validar datos completos del onboarding
    """
    # Datos de la organización
    organization = serializers.DictField()
    
    # Lista de profesionales
    professionals = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    # Lista de servicios
    services = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    # Token del registro temporal
    registration_token = serializers.CharField()
    
    def validate_registration_token(self, value):
        """Validar que el token de registro es válido"""
        try:
            registration = UserRegistration.objects.get(
                temp_token=value,
                is_completed=False,
                is_expired=False
            )
            if not registration.is_valid:
                raise serializers.ValidationError("Token de registro expirado")
            
            # Guardar la instancia para uso posterior
            self.context['registration'] = registration
            return value
        except UserRegistration.DoesNotExist:
            raise serializers.ValidationError("Token de registro inválido")
    
    def validate_organization(self, value):
        """Validar datos de organización"""
        required_fields = ['name', 'industry_template', 'email', 'phone']
        for field in required_fields:
            if not value.get(field):
                raise serializers.ValidationError(f"Campo '{field}' es requerido")
        return value
    
    def validate_professionals(self, value):
        """Validar datos de profesionales"""
        registration = self.context.get('registration')
        if registration:
            max_professionals = registration.selected_plan.max_professionals
            if len(value) > max_professionals:
                raise serializers.ValidationError(
                    f"El plan {registration.selected_plan.name} permite máximo {max_professionals} profesionales"
                )
        
        for i, professional in enumerate(value):
            if not professional.get('name'):
                raise serializers.ValidationError(f"Nombre del profesional {i+1} es requerido")
            if not professional.get('email'):
                raise serializers.ValidationError(f"Email del profesional {i+1} es requerido")
        
        return value
    
    def validate_services(self, value):
        """Validar datos de servicios"""
        registration = self.context.get('registration')
        if registration:
            max_services = registration.selected_plan.max_services
            if len(value) > max_services:
                raise serializers.ValidationError(
                    f"El plan {registration.selected_plan.name} permite máximo {max_services} servicios"
                )
        
        for i, service in enumerate(value):
            if not service.get('name'):
                raise serializers.ValidationError(f"Nombre del servicio {i+1} es requerido")
            if not service.get('price') or service.get('price', 0) <= 0:
                raise serializers.ValidationError(f"Precio del servicio {i+1} debe ser mayor a 0")
            if not service.get('duration_minutes') or service.get('duration_minutes', 0) <= 0:
                raise serializers.ValidationError(f"Duración del servicio {i+1} debe ser mayor a 0")
        
        return value


class OrganizationSubscriptionSerializer(serializers.ModelSerializer):
    """
    Serializer para suscripciones de organización
    """
    plan = PlanSerializer(read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = OrganizationSubscription
        fields = [
            'id', 'organization', 'organization_name', 'plan',
            'billing_cycle', 'status', 'trial_start', 'trial_end',
            'current_period_start', 'current_period_end',
            'current_professionals_count', 'current_services_count',
            'current_clients_count', 'current_month_appointments_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization', 'organization_name', 'plan',
            'created_at', 'updated_at'
        ]


class SubscriptionUsageSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar el uso actual de la suscripción
    """
    plan_limits = serializers.SerializerMethodField()
    usage_percentages = serializers.SerializerMethodField()
    can_add = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationSubscription
        fields = [
            'current_professionals_count', 'current_services_count',
            'current_clients_count', 'current_month_appointments_count',
            'plan_limits', 'usage_percentages', 'can_add'
        ]
    
    def get_plan_limits(self, obj):
        """Obtener límites del plan"""
        return {
            'max_professionals': obj.plan.max_professionals,
            'max_services': obj.plan.max_services,
            'max_clients': obj.plan.max_clients,
            'max_monthly_appointments': obj.plan.max_monthly_appointments
        }
    
    def get_usage_percentages(self, obj):
        """Calcular porcentajes de uso"""
        return {
            'professionals': round((obj.current_professionals_count / obj.plan.max_professionals) * 100, 1),
            'services': round((obj.current_services_count / obj.plan.max_services) * 100, 1),
            'clients': round((obj.current_clients_count / obj.plan.max_clients) * 100, 1),
            'monthly_appointments': round((obj.current_month_appointments_count / obj.plan.max_monthly_appointments) * 100, 1)
        }
    
    def get_can_add(self, obj):
        """Verificar qué se puede agregar"""
        return {
            'professional': obj.can_add_professional(),
            'service': obj.can_add_service(),
            'client': obj.can_add_client(),
            'appointment': obj.can_create_appointment()
        }