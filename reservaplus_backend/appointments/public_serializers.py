# appointments/public_serializers.py

from rest_framework import serializers
from organizations.models import Organization, Professional, Service, Client
from appointments.models import Appointment


class PublicOrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer para información pública de organización
    """
    industry_display = serializers.CharField(source='get_industry_template_display', read_only=True)
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'slug', 'description', 'industry_template', 'industry_display',
            'email', 'phone', 'website', 'address', 'city', 'country',
            'logo', 'cover_image', 'gallery_images', 'rating', 'total_reviews',
            'is_featured'
        ]


class PublicProfessionalSerializer(serializers.ModelSerializer):
    """
    Serializer para información pública de profesional
    """
    
    class Meta:
        model = Professional
        fields = [
            'id', 'name', 'specialty', 'bio', 'accepts_walk_ins', 'color_code'
        ]


class PublicServiceSerializer(serializers.ModelSerializer):
    """
    Serializer para información pública de servicio
    """
    professionals = PublicProfessionalSerializer(many=True, read_only=True)
    price_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'category', 'duration_minutes', 
            'price', 'price_formatted', 'professionals'
        ]
    
    def get_price_formatted(self, obj):
        """Formatear precio para mostrar"""
        return f"${obj.price:,.0f}"


class PublicClientCreateSerializer(serializers.Serializer):
    """
    Serializer para crear cliente público
    """
    booking_type = serializers.ChoiceField(choices=['guest', 'registered'], default='guest')
    
    # Datos del cliente
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    # Para clientes registrados
    password = serializers.CharField(write_only=True, required=False)
    
    # Campos adicionales opcionales
    emergency_contact = serializers.CharField(max_length=200, required=False, allow_blank=True)
    marketing_consent = serializers.BooleanField(default=False)
    address = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validaciones adicionales"""
        if data['booking_type'] == 'registered' and not data.get('password'):
            raise serializers.ValidationError(
                "Password es requerido para clientes registrados"
            )
        
        # Validar formato de email
        email = data['email']
        if '@' not in email or '.' not in email.split('@')[-1]:
            raise serializers.ValidationError("Formato de email inválido")
        
        # Validar teléfono (formato chileno básico)
        phone = data['phone']
        if not phone.startswith('+56') and not phone.startswith('56') and not phone.startswith('9'):
            # Permitir diferentes formatos pero sugerir el correcto
            pass
        
        return data


class PublicAppointmentCreateSerializer(serializers.Serializer):
    """
    Serializer para crear cita pública
    """
    service_id = serializers.UUIDField()
    professional_id = serializers.UUIDField()
    start_datetime = serializers.DateTimeField()
    client_data = PublicClientCreateSerializer()
    
    # Campos adicionales del booking
    password = serializers.CharField(write_only=True, required=False)
    emergency_contact = serializers.CharField(max_length=200, required=False)
    marketing_consent = serializers.BooleanField(default=False)


class PublicAppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer para mostrar cita pública
    """
    service_name = serializers.CharField(source='service.name', read_only=True)
    service_duration = serializers.IntegerField(source='service.duration_minutes', read_only=True)
    service_price = serializers.DecimalField(source='service.price', max_digits=10, decimal_places=2, read_only=True)
    service_category = serializers.CharField(source='service.category', read_only=True)
    
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    professional_specialty = serializers.CharField(source='professional.specialty', read_only=True)
    
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_address = serializers.CharField(source='organization.address', read_only=True)
    organization_phone = serializers.CharField(source='organization.phone', read_only=True)
    
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    client_phone = serializers.CharField(source='client.phone', read_only=True)
    client_type = serializers.CharField(source='client.client_type', read_only=True)
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    can_be_cancelled = serializers.BooleanField(read_only=True)
    time_until_appointment = serializers.CharField(read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'start_datetime', 'end_datetime', 'status', 'status_display',
            'notes', 'can_be_cancelled', 'time_until_appointment',
            'service_name', 'service_duration', 'service_price', 'service_category',
            'professional_name', 'professional_specialty',
            'organization_name', 'organization_address', 'organization_phone',
            'client_name', 'client_phone', 'client_type'
        ]


class PublicClientSerializer(serializers.ModelSerializer):
    """
    Serializer para cliente público
    """
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'client_type', 'email_verified', 'address', 'emergency_contact',
            'email_notifications', 'sms_notifications', 'marketing_consent',
            'created_at'
        ]


class ClientLoginSerializer(serializers.Serializer):
    """
    Serializer para login de cliente
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ClientVerifyEmailSerializer(serializers.Serializer):
    """
    Serializer para verificación de email
    """
    email = serializers.EmailField()
    verification_token = serializers.CharField()


class AvailabilitySlotSerializer(serializers.Serializer):
    """
    Serializer para slot de disponibilidad
    """
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    professional_id = serializers.UUIDField()
    professional_name = serializers.CharField()
    duration_minutes = serializers.IntegerField()
    is_available = serializers.BooleanField()
    conflict_reason = serializers.CharField(required=False, allow_null=True)


class PublicAvailabilityResponseSerializer(serializers.Serializer):
    """
    Serializer para respuesta de disponibilidad pública
    """
    organization_slug = serializers.CharField()
    service = PublicServiceSerializer()
    professional_filter = serializers.UUIDField(required=False, allow_null=True)
    date_range = serializers.DictField()
    availability = serializers.DictField()


class AppointmentCancelSerializer(serializers.Serializer):
    """
    Serializer para cancelar cita
    """
    reason = serializers.CharField(max_length=500, required=False, default="Cancelada por el cliente")
    guest_token = serializers.CharField(required=False)  # Para clientes guest


class ClientProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar perfil de cliente
    """
    
    class Meta:
        model = Client
        fields = [
            'first_name', 'last_name', 'phone', 'address', 'emergency_contact',
            'email_notifications', 'sms_notifications', 'marketing_consent'
        ]
    
    def validate_phone(self, value):
        """Validar formato de teléfono"""
        if not value:
            return value
        
        # Limpiar espacios y caracteres especiales
        cleaned_phone = ''.join(filter(str.isdigit, value.replace('+', '')))
        
        # Validar longitud mínima
        if len(cleaned_phone) < 8:
            raise serializers.ValidationError("Número de teléfono muy corto")
        
        return value