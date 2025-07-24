import uuid
import json
from django.db import models
from django.utils import timezone
from decimal import Decimal


class MercadoPagoConfig(models.Model):
    """
    Configuración global de MercadoPago
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    access_token = models.CharField(max_length=500, verbose_name="Access Token")
    public_key = models.CharField(max_length=500, verbose_name="Public Key")
    client_id = models.CharField(max_length=200, verbose_name="Client ID")
    client_secret = models.CharField(max_length=500, verbose_name="Client Secret")
    
    # Configuración
    is_sandbox = models.BooleanField(default=True, verbose_name="Modo Sandbox")
    webhook_url = models.URLField(verbose_name="URL del Webhook")
    
    # Configuración de suscripciones
    auto_recurring = models.BooleanField(default=True, verbose_name="Pagos Recurrentes Automáticos")
    retry_attempts = models.PositiveIntegerField(default=3, verbose_name="Intentos de Reintento")
    
    # Estados
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments_mercadopago_config'
        verbose_name = 'Configuración MercadoPago'
        verbose_name_plural = 'Configuraciones MercadoPago'
    
    def __str__(self):
        return f"MercadoPago Config - {'Sandbox' if self.is_sandbox else 'Production'}"


class PaymentMethod(models.Model):
    """
    Métodos de pago guardados de las organizaciones
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con organización
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='payment_methods'
    )
    
    # Información de MercadoPago
    mp_payment_method_id = models.CharField(max_length=200, verbose_name="ID Método de Pago MP")
    mp_customer_id = models.CharField(max_length=200, verbose_name="ID Cliente MP")
    mp_card_id = models.CharField(max_length=200, blank=True, verbose_name="ID Tarjeta MP")
    
    # Información de la tarjeta (datos seguros)
    card_last_four_digits = models.CharField(max_length=4, verbose_name="Últimos 4 dígitos")
    card_first_six_digits = models.CharField(max_length=6, verbose_name="Primeros 6 dígitos")
    card_brand = models.CharField(max_length=50, verbose_name="Marca de la tarjeta")
    card_holder_name = models.CharField(max_length=200, verbose_name="Nombre del titular")
    expiration_month = models.PositiveIntegerField(verbose_name="Mes de expiración")
    expiration_year = models.PositiveIntegerField(verbose_name="Año de expiración")
    
    # Estados
    is_default = models.BooleanField(default=False, verbose_name="Método por defecto")
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments_payment_method'
        verbose_name = 'Método de Pago'
        verbose_name_plural = 'Métodos de Pago'
        unique_together = ['organization', 'mp_card_id']
    
    def __str__(self):
        return f"{self.card_brand} •••• {self.card_last_four_digits} - {self.organization.name}"
    
    def save(self, *args, **kwargs):
        # Si este es el método por defecto, desactivar otros métodos por defecto
        if self.is_default:
            PaymentMethod.objects.filter(
                organization=self.organization,
                is_default=True
            ).exclude(id=self.id).update(is_default=False)
        super().save(*args, **kwargs)


