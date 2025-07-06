from django.db import models
import uuid
from django.core.exceptions import ValidationError
from datetime import datetime, time, timedelta
from django.utils import timezone

# Create your models here.

class ProfessionalSchedule(models.Model):
    """
    Configuración general de horarios para un profesional
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con el profesional
    professional = models.OneToOneField(
        'organizations.Professional',
        on_delete=models.CASCADE,
        related_name='schedule'
    )
    
    # Configuración general
    timezone = models.CharField(
        max_length=50,
        default='America/Santiago',
        help_text="Zona horaria del profesional"
    )
    
    # Configuración de citas
    min_booking_notice = models.PositiveIntegerField(
        default=60,
        help_text="Tiempo mínimo de anticipación para reservas (minutos)"
    )
    max_booking_advance = models.PositiveIntegerField(
        default=10080,  # 1 semana en minutos
        help_text="Tiempo máximo de anticipación para reservas (minutos)"
    )
    
    # Configuración de slots
    slot_duration = models.PositiveIntegerField(
        default=30,
        help_text="Duración de cada slot de tiempo (minutos)"
    )
    
    # Estados
    is_active = models.BooleanField(default=True)
    accepts_bookings = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schedule_professional_schedule'
        verbose_name = 'Horario de Profesional'
        verbose_name_plural = 'Horarios de Profesionales'
    
    def __str__(self):
        return f"Horario de {self.professional.name}"


class WeeklySchedule(models.Model):
    """
    Horarios semanales recurrentes para un profesional
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con el horario del profesional
    professional_schedule = models.ForeignKey(
        ProfessionalSchedule,
        on_delete=models.CASCADE,
        related_name='weekly_schedules'
    )
    
    # Día de la semana
    WEEKDAY_CHOICES = [
        (0, 'Lunes'),
        (1, 'Martes'),
        (2, 'Miércoles'),
        (3, 'Jueves'),
        (4, 'Viernes'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ]
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    
    # Horarios
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Estados
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schedule_weekly_schedule'
        verbose_name = 'Horario Semanal'
        verbose_name_plural = 'Horarios Semanales'
        unique_together = ['professional_schedule', 'weekday', 'start_time']
        ordering = ['weekday', 'start_time']
    
    def __str__(self):
        return f"{self.get_weekday_display()} {self.start_time} - {self.end_time}"
    
    def clean(self):
        """
        Validar que la hora de inicio sea anterior a la de fin
        """
        if self.start_time >= self.end_time:
            raise ValidationError("La hora de inicio debe ser anterior a la hora de fin")


class ScheduleBreak(models.Model):
    """
    Descansos/breaks dentro de los horarios de trabajo
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con el horario semanal
    weekly_schedule = models.ForeignKey(
        WeeklySchedule,
        on_delete=models.CASCADE,
        related_name='breaks'
    )
    
    # Horarios del descanso
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Información del descanso
    name = models.CharField(max_length=100, default="Descanso")
    description = models.TextField(blank=True)
    
    # Estados
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schedule_break'
        verbose_name = 'Descanso'
        verbose_name_plural = 'Descansos'
        ordering = ['start_time']
    
    def __str__(self):
        return f"{self.name}: {self.start_time} - {self.end_time}"
    
    def clean(self):
        """
        Validar que el descanso esté dentro del horario de trabajo
        """
        if self.start_time >= self.end_time:
            raise ValidationError("La hora de inicio debe ser anterior a la hora de fin")
        
        # Verificar que el descanso esté dentro del horario de trabajo
        if (self.start_time < self.weekly_schedule.start_time or 
            self.end_time > self.weekly_schedule.end_time):
            raise ValidationError("El descanso debe estar dentro del horario de trabajo")


class ScheduleException(models.Model):
    """
    Excepciones para días específicos (vacaciones, días libres, horarios especiales)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con el horario del profesional
    professional_schedule = models.ForeignKey(
        ProfessionalSchedule,
        on_delete=models.CASCADE,
        related_name='exceptions'
    )
    
    # Fecha de la excepción
    date = models.DateField()
    
    # Tipos de excepción
    EXCEPTION_TYPES = [
        ('unavailable', 'No Disponible'),
        ('vacation', 'Vacaciones'),
        ('sick_leave', 'Licencia Médica'),
        ('special_hours', 'Horario Especial'),
        ('holiday', 'Día Festivo'),
    ]
    exception_type = models.CharField(max_length=20, choices=EXCEPTION_TYPES)
    
    # Para horarios especiales
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    
    # Información adicional
    reason = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    
    # Estados
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schedule_exception'
        verbose_name = 'Excepción de Horario'
        verbose_name_plural = 'Excepciones de Horarios'
        unique_together = ['professional_schedule', 'date']
        ordering = ['date']
    
    def __str__(self):
        return f"{self.date} - {self.get_exception_type_display()}"
    
    def clean(self):
        """
        Validar horarios especiales
        """
        if self.exception_type == 'special_hours':
            if not self.start_time or not self.end_time:
                raise ValidationError("Los horarios especiales requieren hora de inicio y fin")
            if self.start_time >= self.end_time:
                raise ValidationError("La hora de inicio debe ser anterior a la hora de fin")


class AvailabilitySlot(models.Model):
    """
    Slots de disponibilidad calculados para un profesional en una fecha específica
    Estos se generan automáticamente basándose en los horarios y excepciones
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con el horario del profesional
    professional_schedule = models.ForeignKey(
        ProfessionalSchedule,
        on_delete=models.CASCADE,
        related_name='availability_slots'
    )
    
    # Fecha y hora del slot
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    
    # Estado del slot
    is_available = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    
    # Información adicional
    blocked_reason = models.CharField(max_length=200, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'schedule_availability_slot'
        verbose_name = 'Slot de Disponibilidad'
        verbose_name_plural = 'Slots de Disponibilidad'
        unique_together = ['professional_schedule', 'date', 'start_time']
        ordering = ['date', 'start_time']
    
    def __str__(self):
        return f"{self.date} {self.start_time} - {self.end_time}"
