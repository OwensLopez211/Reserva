# plans/management/commands/system_check.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from plans.models import Plan, UserRegistration, OrganizationSubscription
from organizations.models import Organization, Professional, Service, Client

User = get_user_model()


class Command(BaseCommand):
    help = 'Verificar la salud del sistema ReservaPlus'

    def add_arguments(self, parser):
        parser.add_argument(
            '--detailed',
            action='store_true',
            help='Mostrar información detallada',
        )
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Intentar corregir problemas encontrados',
        )

    def handle(self, *args, **options):
        self.detailed = options['detailed']
        self.fix_issues = options['fix']
        
        self.stdout.write(
            self.style.SUCCESS('🔍 Verificando salud del sistema ReservaPlus...\n')
        )

        # 1. Verificar planes
        self.check_plans()

        # 2. Verificar organizaciones y suscripciones
        self.check_organizations()

        # 3. Verificar usuarios y roles
        self.check_users()

        # 4. Verificar registros temporales
        self.check_registrations()

        # 5. Verificar integridad de datos
        self.check_data_integrity()

        # 6. Verificar límites y contadores
        self.check_subscription_limits()

        # 7. Verificar configuraciones
        self.check_system_configuration()

        self.stdout.write(
            self.style.SUCCESS('\n✅ Verificación del sistema completada!')
        )

    def check_plans(self):
        """Verificar estado de los planes"""
        self.stdout.write('📋 Verificando planes...')
        
        total_plans = Plan.objects.count()
        active_plans = Plan.objects.filter(is_active=True).count()
        popular_plans = Plan.objects.filter(is_popular=True).count()
        coming_soon_plans = Plan.objects.filter(is_coming_soon=True).count()

        self.stdout.write(f'  → Total de planes: {total_plans}')
        self.stdout.write(f'  → Planes activos: {active_plans}')
        self.stdout.write(f'  → Planes populares: {popular_plans}')
        self.stdout.write(f'  → Planes próximamente: {coming_soon_plans}')

        if self.detailed:
            for plan in Plan.objects.all():
                status_emoji = '🟢' if plan.is_active else '🔴'
                popular_emoji = '⭐' if plan.is_popular else ''
                self.stdout.write(
                    f'    {status_emoji} {plan.name} - ${plan.price_monthly}/mes {popular_emoji}'
                )

        if active_plans == 0:
            self.stdout.write(
                self.style.WARNING('  ⚠️ No hay planes activos disponibles')
            )
            if self.fix_issues:
                self.stdout.write('  🔧 Ejecuta: python manage.py create_plans')

    def check_organizations(self):
        """Verificar organizaciones y suscripciones"""
        self.stdout.write('\n🏢 Verificando organizaciones...')
        
        total_orgs = Organization.objects.count()
        completed_onboarding = Organization.objects.filter(onboarding_completed=True).count()
        pending_onboarding = total_orgs - completed_onboarding

        self.stdout.write(f'  → Total organizaciones: {total_orgs}')
        self.stdout.write(f'  → Onboarding completado: {completed_onboarding}')
        self.stdout.write(f'  → Onboarding pendiente: {pending_onboarding}')

        # Verificar suscripciones
        total_subscriptions = OrganizationSubscription.objects.count()
        active_subscriptions = OrganizationSubscription.objects.filter(
            status__in=['trial', 'active']
        ).count()
        trial_subscriptions = OrganizationSubscription.objects.filter(
            status='trial'
        ).count()

        self.stdout.write(f'  → Total suscripciones: {total_subscriptions}')
        self.stdout.write(f'  → Suscripciones activas: {active_subscriptions}')
        self.stdout.write(f'  → En periodo de prueba: {trial_subscriptions}')

        # Verificar organizaciones sin suscripción
        orgs_without_subscription = Organization.objects.filter(
            onboarding_completed=True,
            subscription__isnull=True
        ).count()
        
        if orgs_without_subscription > 0:
            self.stdout.write(
                self.style.WARNING(f'  ⚠️ {orgs_without_subscription} organizaciones sin suscripción')
            )

        if self.detailed:
            for org in Organization.objects.select_related('subscription'):
                subscription = getattr(org, 'subscription', None)
                if subscription:
                    status_emoji = '🟢' if subscription.is_active else '🔴'
                    trial_emoji = '🆓' if subscription.is_trial else '💰'
                    self.stdout.write(
                        f'    {status_emoji} {org.name} - {subscription.plan.name} {trial_emoji}'
                    )
                else:
                    self.stdout.write(f'    🔴 {org.name} - Sin suscripción')

    def check_users(self):
        """Verificar usuarios y roles"""
        self.stdout.write('\n👥 Verificando usuarios...')
        
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Contar por roles
        owners = User.objects.filter(role='owner').count()
        admins = User.objects.filter(role='admin').count()
        staff = User.objects.filter(role='staff').count()
        professionals = User.objects.filter(role='professional').count()

        self.stdout.write(f'  → Total usuarios: {total_users}')
        self.stdout.write(f'  → Usuarios activos: {active_users}')
        self.stdout.write(f'  → Propietarios: {owners}')
        self.stdout.write(f'  → Administradores: {admins}')
        self.stdout.write(f'  → Personal: {staff}')
        self.stdout.write(f'  → Profesionales: {professionals}')

        # Verificar usuarios sin organización
        users_without_org = User.objects.filter(
            organization__isnull=True
        ).exclude(is_superuser=True).count()
        
        if users_without_org > 0:
            self.stdout.write(
                self.style.WARNING(f'  ⚠️ {users_without_org} usuarios sin organización asignada')
            )

    def check_registrations(self):
        """Verificar registros temporales"""
        self.stdout.write('\n📝 Verificando registros temporales...')
        
        total_registrations = UserRegistration.objects.count()
        valid_registrations = UserRegistration.objects.filter(
            is_completed=False,
            is_expired=False,
            expires_at__gt=timezone.now()
        ).count()
        completed_registrations = UserRegistration.objects.filter(is_completed=True).count()
        expired_registrations = UserRegistration.objects.filter(
            expires_at__lt=timezone.now(),
            is_expired=False
        ).count()

        self.stdout.write(f'  → Total registros: {total_registrations}')
        self.stdout.write(f'  → Registros válidos: {valid_registrations}')
        self.stdout.write(f'  → Registros completados: {completed_registrations}')
        self.stdout.write(f'  → Registros expirados no marcados: {expired_registrations}')

        # Limpiar registros expirados
        if expired_registrations > 0:
            if self.fix_issues:
                updated = UserRegistration.objects.filter(
                    expires_at__lt=timezone.now(),
                    is_expired=False
                ).update(is_expired=True)
                self.stdout.write(f'  🔧 {updated} registros expirados marcados como tal')
            else:
                self.stdout.write('  💡 Ejecuta con --fix para marcar registros expirados')

    def check_data_integrity(self):
        """Verificar integridad de datos"""
        self.stdout.write('\n🔍 Verificando integridad de datos...')
        
        issues_found = []

        # 1. Profesionales sin organización
        orphan_professionals = Professional.objects.filter(organization__isnull=True).count()
        if orphan_professionals > 0:
            issues_found.append(f'Profesionales sin organización: {orphan_professionals}')

        # 2. Servicios sin organización
        orphan_services = Service.objects.filter(organization__isnull=True).count()
        if orphan_services > 0:
            issues_found.append(f'Servicios sin organización: {orphan_services}')

        # 3. Clientes sin organización
        orphan_clients = Client.objects.filter(organization__isnull=True).count()
        if orphan_clients > 0:
            issues_found.append(f'Clientes sin organización: {orphan_clients}')

        # 4. Servicios sin profesionales asignados
        services_without_professionals = Service.objects.filter(professionals__isnull=True).count()
        if services_without_professionals > 0:
            issues_found.append(f'Servicios sin profesionales: {services_without_professionals}')

        # 5. Emails duplicados
        duplicate_emails = self.find_duplicate_emails()
        if duplicate_emails:
            issues_found.append(f'Emails duplicados encontrados: {len(duplicate_emails)}')

        if issues_found:
            self.stdout.write('  ⚠️ Problemas de integridad encontrados:')
            for issue in issues_found:
                self.stdout.write(f'    • {issue}')
        else:
            self.stdout.write('  ✅ No se encontraron problemas de integridad')

    def find_duplicate_emails(self):
        """Encontrar emails duplicados entre usuarios"""
        from django.db.models import Count
        
        duplicates = User.objects.values('email').annotate(
            count=Count('email')
        ).filter(count__gt=1)
        
        return list(duplicates)

    def check_subscription_limits(self):
        """Verificar límites y contadores de suscripciones"""
        self.stdout.write('\n📊 Verificando límites de suscripciones...')
        
        inconsistencies = []
        
        for subscription in OrganizationSubscription.objects.select_related('organization', 'plan'):
            org = subscription.organization
            
            # Contar datos reales
            actual_professionals = Professional.objects.filter(organization=org).count()
            actual_services = Service.objects.filter(organization=org).count()
            actual_clients = Client.objects.filter(organization=org).count()
            
            # Comparar con contadores almacenados
            if subscription.current_professionals_count != actual_professionals:
                inconsistencies.append(
                    f'{org.name}: Profesionales contador={subscription.current_professionals_count}, real={actual_professionals}'
                )
                if self.fix_issues:
                    subscription.current_professionals_count = actual_professionals
                    subscription.save(update_fields=['current_professionals_count'])

            if subscription.current_services_count != actual_services:
                inconsistencies.append(
                    f'{org.name}: Servicios contador={subscription.current_services_count}, real={actual_services}'
                )
                if self.fix_issues:
                    subscription.current_services_count = actual_services
                    subscription.save(update_fields=['current_services_count'])

            if subscription.current_clients_count != actual_clients:
                inconsistencies.append(
                    f'{org.name}: Clientes contador={subscription.current_clients_count}, real={actual_clients}'
                )
                if self.fix_issues:
                    subscription.current_clients_count = actual_clients
                    subscription.save(update_fields=['current_clients_count'])

            # Verificar si exceden límites del plan
            if actual_professionals > subscription.plan.max_professionals:
                inconsistencies.append(
                    f'{org.name}: Excede límite de profesionales ({actual_professionals} > {subscription.plan.max_professionals})'
                )

            if actual_services > subscription.plan.max_services:
                inconsistencies.append(
                    f'{org.name}: Excede límite de servicios ({actual_services} > {subscription.plan.max_services})'
                )

        if inconsistencies:
            self.stdout.write('  ⚠️ Inconsistencias en contadores:')
            for issue in inconsistencies:
                self.stdout.write(f'    • {issue}')
            
            if self.fix_issues:
                self.stdout.write('  🔧 Contadores corregidos automáticamente')
            else:
                self.stdout.write('  💡 Ejecuta con --fix para corregir contadores')
        else:
            self.stdout.write('  ✅ Todos los contadores están correctos')

    def check_system_configuration(self):
        """Verificar configuración del sistema"""
        self.stdout.write('\n⚙️ Verificando configuración del sistema...')
        
        from django.conf import settings
        
        # Verificar JWT settings
        jwt_settings = [
            'JWT_SECRET_KEY',
            'JWT_ALGORITHM', 
            'JWT_ACCESS_TOKEN_LIFETIME',
            'JWT_REFRESH_TOKEN_LIFETIME'
        ]
        
        missing_jwt_settings = []
        for setting in jwt_settings:
            if not hasattr(settings, setting):
                missing_jwt_settings.append(setting)
        
        if missing_jwt_settings:
            self.stdout.write('  ⚠️ Configuraciones JWT faltantes:')
            for setting in missing_jwt_settings:
                self.stdout.write(f'    • {setting}')
        else:
            self.stdout.write('  ✅ Configuraciones JWT correctas')

        # Verificar apps instaladas
        required_apps = ['plans', 'organizations', 'users', 'core']
        missing_apps = []
        
        for app in required_apps:
            if app not in settings.INSTALLED_APPS:
                missing_apps.append(app)
        
        if missing_apps:
            self.stdout.write('  ⚠️ Apps faltantes en INSTALLED_APPS:')
            for app in missing_apps:
                self.stdout.write(f'    • {app}')
        else:
            self.stdout.write('  ✅ Todas las apps requeridas están instaladas')

        # Verificar middlewares
        required_middlewares = [
            'core.middleware.SubscriptionLimitsMiddleware',
            'core.middleware.SubscriptionCounterMiddleware'
        ]
        
        missing_middlewares = []
        for middleware in required_middlewares:
            if middleware not in settings.MIDDLEWARE:
                missing_middlewares.append(middleware)
        
        if missing_middlewares:
            self.stdout.write('  ⚠️ Middlewares faltantes:')
            for middleware in missing_middlewares:
                self.stdout.write(f'    • {middleware}')
        else:
            self.stdout.write('  ✅ Todos los middlewares están configurados')

        # Verificar base de datos
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write('  ✅ Conexión a base de datos exitosa')
        except Exception as e:
            self.stdout.write(f'  ❌ Error de conexión a base de datos: {e}')

    def print_summary_stats(self):
        """Imprimir estadísticas del sistema"""
        self.stdout.write('\n📈 Resumen estadísticas:')
        
        stats = {
            'Planes activos': Plan.objects.filter(is_active=True).count(),
            'Organizaciones': Organization.objects.count(),
            'Usuarios totales': User.objects.count(),
            'Suscripciones activas': OrganizationSubscription.objects.filter(
                status__in=['trial', 'active']
            ).count(),
            'Profesionales': Professional.objects.count(),
            'Servicios': Service.objects.count(),
            'Clientes': Client.objects.count(),
        }
        
        for metric, value in stats.items():
            self.stdout.write(f'  • {metric}: {value}')

    def handle(self, *args, **options):
        self.detailed = options['detailed']
        self.fix_issues = options['fix']
        
        self.stdout.write(
            self.style.SUCCESS('🔍 Verificando salud del sistema ReservaPlus...\n')
        )

        # Ejecutar todas las verificaciones
        self.check_plans()
        self.check_organizations()
        self.check_users()
        self.check_registrations()
        self.check_data_integrity()
        self.check_subscription_limits()
        self.check_system_configuration()

        # Mostrar resumen
        if self.detailed:
            self.print_summary_stats()

        self.stdout.write(
            self.style.SUCCESS('\n✅ Verificación del sistema completada!')
        )
        
        if not self.fix_issues:
            self.stdout.write(
                self.style.WARNING('💡 Tip: Ejecuta con --fix para corregir problemas automáticamente')
            )