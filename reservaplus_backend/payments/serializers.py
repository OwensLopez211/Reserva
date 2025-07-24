from rest_framework import serializers
from .models import (
    MercadoPagoConfig,
    PaymentMethod,
    SubscriptionPayment,
    Payment,
    WebhookEvent
)
from plans.models import Plan, OrganizationSubscription


class PaymentMethodSerializer(serializers.ModelSerializer):
    """
    Serializer para métodos de pago (solo datos seguros)
    """
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'card_brand', 'card_last_four_digits', 
            'card_holder_name', 'expiration_month', 'expiration_year',
            'is_default', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    """
    Serializer para suscripciones de pago
    """
    organization_name = serializers.CharField(source='organization_subscription.organization.name', read_only=True)
    plan_name = serializers.CharField(source='organization_subscription.plan.name', read_only=True)
    
    class Meta:
        model = SubscriptionPayment
        fields = [
            'id', 'organization_name', 'plan_name',
            'frequency', 'frequency_type', 'transaction_amount',
            'mp_status', 'start_date', 'next_payment_date',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer para pagos
    """
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'organization_name', 'transaction_amount', 'currency_id',
            'description', 'mp_status', 'mp_status_detail',
            'mp_date_created', 'mp_date_approved', 'is_processed',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class CreatePaymentPreferenceSerializer(serializers.Serializer):
    """
    Serializer para crear preferencia de pago
    """
    plan_id = serializers.UUIDField()
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'yearly'], default='monthly')
    
    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            return value
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Plan no encontrado o inactivo")


class SavePaymentMethodSerializer(serializers.Serializer):
    """
    Serializer para guardar método de pago
    """
    card_token = serializers.CharField(max_length=500)
    
    def validate_card_token(self, value):
        if not value or len(value) < 10:
            raise serializers.ValidationError("Token de tarjeta inválido")
        return value


class CreateSubscriptionSerializer(serializers.Serializer):
    """
    Serializer para crear suscripción automática
    """
    plan_id = serializers.UUIDField()
    billing_cycle = serializers.ChoiceField(choices=['monthly', 'yearly'], default='monthly')
    payment_method_id = serializers.UUIDField(required=False)
    
    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            return value
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Plan no encontrado o inactivo")
    
    def validate(self, attrs):
        user = self.context['request'].user
        
        # Verificar que el usuario tenga organización
        if not user.organization:
            raise serializers.ValidationError("Usuario no pertenece a ninguna organización")
        
        # Verificar que no tenga suscripción activa
        if hasattr(user.organization, 'subscription') and user.organization.subscription.is_active:
            raise serializers.ValidationError("La organización ya tiene una suscripción activa")
        
        return attrs


class WebhookEventSerializer(serializers.ModelSerializer):
    """
    Serializer para eventos de webhook (solo para admin)
    """
    class Meta:
        model = WebhookEvent
        fields = [
            'id', 'mp_resource', 'mp_topic', 'mp_resource_id',
            'status', 'error_message', 'retry_count',
            'created_at', 'processed_at'
        ]
        read_only_fields = ['id', 'created_at', 'processed_at']


class PaymentSummarySerializer(serializers.Serializer):
    """
    Serializer para resumen de pagos de una organización
    """
    total_payments = serializers.IntegerField()
    successful_payments = serializers.IntegerField()
    failed_payments = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    total_amount_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    last_payment_date = serializers.DateTimeField()
    next_payment_date = serializers.DateTimeField()
    subscription_status = serializers.CharField()


class SubscriptionStatusSerializer(serializers.Serializer):
    """
    Serializer para estado de suscripción con información de pagos
    """
    has_subscription = serializers.BooleanField()
    subscription_active = serializers.BooleanField()
    plan_name = serializers.CharField()
    next_payment_date = serializers.DateTimeField()
    payment_method_configured = serializers.BooleanField()
    last_payment_status = serializers.CharField()
    days_until_next_payment = serializers.IntegerField()