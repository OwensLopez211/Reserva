from django.core.management.base import BaseCommand
from django.conf import settings
from payments.models import MercadoPagoConfig


class Command(BaseCommand):
    help = 'Setup MercadoPago configuration'

    def add_arguments(self, parser):
        parser.add_argument('--access-token', type=str, help='MercadoPago Access Token')
        parser.add_argument('--public-key', type=str, help='MercadoPago Public Key')
        parser.add_argument('--client-id', type=str, help='MercadoPago Client ID')
        parser.add_argument('--client-secret', type=str, help='MercadoPago Client Secret')
        parser.add_argument('--webhook-url', type=str, help='Webhook URL')
        parser.add_argument('--sandbox', action='store_true', help='Use sandbox mode')
        parser.add_argument('--production', action='store_true', help='Use production mode')

    def handle(self, *args, **options):
        self.stdout.write('🔧 Setting up MercadoPago configuration...')
        
        # Obtener o crear configuración
        config, created = MercadoPagoConfig.objects.get_or_create(
            defaults={
                'access_token': '',
                'public_key': '',
                'client_id': '',
                'client_secret': '',
                'webhook_url': '',
                'is_sandbox': True,
                'auto_recurring': True,
                'retry_attempts': 3,
                'is_active': True
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✅ Created new MercadoPago configuration'))
        else:
            self.stdout.write('📝 Updating existing MercadoPago configuration')
        
        # Actualizar campos si se proporcionaron
        updated = False
        
        if options['access_token']:
            config.access_token = options['access_token']
            updated = True
            self.stdout.write('✅ Access token updated')
        
        if options['public_key']:
            config.public_key = options['public_key']
            updated = True
            self.stdout.write('✅ Public key updated')
        
        if options['client_id']:
            config.client_id = options['client_id']
            updated = True
            self.stdout.write('✅ Client ID updated')
        
        if options['client_secret']:
            config.client_secret = options['client_secret']
            updated = True
            self.stdout.write('✅ Client secret updated')
        
        if options['webhook_url']:
            config.webhook_url = options['webhook_url']
            updated = True
            self.stdout.write('✅ Webhook URL updated')
        
        if options['sandbox']:
            config.is_sandbox = True
            updated = True
            self.stdout.write('✅ Sandbox mode enabled')
        
        if options['production']:
            config.is_sandbox = False
            updated = True
            self.stdout.write('✅ Production mode enabled')
        
        if updated:
            config.save()
            self.stdout.write(self.style.SUCCESS('💾 Configuration saved'))
        
        # Mostrar configuración actual
        self.stdout.write('\n📋 Current MercadoPago Configuration:')
        self.stdout.write(f'   Access Token: {"✅ Set" if config.access_token else "❌ Not set"}')
        self.stdout.write(f'   Public Key: {"✅ Set" if config.public_key else "❌ Not set"}')
        self.stdout.write(f'   Client ID: {"✅ Set" if config.client_id else "❌ Not set"}')
        self.stdout.write(f'   Client Secret: {"✅ Set" if config.client_secret else "❌ Not set"}')
        self.stdout.write(f'   Webhook URL: {config.webhook_url or "❌ Not set"}')
        self.stdout.write(f'   Mode: {"🧪 Sandbox" if config.is_sandbox else "🚀 Production"}')
        self.stdout.write(f'   Auto Recurring: {"✅" if config.auto_recurring else "❌"}')
        self.stdout.write(f'   Retry Attempts: {config.retry_attempts}')
        self.stdout.write(f'   Active: {"✅" if config.is_active else "❌"}')
        
        # Verificar si la configuración está completa
        if all([config.access_token, config.public_key, config.client_id, config.client_secret, config.webhook_url]):
            self.stdout.write(self.style.SUCCESS('\n🎉 MercadoPago configuration is complete!'))
            self.stdout.write('\nNext steps:')
            self.stdout.write('1. Configure webhooks in your MercadoPago dashboard')
            self.stdout.write('2. Test the integration with sandbox credentials')
            self.stdout.write('3. Set up automatic payment processing cron job')
        else:
            self.stdout.write(self.style.WARNING('\n⚠️  MercadoPago configuration is incomplete'))
            self.stdout.write('\nPlease provide all required credentials:')
            if not config.access_token:
                self.stdout.write('  --access-token YOUR_ACCESS_TOKEN')
            if not config.public_key:
                self.stdout.write('  --public-key YOUR_PUBLIC_KEY')
            if not config.client_id:
                self.stdout.write('  --client-id YOUR_CLIENT_ID')
            if not config.client_secret:
                self.stdout.write('  --client-secret YOUR_CLIENT_SECRET')
            if not config.webhook_url:
                self.stdout.write('  --webhook-url https://yourdomain.com/api/payments/webhook/')
        
        self.stdout.write('\n📖 For more information, check: MERCADOPAGO_INTEGRATION.md')