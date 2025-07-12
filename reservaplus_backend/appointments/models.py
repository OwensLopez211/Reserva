# appointments/models.py

import uuid
from datetime import datetime, timedelta
from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from organizations.models import Organization, Professional, Service, Client
from users.models import User


class Appointment(models.Model):
    """
    Modelo principal de citas/reservas
    Corazón del sistema ReservaPlus
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relaciones principales (multi-tenant)
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    professional = models.ForeignKey(
        Professional, 
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    client = models.ForeignKey(
        Client, 
        on_delete=models.CASCADE,
        related_name='appointments'
    )
    
    # Información de tiempo
    start_datetime = models.DateTimeField(verbose_name="Fecha y hora de inicio")
    end_datetime = models.DateTimeField(verbose_name="Fecha y hora de fin")
    
    # Estados de la cita
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('confirmed', 'Confirmada'),
        ('checked_in', 'Cliente Llegó'),
        ('in_progress', 'En Proceso'),
        ('completed', 'Completada'),
        ('cancelled', 'Cancelada'),
        ('no_show', 'No Asistió'),
        ('rescheduled', 'Reprogramada'),
    ]
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        verbose_name="Estado"
    )
    
    # Información comercial
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Precio"
    )
    duration_minutes = models.PositiveIntegerField(
        verbose_name="Duración en minutos"
    )
    
    # Información adicional
    notes = models.TextField(blank=True, verbose_name="Notas")
    internal_notes = models.TextField(blank=True, verbose_name="Notas internas")
    
    # Configuración de la cita
    is_walk_in = models.BooleanField(default=False, verbose_name="Es Walk-in")
    requires_confirmation = models.BooleanField(default=False, verbose_name="Requiere confirmación")
    
    # Recordatorios y notificaciones
    reminder_sent = models.BooleanField(default=False)
    confirmation_sent = models.BooleanField(default=False)
    
    # Auditoría
    created_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='created_appointments'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Información de cancelación
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='cancelled_appointments'
    )
    cancellation_reason = models.TextField(blank=True)
    
    class Meta:
        db_table = 'appointments_appointment'
        ordering = ['start_datetime']
        indexes = [
            models.Index(fields=['organization', 'start_datetime']),
            models.Index(fields=['professional', 'start_datetime']),
            models.Index(fields=['client', 'start_datetime']),
            models.Index(fields=['status']),
        ]
        
    def __str__(self):
        return f"{self.client.full_name} - {self.service.name} - {self.start_datetime.strftime('%Y-%m-%d %H:%M')}"
    
    def clean(self):
        """Validaciones del modelo"""
        super().clean()
        
        # Validar que end_datetime sea después de start_datetime
        if self.start_datetime and self.end_datetime:
            if self.end_datetime <= self.start_datetime:
                raise ValidationError("La hora de fin debe ser posterior a la hora de inicio")
        
        # Validar que la duración coincida
        if self.start_datetime and self.end_datetime and self.duration_minutes:
            calculated_duration = (self.end_datetime - self.start_datetime).total_seconds() / 60
            if abs(calculated_duration - self.duration_minutes) > 1:  # 1 minuto de tolerancia
                raise ValidationError("La duración no coincide con las horas de inicio y fin")
        
        # Validar que el profesional pueda realizar el servicio
        if self.professional and self.service:
            if not self.service.professionals.filter(id=self.professional.id).exists():
                raise ValidationError("El profesional seleccionado no puede realizar este servicio")
        
        # NUEVA VALIDACIÓN: Verificar disponibilidad según horario del profesional
        if self.professional and self.start_datetime and self.service:
            is_available, reason = self._validate_professional_availability()
            if not is_available:
                raise ValidationError(f"Horario no disponible: {reason}")
        
        # Validar que no haya solapamiento con otras citas del mismo profesional
        if self.professional and self.start_datetime and self.end_datetime:
            overlapping = Appointment.objects.filter(
                professional=self.professional,
                start_datetime__lt=self.end_datetime,
                end_datetime__gt=self.start_datetime,
                status__in=['pending', 'confirmed', 'checked_in', 'in_progress']
            ).exclude(id=self.id)
            
            if overlapping.exists():
                raise ValidationError("El profesional ya tiene una cita en este horario")
    
    def save(self, *args, **kwargs):
        # Calcular end_datetime si no está definido
        if not self.end_datetime and self.start_datetime and self.duration_minutes:
            self.end_datetime = self.start_datetime + timedelta(minutes=self.duration_minutes)
        
        # Establecer duración si no está definida
        if not self.duration_minutes and self.service:
            self.duration_minutes = self.service.total_duration_minutes
        
        # Establecer precio si no está definido
        if not self.price and self.service:
            self.price = self.service.price
        
        # Validar antes de guardar
        try:
            self.full_clean()
        except ValidationError as e:
            # Re-raise validation errors for proper handling
            raise e
        
        super().save(*args, **kwargs)
    
    @property
    def duration_hours(self):
        """Duración en horas"""
        return self.duration_minutes / 60
    
    @property
    def is_today(self):
        """¿Es la cita hoy?"""
        return self.start_datetime.date() == timezone.now().date()
    
    @property
    def is_past(self):
        """¿Ya pasó la cita?"""
        return self.start_datetime < timezone.now()
    
    @property
    def is_upcoming(self):
        """¿Es una cita futura?"""
        return self.start_datetime > timezone.now()
    
    @property
    def can_be_cancelled(self):
        """¿Puede ser cancelada?"""
        if self.status in ['cancelled', 'completed', 'no_show']:
            return False
        
        # Verificar reglas de negocio de la organización
        business_rules = self.organization.business_rules
        cancellation_window = business_rules.get('cancellation_window_hours', 2)
        
        hours_until_appointment = (self.start_datetime - timezone.now()).total_seconds() / 3600
        return hours_until_appointment >= cancellation_window
    
    @property
    def time_until_appointment(self):
        """Tiempo hasta la cita"""
        if self.is_past:
            return None
        
        delta = self.start_datetime - timezone.now()
        hours = delta.total_seconds() / 3600
        
        if hours < 1:
            minutes = delta.total_seconds() / 60
            return f"{int(minutes)} minutos"
        elif hours < 24:
            return f"{int(hours)} horas"
        else:
            days = delta.days
            return f"{days} días"
    
    def confirm(self):
        """Confirmar la cita"""
        if self.status == 'pending':
            self.status = 'confirmed'
            self.save(update_fields=['status', 'updated_at'])
    
    def check_in(self):
        """Marcar que el cliente llegó"""
        if self.status in ['pending', 'confirmed']:
            self.status = 'checked_in'
            self.save(update_fields=['status', 'updated_at'])
    
    def start_service(self):
        """Iniciar el servicio"""
        if self.status == 'checked_in':
            self.status = 'in_progress'
            self.save(update_fields=['status', 'updated_at'])
    
    def complete(self):
        """Completar la cita"""
        if self.status in ['checked_in', 'in_progress']:
            self.status = 'completed'
            self.save(update_fields=['status', 'updated_at'])
    
    def cancel(self, cancelled_by=None, reason=""):
        """Cancelar la cita"""
        if self.can_be_cancelled:
            self.status = 'cancelled'
            self.cancelled_at = timezone.now()
            self.cancelled_by = cancelled_by
            self.cancellation_reason = reason
            self.save(update_fields=[
                'status', 'cancelled_at', 'cancelled_by', 
                'cancellation_reason', 'updated_at'
            ])
    
    def mark_no_show(self):
        """Marcar como no show"""
        if self.status in ['pending', 'confirmed'] and self.is_past:
            self.status = 'no_show'
            self.save(update_fields=['status', 'updated_at'])
    
    def _validate_professional_availability(self):
        """
        Validar disponibilidad del profesional según su horario configurado
        
        Returns:
            Tuple[bool, str]: (is_available, reason)
        """
        # Importar aquí para evitar import circular
        from schedule.services import AvailabilityCalculationService
        
        # Si no tiene horario configurado, permitir (backward compatibility)
        from schedule.models import ProfessionalSchedule
        try:
            professional_schedule = ProfessionalSchedule.objects.get(professional=self.professional)
        except ProfessionalSchedule.DoesNotExist:
            return True, "Sin horario configurado"
        
        # Usar el servicio de cálculo de disponibilidad
        availability_service = AvailabilityCalculationService(self.professional)
        return availability_service.is_available_at_time(self.start_datetime, self.service)


class AppointmentHistory(models.Model):
    """
    Historial de cambios en las citas
    Para auditoría y seguimiento
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    appointment = models.ForeignKey(
        Appointment, 
        on_delete=models.CASCADE,
        related_name='history'
    )
    
    # Información del cambio
    action = models.CharField(max_length=50)  # 'created', 'updated', 'cancelled', etc.
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    
    # Auditoría
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'appointments_history'
        ordering = ['-changed_at']
        
    def __str__(self):
        return f"{self.appointment} - {self.action} - {self.changed_at}"


