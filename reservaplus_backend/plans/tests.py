# plans/tests.py

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model

from .models import Plan, UserRegistration, OrganizationSubscription
from organizations.models import Organization, Professional, Service, Client

User = get_user_model()


class PlanModelTests(TestCase):
    """Pruebas para el modelo Plan"""
    
    def setUp(self):
        self.plan = Plan.objects.create(
            name='Plan Test',
            price_monthly=29990,
            max_professionals=3,
            max_services=20,
            max_monthly_appointments=500,
            max_clients=1000
        )
    
    def test_plan_creation(self):
        """Probar creación de plan"""
        self.assertEqual(self.plan.name, 'Plan Test')
        self.assertEqual(self.plan.slug, 'plan-test')
        self.assertTrue(self.plan.is_active)
    
    def test_plan_limits_validation(self):
        """Probar validaciones de límites"""
        self.assertTrue(self.plan.can_create_professional(2))
        self.assertFalse(self.plan.can_create_professional(3))
        
        self.assertTrue(self.plan.can_create_service(19))
        self.assertFalse(self.plan.can_create_service(20))


class UserRegistrationModelTests(TestCase):
    """Pruebas para el modelo UserRegistration"""
    
    def setUp(self):
        self.plan = Plan.objects.create(
            name='Plan Test',
            price_monthly=29990,
            max_professionals=3,
            max_services=20,
            max_monthly_appointments=500,
            max_clients=1000
        )
        
        self.registration = UserRegistration.objects.create(
            email='test@example.com',
            temp_token='test-token-123',
            selected_plan=self.plan,
            expires_at=timezone.now() + timedelta(hours=24)
        )
    
    def test_registration_creation(self):
        """Probar creación de registro temporal"""
        self.assertEqual(self.registration.email, 'test@example.com')
        self.assertEqual(self.registration.selected_plan, self.plan)
        self.assertTrue(self.registration.is_valid)
    
    def test_registration_expiration(self):
        """Probar expiración de registro"""
        self.registration.expires_at = timezone.now() - timedelta(hours=1)
        self.registration.save()
        self.assertFalse(self.registration.is_valid)


