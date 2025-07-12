# organizations/models.py - ACTUALIZACIONES AL MODELO ORGANIZATION

import uuid
from django.db import models
from django.utils.text import slugify


class Organization(models.Model):
    """
    Organización/Empresa cliente (Tenant principal)
    Cada organización es un tenant independiente
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Información básica
    name = models.CharField(max_length=200, verbose_name="Nombre")
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True, verbose_name="Descripción")
    
    # Configuración de industria
    INDUSTRY_CHOICES = [
        ('salon', 'Peluquería/Salón de Belleza'),
        ('clinic', 'Clínica/Consultorio Médico'),
        ('fitness', 'Entrenamiento Personal/Fitness'),
        ('spa', 'Spa/Centro de Bienestar'),
        ('dental', 'Clínica Dental'),
        ('veterinary', 'Veterinaria'),
        ('beauty', 'Centro de Estética'),
        ('massage', 'Centro de Masajes'),
        ('other', 'Otro'),
    ]
    industry_template = models.CharField(
        max_length=50, 
        choices=INDUSTRY_CHOICES,
        default='salon',
        verbose_name="Tipo de Industria"
    )
    
    # Información de contacto
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    
    # ===== CAMPOS PARA MARKETPLACE =====
    logo = models.URLField(blank=True, help_text="URL del logo de la organización")
    cover_image = models.URLField(blank=True, help_text="URL de la imagen de portada")
    gallery_images = models.JSONField(
        default=list, 
        blank=True,
        help_text="Lista de URLs de imágenes para la galería"
    )
    is_featured = models.BooleanField(
        default=False,
        help_text="Aparece en la sección de destacados del marketplace"
    )
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=0.0,
        help_text="Rating promedio basado en reseñas"
    )
    total_reviews = models.PositiveIntegerField(
        default=0,
        help_text="Número total de reseñas"
    )
    
    # Dirección
    address = models.TextField(blank=True, verbose_name="Dirección")
    city = models.CharField(max_length=100, blank=True, verbose_name="Ciudad")
    country = models.CharField(max_length=100, default='Chile', verbose_name="País")
    
    # NUEVA: Estado del onboarding
    onboarding_completed = models.BooleanField(
        default=False,
        verbose_name="Onboarding Completado"
    )
    onboarding_completed_at = models.DateTimeField(
        null=True, blank=True,
        verbose_name="Fecha de Completado del Onboarding"
    )
    
    # Configuración de suscripción - DEPRECADO (mantenemos por compatibilidad)
    PLAN_CHOICES = [
        ('free', 'Plan Gratuito'),
        ('basic', 'Plan Básico'),
        ('professional', 'Plan Profesional'),
        ('enterprise', 'Plan Empresarial'),
    ]
    subscription_plan = models.CharField(
        max_length=50, 
        choices=PLAN_CHOICES, 
        default='free',
        verbose_name="Plan de Suscripción (Deprecado)"
    )
    
    # Configuraciones dinámicas (JSON)
    settings = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Configuraciones específicas de la organización"
    )
    
    # Estados
    is_active = models.BooleanField(default=True)
    is_trial = models.BooleanField(default=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations_organization'
        ordering = ['name']
        
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    # NUEVOS: Métodos relacionados con suscripción
    @property
    def active_subscription(self):
        """Obtener suscripción activa"""
        return getattr(self, 'subscription', None)
    
    @property
    def current_plan(self):
        """Obtener plan actual"""
        if self.active_subscription:
            return self.active_subscription.plan
        return None
    
    def complete_onboarding(self):
        """Marcar onboarding como completado"""
        from django.utils import timezone
        self.onboarding_completed = True
        self.onboarding_completed_at = timezone.now()
        self.save(update_fields=['onboarding_completed', 'onboarding_completed_at'])
    
    def get_business_config(self):
        """Obtener configuración de negocio basada en la industria"""
        from core.industry_templates import INDUSTRY_TEMPLATES
        
        template = INDUSTRY_TEMPLATES.get(self.industry_template, {})
        
        # Combinar configuración de template con settings personalizados
        config = template.copy()
        config.update(self.settings)
        
        return config
    
    @property
    def terminology(self):
        """Obtener terminología específica de la industria"""
        config = self.get_business_config()
        return config.get('terminology', {})
    
    @property
    def business_rules(self):
        """Obtener reglas de negocio específicas"""
        config = self.get_business_config()
        return config.get('business_rules', {})


class Professional(models.Model):
    """
    Profesional que ofrece servicios dentro de una organización
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con organización (multi-tenant)
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE,
        related_name='professionals'
    )
    
    # Relación opcional con usuario del sistema
    user = models.OneToOneField(
        'users.User', 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='professional_profile'
    )
    
    # Información básica
    name = models.CharField(max_length=200, verbose_name="Nombre")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Información profesional
    specialty = models.CharField(max_length=100, blank=True, verbose_name="Especialidad")
    license_number = models.CharField(max_length=50, blank=True, verbose_name="Número de Licencia")
    bio = models.TextField(blank=True, verbose_name="Biografía")
    
    # Configuración visual
    color_code = models.CharField(
        max_length=7, 
        default='#4CAF50',
        help_text="Color hex para mostrar en el calendario"
    )
    
    # Estados
    is_active = models.BooleanField(default=True)
    accepts_walk_ins = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations_professional'
        ordering = ['name']
        unique_together = ['organization', 'email']
        
    def __str__(self):
        return f"{self.name} ({self.organization.name})"


