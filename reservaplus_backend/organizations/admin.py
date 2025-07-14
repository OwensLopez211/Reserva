# organizations/admin.py

from django.contrib import admin
from .models import Organization, Professional, Service, Client, ClientNote, ClientFile


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


@admin.register(ClientNote)
class ClientNoteAdmin(admin.ModelAdmin):
    """
    Admin para el modelo ClientNote
    """
    list_display = ['title', 'client', 'organization', 'category', 'is_private', 'created_by', 'created_at']
    list_filter = ['organization', 'category', 'is_private', 'created_at']
    search_fields = ['title', 'content', 'client__first_name', 'client__last_name']
    readonly_fields = ['created_at', 'updated_at']
    
    def get_queryset(self, request):
        """Filtrar por organización si el usuario no es superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'organization'):
            qs = qs.filter(organization=request.user.organization)
        return qs


@admin.register(ClientFile)
class ClientFileAdmin(admin.ModelAdmin):
    """
    Admin para el modelo ClientFile
    """
    list_display = ['name', 'client', 'organization', 'category', 'file_size', 'uploaded_by', 'uploaded_at']
    list_filter = ['organization', 'category', 'file_type', 'uploaded_at']
    search_fields = ['name', 'description', 'client__first_name', 'client__last_name']
    readonly_fields = ['uploaded_at']
    
    def get_queryset(self, request):
        """Filtrar por organización si el usuario no es superuser"""
        qs = super().get_queryset(request)
        if not request.user.is_superuser and hasattr(request.user, 'organization'):
            qs = qs.filter(organization=request.user.organization)
        return qs