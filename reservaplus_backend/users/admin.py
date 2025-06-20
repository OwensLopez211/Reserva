# users/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    """
    Admin personalizado para el modelo User
    """
    list_display = ['username', 'email', 'full_name', 'organization', 'role', 'is_active']
    list_filter = ['role', 'is_professional', 'is_active', 'organization']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = UserAdmin.fieldsets + (
        ('ReservaPlus Info', {
            'fields': ('organization', 'phone', 'role', 'is_professional', 'is_active_in_org')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'timezone', 'language', 'email_notifications']
    list_filter = ['timezone', 'language', 'email_notifications']
    search_fields = ['user__username', 'user__email']