class SubscriptionPayment(models.Model):
    """
    Suscripciones de pago en MercadoPago
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relación con suscripción local
    organization_subscription = models.OneToOneField(
        'plans.OrganizationSubscription',
        on_delete=models.CASCADE,
        related_name='mp_subscription'
    )
    
    # Información de MercadoPago
    mp_subscription_id = models.CharField(max_length=200, unique=True, verbose_name="ID Suscripción MP")
    mp_preapproval_id = models.CharField(max_length=200, blank=True, verbose_name="ID Preaprobación MP")
    mp_payer_id = models.CharField(max_length=200, verbose_name="ID Pagador MP")
    
    # Configuración de la suscripción
    frequency = models.PositiveIntegerField(default=1, verbose_name="Frecuencia")
    FREQUENCY_TYPE_CHOICES = [
        ('months', 'Meses'),
        ('days', 'Días'),
        ('years', 'Años'),
    ]
    frequency_type = models.CharField(
        max_length=10,
        choices=FREQUENCY_TYPE_CHOICES,
        default='months',
        verbose_name="Tipo de Frecuencia"
    )
    
    # Montos
    transaction_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Monto de Transacción"
    )
    
    # Estado en MercadoPago
    MP_STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('authorized', 'Autorizada'),
        ('paused', 'Pausada'),
        ('cancelled', 'Cancelada'),
    ]
    mp_status = models.CharField(
        max_length=20,
        choices=MP_STATUS_CHOICES,
        default='pending',
        verbose_name="Estado en MP"
    )
    
    # Fechas importantes
    start_date = models.DateTimeField(verbose_name="Fecha de Inicio")
    end_date = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Fin")
    next_payment_date = models.DateTimeField(verbose_name="Próximo Pago")
    
    # Configuración de reintentos
    retry_attempts = models.PositiveIntegerField(default=0, verbose_name="Intentos de Reintento")
    max_retry_attempts = models.PositiveIntegerField(default=3, verbose_name="Máximo Intentos")
    
    # Estados
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments_subscription_payment'
        verbose_name = 'Suscripción de Pago'
        verbose_name_plural = 'Suscripciones de Pago'
    
    def __str__(self):
        return f"Suscripción {self.organization_subscription.organization.name} - ${self.transaction_amount}"
    
    @property
    def is_near_next_payment(self):
        """Verificar si el próximo pago está cerca (próximos 3 días)"""
        from datetime import timedelta
        return timezone.now() + timedelta(days=3) >= self.next_payment_date
    
    def update_next_payment_date(self):
        """Actualizar fecha del próximo pago"""
        from datetime import timedelta
        from dateutil.relativedelta import relativedelta
        
        if self.frequency_type == 'months':
            self.next_payment_date = self.next_payment_date + relativedelta(months=self.frequency)
        elif self.frequency_type == 'days':
            self.next_payment_date = self.next_payment_date + timedelta(days=self.frequency)
        elif self.frequency_type == 'years':
            self.next_payment_date = self.next_payment_date + relativedelta(years=self.frequency)
        
        self.save(update_fields=['next_payment_date'])


class Payment(models.Model):
    """
    Registro de pagos individuales
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relaciones
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='payments'
    )
    subscription_payment = models.ForeignKey(
        SubscriptionPayment,
        on_delete=models.CASCADE,
        related_name='payments',
        null=True, blank=True
    )
    payment_method = models.ForeignKey(
        PaymentMethod,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    
    # Información de MercadoPago
    mp_payment_id = models.CharField(max_length=200, unique=True, verbose_name="ID Pago MP")
    mp_preference_id = models.CharField(max_length=200, blank=True, verbose_name="ID Preferencia MP")
    
    # Información del pago
    transaction_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Monto"
    )
    currency_id = models.CharField(max_length=3, default='CLP', verbose_name="Moneda")
    
    # Descripción del pago
    description = models.CharField(max_length=250, verbose_name="Descripción")
    external_reference = models.CharField(max_length=200, blank=True, verbose_name="Referencia Externa")
    
    # Estado del pago
    MP_PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('authorized', 'Autorizado'),
        ('in_process', 'En Proceso'),
        ('in_mediation', 'En Mediación'),
        ('rejected', 'Rechazado'),
        ('cancelled', 'Cancelado'),
        ('refunded', 'Reembolsado'),
        ('charged_back', 'Contracargo'),
    ]
    mp_status = models.CharField(
        max_length=20,
        choices=MP_PAYMENT_STATUS_CHOICES,
        default='pending',
        verbose_name="Estado en MP"
    )
    mp_status_detail = models.CharField(max_length=100, blank=True, verbose_name="Detalle del Estado")
    
    # Información adicional de MercadoPago
    mp_operation_type = models.CharField(max_length=50, blank=True, verbose_name="Tipo de Operación")
    mp_payment_type_id = models.CharField(max_length=50, blank=True, verbose_name="Tipo de Pago")
    mp_payment_method_id = models.CharField(max_length=50, blank=True, verbose_name="Método de Pago")
    
    # Fechas
    mp_date_created = models.DateTimeField(null=True, blank=True, verbose_name="Fecha Creación MP")
    mp_date_approved = models.DateTimeField(null=True, blank=True, verbose_name="Fecha Aprobación MP")
    mp_date_last_updated = models.DateTimeField(null=True, blank=True, verbose_name="Última Actualización MP")
    
    # Información de comisiones
    mp_fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="Comisión MP"
    )
    net_received_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True, blank=True,
        verbose_name="Monto Neto Recibido"
    )
    
    # Datos adicionales (JSON)
    mp_raw_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="Datos Completos de MP"
    )
    
    # Campos propios
    is_processed = models.BooleanField(default=False, verbose_name="Procesado")
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name="Fecha de Procesamiento")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments_payment'
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Pago {self.mp_payment_id} - ${self.transaction_amount} - {self.mp_status}"
    
    @property
    def is_successful(self):
        """Verificar si el pago fue exitoso"""
        return self.mp_status in ['approved', 'authorized']
    
    @property
    def is_failed(self):
        """Verificar si el pago falló"""
        return self.mp_status in ['rejected', 'cancelled']
    
    @property
    def is_pending(self):
        """Verificar si el pago está pendiente"""
        return self.mp_status in ['pending', 'in_process', 'in_mediation']
    
    def mark_as_processed(self):
        """Marcar el pago como procesado"""
        self.is_processed = True
        self.processed_at = timezone.now()
        self.save(update_fields=['is_processed', 'processed_at'])
    
    def update_from_mp_data(self, mp_data):
        """Actualizar pago con datos de MercadoPago"""
        self.mp_status = mp_data.get('status', self.mp_status)
        self.mp_status_detail = mp_data.get('status_detail', '')
        self.mp_operation_type = mp_data.get('operation_type', '')
        self.mp_payment_type_id = mp_data.get('payment_type_id', '')
        self.mp_payment_method_id = mp_data.get('payment_method_id', '')
        
        # Fechas
        if mp_data.get('date_created'):
            self.mp_date_created = timezone.datetime.fromisoformat(mp_data['date_created'].replace('Z', '+00:00'))
        if mp_data.get('date_approved'):
            self.mp_date_approved = timezone.datetime.fromisoformat(mp_data['date_approved'].replace('Z', '+00:00'))
        if mp_data.get('date_last_updated'):
            self.mp_date_last_updated = timezone.datetime.fromisoformat(mp_data['date_last_updated'].replace('Z', '+00:00'))
        
        # Comisiones
        if mp_data.get('fee_details'):
            fee_amount = sum(Decimal(str(fee.get('amount', 0))) for fee in mp_data['fee_details'])
            self.mp_fee_amount = fee_amount
            self.net_received_amount = self.transaction_amount - fee_amount
        
        # Guardar datos completos
        self.mp_raw_data = mp_data
        
        self.save()


