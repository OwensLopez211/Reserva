# onboarding/tests.py
"""
Tests para el módulo de onboarding refactorizado
"""

import json
from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from plans.models import Plan, UserRegistration
from organizations.models import Organization, Professional, Service
from .managers import OnboardingManager
from .validators import OnboardingValidator
from .exceptions import OnboardingValidationError, OnboardingTokenError, OnboardingLimitError

User = get_user_model()


class OnboardingValidatorTest(TestCase):
    """
    Tests para OnboardingValidator
    """
    
    def setUp(self):
        # Crear plan de prueba
        self.plan = Plan.objects.create(
            name='Plan Básico',
            description='Plan básico de prueba',
            price_monthly=15000,
            max_users=10,  # Campo requerido añadido
            max_professionals=3,
            max_services=5,
            max_monthly_appointments=100,
            max_clients=50
        )
        
        # Crear registro temporal
        self.registration = UserRegistration.objects.create(
            email='test@example.com',
            temp_token='valid-token-123',
            selected_plan=self.plan,
            registration_data={'first_name': 'Test', 'last_name': 'User'},
            expires_at=timezone.now() + timedelta(hours=24)
        )
    
    def test_validate_valid_token(self):
        """Test validación de token válido"""
        registration = OnboardingValidator.validate_registration_token('valid-token-123')
        self.assertEqual(registration.email, 'test@example.com')
    
    def test_validate_invalid_token(self):
        """Test validación de token inválido"""
        with self.assertRaises(OnboardingTokenError):
            OnboardingValidator.validate_registration_token('invalid-token')
    
    def test_validate_organization_data(self):
        """Test validación de datos de organización"""
        valid_data = {
            'name': 'Mi Salón',
            'industry_template': 'salon',
            'email': 'info@misalon.com',
            'phone': '+56912345678'
        }
        
        result = OnboardingValidator.validate_organization_data(valid_data)
        self.assertEqual(result['name'], 'Mi Salón')
    
    def test_validate_organization_missing_fields(self):
        """Test validación de organización con campos faltantes"""
        invalid_data = {
            'name': 'Mi Salón',
            # Faltan campos requeridos
        }
        
        with self.assertRaises(OnboardingValidationError):
            OnboardingValidator.validate_organization_data(invalid_data)
    
    def test_validate_professionals_data(self):
        """Test validación de datos de profesionales"""
        valid_data = [
            {
                'name': 'Ana García',
                'email': 'ana@misalon.com',
                'phone': '+56987654321'
            }
        ]
        
        result = OnboardingValidator.validate_professionals_data(valid_data, self.plan)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['name'], 'Ana García')
    
    def test_validate_professionals_exceeds_limit(self):
        """Test validación de profesionales que excede límite"""
        # Crear más profesionales que el límite del plan
        professionals_data = []
        for i in range(self.plan.max_professionals + 1):
            professionals_data.append({
                'name': f'Profesional {i}',
                'email': f'prof{i}@misalon.com',
                'phone': f'+56900000{i:03d}'
            })
        
        with self.assertRaises(OnboardingLimitError):
            OnboardingValidator.validate_professionals_data(professionals_data, self.plan)
    
    def test_validate_services_data(self):
        """Test validación de datos de servicios"""
        valid_data = [
            {
                'name': 'Corte de Cabello',
                'price': 15000,
                'duration_minutes': 45
            }
        ]
        
        result = OnboardingValidator.validate_services_data(valid_data, self.plan)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['name'], 'Corte de Cabello')
    
    def test_validate_services_exceeds_limit(self):
        """Test validación de servicios que excede límite"""
        # Crear más servicios que el límite del plan
        services_data = []
        for i in range(self.plan.max_services + 1):
            services_data.append({
                'name': f'Servicio {i}',
                'price': 10000,
                'duration_minutes': 30
            })
        
        with self.assertRaises(OnboardingLimitError):
            OnboardingValidator.validate_services_data(services_data, self.plan)


