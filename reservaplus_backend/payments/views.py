import json
import logging
from datetime import datetime, timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction

from .models import (
    PaymentMethod,
    SubscriptionPayment,
    Payment,
    WebhookEvent
)
from .serializers import (
    PaymentMethodSerializer,
    SubscriptionPaymentSerializer,
    PaymentSerializer,
    CreatePaymentPreferenceSerializer,
    SavePaymentMethodSerializer,
    CreateSubscriptionSerializer,
    PaymentSummarySerializer,
    SubscriptionStatusSerializer
)
from .services import mercadopago_service
from plans.models import Plan, OrganizationSubscription
from organizations.models import Organization

logger = logging.getLogger(__name__)


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar métodos de pago
    """
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(
            organization=self.request.user.organization,
            is_active=True
        ).order_by('-is_default', '-created_at')
    
    @action(detail=True, methods=['post'])
    def set_as_default(self, request, pk=None):
        """
        Establecer método de pago como predeterminado
        """
        payment_method = self.get_object()
        
        # Desactivar otros métodos como default
        PaymentMethod.objects.filter(
            organization=request.user.organization,
            is_default=True
        ).update(is_default=False)
        
        # Activar este como default
        payment_method.is_default = True
        payment_method.save()
        
        return Response({'message': 'Método de pago establecido como predeterminado'})
    
    def destroy(self, request, *args, **kwargs):
        """
        Desactivar método de pago (no eliminar)
        """
        payment_method = self.get_object()
        payment_method.is_active = False
        payment_method.save()
        
        return Response({'message': 'Método de pago desactivado'})


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar historial de pagos
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Payment.objects.filter(
            organization=self.request.user.organization
        ).order_by('-created_at')


class SubscriptionPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consultar suscripciones de pago
    """
    serializer_class = SubscriptionPaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SubscriptionPayment.objects.filter(
            organization_subscription__organization=self.request.user.organization
        )


