# plans/management/commands/populate_dev_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from plans.models import Plan, OrganizationSubscription
from organizations.models import Organization, Professional, Service, Client

User = get_user_model()


class Command(BaseCommand):
    help = 'Poblar base de datos con datos de desarrollo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Resetear datos existentes antes de poblar',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('Reseteando datos existentes...')
            self.reset_data()

        self.stdout.write('Poblando datos de desarrollo...')

        # 1. Crear planes si no existen
        self.create_plans()

        # 2. Crear organizaciones de ejemplo
        self.create_demo_organizations()

        self.stdout.write(
            self.style.SUCCESS('✅ Datos de desarrollo creados exitosamente!')
        )

    def reset_data(self):
        """Resetear datos de desarrollo"""
        # Eliminar organizaciones demo (esto eliminará usuarios, profesionales, etc. por cascade)
        Organization.objects.filter(
            name__in=['Salón Demo', 'Clínica Demo', 'Spa Demo']
        ).delete()
        
        self.stdout.write('→ Datos existentes eliminados')

    def create_plans(self):
        """Crear planes por defecto"""
        plans_data = [
            {
                'name': 'Básico',
                'slug': 'basico',
                'description': 'Todo lo que necesitas para profesionalizar tu negocio',
                'price_monthly': 29990,
                'price_yearly': 299990,
                'original_price': 59990,
                'max_professionals': 3,
                'max_services': 20,
                'max_monthly_appointments': 500,
                'max_clients': 1000,
                'is_popular': True,
                'color_scheme': 'emerald',
                'discount_text': '-17%',
                'features': [
                    '1 Usuario Admin',
                    '1 Recepcionista',
                    '3 Profesionales',
                    '500 citas por mes',
                    '5 GB de almacenamiento',
                    'Calendario inteligente',
                    'Notificaciones automáticas',
                    'Soporte personalizado'
                ]
            },
            {
                'name': 'Profesional',
                'slug': 'profesional',
                'description': 'Para equipos que buscan crecer y optimizar',
                'price_monthly': 49990,
                'price_yearly': 499990,
                'max_professionals': 10,
                'max_services': 100,
                'max_monthly_appointments': 2000,
                'max_clients': 5000,
                'is_coming_soon': True,
                'color_scheme': 'blue',
                'supports_integrations': True,
                'supports_advanced_reports': True,
                'features': [
                    'Hasta 10 profesionales',
                    '2000 citas mensuales',
                    'Reportes avanzados',
                    'Múltiples ubicaciones',
                    'Soporte prioritario'
                ]
            }
        ]

        for plan_data in plans_data:
            plan, created = Plan.objects.get_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(f'  ✓ Plan "{plan.name}" creado')
            else:
                self.stdout.write(f'  → Plan "{plan.name}" ya existe')

    def create_demo_organizations(self):
        """Crear organizaciones demo con datos completos"""
        plan_basico = Plan.objects.get(slug='basico')

        demo_orgs = [
            {
                'name': 'Salón Demo',
                'industry_template': 'salon',
                'email': 'info@salondemo.com',
                'phone': '+56912345678',
                'address': 'Av. Providencia 1234',
                'city': 'Santiago',
                'country': 'Chile',
                'user_data': {
                    'username': 'salon_demo',
                    'email': 'salon@demo.com',
                    'password': 'demo123',
                    'first_name': 'María',
                    'last_name': 'González'
                },
                'professionals': [
                    {
                        'name': 'Ana Estilista',
                        'email': 'ana@salondemo.com',
                        'phone': '+56987654321',
                        'specialty': 'Colorista Senior',
                        'color_code': '#FF6B6B'
                    },
                    {
                        'name': 'Carlos Barbero',
                        'email': 'carlos@salondemo.com',
                        'phone': '+56987654322',
                        'specialty': 'Barbero Especialista',
                        'color_code': '#4ECDC4'
                    }
                ],
                'services': [
                    {
                        'name': 'Corte de Cabello Mujer',
                        'category': 'Cortes',
                        'duration_minutes': 45,
                        'price': 18000,
                        'buffer_time_after': 15
                    },
                    {
                        'name': 'Corte de Cabello Hombre',
                        'category': 'Cortes',
                        'duration_minutes': 30,
                        'price': 12000,
                        'buffer_time_after': 10
                    },
                    {
                        'name': 'Tinte Completo',
                        'category': 'Color',
                        'duration_minutes': 120,
                        'price': 45000,
                        'buffer_time_before': 10,
                        'buffer_time_after': 20,
                        'requires_preparation': True
                    },
                    {
                        'name': 'Peinado de Novia',
                        'category': 'Eventos',
                        'duration_minutes': 90,
                        'price': 35000,
                        'buffer_time_before': 15,
                        'buffer_time_after': 15
                    }
                ],
                'clients': [
                    {
                        'first_name': 'Patricia',
                        'last_name': 'Silva',
                        'email': 'patricia@example.com',
                        'phone': '+56987111111'
                    },
                    {
                        'first_name': 'Roberto',
                        'last_name': 'Morales',
                        'email': 'roberto@example.com',
                        'phone': '+56987222222'
                    }
                ]
            },
            {
                'name': 'Clínica Demo',
                'industry_template': 'clinic',
                'email': 'info@clinicademo.com',
                'phone': '+56922345678',
                'address': 'Las Condes 5678',
                'city': 'Santiago',
                'country': 'Chile',
                'user_data': {
                    'username': 'clinic_demo',
                    'email': 'clinic@demo.com',
                    'password': 'demo123',
                    'first_name': 'Dr. Carlos',
                    'last_name': 'Mendoza'
                },
                'professionals': [
                    {
                        'name': 'Dr. Elena Rodríguez',
                        'email': 'elena@clinicademo.com',
                        'phone': '+56987654323',
                        'specialty': 'Medicina General',
                        'color_code': '#45B7D1'
                    }
                ],
                'services': [
                    {
                        'name': 'Consulta General',
                        'category': 'Consultas',
                        'duration_minutes': 30,
                        'price': 25000,
                        'buffer_time_after': 10
                    },
                    {
                        'name': 'Control Médico',
                        'category': 'Controles',
                        'duration_minutes': 20,
                        'price': 15000,
                        'buffer_time_after': 5
                    }
                ],
                'clients': [
                    {
                        'first_name': 'Juan',
                        'last_name': 'Pérez',
                        'email': 'juan@example.com',
                        'phone': '+56987333333'
                    }
                ]
            }
        ]

        for org_data in demo_orgs:
            # Crear organización
            organization, created = Organization.objects.get_or_create(
                name=org_data['name'],
                defaults={
                    'industry_template': org_data['industry_template'],
                    'email': org_data['email'],
                    'phone': org_data['phone'],
                    'address': org_data['address'],
                    'city': org_data['city'],
                    'country': org_data['country'],
                    'onboarding_completed': True
                }
            )

            if created:
                self.stdout.write(f'  ✓ Organización "{organization.name}" creada')

                # Crear usuario owner
                user_data = org_data['user_data']
                user, user_created = User.objects.get_or_create(
                    username=user_data['username'],
                    defaults={
                        'email': user_data['email'],
                        'first_name': user_data['first_name'],
                        'last_name': user_data['last_name'],
                        'organization': organization,
                        'role': 'owner'
                    }
                )
                if user_created:
                    user.set_password(user_data['password'])
                    user.save()
                    self.stdout.write(f'    ✓ Usuario owner "{user.username}" creado')

                # Crear suscripción
                subscription = OrganizationSubscription.objects.create(
                    organization=organization,
                    plan=plan_basico,
                    status='trial',
                    trial_start=timezone.now(),
                    trial_end=timezone.now() + timedelta(days=14),
                    current_period_start=timezone.now(),
                    current_period_end=timezone.now() + timedelta(days=14)
                )

                # Crear profesionales
                professionals = []
                for prof_data in org_data['professionals']:
                    professional = Professional.objects.create(
                        organization=organization,
                        **prof_data
                    )
                    professionals.append(professional)
                    subscription.increment_professionals_count()
                    self.stdout.write(f'    ✓ Profesional "{professional.name}" creado')

                # Crear servicios
                for serv_data in org_data['services']:
                    service = Service.objects.create(
                        organization=organization,
                        **serv_data
                    )
                    service.professionals.set(professionals)
                    subscription.increment_services_count()
                    self.stdout.write(f'    ✓ Servicio "{service.name}" creado')

                # Crear clientes
                for client_data in org_data['clients']:
                    client = Client.objects.create(
                        organization=organization,
                        **client_data
                    )
                    subscription.current_clients_count += 1
                    subscription.save(update_fields=['current_clients_count'])
                    self.stdout.write(f'    ✓ Cliente "{client.full_name}" creado')

            else:
                self.stdout.write(f'  → Organización "{organization.name}" ya existe')