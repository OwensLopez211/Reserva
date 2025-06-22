# appointments/admin.py

from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from .models import Appointment, AppointmentHistory, RecurringAppointment


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """
    Admin interface para citas
    """
    list_display = [
        'client_name', 'service_name', 'professional_name', 
        'start_datetime', 'duration_minutes', 'status_badge', 
        'price', 'organization'
    ]
    list_filter = [
        'status', 'organization', 'professional', 'service', 
        'is_walk_in', 'created_at'
    ]
    search_fields = [
        'client__first_name', 'client__last_name', 'client__email',
        'professional__name', 'service__name', 'notes'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'cancelled_at',
        'time_until_appointment', 'is_past', 'can_be_cancelled'
    ]
    
    fieldsets = (
        ('Información Principal', {
            'fields': (
                'organization', 'client', 'professional', 'service'
            )
        }),
        ('Programación', {
            'fields': (
                'start_datetime', 'end_datetime', 'duration_minutes'
            )
        }),
        ('Estado y Configuración', {
            'fields': (
                'status', 'price', 'is_walk_in', 'requires_confirmation'
            )
        }),
        ('Notas', {
            'fields': ('notes', 'internal_notes'),
            'classes': ('collapse',)
        }),
        ('Cancelación', {
            'fields': (
                'cancelled_at', 'cancelled_by', 'cancellation_reason'
            ),
            'classes': ('collapse',)
        }),
        ('Información del Sistema', {
            'fields': (
                'id', 'created_by', 'created_at', 'updated_at',
                'time_until_appointment', 'is_past', 'can_be_cancelled'
            ),
            'classes': ('collapse',)
        }),
    )
    
    # Configuración de listado
    date_hierarchy = 'start_datetime'
    ordering = ['-start_datetime']
    list_per_page = 25
    
    def client_name(self, obj):
        """Nombre del cliente con link"""
        url = reverse('admin:organizations_client_change', args=[obj.client.id])
        return format_html('<a href="{}">{}</a>', url, obj.client.full_name)
    client_name.short_description = 'Cliente'
    client_name.admin_order_field = 'client__first_name'
    
    def service_name(self, obj):
        """Nombre del servicio"""
        return obj.service.name
    service_name.short_description = 'Servicio'
    service_name.admin_order_field = 'service__name'
    
    def professional_name(self, obj):
        """Nombre del profesional"""
        return obj.professional.name
    professional_name.short_description = 'Profesional'
    professional_name.admin_order_field = 'professional__name'
    
    def status_badge(self, obj):
        """Badge de estado con colores"""
        colors = {
            'pending': '#ffc107',
            'confirmed': '#17a2b8',
            'checked_in': '#28a745',
            'in_progress': '#fd7e14',
            'completed': '#6f42c1',
            'cancelled': '#dc3545',
            'no_show': '#6c757d',
            'rescheduled': '#20c997',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Estado'
    status_badge.admin_order_field = 'status'
    
    def get_queryset(self, request):
        """Optimizar consultas"""
        return super().get_queryset(request).select_related(
            'organization', 'client', 'professional', 'service', 
            'created_by', 'cancelled_by'
        )
    
    # Acciones personalizadas
    actions = ['confirm_appointments', 'cancel_appointments', 'mark_completed']
    
    def confirm_appointments(self, request, queryset):
        """Confirmar citas seleccionadas"""
        count = 0
        for appointment in queryset.filter(status='pending'):
            appointment.confirm()
            count += 1
        
        self.message_user(
            request, 
            f"{count} citas fueron confirmadas exitosamente."
        )
    confirm_appointments.short_description = "Confirmar citas seleccionadas"
    
    def cancel_appointments(self, request, queryset):
        """Cancelar citas seleccionadas"""
        count = 0
        for appointment in queryset:
            if appointment.can_be_cancelled:
                appointment.cancel(cancelled_by=request.user, reason="Cancelada desde admin")
                count += 1
        
        self.message_user(
            request, 
            f"{count} citas fueron canceladas exitosamente."
        )
    cancel_appointments.short_description = "Cancelar citas seleccionadas"
    
    def mark_completed(self, request, queryset):
        """Marcar citas como completadas"""
        count = 0
        for appointment in queryset.filter(status__in=['checked_in', 'in_progress']):
            appointment.complete()
            count += 1
        
        self.message_user(
            request, 
            f"{count} citas fueron marcadas como completadas."
        )
    mark_completed.short_description = "Marcar como completadas"


@admin.register(AppointmentHistory)
class AppointmentHistoryAdmin(admin.ModelAdmin):
    """
    Admin interface para historial de citas
    """
    list_display = [
        'appointment_info', 'action', 'changed_by', 'changed_at'
    ]
    list_filter = ['action', 'changed_at', 'changed_by']
    search_fields = [
        'appointment__client__first_name', 
        'appointment__client__last_name',
        'notes'
    ]
    readonly_fields = ['appointment', 'action', 'old_values', 'new_values', 'changed_by', 'changed_at']
    
    date_hierarchy = 'changed_at'
    ordering = ['-changed_at']
    
    def appointment_info(self, obj):
        """Información de la cita"""
        return str(obj.appointment)
    appointment_info.short_description = 'Cita'
    
    def has_add_permission(self, request):
        """No permitir crear registros manualmente"""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Solo lectura"""
        return False


@admin.register(RecurringAppointment)
class RecurringAppointmentAdmin(admin.ModelAdmin):
    """
    Admin interface para citas recurrentes
    """
    list_display = [
        'client_name', 'service_name', 'frequency', 
        'preferred_time', 'is_active', 'organization'
    ]
    list_filter = [
        'frequency', 'is_active', 'organization', 
        'professional', 'auto_confirm'
    ]
    search_fields = [
        'client__first_name', 'client__last_name',
        'professional__name', 'service__name'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información Principal', {
            'fields': (
                'organization', 'client', 'professional', 'service'
            )
        }),
        ('Configuración de Recurrencia', {
            'fields': (
                'frequency', 'interval_days', 'preferred_time', 
                'preferred_day_of_week'
            )
        }),
        ('Período', {
            'fields': ('start_date', 'end_date', 'is_active')
        }),
        ('Configuración Avanzada', {
            'fields': (
                'auto_confirm', 'advance_booking_days'
            ),
            'classes': ('collapse',)
        }),
        ('Información del Sistema', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def client_name(self, obj):
        """Nombre del cliente"""
        return obj.client.full_name
    client_name.short_description = 'Cliente'
    client_name.admin_order_field = 'client__first_name'
    
    def service_name(self, obj):
        """Nombre del servicio"""
        return obj.service.name
    service_name.short_description = 'Servicio'
    service_name.admin_order_field = 'service__name'