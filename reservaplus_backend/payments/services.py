import mercadopago
import logging
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
from .models import (
    MercadoPagoConfig, 
    PaymentMethod, 
    SubscriptionPayment, 
    Payment, 
    WebhookEvent
)

logger = logging.getLogger(__name__)


class MercadoPagoService:
    """
    Servicio para manejar la integración con MercadoPago
    """
    
    def __init__(self):
        self.config = None
        self.sdk = None
        self._initialize()
    
    def _initialize(self):
        """Inicializar la configuración de MercadoPago"""
        try:
            self.config = MercadoPagoConfig.objects.filter(is_active=True).first()
            if not self.config:
                logger.warning("No se encontró configuración activa de MercadoPago")
                return
            
            # Inicializar SDK
            self.sdk = mercadopago.SDK(self.config.access_token)
            
            # Configurar sandbox si está habilitado
            if self.config.is_sandbox:
                self.sdk.sandbox_mode(True)
                
        except Exception as e:
            logger.error(f"Error al inicializar MercadoPago: {str(e)}")
    
    def is_configured(self):
        """Verificar si MercadoPago está configurado"""
        return self.config is not None and self.sdk is not None
    
    def create_customer(self, organization):
        """
        Crear un cliente en MercadoPago para una organización
        """
        if not self.is_configured():
            raise Exception("MercadoPago no está configurado")
        
        customer_data = {
            "email": organization.email or f"admin@{organization.slug}.com",
            "first_name": organization.name,
            "last_name": "Organization",
            "phone": {
                "area_code": "+56",
                "number": organization.phone or "123456789"
            },
            "identification": {
                "type": "OTHER",
                "number": str(organization.id)[:20]  # Truncar si es muy largo
            },
            "description": f"Cliente {organization.name}",
            "metadata": {
                "organization_id": str(organization.id),
                "organization_name": organization.name
            }
        }
        
        try:
            response = self.sdk.customer().create(customer_data)
            
            if response["status"] == 201:
                customer_id = response["response"]["id"]
                logger.info(f"Cliente MP creado: {customer_id} para organización {organization.name}")
                return customer_id
            else:
                logger.error(f"Error al crear cliente MP: {response}")
                raise Exception(f"Error al crear cliente: {response.get('response', {}).get('message', 'Error desconocido')}")
                
        except Exception as e:
            logger.error(f"Error al crear cliente MP: {str(e)}")
            raise
    
    def save_payment_method(self, organization, card_token):
        """
        Guardar método de pago de una organización
        """
        if not self.is_configured():
            raise Exception("MercadoPago no está configurado")
        
        # Primero, crear o obtener el customer
        customer_id = self._get_or_create_customer(organization)
        
        # Crear la tarjeta
        card_data = {
            "token": card_token
        }
        
        try:
            response = self.sdk.card().create(customer_id, card_data)
            
            if response["status"] == 201:
                card_info = response["response"]
                
                # Guardar en nuestra base de datos
                payment_method = PaymentMethod.objects.create(
                    organization=organization,
                    mp_payment_method_id=card_info["payment_method"]["id"],
                    mp_customer_id=customer_id,
                    mp_card_id=card_info["id"],
                    card_last_four_digits=card_info["last_four_digits"],
                    card_first_six_digits=card_info["first_six_digits"],
                    card_brand=card_info["payment_method"]["name"],
                    card_holder_name=card_info["cardholder"]["name"],
                    expiration_month=card_info["expiration_month"],
                    expiration_year=card_info["expiration_year"],
                    is_default=not organization.payment_methods.exists()  # Primera tarjeta es default
                )
                
                logger.info(f"Método de pago guardado: {payment_method.id}")
                return payment_method
                
            else:
                logger.error(f"Error al crear tarjeta: {response}")
                raise Exception(f"Error al guardar método de pago: {response.get('response', {}).get('message', 'Error desconocido')}")
                
        except Exception as e:
            logger.error(f"Error al guardar método de pago: {str(e)}")
            raise
    
    def create_subscription(self, organization_subscription):
        """
        Crear suscripción automática en MercadoPago
        """
        if not self.is_configured():
            raise Exception("MercadoPago no está configurado")
        
        organization = organization_subscription.organization
        plan = organization_subscription.plan
        
        # Obtener método de pago por defecto
        payment_method = organization.payment_methods.filter(is_default=True).first()
        if not payment_method:
            raise Exception("No hay método de pago configurado")
        
        # Calcular fechas
        start_date = timezone.now()
        if organization_subscription.billing_cycle == 'monthly':
            next_payment_date = start_date + relativedelta(months=1)
        else:  # yearly
            next_payment_date = start_date + relativedelta(years=1)
        
        # Obtener el monto según el ciclo
        amount = plan.price_monthly if organization_subscription.billing_cycle == 'monthly' else plan.price_yearly
        
        # Datos de la suscripción
        subscription_data = {
            "reason": f"Suscripción {plan.name} - {organization.name}",
            "auto_recurring": {
                "frequency": 1,
                "frequency_type": "months" if organization_subscription.billing_cycle == 'monthly' else "years",
                "transaction_amount": float(amount),
                "currency_id": "CLP",
                "start_date": start_date.isoformat(),
                "end_date": None  # Suscripción indefinida
            },
            "payer_email": organization.email or f"admin@{organization.slug}.com",
            "card_token_id": payment_method.mp_card_id,
            "external_reference": f"subscription_{organization_subscription.id}",
            "status": "authorized",
            "metadata": {
                "organization_id": str(organization.id),
                "subscription_id": str(organization_subscription.id),
                "plan_id": str(plan.id)
            }
        }
        
        try:
            response = self.sdk.preapproval().create(subscription_data)
            
            if response["status"] == 201:
                preapproval_info = response["response"]
                
                # Crear registro de suscripción de pago
                subscription_payment = SubscriptionPayment.objects.create(
                    organization_subscription=organization_subscription,
                    mp_subscription_id=preapproval_info["id"],
                    mp_preapproval_id=preapproval_info["id"],
                    mp_payer_id=preapproval_info["payer_id"],
                    frequency=1,
                    frequency_type="months" if organization_subscription.billing_cycle == 'monthly' else "years",
                    transaction_amount=amount,
                    mp_status=preapproval_info["status"],
                    start_date=start_date,
                    next_payment_date=next_payment_date
                )
                
                # Actualizar estado de la suscripción local
                organization_subscription.status = 'active'
                organization_subscription.save(update_fields=['status'])
                
                logger.info(f"Suscripción creada: {subscription_payment.id}")
                return subscription_payment
                
            else:
                logger.error(f"Error al crear suscripción: {response}")
                raise Exception(f"Error al crear suscripción: {response.get('response', {}).get('message', 'Error desconocido')}")
                
        except Exception as e:
            logger.error(f"Error al crear suscripción: {str(e)}")
            raise
    
    def cancel_subscription(self, subscription_payment):
        """
        Cancelar suscripción en MercadoPago
        """
        if not self.is_configured():
            raise Exception("MercadoPago no está configurado")
        
        try:
            response = self.sdk.preapproval().update(
                subscription_payment.mp_preapproval_id,
                {"status": "cancelled"}
            )
            
            if response["status"] == 200:
                subscription_payment.mp_status = 'cancelled'
                subscription_payment.is_active = False
                subscription_payment.save(update_fields=['mp_status', 'is_active'])
                
                # Actualizar suscripción local
                subscription_payment.organization_subscription.status = 'cancelled'
                subscription_payment.organization_subscription.save(update_fields=['status'])
                
                logger.info(f"Suscripción cancelada: {subscription_payment.id}")
                return True
                
            else:
                logger.error(f"Error al cancelar suscripción: {response}")
                return False
                
        except Exception as e:
            logger.error(f"Error al cancelar suscripción: {str(e)}")
            return False
    
    def process_payment_webhook(self, webhook_data):
        """
        Procesar webhook de pago
        """
        try:
            # Registrar el evento
            webhook_event = WebhookEvent.objects.create(
                mp_resource=webhook_data.get("resource", ""),
                mp_topic=webhook_data.get("topic", ""),
                mp_resource_id=webhook_data.get("resource_id", ""),
                raw_data=webhook_data,
                status='processing'
            )
            
            if webhook_data.get("topic") == "payment":
                payment_id = webhook_data.get("resource_id")
                if payment_id:
                    self._process_payment_update(payment_id, webhook_event)
            
            elif webhook_data.get("topic") == "preapproval":
                preapproval_id = webhook_data.get("resource_id")
                if preapproval_id:
                    self._process_subscription_update(preapproval_id, webhook_event)
            
            webhook_event.mark_as_processed()
            
        except Exception as e:
            logger.error(f"Error procesando webhook: {str(e)}")
            if 'webhook_event' in locals():
                webhook_event.mark_as_failed(str(e))
    
    def _process_payment_update(self, payment_id, webhook_event):
        """
        Procesar actualización de pago
        """
        try:
            # Obtener información del pago desde MP
            response = self.sdk.payment().get(payment_id)
            
            if response["status"] == 200:
                payment_data = response["response"]
                
                # Buscar o crear el pago en nuestra BD
                payment, created = Payment.objects.get_or_create(
                    mp_payment_id=payment_id,
                    defaults={
                        'transaction_amount': Decimal(str(payment_data["transaction_amount"])),
                        'currency_id': payment_data["currency_id"],
                        'description': payment_data["description"],
                        'external_reference': payment_data.get("external_reference", ""),
                        'mp_status': payment_data["status"],
                        'mp_preference_id': payment_data.get("preference_id", ""),
                    }
                )
                
                # Actualizar con datos de MP
                payment.update_from_mp_data(payment_data)
                
                # Si es un pago exitoso de suscripción, procesar
                if payment.is_successful and payment.subscription_payment:
                    self._process_successful_subscription_payment(payment)
                
                logger.info(f"Pago procesado: {payment_id} - Estado: {payment.mp_status}")
                
        except Exception as e:
            logger.error(f"Error procesando pago {payment_id}: {str(e)}")
            raise
    
    def _process_subscription_update(self, preapproval_id, webhook_event):
        """
        Procesar actualización de suscripción
        """
        try:
            # Obtener información de la suscripción desde MP
            response = self.sdk.preapproval().get(preapproval_id)
            
            if response["status"] == 200:
                subscription_data = response["response"]
                
                # Buscar la suscripción en nuestra BD
                subscription_payment = SubscriptionPayment.objects.filter(
                    mp_preapproval_id=preapproval_id
                ).first()
                
                if subscription_payment:
                    # Actualizar estado
                    subscription_payment.mp_status = subscription_data["status"]
                    subscription_payment.save(update_fields=['mp_status'])
                    
                    # Actualizar estado de la suscripción local
                    if subscription_data["status"] == "cancelled":
                        subscription_payment.organization_subscription.status = 'cancelled'
                    elif subscription_data["status"] == "authorized":
                        subscription_payment.organization_subscription.status = 'active'
                    elif subscription_data["status"] == "paused":
                        subscription_payment.organization_subscription.status = 'past_due'
                    
                    subscription_payment.organization_subscription.save(update_fields=['status'])
                    
                logger.info(f"Suscripción procesada: {preapproval_id} - Estado: {subscription_data['status']}")
                
        except Exception as e:
            logger.error(f"Error procesando suscripción {preapproval_id}: {str(e)}")
            raise
    
    def _process_successful_subscription_payment(self, payment):
        """
        Procesar pago exitoso de suscripción
        """
        subscription_payment = payment.subscription_payment
        
        # Actualizar próxima fecha de pago
        subscription_payment.update_next_payment_date()
        
        # Resetear intentos de reintento
        subscription_payment.retry_attempts = 0
        subscription_payment.save(update_fields=['retry_attempts'])
        
        # Actualizar estado de la suscripción si estaba en "past_due"
        if subscription_payment.organization_subscription.status == 'past_due':
            subscription_payment.organization_subscription.status = 'active'
            subscription_payment.organization_subscription.save(update_fields=['status'])
        
        # Marcar pago como procesado
        payment.mark_as_processed()
        
        logger.info(f"Pago de suscripción procesado exitosamente: {payment.mp_payment_id}")
    
    def _get_or_create_customer(self, organization):
        """
        Obtener o crear customer de MercadoPago para una organización
        """
        # Buscar si ya tenemos un customer guardado
        payment_method = organization.payment_methods.first()
        if payment_method and payment_method.mp_customer_id:
            return payment_method.mp_customer_id
        
        # Crear nuevo customer
        return self.create_customer(organization)
    
    def create_payment_preference(self, organization, plan, billing_cycle='monthly'):
        """
        Crear preferencia de pago para setup inicial
        """
        if not self.is_configured():
            raise Exception("MercadoPago no está configurado")
        
        amount = plan.price_monthly if billing_cycle == 'monthly' else plan.price_yearly
        
        preference_data = {
            "items": [
                {
                    "title": f"Suscripción {plan.name} - {billing_cycle}",
                    "description": f"Plan {plan.name} para {organization.name}",
                    "quantity": 1,
                    "unit_price": float(amount),
                    "currency_id": "CLP"
                }
            ],
            "payer": {
                "name": organization.name,
                "email": organization.email or f"admin@{organization.slug}.com"
            },
            "external_reference": f"setup_{organization.id}_{plan.id}",
            "notification_url": f"{self.config.webhook_url}/payments/webhook/",
            "back_urls": {
                "success": f"{settings.FRONTEND_URL}/subscription/success",
                "failure": f"{settings.FRONTEND_URL}/subscription/failure",
                "pending": f"{settings.FRONTEND_URL}/subscription/pending"
            },
            "auto_return": "approved",
            "metadata": {
                "organization_id": str(organization.id),
                "plan_id": str(plan.id),
                "billing_cycle": billing_cycle,
                "setup_payment": True
            }
        }
        
        try:
            response = self.sdk.preference().create(preference_data)
            
            if response["status"] == 201:
                preference = response["response"]
                
                logger.info(f"Preferencia creada: {preference['id']} para organización {organization.name}")
                return {
                    "preference_id": preference["id"],
                    "init_point": preference["init_point"],
                    "sandbox_init_point": preference.get("sandbox_init_point")
                }
            else:
                logger.error(f"Error al crear preferencia: {response}")
                raise Exception(f"Error al crear preferencia: {response.get('response', {}).get('message', 'Error desconocido')}")
                
        except Exception as e:
            logger.error(f"Error al crear preferencia: {str(e)}")
            raise


# Instancia global del servicio
mercadopago_service = MercadoPagoService()