# appointments/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import Appointment, AppointmentHistory, RecurringAppointment
from organizations.models import Professional, Service, Client


class AppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer principal para citas
    """
    # Campos de solo lectura con información adicional
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    # Propiedades calculadas
    duration_hours = serializers.ReadOnlyField()
    is_today = serializers.ReadOnlyField()
    is_past = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    can_be_cancelled = serializers.ReadOnlyField()
    time_until_appointment = serializers.ReadOnlyField()
    
    # Status display
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'organization', 'organization_name',
            'client', 'client_name', 'professional', 'professional_name',
            'service', 'service_name', 'start_datetime', 'end_datetime',
            'duration_minutes', 'duration_hours', 'status', 'status_display',
            'price', 'notes', 'internal_notes', 'is_walk_in',
            'requires_confirmation', 'reminder_sent', 'confirmation_sent',
            'is_today', 'is_past', 'is_upcoming', 'can_be_cancelled',
            'time_until_appointment', 'cancelled_at', 'cancelled_by',
            'cancellation_reason', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organization', 'end_datetime', 'cancelled_at', 
            'cancelled_by', 'created_at', 'updated_at'
        ]
    
    def validate(self, data):
        """Validaciones personalizadas"""
        # Validar que la fecha no sea en el pasado
        if data.get('start_datetime') and data['start_datetime'] < timezone.now():
            raise serializers.ValidationError(
                "No se pueden crear citas en el pasado"
            )
        
        # Validar que el profesional pueda realizar el servicio
        professional = data.get('professional')
        service = data.get('service')
        if professional and service:
            if not service.professionals.filter(id=professional.id).exists():
                raise serializers.ValidationError(
                    "El profesional seleccionado no puede realizar este servicio"
                )
        
        return data
    
    def create(self, validated_data):
        """Crear cita con lógica de negocio"""
        # Establecer organización del usuario actual
        validated_data['organization'] = self.context['request'].user.organization
        validated_data['created_by'] = self.context['request'].user
        
        # Establecer duración y precio automáticamente si no están definidos
        service = validated_data.get('service')
        if service:
            if not validated_data.get('duration_minutes'):
                validated_data['duration_minutes'] = service.total_duration_minutes
            if not validated_data.get('price'):
                validated_data['price'] = service.price
        
        # Verificar reglas de negocio de la organización
        organization = validated_data['organization']
        business_rules = organization.business_rules
        
        # Establecer si requiere confirmación
        if not validated_data.get('requires_confirmation'):
            validated_data['requires_confirmation'] = business_rules.get('requires_confirmation', False)
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        """Personalizar la representación de salida"""
        representation = super().to_representation(instance)
        
        # Convertir UUIDs a strings para consistencia
        for field in ['organization', 'client', 'professional', 'service', 'created_by', 'cancelled_by']:
            if representation.get(field):
                representation[field] = str(representation[field])
        
        return representation


class AppointmentCreateSerializer(AppointmentSerializer):
    """
    Serializer especializado para crear citas
    """
    class Meta(AppointmentSerializer.Meta):
        fields = [
            'client', 'professional', 'service', 'start_datetime',
            'notes', 'is_walk_in', 'requires_confirmation'
        ]


class AppointmentUpdateSerializer(AppointmentSerializer):
    """
    Serializer especializado para actualizar citas
    """
    class Meta(AppointmentSerializer.Meta):
        fields = [
            'start_datetime', 'notes', 'internal_notes', 
            'status', 'cancellation_reason'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']


class AppointmentHistorySerializer(serializers.ModelSerializer):
    """
    Serializer para el historial de citas
    """
    appointment_info = serializers.CharField(source='appointment.__str__', read_only=True)
    changed_by_name = serializers.CharField(source='changed_by.full_name', read_only=True)
    
    class Meta:
        model = AppointmentHistory
        fields = [
            'id', 'appointment', 'appointment_info', 'action',
            'old_values', 'new_values', 'changed_by', 'changed_by_name',
            'changed_at', 'notes'
        ]
        read_only_fields = ['id', 'changed_at']


class RecurringAppointmentSerializer(serializers.ModelSerializer):
    """
    Serializer para citas recurrentes
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    
    class Meta:
        model = RecurringAppointment
        fields = [
            'id', 'organization', 'client', 'client_name',
            'professional', 'professional_name', 'service', 'service_name',
            'frequency', 'frequency_display', 'interval_days',
            'preferred_time', 'preferred_day_of_week', 'is_active',
            'start_date', 'end_date', 'auto_confirm', 'advance_booking_days',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'organization', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        """Crear cita recurrente"""
        validated_data['organization'] = self.context['request'].user.organization
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class AppointmentCalendarSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para vista de calendario
    Campos mínimos para rendimiento
    """
    client_name = serializers.CharField(source='client.full_name', read_only=True)
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    professional_color = serializers.CharField(source='professional.color_code', read_only=True)
    
    class Meta:
        model = Appointment
        fields = [
            'id', 'client_name', 'professional_name', 'service_name',
            'start_datetime', 'end_datetime', 'duration_minutes',
            'status', 'professional_color', 'is_walk_in'
        ]


class AvailabilitySlotSerializer(serializers.Serializer):
    """
    Serializer para slots de disponibilidad
    No es un modelo, solo para respuestas de API
    """
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField()
    is_available = serializers.BooleanField()
    professional_id = serializers.UUIDField()
    professional_name = serializers.CharField()
    service_id = serializers.UUIDField(required=False)
    service_name = serializers.CharField(required=False)