class Service(models.Model):
    """
    Servicios ofrecidos por la organización
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con organización (multi-tenant)
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE,
        related_name='services'
    )
    
    # Información básica
    name = models.CharField(max_length=200, verbose_name="Nombre del Servicio")
    description = models.TextField(blank=True, verbose_name="Descripción")
    category = models.CharField(max_length=100, blank=True, verbose_name="Categoría")
    
    # Configuración de tiempo y precio
    duration_minutes = models.PositiveIntegerField(verbose_name="Duración (minutos)")
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        verbose_name="Precio"
    )
    
    # Configuración avanzada
    buffer_time_before = models.PositiveIntegerField(
        default=0,
        help_text="Tiempo de preparación antes del servicio (minutos)"
    )
    buffer_time_after = models.PositiveIntegerField(
        default=0,
        help_text="Tiempo de limpieza después del servicio (minutos)"
    )
    
    # Configuración de profesionales
    professionals = models.ManyToManyField(
        Professional,
        blank=True,
        related_name='services',
        help_text="Profesionales que pueden realizar este servicio"
    )
    
    # Estados
    is_active = models.BooleanField(default=True)
    requires_preparation = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations_service'
        ordering = ['category', 'name']
        
    def __str__(self):
        return f"{self.name} - {self.organization.name}"
    
    @property
    def total_duration_minutes(self):
        """Duración total incluyendo buffers"""
        return self.duration_minutes + self.buffer_time_before + self.buffer_time_after


class Client(models.Model):
    """
    Clientes finales de la organización
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con organización (multi-tenant)
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE,
        related_name='clients'
    )
    
    # Información básica
    first_name = models.CharField(max_length=100, verbose_name="Nombre")
    last_name = models.CharField(max_length=100, verbose_name="Apellido")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, verbose_name="Teléfono")
    
    # Información adicional
    birth_date = models.DateField(null=True, blank=True, verbose_name="Fecha de Nacimiento")
    notes = models.TextField(blank=True, verbose_name="Notas")
    
    # Configuración de comunicación
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    
    # NUEVO: Campos para clientes públicos
    CLIENT_TYPE_CHOICES = [
        ('internal', 'Cliente Interno'),  # Creado por el staff
        ('registered', 'Cliente Registrado'),  # Tiene cuenta propia
        ('guest', 'Cliente Invitado'),  # Sin cuenta, solo para booking
    ]
    client_type = models.CharField(
        max_length=20,
        choices=CLIENT_TYPE_CHOICES,
        default='internal',
        verbose_name="Tipo de Cliente"
    )
    
    # Para clientes registrados
    password_hash = models.CharField(max_length=128, blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    
    # Para clientes guest (temporal)
    is_guest = models.BooleanField(default=False)
    guest_token = models.CharField(max_length=100, blank=True, null=True)
    guest_expires_at = models.DateTimeField(null=True, blank=True)
    
    # Información adicional para booking público
    address = models.TextField(blank=True, verbose_name="Dirección")
    emergency_contact = models.CharField(max_length=200, blank=True, verbose_name="Contacto de Emergencia")
    marketing_consent = models.BooleanField(default=False, verbose_name="Acepta Marketing")
    
    # Estados
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations_client'
        ordering = ['first_name', 'last_name']
        unique_together = ['organization', 'email']
        
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def set_password(self, raw_password):
        """Establecer contraseña para cliente registrado"""
        from django.contrib.auth.hashers import make_password
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        """Verificar contraseña para cliente registrado"""
        from django.contrib.auth.hashers import check_password
        return check_password(raw_password, self.password_hash)
    
    def generate_verification_token(self):
        """Generar token de verificación de email"""
        import secrets
        self.verification_token = secrets.token_urlsafe(32)
        return self.verification_token
    
    def generate_guest_token(self):
        """Generar token temporal para cliente guest"""
        import secrets
        from django.utils import timezone
        from datetime import timedelta
        
        self.guest_token = secrets.token_urlsafe(32)
        self.guest_expires_at = timezone.now() + timedelta(hours=24)  # Expira en 24 horas
        return self.guest_token
    
    def is_guest_token_valid(self):
        """Verificar si el token de guest es válido"""
        from django.utils import timezone
        return (
            self.guest_token and 
            self.guest_expires_at and 
            timezone.now() < self.guest_expires_at
        )
    
    @classmethod
    def create_guest_client(cls, organization, first_name, last_name, email, phone, **extra_data):
        """Crear cliente guest temporal"""
        client = cls(
            organization=organization,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            client_type='guest',
            is_guest=True,
            **extra_data
        )
        client.generate_guest_token()
        client.save()
        return client
    
    @classmethod
    def create_registered_client(cls, organization, first_name, last_name, email, phone, password, **extra_data):
        """Crear cliente registrado"""
        client = cls(
            organization=organization,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            client_type='registered',
            **extra_data
        )
        client.set_password(password)
        client.generate_verification_token()
        client.save()
        return client