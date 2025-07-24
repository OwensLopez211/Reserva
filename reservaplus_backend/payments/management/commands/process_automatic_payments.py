import logging
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from django.conf import settings

from payments.models import SubscriptionPayment, Payment, WebhookEvent
from payments.services import mercadopago_service
from plans.models import OrganizationSubscription

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Process automatic payments for subscriptions due today'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be processed without actually doing it',
        )
        parser.add_argument(
            '--days-ahead',
            type=int,
            default=0,
            help='Process payments due in N days ahead (default: 0 for today only)',
        )
        parser.add_argument(
            '--force-retry',
            action='store_true',
            help='Force retry failed payments regardless of retry count',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days_ahead = options['days_ahead']
        force_retry = options['force_retry']
        
        self.stdout.write(
            self.style.SUCCESS(
                f'🚀 Starting automatic payment processing (dry_run={dry_run}, days_ahead={days_ahead})'
            )
        )
        
        if not mercadopago_service.is_configured():
            self.stdout.write(
                self.style.ERROR('❌ MercadoPago is not configured. Please configure it in Django Admin.')
            )
            return
        
        # Fecha límite para procesar pagos
        cutoff_date = timezone.now().date() + timedelta(days=days_ahead + 1)
        
        # Obtener suscripciones que necesitan pago
        pending_subscriptions = SubscriptionPayment.objects.filter(
            is_active=True,
            mp_status__in=['authorized', 'pending'],
            next_payment_date__date__lt=cutoff_date
        ).select_related('organization_subscription', 'organization_subscription__organization')
        
        self.stdout.write(f'📋 Found {pending_subscriptions.count()} subscriptions requiring payment processing')
        
        processed_count = 0
        success_count = 0
        failed_count = 0
        
        for subscription_payment in pending_subscriptions:
            try:
                organization = subscription_payment.organization_subscription.organization
                
                self.stdout.write(f'\n🏢 Processing: {organization.name}')
                self.stdout.write(f'   Next payment date: {subscription_payment.next_payment_date}')
                self.stdout.write(f'   Amount: ${subscription_payment.transaction_amount}')
                
                if dry_run:
                    self.stdout.write('   ℹ️  DRY RUN - Would process payment')
                    processed_count += 1
                    continue
                
                # Verificar si ya se ha intentado el pago demasiadas veces
                if not force_retry and subscription_payment.retry_attempts >= subscription_payment.max_retry_attempts:
                    self.stdout.write(
                        self.style.WARNING(
                            f'   ⚠️  Skipping - Max retry attempts reached ({subscription_payment.retry_attempts})'
                        )
                    )
                    # Marcar suscripción como pausada
                    self._pause_subscription(subscription_payment)
                    continue
                
                # Procesar el pago
                success = self._process_subscription_payment(subscription_payment)
                
                if success:
                    success_count += 1
                    self.stdout.write(self.style.SUCCESS('   ✅ Payment processed successfully'))
                else:
                    failed_count += 1
                    self.stdout.write(self.style.ERROR('   ❌ Payment processing failed'))
                
                processed_count += 1
                
            except Exception as e:
                failed_count += 1
                logger.error(f'Error processing subscription {subscription_payment.id}: {str(e)}')
                self.stdout.write(
                    self.style.ERROR(f'   ❌ Error: {str(e)}')
                )
        
        # Procesar webhooks pendientes
        self._process_pending_webhooks(dry_run)
        
        # Resumen final
        self.stdout.write(f'\n📊 Processing Summary:')
        self.stdout.write(f'   Total processed: {processed_count}')
        self.stdout.write(f'   Successful: {success_count}')
        self.stdout.write(f'   Failed: {failed_count}')
        
        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS('✨ Automatic payment processing completed!')
            )
        else:
            self.stdout.write(
                self.style.WARNING('ℹ️  Dry run completed - no actual payments were processed')
            )

    def _process_subscription_payment(self, subscription_payment):
        """
        Procesar un pago de suscripción individual
        """
        try:
            with transaction.atomic():
                # Incrementar contador de intentos
                subscription_payment.retry_attempts += 1
                subscription_payment.save(update_fields=['retry_attempts'])
                
                # Obtener método de pago por defecto
                organization = subscription_payment.organization_subscription.organization
                payment_method = organization.payment_methods.filter(
                    is_default=True, 
                    is_active=True
                ).first()
                
                if not payment_method:
                    self.stdout.write('   ❌ No active payment method found')
                    return False
                
                # Crear el pago en MercadoPago
                payment_data = {
                    "transaction_amount": float(subscription_payment.transaction_amount),
                    "description": f"Suscripción {subscription_payment.organization_subscription.plan.name} - {organization.name}",
                    "payment_method_id": payment_method.mp_payment_method_id,
                    "payer": {
                        "id": payment_method.mp_customer_id
                    },
                    "external_reference": f"subscription_{subscription_payment.id}_{timezone.now().strftime('%Y%m%d')}",
                    "metadata": {
                        "subscription_payment_id": str(subscription_payment.id),
                        "organization_id": str(organization.id)
                    }
                }
                
                # Crear pago usando el SDK de MercadoPago
                response = mercadopago_service.sdk.payment().create(payment_data)
                
                if response["status"] == 201:
                    payment_info = response["response"]
                    
                    # Crear registro del pago en nuestra BD
                    payment = Payment.objects.create(
                        organization=organization,
                        subscription_payment=subscription_payment,
                        payment_method=payment_method,
                        mp_payment_id=payment_info["id"],
                        transaction_amount=subscription_payment.transaction_amount,
                        currency_id=payment_info.get("currency_id", "CLP"),
                        description=payment_data["description"],
                        external_reference=payment_data["external_reference"],
                        mp_status=payment_info["status"]
                    )
                    
                    # Actualizar con datos completos de MP
                    payment.update_from_mp_data(payment_info)
                    
                    # Si el pago fue exitoso inmediatamente
                    if payment.is_successful:
                        self._handle_successful_payment(subscription_payment, payment)
                        return True
                    
                    # Si está pendiente, esperamos el webhook
                    if payment.is_pending:
                        self.stdout.write('   ⏳ Payment pending - waiting for webhook confirmation')
                        return True
                    
                    # Si falló inmediatamente
                    if payment.is_failed:
                        self._handle_failed_payment(subscription_payment, payment)
                        return False
                    
                    return True
                else:
                    logger.error(f'MercadoPago payment creation failed: {response}')
                    return False
                    
        except Exception as e:
            logger.error(f'Error processing payment for subscription {subscription_payment.id}: {str(e)}')
            return False

    def _handle_successful_payment(self, subscription_payment, payment):
        """
        Manejar pago exitoso
        """
        # Actualizar próxima fecha de pago
        subscription_payment.update_next_payment_date()
        
        # Resetear intentos de reintento
        subscription_payment.retry_attempts = 0
        subscription_payment.save(update_fields=['retry_attempts'])
        
        # Actualizar estado de la suscripción
        if subscription_payment.organization_subscription.status == 'past_due':
            subscription_payment.organization_subscription.status = 'active'
            subscription_payment.organization_subscription.save(update_fields=['status'])
        
        # Marcar pago como procesado
        payment.mark_as_processed()

    def _handle_failed_payment(self, subscription_payment, payment):
        """
        Manejar pago fallido
        """
        # Cambiar estado de suscripción a past_due
        subscription_payment.organization_subscription.status = 'past_due'
        subscription_payment.organization_subscription.save(update_fields=['status'])
        
        # Si se han agotado los intentos, pausar suscripción
        if subscription_payment.retry_attempts >= subscription_payment.max_retry_attempts:
            self._pause_subscription(subscription_payment)

    def _pause_subscription(self, subscription_payment):
        """
        Pausar suscripción por falta de pago
        """
        subscription_payment.mp_status = 'paused'
        subscription_payment.is_active = False
        subscription_payment.save(update_fields=['mp_status', 'is_active'])
        
        subscription_payment.organization_subscription.status = 'cancelled'
        subscription_payment.organization_subscription.save(update_fields=['status'])
        
        self.stdout.write('   ⏸️  Subscription paused due to payment failures')

    def _process_pending_webhooks(self, dry_run):
        """
        Procesar webhooks pendientes que puedan haber fallado
        """
        self.stdout.write('\n🔄 Processing pending webhooks...')
        
        pending_webhooks = WebhookEvent.objects.filter(
            status__in=['pending', 'failed'],
            created_at__gte=timezone.now() - timedelta(hours=24)  # Solo últimas 24 horas
        ).filter(retry_count__lt=3)
        
        if not pending_webhooks.exists():
            self.stdout.write('   ✅ No pending webhooks to process')
            return
        
        for webhook in pending_webhooks:
            try:
                if dry_run:
                    self.stdout.write(f'   ℹ️  Would retry webhook: {webhook.mp_topic} - {webhook.mp_resource_id}')
                    continue
                
                webhook.status = 'processing'
                webhook.save(update_fields=['status'])
                
                # Reprocess webhook
                mercadopago_service.process_payment_webhook(webhook.raw_data)
                
                self.stdout.write(f'   ✅ Reprocessed webhook: {webhook.mp_topic} - {webhook.mp_resource_id}')
                
            except Exception as e:
                webhook.mark_as_failed(str(e))
                self.stdout.write(f'   ❌ Failed to reprocess webhook {webhook.id}: {str(e)}')

    def _send_payment_notifications(self, subscription_payment, payment, success):
        """
        Enviar notificaciones sobre el estado del pago
        """
        # TODO: Implementar notificaciones por email/SMS
        # Este método se puede expandir para enviar notificaciones a los usuarios
        pass