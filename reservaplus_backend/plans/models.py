# plans/models.py

import uuid
from django.db import models
from django.utils.text import slugify


class Plan(models.Model):
    """
    Planes de suscripción para ReservaPlus
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Información básica
    name = models.CharField(max_length=100, verbose_name="Nombre del Plan")
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(verbose_name="Descripción")
    
    # Precios
    price_monthly = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Precio Mensual"
    )
    price_yearly = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, blank=True,
        verbose_name="Precio Anual"
    )
    original_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, blank=True,
        verbose_name="Precio Original (para mostrar descuentos)"
    )
    
    # Límites del plan
    max_users = models.IntegerField(
        verbose_name="Máximo de Usuarios",
        help_text="Número máximo de usuarios del sistema permitidos"
    )
    max_professionals = models.IntegerField(
        verbose_name="Máximo de Profesionales",
        help_text="Número máximo de profesionales permitidos"
    )
    max_receptionists = models.IntegerField(
        default=1,
        verbose_name="Máximo de Recepcionistas",
        help_text="Número máximo de recepcionistas permitidos"
    )
    max_staff = models.IntegerField(
        default=1,
        verbose_name="Máximo de Staff",
        help_text="Número máximo de staff permitidos"
    )
    max_services = models.IntegerField(
        verbose_name="Máximo de Servicios",
        help_text="Número máximo de servicios permitidos"
    )
    max_monthly_appointments = models.IntegerField(
        verbose_name="Máximo de Citas Mensuales",
        help_text="Número máximo de citas por mes"
    )
    max_clients = models.IntegerField(
        default=1000,
        verbose_name="Máximo de Clientes",
        help_text="Número máximo de clientes en la base de datos"
    )
    
    # Características incluidas (JSON)
    features = models.JSONField(
        default=list,
        verbose_name="Características",
        help_text="Lista de características incluidas en el plan"
    )
    
    # Configuraciones adicionales
    supports_integrations = models.BooleanField(default=False)
    supports_advanced_reports = models.BooleanField(default=False)
    supports_multi_location = models.BooleanField(default=False)
    supports_custom_branding = models.BooleanField(default=False)
    priority_support = models.BooleanField(default=False)
    
    # Estado y metadata
    is_active = models.BooleanField(default=True)
    is_popular = models.BooleanField(default=False)
    is_coming_soon = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    
    # Color scheme para UI
    COLOR_CHOICES = [
        ('emerald', 'Emerald'),
        ('blue', 'Blue'),
        ('purple', 'Purple'),
        ('gradient', 'Gradient'),
    ]
    color_scheme = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        default='emerald'
    )
    
    # Badges y etiquetas
    badge_text = models.CharField(
        max_length=50, 
        blank=True,
        verbose_name="Texto del Badge"
    )
    discount_text = models.CharField(
        max_length=20, 
        blank=True,
        verbose_name="Texto del Descuento"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'plans_plan'
        ordering = ['display_order', 'price_monthly']
        verbose_name = 'Plan'
        verbose_name_plural = 'Planes'
        
    def __str__(self):
        return f"{self.name} - ${self.price_monthly}/mes"
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def yearly_discount_percentage(self):
        """Calcular porcentaje de descuento anual"""
        if self.price_yearly and self.price_monthly:
            yearly_equivalent = self.price_monthly * 12
            discount = ((yearly_equivalent - self.price_yearly) / yearly_equivalent) * 100
            return round(discount)
        return 0
    
    def can_create_user(self, current_count):
        """Verificar si se puede crear otro usuario"""
        return current_count < self.max_users
    
    def can_create_professional(self, current_count):
        """Verificar si se puede crear otro profesional"""
        return current_count < self.max_professionals
    
    def can_create_receptionist(self, current_count):
        """Verificar si se puede crear otro recepcionista"""
        return current_count < self.max_receptionists
    
    def can_create_staff(self, current_count):
        """Verificar si se puede crear otro staff"""
        return current_count < self.max_staff
    
    def can_create_service(self, current_count):
        """Verificar si se puede crear otro servicio"""
        return current_count < self.max_services
    
    def can_create_appointment(self, current_month_count):
        """Verificar si se puede crear otra cita este mes"""
        return current_month_count < self.max_monthly_appointments
    
    def can_create_client(self, current_count):
        """Verificar si se puede crear otro cliente"""
        return current_count < self.max_clients


class UserRegistration(models.Model):
    """
    Registro temporal de usuarios durante el proceso de onboarding
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Información básica del registro
    email = models.EmailField(unique=True, verbose_name="Email")
    temp_token = models.CharField(
        max_length=255, 
        unique=True,
        verbose_name="Token Temporal"
    )
    
    # Plan seleccionado
    selected_plan = models.ForeignKey(
        Plan, 
        on_delete=models.CASCADE,
        verbose_name="Plan Seleccionado"
    )
    
    # Datos del proceso de registro (JSON)
    registration_data = models.JSONField(
        default=dict,
        verbose_name="Datos de Registro",
        help_text="Datos temporales del proceso de registro"
    )
    
    # Progreso del onboarding
    onboarding_step = models.PositiveIntegerField(
        default=0,
        verbose_name="Paso del Onboarding"
    )
    completed_steps = models.JSONField(
        default=list,
        verbose_name="Pasos Completados"
    )
    
    # Estado del registro
    is_completed = models.BooleanField(
        default=False,
        verbose_name="Registro Completado"
    )
    is_expired = models.BooleanField(
        default=False,
        verbose_name="Registro Expirado"
    )
    
    # Usuario creado (una vez completado el onboarding)
    created_user = models.OneToOneField(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        verbose_name="Usuario Creado"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(verbose_name="Expira en")
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'plans_user_registration'
        ordering = ['-created_at']
        verbose_name = 'Registro de Usuario'
        verbose_name_plural = 'Registros de Usuarios'
        
    def __str__(self):
        return f"Registro: {self.email} - {self.selected_plan.name}"
    
    @property
    def is_valid(self):
        """Verificar si el registro es válido y no ha expirado"""
        from django.utils import timezone
        return not self.is_expired and not self.is_completed and timezone.now() < self.expires_at
    
    def mark_expired(self):
        """Marcar el registro como expirado"""
        self.is_expired = True
        self.save(update_fields=['is_expired'])
    
    def mark_completed(self, user):
        """Marcar el registro como completado"""
        from django.utils import timezone
        self.is_completed = True
        self.completed_at = timezone.now()
        self.created_user = user
        self.save(update_fields=['is_completed', 'completed_at', 'created_user'])
    
    def update_progress(self, step, completed_steps_list):
        """Actualizar progreso del onboarding"""
        self.onboarding_step = step
        self.completed_steps = completed_steps_list
        self.save(update_fields=['onboarding_step', 'completed_steps'])


class OrganizationSubscription(models.Model):
    """
    Suscripción activa de una organización a un plan
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relaciones
    organization = models.OneToOneField(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.PROTECT,
        related_name='subscriptions'
    )
    
    # Información de la suscripción
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Mensual'),
        ('yearly', 'Anual'),
    ]
    billing_cycle = models.CharField(
        max_length=20,
        choices=BILLING_CYCLE_CHOICES,
        default='monthly'
    )
    
    # Estado de la suscripción
    STATUS_CHOICES = [
        ('trial', 'Periodo de Prueba'),
        ('active', 'Activa'),
        ('past_due', 'Pago Pendiente'),
        ('cancelled', 'Cancelada'),
        ('expired', 'Expirada'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='trial'
    )
    
    # Fechas importantes
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    
    # Uso actual (para verificar límites)
    current_users_count = models.PositiveIntegerField(default=0)
    current_professionals_count = models.PositiveIntegerField(default=0)
    current_receptionists_count = models.PositiveIntegerField(default=0)
    current_staff_count = models.PositiveIntegerField(default=0)
    current_services_count = models.PositiveIntegerField(default=0)
    current_clients_count = models.PositiveIntegerField(default=0)
    current_month_appointments_count = models.PositiveIntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'plans_organization_subscription'
        verbose_name = 'Suscripción de Organización'
        verbose_name_plural = 'Suscripciones de Organizaciones'
        
    def __str__(self):
        return f"{self.organization.name} - {self.plan.name} ({self.status})"
    
    @property
    def is_trial(self):
        """Verificar si está en periodo de prueba"""
        return self.status == 'trial'
    
    @property
    def is_active(self):
        """Verificar si la suscripción está activa"""
        return self.status in ['trial', 'active']
    
    def can_add_user(self):
        """Verificar si puede agregar otro usuario"""
        return self.current_users_count < self.plan.max_users
    
    def can_add_professional(self):
        """Verificar si puede agregar otro profesional"""
        return self.current_professionals_count < self.plan.max_professionals
    
    def can_add_receptionist(self):
        """Verificar si puede agregar otro recepcionista"""
        return self.current_receptionists_count < self.plan.max_receptionists
    
    def can_add_staff(self):
        """Verificar si puede agregar otro staff"""
        return self.current_staff_count < self.plan.max_staff
    
    def can_add_service(self):
        """Verificar si puede agregar otro servicio"""
        return self.current_services_count < self.plan.max_services
    
    def can_add_client(self):
        """Verificar si puede agregar otro cliente"""
        return self.current_clients_count < self.plan.max_clients
    
    def can_create_appointment(self):
        """Verificar si puede crear otra cita este mes"""
        return self.current_month_appointments_count < self.plan.max_monthly_appointments
    
    def increment_users_count(self):
        """Incrementar contador de usuarios"""
        self.current_users_count += 1
        self.save(update_fields=['current_users_count'])
    
    def decrement_users_count(self):
        """Decrementar contador de usuarios"""
        if self.current_users_count > 0:
            self.current_users_count -= 1
            self.save(update_fields=['current_users_count'])
    
    def increment_professionals_count(self):
        """Incrementar contador de profesionales"""
        self.current_professionals_count += 1
        self.save(update_fields=['current_professionals_count'])
    
    def decrement_professionals_count(self):
        """Decrementar contador de profesionales"""
        if self.current_professionals_count > 0:
            self.current_professionals_count -= 1
            self.save(update_fields=['current_professionals_count'])
    
    def increment_receptionists_count(self):
        """Incrementar contador de recepcionistas"""
        self.current_receptionists_count += 1
        self.save(update_fields=['current_receptionists_count'])
    
    def decrement_receptionists_count(self):
        """Decrementar contador de recepcionistas"""
        if self.current_receptionists_count > 0:
            self.current_receptionists_count -= 1
            self.save(update_fields=['current_receptionists_count'])
    
    def increment_staff_count(self):
        """Incrementar contador de staff"""
        self.current_staff_count += 1
        self.save(update_fields=['current_staff_count'])
    
    def decrement_staff_count(self):
        """Decrementar contador de staff"""
        if self.current_staff_count > 0:
            self.current_staff_count -= 1
            self.save(update_fields=['current_staff_count'])
    
    def increment_services_count(self):
        """Incrementar contador de servicios"""
        self.current_services_count += 1
        self.save(update_fields=['current_services_count'])
    
    def decrement_services_count(self):
        """Decrementar contador de servicios"""
        if self.current_services_count > 0:
            self.current_services_count -= 1
            self.save(update_fields=['current_services_count'])
    
    def reset_monthly_appointments_count(self):
        """Resetear contador de citas mensuales (llamar al inicio de cada mes)"""
        self.current_month_appointments_count = 0
        self.save(update_fields=['current_month_appointments_count'])