class OnboardingManagerTest(TransactionTestCase):
    """
    Tests para OnboardingManager (usar TransactionTestCase por las transacciones)
    """
    
    def setUp(self):
        # Crear plan de prueba
        self.plan = Plan.objects.create(
            name='Plan Básico',
            description='Plan básico de prueba',
            price_monthly=15000,
            max_users=10,  # Campo requerido añadido
            max_professionals=3,
            max_services=5,
            max_monthly_appointments=100,
            max_clients=50
        )
        
        # Crear registro temporal
        self.registration = UserRegistration.objects.create(
            email='test@example.com',
            temp_token='valid-token-123',
            selected_plan=self.plan,
            registration_data={
                'first_name': 'Test', 
                'last_name': 'User',
                'email': 'test@example.com',
                'password': 'testpass123'
            },
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        # Datos de prueba para onboarding
        self.onboarding_data = {
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
                    'role': 'professional',
                    'specialty': 'Estilista',
                    'color_code': '#4CAF50'
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
    
    def test_complete_onboarding_success(self):
        """Test completar onboarding exitosamente"""
        manager = OnboardingManager()
        result = manager.complete_onboarding(self.onboarding_data)
        
        # Verificar respuesta
        self.assertIn('message', result)
        self.assertIn('data', result)
        self.assertEqual(result['message'], 'Onboarding completado exitosamente')
        
        # Verificar que se crearon las entidades
        self.assertTrue(Organization.objects.filter(name='Mi Salón').exists())
        self.assertTrue(User.objects.filter(email='test@example.com').exists())
        self.assertTrue(Professional.objects.filter(name='Ana García').exists())
        self.assertTrue(Service.objects.filter(name='Corte de Cabello').exists())
        
        # Verificar que el registro se marcó como completado
        self.registration.refresh_from_db()
        self.assertTrue(self.registration.is_completed)
    
    def test_complete_onboarding_invalid_token(self):
        """Test onboarding con token inválido"""
        invalid_data = self.onboarding_data.copy()
        invalid_data['registration_token'] = 'invalid-token'
        
        manager = OnboardingManager()
        with self.assertRaises(OnboardingTokenError):
            manager.complete_onboarding(invalid_data)
    
    def test_validate_onboarding_data(self):
        """Test validación de datos sin ejecutar onboarding"""
        result = OnboardingManager.validate_onboarding_data(self.onboarding_data)
        
        self.assertTrue(result['valid'])
        self.assertIn('registration', result)
        self.assertEqual(result['registration']['email'], 'test@example.com')


class OnboardingAPITest(APITestCase):
    """
    Tests para las vistas de la API de onboarding
    """
    
    def setUp(self):
        # Crear plan de prueba
        self.plan = Plan.objects.create(
            name='Plan Básico',
            description='Plan básico de prueba',
            price_monthly=15000,
            max_users=10,  # Campo requerido añadido
            max_professionals=3,
            max_services=5,
            max_monthly_appointments=100,
            max_clients=50
        )
        
        # Crear registro temporal
        self.registration = UserRegistration.objects.create(
            email='test@example.com',
            temp_token='valid-token-123',
            selected_plan=self.plan,
            registration_data={
                'first_name': 'Test', 
                'last_name': 'User',
                'email': 'test@example.com',
                'password': 'testpass123'
            },
            expires_at=timezone.now() + timedelta(hours=24)
        )
        
        # URLs
        self.complete_url = reverse('onboarding-complete')
        self.validate_url = reverse('onboarding-validate')
        self.health_url = reverse('onboarding-health')
        
        # Datos de prueba
        self.onboarding_data = {
            'registration_token': 'valid-token-123',
            'organization': {
                'name': 'Mi Salón',
                'industry_template': 'salon',
                'email': 'info@misalon.com',
                'phone': '+56912345678'
            },
            'professionals': [
                {
                    'name': 'Ana García',
                    'email': 'ana@misalon.com',
                    'phone': '+56987654321',
                    'role': 'professional'
                }
            ],
            'services': [
                {
                    'name': 'Corte de Cabello',
                    'duration_minutes': 45,
                    'price': 15000
                }
            ]
        }
    
    def test_complete_onboarding_api_success(self):
        """Test API de completar onboarding exitoso"""
        response = self.client.post(
            self.complete_url,
            data=json.dumps(self.onboarding_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)
        self.assertIn('data', response.data)
    
    def test_complete_onboarding_api_invalid_token(self):
        """Test API de onboarding con token inválido"""
        invalid_data = self.onboarding_data.copy()
        invalid_data['registration_token'] = 'invalid-token'
        
        response = self.client.post(
            self.complete_url,
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
    
    def test_validate_onboarding_api(self):
        """Test API de validación de onboarding"""
        response = self.client.post(
            self.validate_url,
            data=json.dumps(self.onboarding_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])
    
    def test_health_check_api(self):
        """Test API de health check"""
        response = self.client.get(self.health_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['service'], 'onboarding')
        self.assertEqual(response.data['version'], '2.0') 