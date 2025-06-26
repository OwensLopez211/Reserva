# core/validators.py

from rest_framework import serializers
from plans.models import OrganizationSubscription


class SubscriptionLimitValidator:
    """
    Validador para verificar límites de suscripción
    """
    
    def __init__(self, limit_type):
        """
        limit_type: 'professionals', 'services', 'clients', 'appointments'
        """
        self.limit_type = limit_type
    
    def __call__(self, value):
        """
        Validar límites en el contexto del serializer
        """
        # Obtener el request del contexto del serializer
        request = self.get_request_from_context()
        if not request:
            return
        
        # Verificar que el usuario tenga organización
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return
        
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=request.user.organization
            )
            
            if not subscription.is_active:
                raise serializers.ValidationError(
                    'Tu suscripción no está activa. Contacta al soporte.'
                )
            
            # Validar según el tipo de límite
            if self.limit_type == 'professionals':
                if not subscription.can_add_professional():
                    raise serializers.ValidationError(
                        f'Has alcanzado el límite de {subscription.plan.max_professionals} '
                        f'profesionales para tu plan {subscription.plan.name}. '
                        f'Actualiza tu plan para agregar más profesionales.'
                    )
            
            elif self.limit_type == 'services':
                if not subscription.can_add_service():
                    raise serializers.ValidationError(
                        f'Has alcanzado el límite de {subscription.plan.max_services} '
                        f'servicios para tu plan {subscription.plan.name}. '
                        f'Actualiza tu plan para agregar más servicios.'
                    )
            
            elif self.limit_type == 'clients':
                if not subscription.can_add_client():
                    raise serializers.ValidationError(
                        f'Has alcanzado el límite de {subscription.plan.max_clients} '
                        f'clientes para tu plan {subscription.plan.name}. '
                        f'Actualiza tu plan para agregar más clientes.'
                    )
            
            elif self.limit_type == 'appointments':
                if not subscription.can_create_appointment():
                    raise serializers.ValidationError(
                        f'Has alcanzado el límite de {subscription.plan.max_monthly_appointments} '
                        f'citas mensuales para tu plan {subscription.plan.name}. '
                        f'Actualiza tu plan o espera al próximo mes.'
                    )
        
        except OrganizationSubscription.DoesNotExist:
            raise serializers.ValidationError(
                'No se encontró una suscripción activa para tu organización.'
            )
    
    def get_request_from_context(self):
        """
        Obtener el request del contexto del serializer
        """
        # Este método será llamado desde un serializer
        # y necesitamos acceso al contexto del serializer parent
        import inspect
        
        for frame_info in inspect.stack():
            frame_locals = frame_info.frame.f_locals
            if 'self' in frame_locals:
                obj = frame_locals['self']
                if hasattr(obj, 'context') and 'request' in obj.context:
                    return obj.context['request']
        
        return None


def validate_professional_limit(value):
    """
    Validador específico para profesionales
    """
    validator = SubscriptionLimitValidator('professionals')
    return validator(value)


def validate_service_limit(value):
    """
    Validador específico para servicios
    """
    validator = SubscriptionLimitValidator('services')
    return validator(value)


def validate_client_limit(value):
    """
    Validador específico para clientes
    """
    validator = SubscriptionLimitValidator('clients')
    return validator(value)


def validate_appointment_limit(value):
    """
    Validador específico para citas
    """
    validator = SubscriptionLimitValidator('appointments')
    return validator(value)


class IndustryConfigValidator:
    """
    Validador para configuraciones específicas de industria
    """
    
    def __init__(self, field_name):
        self.field_name = field_name
    
    def __call__(self, value):
        """
        Validar configuraciones según la industria
        """
        # Implementar validaciones específicas según necesidades
        # Por ejemplo, validar horarios de negocio, tipos de servicios, etc.
        pass


def validate_business_hours(hours_data):
    """
    Validar formato de horarios de negocio
    """
    if not isinstance(hours_data, dict):
        raise serializers.ValidationError("Los horarios deben ser un objeto")
    
    required_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    for day in required_days:
        if day not in hours_data:
            raise serializers.ValidationError(f"Falta el día {day} en los horarios")
        
        day_data = hours_data[day]
        if not isinstance(day_data, dict):
            raise serializers.ValidationError(f"Los datos del {day} deben ser un objeto")
        
        required_fields = ['open', 'close', 'is_open']
        for field in required_fields:
            if field not in day_data:
                raise serializers.ValidationError(f"Falta el campo {field} para {day}")


def validate_service_duration(duration_minutes):
    """
    Validar duración de servicios
    """
    if duration_minutes < 5:
        raise serializers.ValidationError("La duración mínima es de 5 minutos")
    
    if duration_minutes > 480:  # 8 horas
        raise serializers.ValidationError("La duración máxima es de 8 horas (480 minutos)")
    
    if duration_minutes % 5 != 0:
        raise serializers.ValidationError("La duración debe ser múltiplo de 5 minutos")


def validate_service_price(price):
    """
    Validar precio de servicios
    """
    if price < 0:
        raise serializers.ValidationError("El precio no puede ser negativo")
    
    if price > 1000000:  # 1 millón
        raise serializers.ValidationError("El precio máximo es de $1,000,000")


def validate_professional_email(email, organization):
    """
    Validar que el email del profesional sea único en la organización
    """
    from organizations.models import Professional
    
    if Professional.objects.filter(
        organization=organization,
        email=email
    ).exists():
        raise serializers.ValidationError(
            "Ya existe un profesional con este email en tu organización"
        )