class CreatePaymentPreferenceView(APIView):
    """
    Crear preferencia de pago para setup inicial
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreatePaymentPreferenceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plan = Plan.objects.get(id=serializer.validated_data['plan_id'])
            organization = request.user.organization
            billing_cycle = serializer.validated_data['billing_cycle']
            
            # Crear preferencia en MercadoPago
            preference_data = mercadopago_service.create_payment_preference(
                organization, plan, billing_cycle
            )
            
            return Response({
                'preference_id': preference_data['preference_id'],
                'init_point': preference_data['init_point'],
                'sandbox_init_point': preference_data.get('sandbox_init_point'),
                'plan': {
                    'id': str(plan.id),
                    'name': plan.name,
                    'price': plan.price_monthly if billing_cycle == 'monthly' else plan.price_yearly
                }
            })
            
        except Exception as e:
            logger.error(f"Error creando preferencia: {str(e)}")
            return Response(
                {'error': 'Error al crear preferencia de pago'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SavePaymentMethodView(APIView):
    """
    Guardar método de pago desde token de tarjeta
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = SavePaymentMethodSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            organization = request.user.organization
            card_token = serializer.validated_data['card_token']
            
            # Guardar método de pago
            payment_method = mercadopago_service.save_payment_method(
                organization, card_token
            )
            
            return Response(PaymentMethodSerializer(payment_method).data)
            
        except Exception as e:
            logger.error(f"Error guardando método de pago: {str(e)}")
            return Response(
                {'error': 'Error al guardar método de pago'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CreateSubscriptionView(APIView):
    """
    Crear suscripción automática
    """
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        serializer = CreateSubscriptionSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            plan = Plan.objects.get(id=serializer.validated_data['plan_id'])
            organization = request.user.organization
            billing_cycle = serializer.validated_data['billing_cycle']
            
            # Crear o actualizar suscripción local
            organization_subscription, created = OrganizationSubscription.objects.get_or_create(
                organization=organization,
                defaults={
                    'plan': plan,
                    'billing_cycle': billing_cycle,
                    'status': 'trial',
                    'current_period_start': timezone.now(),
                    'current_period_end': timezone.now() + timedelta(days=30)
                }
            )
            
            if not created:
                # Actualizar suscripción existente
                organization_subscription.plan = plan
                organization_subscription.billing_cycle = billing_cycle
                organization_subscription.status = 'trial'
                organization_subscription.save()
            
            # Crear suscripción en MercadoPago
            subscription_payment = mercadopago_service.create_subscription(
                organization_subscription
            )
            
            return Response({
                'message': 'Suscripción creada exitosamente',
                'subscription': SubscriptionPaymentSerializer(subscription_payment).data
            })
            
        except Exception as e:
            logger.error(f"Error creando suscripción: {str(e)}")
            return Response(
                {'error': f'Error al crear suscripción: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CancelSubscriptionView(APIView):
    """
    Cancelar suscripción automática
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            organization = request.user.organization
            
            # Buscar suscripción activa
            subscription_payment = SubscriptionPayment.objects.filter(
                organization_subscription__organization=organization,
                is_active=True
            ).first()
            
            if not subscription_payment:
                return Response(
                    {'error': 'No se encontró suscripción activa'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Cancelar en MercadoPago
            success = mercadopago_service.cancel_subscription(subscription_payment)
            
            if success:
                return Response({'message': 'Suscripción cancelada exitosamente'})
            else:
                return Response(
                    {'error': 'Error al cancelar suscripción'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            logger.error(f"Error cancelando suscripción: {str(e)}")
            return Response(
                {'error': 'Error al cancelar suscripción'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentSummaryView(APIView):
    """
    Resumen de pagos de la organización
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            organization = request.user.organization
            payments = Payment.objects.filter(organization=organization)
            
            # Calcular estadísticas
            total_payments = payments.count()
            successful_payments = payments.filter(mp_status__in=['approved', 'authorized']).count()
            failed_payments = payments.filter(mp_status__in=['rejected', 'cancelled']).count()
            pending_payments = payments.filter(mp_status__in=['pending', 'in_process']).count()
            
            # Calcular monto total pagado
            successful_payment_amounts = payments.filter(
                mp_status__in=['approved', 'authorized']
            ).values_list('transaction_amount', flat=True)
            total_amount_paid = sum(successful_payment_amounts) if successful_payment_amounts else 0
            
            # Obtener fechas importantes
            last_payment = payments.filter(mp_status__in=['approved', 'authorized']).first()
            last_payment_date = last_payment.mp_date_approved if last_payment else None
            
            # Próximo pago
            subscription_payment = SubscriptionPayment.objects.filter(
                organization_subscription__organization=organization,
                is_active=True
            ).first()
            next_payment_date = subscription_payment.next_payment_date if subscription_payment else None
            subscription_status = subscription_payment.mp_status if subscription_payment else 'none'
            
            summary_data = {
                'total_payments': total_payments,
                'successful_payments': successful_payments,
                'failed_payments': failed_payments,
                'pending_payments': pending_payments,
                'total_amount_paid': total_amount_paid,
                'last_payment_date': last_payment_date,
                'next_payment_date': next_payment_date,
                'subscription_status': subscription_status
            }
            
            return Response(summary_data)
            
        except Exception as e:
            logger.error(f"Error obteniendo resumen de pagos: {str(e)}")
            return Response(
                {'error': 'Error al obtener resumen de pagos'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubscriptionStatusView(APIView):
    """
    Estado detallado de la suscripción
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            organization = request.user.organization
            
            # Verificar si tiene suscripción
            subscription_payment = SubscriptionPayment.objects.filter(
                organization_subscription__organization=organization
            ).first()
            
            has_subscription = subscription_payment is not None
            subscription_active = subscription_payment.is_active if has_subscription else False
            
            # Información del plan
            plan_name = subscription_payment.organization_subscription.plan.name if has_subscription else ''
            
            # Próximo pago
            next_payment_date = subscription_payment.next_payment_date if has_subscription else None
            days_until_next_payment = 0
            if next_payment_date:
                days_until_next_payment = (next_payment_date.date() - timezone.now().date()).days
            
            # Método de pago configurado
            payment_method_configured = organization.payment_methods.filter(is_active=True).exists()
            
            # Último estado de pago
            last_payment = Payment.objects.filter(
                organization=organization,
                subscription_payment=subscription_payment
            ).first()
            last_payment_status = last_payment.mp_status if last_payment else 'none'
            
            status_data = {
                'has_subscription': has_subscription,
                'subscription_active': subscription_active,
                'plan_name': plan_name,
                'next_payment_date': next_payment_date,
                'payment_method_configured': payment_method_configured,
                'last_payment_status': last_payment_status,
                'days_until_next_payment': days_until_next_payment
            }
            
            return Response(status_data)
            
        except Exception as e:
            logger.error(f"Error obteniendo estado de suscripción: {str(e)}")
            return Response(
                {'error': 'Error al obtener estado de suscripción'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def webhook_handler(request):
    """
    Manejar webhooks de MercadoPago
    """
    try:
        # Obtener datos del webhook
        webhook_data = json.loads(request.body.decode('utf-8'))
        
        logger.info(f"Webhook recibido: {webhook_data}")
        
        # Procesar webhook de forma asíncrona
        mercadopago_service.process_payment_webhook(webhook_data)
        
        return HttpResponse(status=200)
        
    except Exception as e:
        logger.error(f"Error procesando webhook: {str(e)}")
        return HttpResponse(status=500)