class RecurringAppointment(models.Model):
    """
    Modelo para citas recurrentes
    Para clientes que tienen citas regulares
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relaciones
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    professional = models.ForeignKey(Professional, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    
    # Configuración de recurrencia
    FREQUENCY_CHOICES = [
        ('weekly', 'Semanal'),
        ('biweekly', 'Quincenal'),
        ('monthly', 'Mensual'),
        ('custom', 'Personalizado'),
    ]
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    interval_days = models.PositiveIntegerField(default=7)  # Para frecuencia personalizada
    
    # Configuración de tiempo
    preferred_time = models.TimeField()
    preferred_day_of_week = models.PositiveIntegerField(null=True, blank=True)  # 0=Monday
    
    # Estado
    is_active = models.BooleanField(default=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Configuración
    auto_confirm = models.BooleanField(default=False)
    advance_booking_days = models.PositiveIntegerField(default=30)
    
    # Auditoría
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'appointments_recurring'
        
    def __str__(self):
        return f"{self.client.full_name} - {self.service.name} - {self.get_frequency_display()}"
    
    def generate_next_appointments(self, weeks_ahead=4):
        """Generar las próximas citas basadas en la recurrencia"""
        # Implementación del algoritmo de generación automática
        # TODO: Implementar en la siguiente iteración
        pass