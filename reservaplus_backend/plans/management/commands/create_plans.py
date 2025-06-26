# plans/management/commands/create_plans.py

from django.core.management.base import BaseCommand
from plans.models import Plan


class Command(BaseCommand):
    help = 'Crear planes por defecto para ReservaPlus'

    def handle(self, *args, **options):
        self.stdout.write('Creando planes por defecto...')

        # Plan Básico
        basic_plan, created = Plan.objects.get_or_create(
            slug='basico',
            defaults={
                'name': 'Básico',
                'description': 'Todo lo que necesitas para profesionalizar tu negocio',
                'price_monthly': 29990,
                'price_yearly': 299990,
                'original_price': 59990,
                'max_professionals': 3,
                'max_services': 20,
                'max_monthly_appointments': 500,
                'max_clients': 1000,
                'features': [
                    '1 Usuario Admin',
                    '1 Recepcionista', 
                    '3 Profesionales',
                    '500 citas por mes',
                    '5 GB de almacenamiento',
                    'Calendario inteligente',
                    'Base de datos centralizada',
                    'Notificaciones automáticas',
                    'Panel de control básico',
                    'Soporte personalizado',
                    'Recordatorios por email',
                    '$12.990 por profesional adicional'
                ],
                'supports_integrations': False,
                'supports_advanced_reports': False,
                'supports_multi_location': False,
                'supports_custom_branding': False,
                'priority_support': False,
                'is_popular': True,
                'color_scheme': 'emerald',
                'badge_text': 'Más Popular',
                'discount_text': '-17%',
                'display_order': 1
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Plan Básico creado'))
        else:
            self.stdout.write('→ Plan Básico ya existe')

        # Plan Profesional
        professional_plan, created = Plan.objects.get_or_create(
            slug='profesional',
            defaults={
                'name': 'Profesional',
                'description': 'Para equipos que buscan crecer y optimizar',
                'price_monthly': 49990,
                'price_yearly': 499990,
                'max_professionals': 10,
                'max_services': 100,
                'max_monthly_appointments': 2000,
                'max_clients': 5000,
                'features': [
                    'Hasta 10 profesionales',
                    '2000 citas mensuales',
                    '50 GB de almacenamiento',
                    'Reportes avanzados',
                    'Múltiples ubicaciones',
                    'Integraciones básicas',
                    'Branding personalizado',
                    'Soporte prioritario',
                    'API access',
                    'Backup automático'
                ],
                'supports_integrations': True,
                'supports_advanced_reports': True,
                'supports_multi_location': True,
                'supports_custom_branding': True,
                'priority_support': True,
                'is_coming_soon': True,
                'color_scheme': 'blue',
                'display_order': 2
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Plan Profesional creado'))
        else:
            self.stdout.write('→ Plan Profesional ya existe')

        # Plan Empresarial
        enterprise_plan, created = Plan.objects.get_or_create(
            slug='empresarial',
            defaults={
                'name': 'Empresarial',
                'description': 'Solución completa para grandes organizaciones',
                'price_monthly': 99990,
                'price_yearly': 999990,
                'max_professionals': 50,
                'max_services': 500,
                'max_monthly_appointments': 10000,
                'max_clients': 25000,
                'features': [
                    'Hasta 50 profesionales',
                    '10,000 citas mensuales',
                    '500 GB de almacenamiento',
                    'Analytics avanzados',
                    'Múltiples sucursales',
                    'Integraciones completas',
                    'White label',
                    'Soporte 24/7',
                    'API completa',
                    'Consultoría incluida'
                ],
                'supports_integrations': True,
                'supports_advanced_reports': True,
                'supports_multi_location': True,
                'supports_custom_branding': True,
                'priority_support': True,
                'is_coming_soon': True,
                'color_scheme': 'purple',
                'display_order': 3
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Plan Empresarial creado'))
        else:
            self.stdout.write('→ Plan Empresarial ya existe')

        self.stdout.write(
            self.style.SUCCESS(
                f'\n¡Listo! Se han configurado {Plan.objects.count()} planes en total.'
            )
        )