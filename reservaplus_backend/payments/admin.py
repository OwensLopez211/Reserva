from django.contrib import admin
from .models import (
    MercadoPagoConfig,
    PaymentMethod,
    SubscriptionPayment,
    Payment,
    WebhookEvent
)


@admin.register(MercadoPagoConfig)
class MercadoPagoConfigAdmin(admin.ModelAdmin):
    list_display = ['id', 'is_sandbox', 'is_active', 'created_at']
    list_filter = ['is_sandbox', 'is_active']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = [
        ('Configuración Básica', {
            'fields': ['is_sandbox', 'is_active']
        }),
        ('Credenciales', {
            'fields': ['access_token', 'public_key', 'client_id', 'client_secret']
        }),
        ('Configuración de Webhooks', {
            'fields': ['webhook_url']
        }),
        ('Configuración de Suscripciones', {
            'fields': ['auto_recurring', 'retry_attempts']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]


@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['organization', 'card_brand', 'card_last_four_digits', 'is_default', 'is_active', 'created_at']
    list_filter = ['card_brand', 'is_default', 'is_active']
    search_fields = ['organization__name', 'card_holder_name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Información Básica', {
            'fields': ['organization', 'is_default', 'is_active']
        }),
        ('Información de MercadoPago', {
            'fields': ['mp_payment_method_id', 'mp_customer_id', 'mp_card_id']
        }),
        ('Información de la Tarjeta', {
            'fields': [
                'card_brand', 'card_holder_name',
                'card_first_six_digits', 'card_last_four_digits',
                'expiration_month', 'expiration_year'
            ]
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]


@admin.register(SubscriptionPayment)
class SubscriptionPaymentAdmin(admin.ModelAdmin):
    list_display = [
        'organization_subscription', 'transaction_amount', 'mp_status', 
        'next_payment_date', 'is_active', 'created_at'
    ]
    list_filter = ['mp_status', 'frequency_type', 'is_active']
    search_fields = ['organization_subscription__organization__name', 'mp_subscription_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = [
        ('Información Básica', {
            'fields': ['organization_subscription', 'is_active']
        }),
        ('Información de MercadoPago', {
            'fields': ['mp_subscription_id', 'mp_preapproval_id', 'mp_payer_id', 'mp_status']
        }),
        ('Configuración de Frecuencia', {
            'fields': ['frequency', 'frequency_type', 'transaction_amount']
        }),
        ('Fechas', {
            'fields': ['start_date', 'end_date', 'next_payment_date']
        }),
        ('Reintentos', {
            'fields': ['retry_attempts', 'max_retry_attempts']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'mp_payment_id', 'organization', 'transaction_amount', 
        'mp_status', 'is_processed', 'created_at'
    ]
    list_filter = ['mp_status', 'currency_id', 'is_processed']
    search_fields = ['organization__name', 'mp_payment_id', 'description']
    readonly_fields = ['created_at', 'updated_at', 'processed_at']
    
    fieldsets = [
        ('Información Básica', {
            'fields': [
                'organization', 'subscription_payment', 'payment_method',
                'description', 'external_reference'
            ]
        }),
        ('Información de MercadoPago', {
            'fields': [
                'mp_payment_id', 'mp_preference_id', 'mp_status', 'mp_status_detail'
            ]
        }),
        ('Información del Pago', {
            'fields': [
                'transaction_amount', 'currency_id',
                'mp_operation_type', 'mp_payment_type_id', 'mp_payment_method_id'
            ]
        }),
        ('Fechas de MercadoPago', {
            'fields': ['mp_date_created', 'mp_date_approved', 'mp_date_last_updated']
        }),
        ('Comisiones', {
            'fields': ['mp_fee_amount', 'net_received_amount']
        }),
        ('Estado de Procesamiento', {
            'fields': ['is_processed', 'processed_at']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        })
    ]


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ['mp_topic', 'mp_resource_id', 'status', 'retry_count', 'created_at']
    list_filter = ['mp_topic', 'status']
    search_fields = ['mp_resource_id', 'error_message']
    readonly_fields = ['created_at', 'processed_at']
    
    fieldsets = [
        ('Información del Webhook', {
            'fields': ['mp_resource', 'mp_topic', 'mp_resource_id']
        }),
        ('Estado del Procesamiento', {
            'fields': ['status', 'retry_count', 'error_message']
        }),
        ('Datos', {
            'fields': ['raw_data'],
            'classes': ['collapse']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'processed_at'],
            'classes': ['collapse']
        })
    ]
