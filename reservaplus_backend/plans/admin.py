# plans/admin.py

from django.contrib import admin
from .models import Plan, UserRegistration, OrganizationSubscription


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    """
    Admin para el modelo Plan
    """
    list_display = [
        'name', 'price_monthly', 'max_professionals', 'max_services', 
        'is_active', 'is_popular', 'display_order'
    ]
    list_filter = [
        'is_active', 'is_popular', 'is_coming_soon', 'color_scheme',
        'supports_integrations', 'supports_advanced_reports'
    ]
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['yearly_discount_percentage', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'slug', 'description', 'display_order')
        }),
        ('Precios', {
            'fields': ('price_monthly', 'price_yearly', 'original_price', 'yearly_discount_percentage')
        }),
        ('Límites del Plan', {
            'fields': (
                'max_professionals', 'max_services', 
                'max_monthly_appointments', 'max_clients'
            )
        }),
        ('Características', {
            'fields': ('features',),
            'classes': ('wide',)
        }),
        ('Funcionalidades Avanzadas', {
            'fields': (
                'supports_integrations', 'supports_advanced_reports',
                'supports_multi_location', 'supports_custom_branding',
                'priority_support'
            )
        }),
        ('Presentación', {
            'fields': ('color_scheme', 'badge_text', 'discount_text')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_popular', 'is_coming_soon')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(UserRegistration)
class UserRegistrationAdmin(admin.ModelAdmin):
    """
    Admin para el modelo UserRegistration
    """
    list_display = [
        'email', 'selected_plan', 'onboarding_step', 
        'is_completed', 'is_expired', 'created_at'
    ]
    list_filter = [
        'is_completed', 'is_expired', 'selected_plan',
        'onboarding_step', 'created_at'
    ]
    search_fields = ['email', 'temp_token']
    readonly_fields = [
        'temp_token', 'is_valid', 'created_at', 'expires_at', 'completed_at'
    ]
    
    fieldsets = (
        ('Información del Registro', {
            'fields': ('email', 'selected_plan', 'temp_token')
        }),
        ('Progreso del Onboarding', {
            'fields': ('onboarding_step', 'completed_steps')
        }),
        ('Datos del Registro', {
            'fields': ('registration_data',),
            'classes': ('wide',)
        }),
        ('Estado', {
            'fields': ('is_completed', 'is_expired', 'is_valid', 'created_user')
        }),
        ('Fechas', {
            'fields': ('created_at', 'expires_at', 'completed_at')
        })
    )
    
    actions = ['mark_as_expired']
    
    def mark_as_expired(self, request, queryset):
        """Marcar registros como expirados"""
        count = queryset.update(is_expired=True)
        self.message_user(request, f'{count} registros marcados como expirados.')
    mark_as_expired.short_description = "Marcar como expirados"


@admin.register(OrganizationSubscription)
class OrganizationSubscriptionAdmin(admin.ModelAdmin):
    """
    Admin para el modelo OrganizationSubscription
    """
    list_display = [
        'organization', 'plan', 'status', 'billing_cycle',
        'current_professionals_count', 'current_services_count',
        'current_period_end'
    ]
    list_filter = [
        'status', 'billing_cycle', 'plan',
        'trial_start', 'current_period_end'
    ]
    search_fields = ['organization__name', 'plan__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Suscripción', {
            'fields': ('organization', 'plan', 'billing_cycle', 'status')
        }),
        ('Periodo de Prueba', {
            'fields': ('trial_start', 'trial_end')
        }),
        ('Periodo Actual', {
            'fields': ('current_period_start', 'current_period_end')
        }),
        ('Uso Actual', {
            'fields': (
                'current_professionals_count', 'current_services_count',
                'current_clients_count', 'current_month_appointments_count'
            )
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('organization', 'plan')