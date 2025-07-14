# onboarding/management/commands/setup_onboarding_steps.py

from django.core.management.base import BaseCommand
from django.db import transaction
from onboarding.models import OnboardingStep


class Command(BaseCommand):
    help = 'Setup default onboarding steps for the application'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset all existing steps and create new ones',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('Resetting existing onboarding steps...')
            OnboardingStep.objects.all().delete()

        with transaction.atomic():
            steps_data = [
                {
                    'step_key': 'organization_info',
                    'step_number': 1,
                    'title': 'Información de la Organización',
                    'description': 'Configura la información básica de tu organización',
                    'step_type': 'organization',
                    'validation_type': 'required',
                    'required_fields': ['name', 'industry_template', 'address', 'phone'],
                    'validation_rules': {
                        'name': {'min_length': 2, 'max_length': 100},
                        'phone': {'pattern': r'^\+?[1-9]\d{1,14}$'},
                        'industry_template': {'choices': ['salon', 'clinic', 'spa', 'fitness', 'dental', 'veterinary', 'beauty', 'massage']}
                    },
                    'estimated_duration_minutes': 5,
                    'ui_config': {
                        'icon': 'building',
                        'color': 'blue',
                        'sections': ['basic_info', 'contact_info', 'industry_selection']
                    },
                    'help_text': 'Esta información será visible para tus clientes en el marketplace.',
                    'is_skippable': False,
                    'display_order': 1
                },
                {
                    'step_key': 'owner_account',
                    'step_number': 2,
                    'title': 'Cuenta del Propietario',
                    'description': 'Crea tu cuenta como propietario de la organización',
                    'step_type': 'team',
                    'validation_type': 'required',
                    'required_fields': ['first_name', 'last_name', 'password', 'confirm_password'],
                    'validation_rules': {
                        'first_name': {'min_length': 2, 'max_length': 50},
                        'last_name': {'min_length': 2, 'max_length': 50},
                        'password': {'min_length': 8, 'strength': 'medium'},
                        'confirm_password': {'must_match': 'password'}
                    },
                    'depends_on_steps': ['organization_info'],
                    'estimated_duration_minutes': 3,
                    'ui_config': {
                        'icon': 'user-crown',
                        'color': 'purple',
                        'password_requirements': True
                    },
                    'help_text': 'Como propietario, tendrás acceso completo a todas las funciones.',
                    'is_skippable': False,
                    'display_order': 2
                },
                {
                    'step_key': 'team_members',
                    'step_number': 3,
                    'title': 'Miembros del Equipo',
                    'description': 'Agrega recepcionistas y personal administrativo',
                    'step_type': 'team',
                    'validation_type': 'optional',
                    'required_fields': [],
                    'validation_rules': {
                        'team_members': {
                            'max_count': 10,
                            'each_member': {
                                'first_name': {'min_length': 2},
                                'last_name': {'min_length': 2},
                                'email': {'format': 'email'},
                                'role': {'choices': ['receptionist', 'admin']}
                            }
                        }
                    },
                    'depends_on_steps': ['owner_account'],
                    'estimated_duration_minutes': 7,
                    'ui_config': {
                        'icon': 'users',
                        'color': 'green',
                        'allow_multiple': True,
                        'max_items': 10
                    },
                    'help_text': 'Puedes agregar más miembros después desde la configuración.',
                    'is_skippable': True,
                    'display_order': 3
                },
                {
                    'step_key': 'professionals',
                    'step_number': 4,
                    'title': 'Profesionales',
                    'description': 'Agrega los profesionales que brindan servicios',
                    'step_type': 'professional',
                    'validation_type': 'required',
                    'required_fields': ['professionals'],
                    'validation_rules': {
                        'professionals': {
                            'min_count': 1,
                            'max_count': 50,
                            'each_professional': {
                                'first_name': {'min_length': 2},
                                'last_name': {'min_length': 2},
                                'specialty': {'min_length': 2},
                                'email': {'format': 'email', 'optional': True}
                            }
                        }
                    },
                    'depends_on_steps': ['owner_account'],
                    'estimated_duration_minutes': 10,
                    'ui_config': {
                        'icon': 'user-md',
                        'color': 'indigo',
                        'allow_multiple': True,
                        'specialties_by_industry': True
                    },
                    'help_text': 'Los profesionales podrán tener sus propias agendas y servicios.',
                    'is_skippable': False,
                    'display_order': 4
                },
                {
                    'step_key': 'services',
                    'step_number': 5,
                    'title': 'Servicios',
                    'description': 'Define los servicios que ofrece tu organización',
                    'step_type': 'service',
                    'validation_type': 'required',
                    'required_fields': ['services'],
                    'validation_rules': {
                        'services': {
                            'min_count': 1,
                            'max_count': 100,
                            'each_service': {
                                'name': {'min_length': 2, 'max_length': 100},
                                'duration_minutes': {'min': 15, 'max': 480},
                                'price': {'min': 0, 'max': 999999},
                                'category': {'min_length': 2}
                            }
                        }
                    },
                    'depends_on_steps': ['professionals'],
                    'estimated_duration_minutes': 15,
                    'ui_config': {
                        'icon': 'scissors',
                        'color': 'pink',
                        'allow_multiple': True,
                        'categories_by_industry': True,
                        'duration_presets': [15, 30, 45, 60, 90, 120]
                    },
                    'help_text': 'Los servicios aparecerán en tu perfil público para reservas.',
                    'is_skippable': False,
                    'display_order': 5
                },
                {
                    'step_key': 'billing_setup',
                    'step_number': 6,
                    'title': 'Configuración de Facturación',
                    'description': 'Configura tu suscripción y método de pago',
                    'step_type': 'billing',
                    'validation_type': 'required',
                    'required_fields': ['billing_cycle'],
                    'validation_rules': {
                        'billing_cycle': {'choices': ['monthly', 'yearly']},
                        'payment_method': {'choices': ['card', 'bank_transfer'], 'optional': True}
                    },
                    'depends_on_steps': ['services'],
                    'estimated_duration_minutes': 5,
                    'ui_config': {
                        'icon': 'credit-card',
                        'color': 'yellow',
                        'show_plan_details': True,
                        'show_trial_info': True
                    },
                    'help_text': 'Tendrás un período de prueba gratuito antes del primer cargo.',
                    'is_skippable': False,
                    'display_order': 6
                },
                {
                    'step_key': 'finalization',
                    'step_number': 7,
                    'title': 'Finalización',
                    'description': 'Revisa y confirma toda la información',
                    'step_type': 'finalization',
                    'validation_type': 'required',
                    'required_fields': ['terms_accepted', 'privacy_accepted'],
                    'validation_rules': {
                        'terms_accepted': {'must_be': True},
                        'privacy_accepted': {'must_be': True}
                    },
                    'depends_on_steps': ['billing_setup'],
                    'estimated_duration_minutes': 3,
                    'ui_config': {
                        'icon': 'check-circle',
                        'color': 'emerald',
                        'show_summary': True,
                        'show_next_steps': True
                    },
                    'help_text': 'Último paso para activar tu cuenta y comenzar a recibir reservas.',
                    'is_skippable': False,
                    'display_order': 7
                }
            ]

            created_count = 0
            updated_count = 0

            for step_data in steps_data:
                step, created = OnboardingStep.objects.update_or_create(
                    step_key=step_data['step_key'],
                    defaults=step_data
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'[+] Created step: {step.step_key} - {step.title}')
                    )
                else:
                    updated_count += 1
                    self.stdout.write(
                        self.style.WARNING(f'[*] Updated step: {step.step_key} - {step.title}')
                    )

        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'Successfully processed {len(steps_data)} onboarding steps:'))
        self.stdout.write(f'  - Created: {created_count}')
        self.stdout.write(f'  - Updated: {updated_count}')
        self.stdout.write('='*60)
        
        # Verification
        total_steps = OnboardingStep.objects.filter(is_active=True).count()
        self.stdout.write(f'Total active onboarding steps: {total_steps}')
        
        if total_steps != len(steps_data):
            self.stdout.write(
                self.style.WARNING(
                    f'Warning: Expected {len(steps_data)} steps but found {total_steps} active steps'
                )
            )