class WebhookEvent(models.Model):
    """
    Registro de eventos de webhook de MercadoPago
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Información del webhook
    mp_resource = models.CharField(max_length=100, verbose_name="Recurso MP")
    mp_topic = models.CharField(max_length=100, verbose_name="Tópico MP")
    mp_resource_id = models.CharField(max_length=200, verbose_name="ID del Recurso")
    
    # Datos del evento
    raw_data = models.JSONField(verbose_name="Datos Crudos")
    
    # Estado del procesamiento
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('processing', 'Procesando'),
        ('processed', 'Procesado'),
        ('failed', 'Falló'),
        ('ignored', 'Ignorado'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Estado"
    )
    
    # Información adicional
    error_message = models.TextField(blank=True, verbose_name="Mensaje de Error")
    retry_count = models.PositiveIntegerField(default=0, verbose_name="Intentos")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments_webhook_event'
        verbose_name = 'Evento de Webhook'
        verbose_name_plural = 'Eventos de Webhook'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Webhook {self.mp_topic} - {self.mp_resource_id} - {self.status}"
    
    def mark_as_processed(self):
        """Marcar evento como procesado"""
        self.status = 'processed'
        self.processed_at = timezone.now()
        self.save(update_fields=['status', 'processed_at'])
    
    def mark_as_failed(self, error_message):
        """Marcar evento como fallido"""
        self.status = 'failed'
        self.error_message = error_message
        self.retry_count += 1
        self.save(update_fields=['status', 'error_message', 'retry_count'])
    
    def can_retry(self, max_retries=3):
        """Verificar si se puede reintentar el procesamiento"""
        return self.retry_count < max_retries and self.status == 'failed'
