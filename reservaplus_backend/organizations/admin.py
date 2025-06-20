# organizations/admin.py

from django.contrib import admin
from .models import Organization, Professional, Service, Client


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """
    Admin para el modelo Organization
    """
    list_display = ['name', 'industry_template', 'subscription_plan', 'is_active', 'created_at']
    list_filter = ['industry_template', 'subscription_plan', 'is_active', 'is_trial']
    search_fields = ['name', 'email', 'city']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Professional)
class ProfessionalAdmin(admin.ModelAdmin):
    """
    Admin para el modelo Professional
    """
    list_display = ['name', 'organization', 'specialty', 'is_active', 'accepts_walk_ins']
    list_filter = ['organization', 'is_active', 'accepts_walk_ins']
    search_fields = ['name', 'email', 'specialty']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    """
    Admin para el modelo Service
    """
    list_display = ['name', 'organization', 'category', 'duration_minutes', 'price', 'is_active']
    list_filter = ['organization', 'category', 'is_active']
    search_fields = ['name', 'description', 'category']
    readonly_fields = ['created_at', 'updated_at']
    filter_horizontal = ['professionals']


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Admin para el modelo Client
    """
    list_display = ['full_name', 'organization', 'email', 'phone', 'is_active', 'created_at']
    list_filter = ['organization', 'is_active', 'email_notifications']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    readonly_fields = ['created_at', 'updated_at']