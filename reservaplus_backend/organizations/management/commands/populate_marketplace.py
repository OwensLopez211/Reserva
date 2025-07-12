from django.core.management.base import BaseCommand
from django.utils import timezone
from organizations.models import Organization, Professional, Service, Client
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Poblar el marketplace con datos de ejemplo'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Comenzando a poblar el marketplace...'))
        
        # Datos de ejemplo
        organizations_data = [
            {
                'name': 'Salón Bella Vista',
                'description': 'Salón de belleza especializado en cortes modernos y tratamientos capilares premium.',
                'industry_template': 'salon',
                'phone': '+56 9 8765 4321',
                'website': 'https://salonbellavista.cl',
                'address': 'Av. Providencia 1234, Providencia',
                'city': 'Santiago',
                'country': 'Chile',
                'logo': 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=200&h=200&fit=crop',
                'cover_image': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop',
                'gallery_images': [
                    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop'
                ],
                'is_featured': True,
                'rating': Decimal('4.8'),
                'total_reviews': 45,
                'onboarding_completed': True,
                'professionals': [
                    {'name': 'María González', 'specialty': 'Estilista Senior', 'bio': 'Especialista en cortes y coloración con 10 años de experiencia.', 'email': 'maria.gonzalez@bellavista.com'},
                    {'name': 'Ana Rodríguez', 'specialty': 'Colorista', 'bio': 'Experta en técnicas de coloración avanzadas.', 'email': 'ana.rodriguez@bellavista.com'}
                ],
                'services': [
                    {'name': 'Corte de Cabello', 'description': 'Corte personalizado según tu estilo', 'category': 'Cortes', 'duration_minutes': 45, 'price': Decimal('25000')},
                    {'name': 'Coloración Completa', 'description': 'Cambio de color completo', 'category': 'Color', 'duration_minutes': 120, 'price': Decimal('60000')},
                    {'name': 'Tratamiento Capilar', 'description': 'Tratamiento nutritivo para el cabello', 'category': 'Tratamientos', 'duration_minutes': 60, 'price': Decimal('35000')}
                ]
            },
            {
                'name': 'Clínica Dental SmileCenter',
                'description': 'Clínica dental moderna con tecnología de vanguardia para toda la familia.',
                'industry_template': 'dental',
                'phone': '+56 2 2345 6789',
                'website': 'https://smilecenter.cl',
                'address': 'Av. Las Condes 5678, Las Condes',
                'city': 'Santiago',
                'country': 'Chile',
                'logo': 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=200&h=200&fit=crop',
                'cover_image': 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&h=400&fit=crop',
                'gallery_images': [
                    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop'
                ],
                'is_featured': False,
                'rating': Decimal('4.9'),
                'total_reviews': 78,
                'onboarding_completed': True,
                'professionals': [
                    {'name': 'Dr. Carlos Mendoza', 'specialty': 'Dentista General', 'bio': 'Odontólogo con 15 años de experiencia en odontología general.', 'email': 'carlos.mendoza@smilecenter.cl'},
                    {'name': 'Dra. Patricia Silva', 'specialty': 'Ortodoncista', 'bio': 'Especialista en ortodoncia y alineadores invisibles.', 'email': 'patricia.silva@smilecenter.cl'}
                ],
                'services': [
                    {'name': 'Consulta General', 'description': 'Consulta y revisión dental completa', 'category': 'Consultas', 'duration_minutes': 30, 'price': Decimal('30000')},
                    {'name': 'Limpieza Dental', 'description': 'Limpieza profunda y pulido', 'category': 'Limpieza', 'duration_minutes': 45, 'price': Decimal('45000')},
                    {'name': 'Blanqueamiento', 'description': 'Blanqueamiento dental profesional', 'category': 'Estética', 'duration_minutes': 90, 'price': Decimal('120000')}
                ]
            },
            {
                'name': 'FitLife Personal Training',
                'description': 'Entrenamiento personalizado para alcanzar tus objetivos de fitness y bienestar.',
                'industry_template': 'fitness',
                'phone': '+56 9 1234 5678',
                'website': 'https://fitlifept.cl',
                'address': 'Calle Fitness 789, Ñuñoa',
                'city': 'Santiago',
                'country': 'Chile',
                'logo': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
                'cover_image': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop',
                'gallery_images': [
                    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1566911064409-c3c2fb9f4b86?w=600&h=400&fit=crop'
                ],
                'is_featured': True,
                'rating': Decimal('4.7'),
                'total_reviews': 32,
                'onboarding_completed': True,
                'professionals': [
                    {'name': 'Roberto Fitness', 'specialty': 'Entrenador Personal', 'bio': 'Certificado en entrenamiento funcional y nutrición deportiva.', 'email': 'roberto.fitness@fitlifept.cl'},
                    {'name': 'Camila Strong', 'specialty': 'Especialista en Yoga', 'bio': 'Instructora certificada en Vinyasa y Hatha Yoga.', 'email': 'camila.strong@fitlifept.cl'}
                ],
                'services': [
                    {'name': 'Sesión Personal', 'description': 'Entrenamiento personalizado 1:1', 'category': 'Entrenamiento', 'duration_minutes': 60, 'price': Decimal('40000')},
                    {'name': 'Clase de Yoga', 'description': 'Clase de yoga grupal', 'category': 'Yoga', 'duration_minutes': 75, 'price': Decimal('15000')},
                    {'name': 'Evaluación Física', 'description': 'Evaluación completa y plan de entrenamiento', 'category': 'Evaluación', 'duration_minutes': 45, 'price': Decimal('25000')}
                ]
            },
            {
                'name': 'Spa Relax & Wellness',
                'description': 'Centro de bienestar y relajación con tratamientos holísticos para cuerpo y mente.',
                'industry_template': 'spa',
                'phone': '+56 2 3456 7890',
                'website': 'https://sparelax.cl',
                'address': 'Av. Bienestar 456, Vitacura',
                'city': 'Santiago',
                'country': 'Chile',
                'logo': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
                'cover_image': 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop',
                'gallery_images': [
                    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
                    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop'
                ],
                'is_featured': False,
                'rating': Decimal('4.6'),
                'total_reviews': 28,
                'onboarding_completed': True,
                'professionals': [
                    {'name': 'Sofía Wellness', 'specialty': 'Masajista Terapéutica', 'bio': 'Especialista en masajes relajantes y terapéuticos.', 'email': 'sofia.wellness@sparelax.cl'},
                    {'name': 'Elena Zen', 'specialty': 'Esteticista', 'bio': 'Especialista en tratamientos faciales y corporales.', 'email': 'elena.zen@sparelax.cl'}
                ],
                'services': [
                    {'name': 'Masaje Relajante', 'description': 'Masaje corporal completo para relajación', 'category': 'Masajes', 'duration_minutes': 60, 'price': Decimal('50000')},
                    {'name': 'Facial Hidratante', 'description': 'Tratamiento facial profundo e hidratante', 'category': 'Faciales', 'duration_minutes': 75, 'price': Decimal('65000')},
                    {'name': 'Aromaterapia', 'description': 'Sesión de aromaterapia para el bienestar', 'category': 'Terapias', 'duration_minutes': 45, 'price': Decimal('35000')}
                ]
            }
        ]

        # Crear organizaciones
        for org_data in organizations_data:
            professionals_data = org_data.pop('professionals')
            services_data = org_data.pop('services')
            
            organization, created = Organization.objects.get_or_create(
                name=org_data['name'],
                defaults=org_data
            )
            
            if created:
                self.stdout.write(f'✓ Creada organización: {organization.name}')
                
                # Crear profesionales
                for prof_data in professionals_data:
                    professional = Professional.objects.create(
                        organization=organization,
                        **prof_data
                    )
                    self.stdout.write(f'  ✓ Creado profesional: {professional.name}')
                
                # Crear servicios
                for service_data in services_data:
                    service = Service.objects.create(
                        organization=organization,
                        **service_data
                    )
                    self.stdout.write(f'  ✓ Creado servicio: {service.name}')
                
                # Crear algunos clientes de ejemplo
                clients_data = [
                    {'first_name': 'Juan', 'last_name': 'Pérez', 'email': f'juan.perez@{organization.slug}.com', 'phone': '+56 9 1111 1111'},
                    {'first_name': 'María', 'last_name': 'López', 'email': f'maria.lopez@{organization.slug}.com', 'phone': '+56 9 2222 2222'},
                    {'first_name': 'Carlos', 'last_name': 'García', 'email': f'carlos.garcia@{organization.slug}.com', 'phone': '+56 9 3333 3333'},
                ]
                
                for client_data in clients_data:
                    client = Client.objects.create(
                        organization=organization,
                        **client_data
                    )
                    self.stdout.write(f'  ✓ Creado cliente: {client.full_name}')
            else:
                self.stdout.write(f'⚠ Organización ya existe: {organization.name}')
        
        self.stdout.write(self.style.SUCCESS('¡Marketplace poblado exitosamente!'))
        self.stdout.write(self.style.SUCCESS(f'Total de organizaciones: {Organization.objects.filter(onboarding_completed=True).count()}'))
        self.stdout.write(self.style.SUCCESS(f'Total de profesionales: {Professional.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Total de servicios: {Service.objects.count()}'))
        self.stdout.write(self.style.SUCCESS(f'Total de clientes: {Client.objects.count()}')) 