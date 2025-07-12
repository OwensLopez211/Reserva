# tests/test_e2e_flow.py

from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from plans.models import Plan, UserRegistration, OrganizationSubscription
from organizations.models import Organization, Professional, Service, Client

User = get_user_model()


class EndToEndOnboardingFlowTest(TransactionTestCase):
    """
    Test end-to-end del flujo completo de onboarding
    Simula el journey del usuario desde la selección del plan hasta tener su sistema configurado
    """
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear plan para testing
        self.plan = Plan.objects.create(
            name='Plan E2E Test',
            slug='e2e-test',
            price_monthly=29990,
            max_professionals=3,
            max_services=10,
            max_monthly_appointments=500,
            max_clients=1000,
            is_active=True
        )
        
        self.user_email = 'e2etest@example.com'
        self.user_data = {
            'first_name': 'Test',
            'last_name': 'User',
            'organization_name': 'Test Organization'
        }
    
    def test_complete_onboarding_flow(self):
        """
        Test del flujo completo:
        1. Obtener planes disponibles
        2. Signup con selección de plan
        3. Verificar registro temporal
        4. Completar onboarding
        5. Verificar que todo esté creado correctamente
        6. Login y verificar acceso
        7. Probar límites del plan
        """
        
        # PASO 1: Obtener planes disponibles
        plans_response = self.client.get('/api/plans/')
        self.assertEqual(plans_response.status_code, status.HTTP_200_OK)
        self.assertGreater(len(plans_response.data), 0)
        
        # PASO 2: Signup con selección de plan
        signup_data = {
            'email': self.user_email,
            'plan_id': str(self.plan.id),
            'user_data': self.user_data
        }
        
        signup_response = self.client.post('/api/signup/', signup_data, format='json')
        self.assertEqual(signup_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('registration_token', signup_response.data)
        
        registration_token = signup_response.data['registration_token']
        
        # PASO 3: Verificar estado del registro temporal
        registration_status_response = self.client.get(f'/api/registration/{registration_token}/')
        self.assertEqual(registration_status_response.status_code, status.HTTP_200_OK)
        self.assertEqual(registration_status_response.data['email'], self.user_email)
        
        # PASO 4: Completar onboarding
        onboarding_data = {
            'registration_token': registration_token,
            'organization': {
                'name': 'Mi Salón de Prueba',
                'industry_template': 'salon',
                'email': 'info@misalonprueba.com',
                'phone': '+56912345678',
                'address': 'Calle Falsa 123',
                'city': 'Santiago',
                'country': 'Chile'
            },
            'professionals': [
                {
                    'name': 'Ana Estilista',
                    'email': 'ana@misalonprueba.com',
                    'phone': '+56987654321',
                    'specialty': 'Colorista',
                    'color_code': '#FF6B6B',
                    'accepts_walk_ins': True
                },
                {
                    'name': 'Carlos Barbero',
                    'email': 'carlos@misalonprueba.com',
                    'phone': '+56987654322',
                    'specialty': 'Barbero',
                    'color_code': '#4ECDC4',
                    'accepts_walk_ins': True
                }
            ],
            'services': [
                {
                    'name': 'Corte de Cabello',
                    'description': 'Corte profesional',
                    'category': 'Cortes',
                    'duration_minutes': 45,
                    'price': 15000,
                    'buffer_time_after': 10,
                    'is_active': True,
                    'requires_preparation': False
                },
                {
                    'name': 'Tinte',
                    'description': 'Coloración completa',
                    'category': 'Color',
                    'duration_minutes': 90,
                    'price': 35000,
                    'buffer_time_before': 5,
                    'buffer_time_after': 15,
                    'is_active': True,
                    'requires_preparation': True
                }
            ]
        }
        
        onboarding_response = self.client.post('/api/onboarding/complete/', onboarding_data, format='json')
        self.assertEqual(onboarding_response.status_code, status.HTTP_201_CREATED)
        
        # PASO 5: Verificar que todo se creó correctamente
        # Usuario
        user = User.objects.get(email=self.user_email)
        self.assertEqual(user.first_name, self.user_data['first_name'])
        self.assertEqual(user.role, 'owner')
        self.assertIsNotNone(user.organization)
        
        # Organización
        organization = user.organization
        self.assertEqual(organization.name, 'Mi Salón de Prueba')
        self.assertEqual(organization.industry_template, 'salon')
        self.assertTrue(organization.onboarding_completed)
        
        # Suscripción
        subscription = OrganizationSubscription.objects.get(organization=organization)
        self.assertEqual(subscription.plan, self.plan)
        self.assertEqual(subscription.status, 'trial')
        self.assertEqual(subscription.current_professionals_count, 2)
        self.assertEqual(subscription.current_services_count, 2)
        
        # Profesionales
        professionals = Professional.objects.filter(organization=organization)
        self.assertEqual(professionals.count(), 2)
        self.assertTrue(professionals.filter(name='Ana Estilista').exists())
        self.assertTrue(professionals.filter(name='Carlos Barbero').exists())
        
        # Servicios
        services = Service.objects.filter(organization=organization)
        self.assertEqual(services.count(), 2)
        self.assertTrue(services.filter(name='Corte de Cabello').exists())
        self.assertTrue(services.filter(name='Tinte').exists())
        
        # Verificar que los servicios tienen profesionales asignados
        for service in services:
            self.assertEqual(service.professionals.count(), 2)
        
        # PASO 6: Login y verificar acceso
        # El usuario ya debe existir, probemos hacer login
        login_data = {
            'username': self.user_email,  # Usando email como username
            'password': 'temp_password_from_onboarding'  # Necesitaríamos generar esto en onboarding
        }
        
        # Para este test, forzamos la autenticación
        self.client.force_authenticate(user=user)
        
        # Verificar acceso a mi organización
        my_org_response = self.client.get('/api/organizations/me/')
        self.assertEqual(my_org_response.status_code, status.HTTP_200_OK)
        self.assertEqual(my_org_response.data['name'], 'Mi Salón de Prueba')
        self.assertIn('subscription', my_org_response.data)
        
        # Verificar acceso a profesionales
        professionals_response = self.client.get('/api/organizations/professionals/')
        self.assertEqual(professionals_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(professionals_response.data['results']), 2)
        
        # Verificar acceso a servicios
        services_response = self.client.get('/api/organizations/services/')
        self.assertEqual(services_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(services_response.data['results']), 2)
        
        # PASO 7: Probar límites del plan
        # Intentar agregar un profesional más (dentro del límite)
        new_professional_data = {
            'name': 'Luis Manicurista',
            'email': 'luis@misalonprueba.com',
            'specialty': 'Manicure',
            'color_code': '#95E1D3'
        }
        
        add_prof_response = self.client.post('/api/organizations/professionals/', new_professional_data, format='json')
        self.assertEqual(add_prof_response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que el contador se actualizó
        subscription.refresh_from_db()
        self.assertEqual(subscription.current_professionals_count, 3)
        
        # Intentar agregar otro profesional (excedería el límite)
        extra_professional_data = {
            'name': 'Extra Professional',
            'email': 'extra@misalonprueba.com',
            'specialty': 'Extra',
            'color_code': '#FFD93D'
        }
        
        extra_prof_response = self.client.post('/api/organizations/professionals/', extra_professional_data, format='json')
        self.assertEqual(extra_prof_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('límite', extra_prof_response.data['error'].lower())
        
        # Verificar información de límites
        limits_response = self.client.get('/api/organizations/professionals/limits_info/')
        self.assertEqual(limits_response.status_code, status.HTTP_200_OK)
        self.assertEqual(limits_response.data['current_count'], 3)
        self.assertEqual(limits_response.data['max_allowed'], 3)
        self.assertFalse(limits_response.data['can_add_more'])
    
    def test_onboarding_validation_errors(self):
        """
        Test de validaciones durante el onboarding
        """
        # Crear registro temporal
        signup_data = {
            'email': 'validation@test.com',
            'plan_id': str(self.plan.id),
            'user_data': self.user_data
        }
        
        signup_response = self.client.post('/api/signup/', signup_data, format='json')
        registration_token = signup_response.data['registration_token']
        
        # Test: Organización sin datos requeridos
        invalid_onboarding_data = {
            'registration_token': registration_token,
            'organization': {
                'name': '',  # Nombre vacío
                'industry_template': 'salon',
                'email': '',  # Email vacío
                'phone': ''   # Teléfono vacío
            },
            'professionals': [],
            'services': []
        }
        
        response = self.client.post('/api/onboarding/complete/', invalid_onboarding_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test: Sin profesionales
        no_professionals_data = {
            'registration_token': registration_token,
            'organization': {
                'name': 'Test Org',
                'industry_template': 'salon',
                'email': 'test@org.com',
                'phone': '+56912345678'
            },
            'professionals': [],  # Lista vacía
            'services': [
                {
                    'name': 'Test Service',
                    'duration_minutes': 30,
                    'price': 10000
                }
            ]
        }
        
        response = self.client.post('/api/onboarding/complete/', no_professionals_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test: Sin servicios
        no_services_data = {
            'registration_token': registration_token,
            'organization': {
                'name': 'Test Org',
                'industry_template': 'salon',
                'email': 'test@org.com',
                'phone': '+56912345678'
            },
            'professionals': [
                {
                    'name': 'Test Professional',
                    'email': 'prof@test.com'
                }
            ],
            'services': []  # Lista vacía
        }
        
        response = self.client.post('/api/onboarding/complete/', no_services_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_registration_token_expiration(self):
        """
        Test de expiración de tokens de registro
        """
        # Crear registro temporal expirado
        expired_registration = UserRegistration.objects.create(
            email='expired@test.com',
            temp_token='expired-token-123',
            selected_plan=self.plan,
            expires_at=timezone.now() - timedelta(hours=1)  # Expirado hace 1 hora
        )
        
        onboarding_data = {
            'registration_token': 'expired-token-123',
            'organization': {
                'name': 'Test Org',
                'industry_template': 'salon',
                'email': 'test@org.com',
                'phone': '+56912345678'
            },
            'professionals': [
                {
                    'name': 'Test Professional',
                    'email': 'prof@test.com'
                }
            ],
            'services': [
                {
                    'name': 'Test Service',
                    'duration_minutes': 30,
                    'price': 10000
                }
            ]
        }
        
        response = self.client.post('/api/onboarding/complete/', onboarding_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('expirado', str(response.data).lower())


class MultiTenantIsolationTest(APITestCase):
    """
    Test de aislamiento multi-tenant
    Verificar que los datos de diferentes organizaciones estén correctamente aislados
    """
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear plan
        self.plan = Plan.objects.create(
            name='Plan Test',
            price_monthly=29990,
            max_professionals=5,
            max_services=20,
            max_monthly_appointments=500,
            max_clients=1000
        )
        
        # Crear dos organizaciones
        self.org1 = Organization.objects.create(
            name='Organización 1',
            industry_template='salon',
            email='org1@test.com',
            phone='+56911111111',
            onboarding_completed=True
        )
        
        self.org2 = Organization.objects.create(
            name='Organización 2',
            industry_template='clinic',
            email='org2@test.com',
            phone='+56922222222',
            onboarding_completed=True
        )
        
        # Crear usuarios para cada organización
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@test.com',
            password='testpass123',
            organization=self.org1,
            role='owner'
        )
        
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@test.com',
            password='testpass123',
            organization=self.org2,
            role='owner'
        )
        
        # Crear suscripciones
        OrganizationSubscription.objects.create(
            organization=self.org1,
            plan=self.plan,
            status='active',
            current_period_start=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=30)
        )
        
        OrganizationSubscription.objects.create(
            organization=self.org2,
            plan=self.plan,
            status='active',
            current_period_start=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=30)
        )
        
        # Crear datos para cada organización
        self.create_org_data()
    
    def create_org_data(self):
        """Crear datos específicos para cada organización"""
        # Datos para organización 1
        self.prof1_org1 = Professional.objects.create(
            organization=self.org1,
            name='Profesional 1 Org1',
            email='prof1@org1.com',
            specialty='Estilista'
        )
        
        self.service1_org1 = Service.objects.create(
            organization=self.org1,
            name='Servicio 1 Org1',
            duration_minutes=30,
            price=15000,
            category='Cabello'
        )
        
        self.client1_org1 = Client.objects.create(
            organization=self.org1,
            first_name='Cliente 1',
            last_name='Org1',
            email='cliente1@org1.com',
            phone='+56911111111'
        )
        
        # Datos para organización 2
        self.prof1_org2 = Professional.objects.create(
            organization=self.org2,
            name='Profesional 1 Org2',
            email='prof1@org2.com',
            specialty='Doctor'
        )
        
        self.service1_org2 = Service.objects.create(
            organization=self.org2,
            name='Servicio 1 Org2',
            duration_minutes=45,
            price=25000,
            category='Consultas'
        )
        
        self.client1_org2 = Client.objects.create(
            organization=self.org2,
            first_name='Cliente 1',
            last_name='Org2',
            email='cliente1@org2.com',
            phone='+56922222222'
        )
    
    def test_professional_isolation(self):
        """Test que los profesionales estén aislados por organización"""
        # Usuario 1 debe ver solo profesionales de su organización
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/organizations/professionals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Profesional 1 Org1')
        
        # Usuario 2 debe ver solo profesionales de su organización
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/organizations/professionals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Profesional 1 Org2')
    
    def test_service_isolation(self):
        """Test que los servicios estén aislados por organización"""
        # Usuario 1
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/organizations/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Servicio 1 Org1')
        
        # Usuario 2
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/organizations/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Servicio 1 Org2')
    
    def test_client_isolation(self):
        """Test que los clientes estén aislados por organización"""
        # Usuario 1
        self.client.force_authenticate(user=self.user1)
        response = self.client.get('/api/organizations/clients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['email'], 'cliente1@org1.com')
        
        # Usuario 2
        self.client.force_authenticate(user=self.user2)
        response = self.client.get('/api/organizations/clients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['email'], 'cliente1@org2.com')
    
    def test_cross_organization_access_denied(self):
        """Test que no se pueda acceder a datos de otras organizaciones"""
        self.client.force_authenticate(user=self.user1)
        
        # Intentar acceder a profesional de otra organización
        response = self.client.get(f'/api/organizations/professionals/{self.prof1_org2.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Intentar acceder a servicio de otra organización
        response = self.client.get(f'/api/organizations/services/{self.service1_org2.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Intentar acceder a cliente de otra organización
        response = self.client.get(f'/api/organizations/clients/{self.client1_org2.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)