from django.contrib import admin
from .models import (
    ProfessionalSchedule,
    WeeklySchedule,
    ScheduleBreak,
    ScheduleException,
    AvailabilitySlot
)


class WeeklyScheduleInline(admin.TabularInline):
    model = WeeklySchedule
    extra = 0
    fields = ['weekday', 'start_time', 'end_time', 'is_active']
    ordering = ['weekday']


class ScheduleBreakInline(admin.TabularInline):
    model = ScheduleBreak
    extra = 0
    fields = ['start_time', 'end_time', 'name', 'is_active']
    ordering = ['start_time']


class ScheduleExceptionInline(admin.TabularInline):
    model = ScheduleException
    extra = 0
    fields = ['date', 'exception_type', 'start_time', 'end_time', 'reason']
    ordering = ['date']


@admin.register(ProfessionalSchedule)
class ProfessionalScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'professional', 'timezone', 'slot_duration', 
        'is_active', 'accepts_bookings', 'updated_at'
    ]
    list_filter = ['is_active', 'accepts_bookings', 'timezone']
    search_fields = ['professional__name', 'professional__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [WeeklyScheduleInline, ScheduleExceptionInline]
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('professional', 'timezone', 'is_active', 'accepts_bookings')
        }),
        ('Configuración de Reservas', {
            'fields': ('min_booking_notice', 'max_booking_advance', 'slot_duration')
        }),
        ('Metadatos', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(WeeklySchedule)
class WeeklyScheduleAdmin(admin.ModelAdmin):
    list_display = [
        'professional_schedule', 'weekday', 'start_time', 
        'end_time', 'is_active', 'updated_at'
    ]
    list_filter = ['weekday', 'is_active']
    search_fields = ['professional_schedule__professional__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    inlines = [ScheduleBreakInline]
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'professional_schedule__professional'
        )


@admin.register(ScheduleBreak)
class ScheduleBreakAdmin(admin.ModelAdmin):
    list_display = [
        'weekly_schedule', 'name', 'start_time', 
        'end_time', 'is_active', 'updated_at'
    ]
    list_filter = ['is_active']
    search_fields = ['name', 'weekly_schedule__professional_schedule__professional__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'weekly_schedule__professional_schedule__professional'
        )


@admin.register(ScheduleException)
class ScheduleExceptionAdmin(admin.ModelAdmin):
    list_display = [
        'professional_schedule', 'date', 'exception_type', 
        'start_time', 'end_time', 'reason', 'is_active'
    ]
    list_filter = ['exception_type', 'is_active', 'date']
    search_fields = ['professional_schedule__professional__name', 'reason']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'date'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'professional_schedule__professional'
        )


@admin.register(AvailabilitySlot)
class AvailabilitySlotAdmin(admin.ModelAdmin):
    list_display = [
        'professional_schedule', 'date', 'start_time', 
        'end_time', 'is_available', 'is_blocked', 'updated_at'
    ]
    list_filter = ['is_available', 'is_blocked', 'date']
    search_fields = ['professional_schedule__professional__name', 'blocked_reason']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'date'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'professional_schedule__professional'
        )
