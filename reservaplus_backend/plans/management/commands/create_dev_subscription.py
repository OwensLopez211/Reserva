from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from plans.models import Plan, OrganizationSubscription
from organizations.models import Organization
from users.models import User


class Command(BaseCommand):
    help = 'Crear datos de desarrollo para suscripciones'

    def handle(self, *args, **options):
        # Crear plan profesional si no existe
        plan, created = Plan.objects.get_or_create(
            name='Plan Profesional',
            defaults={
                'slug': 'plan-profesional',
                'description': 'Plan profesional con todas las características',
                'price_monthly': 49990,
                'price_yearly': 499990,
                'max_users': 10,
                'max_professionals': 5,
                'max_receptionists': 3,
                'max_staff': 5,
                'max_services': 20,
                'max_monthly_appointments': 1000,
                'max_clients': 500,
                'features': [
                    'Hasta 5 profesionales',
                    'Hasta 20 servicios',
                    'Hasta 1000 citas por mes',
                    'Reportes avanzados',
                    'Soporte prioritario',
                    'Integración con calendarios'
                ],
                'supports_integrations': True,
                'supports_advanced_reports': True,
                'supports_multi_location': False,
                'supports_custom_branding': True,
                'priority_support': True,
                'is_active': True,
                'is_popular': True,
                'color_scheme': 'blue',
                'badge_text': 'Recomendado',
                'discount_text': '20% Off',
                'display_order': 2
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Plan "{plan.name}" creado exitosamente')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Plan "{plan.name}" ya existe')
            )

        # Buscar organizaciones sin suscripción
        organizations_without_subscription = Organization.objects.filter(
            subscription__isnull=True
        )

        for org in organizations_without_subscription:
            # Crear suscripción para cada organización
            subscription, created = OrganizationSubscription.objects.get_or_create(
                organization=org,
                defaults={
                    'plan': plan,
                    'billing_cycle': 'monthly',
                    'status': 'active',
                    'trial_start': timezone.now() - timedelta(days=14),
                    'trial_end': timezone.now() + timedelta(days=16),
                    'current_period_start': timezone.now(),
                    'current_period_end': timezone.now() + timedelta(days=30),
                    'current_users_count': org.users.count(),
                    'current_professionals_count': org.professionals.count() if hasattr(org, 'professionals') else 0,
                    'current_receptionists_count': org.users.filter(role='reception').count(),
                    'current_staff_count': org.users.filter(role='staff').count(),
                    'current_services_count': org.services.count() if hasattr(org, 'services') else 0,
                    'current_clients_count': org.clients.count() if hasattr(org, 'clients') else 0,
                    'current_month_appointments_count': 0
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Suscripción creada para organización "{org.name}"')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Suscripción ya existe para "{org.name}"')
                )

        # Mostrar resumen
        total_orgs = Organization.objects.count()
        total_subscriptions = OrganizationSubscription.objects.count()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Resumen:\n'
                f'- Organizaciones: {total_orgs}\n'
                f'- Suscripciones: {total_subscriptions}\n'
                f'- Plan disponible: {plan.name} (${plan.price_monthly:,} CLP/mes)'
            )
        ) 