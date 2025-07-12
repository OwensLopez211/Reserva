# users/models.py

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Usuario personalizado para ReservaPlus
    Maneja multi-tenant y roles por organización
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Email único en toda la plataforma
    email = models.EmailField(unique=True, help_text="Email único en toda la plataforma")
    
    # Relación con organización (multi-tenant)
    organization = models.ForeignKey(
        'organizations.Organization', 
        on_delete=models.CASCADE,
        related_name='users',
        null=True, blank=True  # Null para superusuarios
    )
    
    # Información adicional
    phone = models.CharField(max_length=20, blank=True)
    
    # Roles en el sistema
    ROLE_CHOICES = [
        ('owner', 'Propietario'),
        ('admin', 'Administrador'),
        ('staff', 'Personal'),
        ('professional', 'Profesional'),
        ('reception', 'Recepción'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    
    # Flags adicionales
    is_professional = models.BooleanField(default=False)
    is_active_in_org = models.BooleanField(default=True)
    
    # Campo para almacenar last_login en hora local de Chile (como string)
    last_login_local = models.CharField(max_length=50, null=True, blank=True, help_text="Último login en hora local de Chile")
    
    # Campo para contraseña temporal (para envío por correo)
    temp_password = models.CharField(max_length=255, null=True, blank=True, help_text="Contraseña temporal generada automáticamente")
    requires_password_change = models.BooleanField(default=False, help_text="Requiere cambio de contraseña en el siguiente login")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users_user'
        ordering = ['first_name', 'last_name']
        
    def __str__(self):
        return f"{self.get_full_name()} ({self.organization})" if self.organization else self.get_full_name()
    
    @property
    def full_name(self):
        return self.get_full_name() or self.username
    
    def has_org_permission(self, permission):
        """Verificar permisos dentro de la organización"""
        if self.role == 'owner':
            return True
        
        # Definir permisos básicos por rol
        permissions = {
            'admin': ['view_all', 'edit_all', 'delete_own'],
            'staff': ['view_own', 'edit_own'],
            'professional': ['view_own', 'edit_own', 'view_appointments'],
            'reception': ['view_all', 'edit_appointments', 'create_appointments'],
        }
        
        return permission in permissions.get(self.role, [])


class UserProfile(models.Model):
    """
    Perfil extendido del usuario con información adicional
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Información personal
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    birth_date = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True)
    
    # Configuraciones
    timezone = models.CharField(max_length=50, default='America/Santiago')
    language = models.CharField(max_length=10, default='es')
    
    # Notificaciones
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile of {self.user.full_name}"