class SignupAPITests(APITestCase):
    """Pruebas para el API de signup"""
    
    def setUp(self):
        self.client = APIClient()
        self.plan = Plan.objects.create(
            name='Plan Básico',
            slug='basico',
            price_monthly=29990,
            max_professionals=3,
            max_services=20,
            max_monthly_appointments=500,
            max_clients=1000,
            is_active=True
        )
        
        self.signup_url = '/api/signup/'
    
    def test_signup_success(self):
        """Probar signup exitoso"""
        data = {
            'email': 'nuevo@example.com',
            'plan_id': str(self.plan.id),
            'user_data': {
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'organization_name': 'Mi Negocio'
            }
        }
        
        response = self.client.post(self.signup_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('registration_token', response.data)
        self.assertIn('expires_at', response.data)
        self.assertEqual(response.data['selected_plan']['name'], 'Plan Básico')
        
        # Verificar que se creó el registro en la DB
        registration = UserRegistration.objects.get(email='nuevo@example.com')
        self.assertEqual(registration.selected_plan, self.plan)
        self.assertTrue(registration.is_valid)
    
    def test_signup_duplicate_email(self):
        """Probar signup con email duplicado"""
        # Crear usuario existente
        User.objects.create_user(
            username='existing',
            email='existing@example.com',
            password='testpass123'
        )
        
        data = {
            'email': 'existing@example.com',
            'plan_id': str(self.plan.id),
            'user_data': {
                'first_name': 'Juan',
                'last_name': 'Pérez'
            }
        }
        
        response = self.client.post(self.signup_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_signup_invalid_plan(self):
        """Probar signup con plan inválido"""
        data = {
            'email': 'test@example.com',
            'plan_id': '00000000-0000-0000-0000-000000000000',
            'user_data': {
                'first_name': 'Juan',
                'last_name': 'Pérez'
            }
        }
        
        response = self.client.post(self.signup_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class OnboardingCompleteAPITests(APITestCase):
    """Pruebas para el API de onboarding completo"""
    
    def setUp(self):
        self.client = APIClient()
        self.plan = Plan.objects.create(
            name='Plan Básico',
            slug='basico',
            price_monthly=29990,
            max_professionals=3,
            max_services=20,
            max_monthly_appointments=500,
            max_clients=1000,
            is_active=True
        )
        
        self.registration = UserRegistration.objects.create(
            email='test@example.com',
            temp_token='valid-token-123',
            selected_plan=self.plan,
            registration_data={
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'email': 'test@example.com'
            },
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        self.onboarding_url = '/api/onboarding/complete/'
    
    def test_onboarding_complete_success(self):
        """Probar onboarding completo exitoso"""
        data = {
            'registration_token': 'valid-token-123',
            'organization': {
                'name': 'Mi Salón',
                'industry_template': 'salon',
                'email': 'info@misalon.com',
                'phone': '+56912345678',
                'address': 'Av. Principal 123',
                'city': 'Santiago',
                'country': 'Chile'
            },
            'professionals': [
                {
                    'name': 'Ana García',
                    'email': 'ana@misalon.com',
                    'phone': '+56987654321',
                    'specialty': 'Estilista',
                    'color_code': '#4CAF50',
                    'accepts_walk_ins': True
                }
            ],
            'services': [
                {
                    'name': 'Corte de Cabello',
                    'description': 'Corte profesional',
                    'category': 'Cabello',
                    'duration_minutes': 45,
                    'price': 15000,
                    'buffer_time_after': 10
                }
            ]
        }
        
        response = self.client.post(self.onboarding_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)
        
        # Verificar que se crearon todas las entidades
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.role, 'owner')
        self.assertIsNotNone(user.organization)
        
        organization = user.organization
        self.assertEqual(organization.name, 'Mi Salón')
        self.assertEqual(organization.industry_template, 'salon')
        self.assertTrue(organization.onboarding_completed)
        
        # Verificar suscripción
        subscription = OrganizationSubscription.objects.get(organization=organization)
        self.assertEqual(subscription.plan, self.plan)
        self.assertEqual(subscription.status, 'trial')
        
        # Verificar profesionales y servicios
        self.assertEqual(organization.professionals.count(), 1)
        self.assertEqual(organization.services.count(), 1)
        
        professional = organization.professionals.first()
        self.assertEqual(professional.name, 'Ana García')
        
        service = organization.services.first()
        self.assertEqual(service.name, 'Corte de Cabello')
        self.assertEqual(service.price, 15000)
        
        # Verificar contadores de suscripción
        subscription.refresh_from_db()
        self.assertEqual(subscription.current_professionals_count, 1)
        self.assertEqual(subscription.current_services_count, 1)
    
    def test_onboarding_invalid_token(self):
        """Probar onboarding con token inválido"""
        data = {
            'registration_token': 'invalid-token',
            'organization': {
                'name': 'Mi Salón',
                'industry_template': 'salon',
                'email': 'info@misalon.com',
                'phone': '+56912345678'
            },
            'professionals': [],
            'services': []
        }
        
        response = self.client.post(self.onboarding_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_onboarding_exceeds_plan_limits(self):
        """Probar onboarding que excede límites del plan"""
        data = {
            'registration_token': 'valid-token-123',
            'organization': {
                'name': 'Mi Salón',
                'industry_template': 'salon',
                'email': 'info@misalon.com',
                'phone': '+56912345678'
            },
            'professionals': [
                {'name': f'Professional {i}', 'email': f'prof{i}@salon.com'}
                for i in range(5)  # Excede el límite de 3
            ],
            'services': [
                {
                    'name': 'Servicio 1',
                    'duration_minutes': 30,
                    'price': 10000
                }
            ]
        }
        
        response = self.client.post(self.onboarding_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('profesionales', str(response.data).lower())


class SubscriptionLimitsIntegrationTests(APITestCase):
    """Pruebas de integración para límites de suscripción"""
    
    def setUp(self):
        self.client = APIClient()
        
        # Crear plan con límites bajos para testing
        self.plan = Plan.objects.create(
            name='Plan Test',
            price_monthly=29990,
            max_professionals=2,
            max_services=3,
            max_monthly_appointments=5,
            max_clients=10
        )
        
        # Crear organización y usuario
        self.organization = Organization.objects.create(
            name='Test Org',
            industry_template='salon',
            email='test@org.com',
            phone='+56912345678',
            onboarding_completed=True
        )
        
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            organization=self.organization,
            role='owner'
        )
        
        # Crear suscripción
        self.subscription = OrganizationSubscription.objects.create(
            organization=self.organization,
            plan=self.plan,
            status='active',
            current_period_start=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=30)
        )
        
        self.client.force_authenticate(user=self.user)
    
    def test_professional_limit_enforcement(self):
        """Probar que se respetan los límites de profesionales"""
        url = '/api/organizations/professionals/'
        
        # Crear hasta el límite
        for i in range(2):
            data = {
                'name': f'Professional {i}',
                'email': f'prof{i}@example.com',
                'specialty': 'Test',
                'color_code': '#4CAF50'
            }
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Intentar crear uno más (debe fallar)
        data = {
            'name': 'Professional Extra',
            'email': 'extra@example.com',
            'specialty': 'Test',
            'color_code': '#4CAF50'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('límite', response.data['error'].lower())
    
    def test_service_limit_enforcement(self):
        """Probar que se respetan los límites de servicios"""
        url = '/api/organizations/services/'
        
        # Crear hasta el límite
        for i in range(3):
            data = {
                'name': f'Servicio {i}',
                'duration_minutes': 30,
                'price': 10000,
                'category': 'Test'
            }
            response = self.client.post(url, data, format='json')
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Intentar crear uno más (debe fallar)
        data = {
            'name': 'Servicio Extra',
            'duration_minutes': 30,
            'price': 10000,
            'category': 'Test'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('límite', response.data['error'].lower())
    
    def test_counter_updates(self):
        """Probar que los contadores se actualizan correctamente"""
        # Crear un profesional
        url = '/api/organizations/professionals/'
        data = {
            'name': 'Test Professional',
            'email': 'test@example.com',
            'specialty': 'Test',
            'color_code': '#4CAF50'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verificar que el contador se actualizó
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.current_professionals_count, 1)
        
        # Eliminar el profesional
        professional_id = response.data['id']
        delete_response = self.client.delete(f'{url}{professional_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verificar que el contador se decrementó
        self.subscription.refresh_from_db()
        self.assertEqual(self.subscription.current_professionals_count, 0)
    
    def test_limits_info_endpoints(self):
        """Probar endpoints de información de límites"""
        # Profesionales
        response = self.client.get('/api/organizations/professionals/limits_info/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['max_allowed'], 2)
        self.assertEqual(response.data['current_count'], 0)
        self.assertTrue(response.data['can_add_more'])
        
        # Servicios
        response = self.client.get('/api/organizations/services/limits_info/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['max_allowed'], 3)
        self.assertEqual(response.data['current_count'], 0)
        self.assertTrue(response.data['can_add_more'])