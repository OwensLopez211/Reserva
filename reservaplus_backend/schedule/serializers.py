# schedule/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import (
    ProfessionalSchedule,
    WeeklySchedule,
    ScheduleBreak,
    ScheduleException,
    AvailabilitySlot
)


class ScheduleBreakSerializer(serializers.ModelSerializer):
    """
    Serializer para descansos/breaks en los horarios
    """
    class Meta:
        model = ScheduleBreak
        fields = [
            'id', 'start_time', 'end_time', 'name', 'description',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WeeklyScheduleSerializer(serializers.ModelSerializer):
    """
    Serializer para horarios semanales
    """
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    breaks = ScheduleBreakSerializer(many=True, read_only=True)
    
    class Meta:
        model = WeeklySchedule
        fields = [
            'id', 'weekday', 'weekday_display', 'start_time', 'end_time',
            'is_active', 'breaks', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validar que la hora de inicio sea anterior a la de fin
        """
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("La hora de inicio debe ser anterior a la hora de fin")
        return data


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    """
    Serializer para excepciones de horarios
    """
    exception_type_display = serializers.CharField(source='get_exception_type_display', read_only=True)
    
    class Meta:
        model = ScheduleException
        fields = [
            'id', 'date', 'exception_type', 'exception_type_display',
            'start_time', 'end_time', 'reason', 'notes', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """
        Validar horarios especiales
        """
        if data.get('exception_type') == 'special_hours':
            if not data.get('start_time') or not data.get('end_time'):
                raise serializers.ValidationError(
                    "Los horarios especiales requieren hora de inicio y fin"
                )
            if data['start_time'] >= data['end_time']:
                raise serializers.ValidationError(
                    "La hora de inicio debe ser anterior a la hora de fin"
                )
        return data


class ProfessionalScheduleSerializer(serializers.ModelSerializer):
    """
    Serializer para la configuración general de horarios
    """
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    weekly_schedules = WeeklyScheduleSerializer(many=True, read_only=True)
    exceptions = ScheduleExceptionSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProfessionalSchedule
        fields = [
            'id', 'professional', 'professional_name', 'timezone',
            'min_booking_notice', 'max_booking_advance', 'slot_duration',
            'is_active', 'accepts_bookings', 'weekly_schedules', 'exceptions',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    """
    Serializer para slots de disponibilidad
    """
    professional_name = serializers.CharField(source='professional_schedule.professional.name', read_only=True)
    
    class Meta:
        model = AvailabilitySlot
        fields = [
            'id', 'professional_schedule', 'professional_name', 'date',
            'start_time', 'end_time', 'is_available', 'is_blocked',
            'blocked_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class WeeklyScheduleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear horarios semanales con sus breaks
    """
    breaks = ScheduleBreakSerializer(many=True, required=False)
    
    class Meta:
        model = WeeklySchedule
        fields = [
            'weekday', 'start_time', 'end_time', 'is_active', 'breaks'
        ]
    
    def create(self, validated_data):
        """
        Crear horario semanal con sus breaks
        """
        breaks_data = validated_data.pop('breaks', [])
        weekly_schedule = WeeklySchedule.objects.create(**validated_data)
        
        for break_data in breaks_data:
            ScheduleBreak.objects.create(
                weekly_schedule=weekly_schedule,
                **break_data
            )
        
        return weekly_schedule
    
    def update(self, instance, validated_data):
        """
        Actualizar horario semanal y sus breaks
        """
        breaks_data = validated_data.pop('breaks', [])
        
        # Actualizar el horario semanal
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar breaks - eliminar los existentes y crear nuevos
        if breaks_data:
            instance.breaks.all().delete()
            for break_data in breaks_data:
                ScheduleBreak.objects.create(
                    weekly_schedule=instance,
                    **break_data
                )
        
        return instance


class ProfessionalScheduleCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear configuración completa de horarios
    """
    weekly_schedules = WeeklyScheduleCreateSerializer(many=True, required=False)
    exceptions = ScheduleExceptionSerializer(many=True, required=False)
    
    class Meta:
        model = ProfessionalSchedule
        fields = [
            'professional', 'timezone', 'min_booking_notice',
            'max_booking_advance', 'slot_duration', 'is_active',
            'accepts_bookings', 'weekly_schedules', 'exceptions'
        ]
    
    def create(self, validated_data):
        """
        Crear configuración completa de horarios
        """
        weekly_schedules_data = validated_data.pop('weekly_schedules', [])
        exceptions_data = validated_data.pop('exceptions', [])
        
        professional_schedule = ProfessionalSchedule.objects.create(**validated_data)
        
        # Crear horarios semanales
        for weekly_data in weekly_schedules_data:
            breaks_data = weekly_data.pop('breaks', [])
            weekly_schedule = WeeklySchedule.objects.create(
                professional_schedule=professional_schedule,
                **weekly_data
            )
            
            # Crear breaks para este horario semanal
            for break_data in breaks_data:
                ScheduleBreak.objects.create(
                    weekly_schedule=weekly_schedule,
                    **break_data
                )
        
        # Crear excepciones
        for exception_data in exceptions_data:
            ScheduleException.objects.create(
                professional_schedule=professional_schedule,
                **exception_data
            )
        
        return professional_schedule


class ScheduleSummarySerializer(serializers.ModelSerializer):
    """
    Serializer resumido para mostrar horarios en listados
    """
    professional_name = serializers.CharField(source='professional.name', read_only=True)
    total_weekly_hours = serializers.SerializerMethodField()
    active_days_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProfessionalSchedule
        fields = [
            'id', 'professional', 'professional_name', 'timezone',
            'slot_duration', 'is_active', 'accepts_bookings',
            'total_weekly_hours', 'active_days_count', 'updated_at'
        ]
    
    def get_total_weekly_hours(self, obj):
        """
        Calcular total de horas semanales
        """
        total_minutes = 0
        for schedule in obj.weekly_schedules.filter(is_active=True):
            start_datetime = timezone.datetime.combine(timezone.datetime.today().date(), schedule.start_time)
            end_datetime = timezone.datetime.combine(timezone.datetime.today().date(), schedule.end_time)
            duration = end_datetime - start_datetime
            total_minutes += duration.total_seconds() / 60
        
        return round(total_minutes / 60, 2)
    
    def get_active_days_count(self, obj):
        """
        Contar días activos en la semana
        """
        return obj.weekly_schedules.filter(is_active=True).count() 