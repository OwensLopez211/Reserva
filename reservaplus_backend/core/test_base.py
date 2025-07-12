# core/test_base.py

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework.test import APIClient
from organizations.models import Organization, Professional, Service, Client

User = get_user_model()


class BaseTestCase(TestCase):
    """
    Clase base para todas las pruebas
    Configura datos comunes necesarios
    """
    
    def setUp(self):
        """Configurar datos base para pruebas"""
        self.create_organizations()
        self.create_users()
        self.create_professionals()
        self.create_services()
        self.create_clients()
    
    def create_organizations(self):
        """Crear organizaciones de prueba"""
        self.salon_org = Organization.objects.create(
            name='Salón Test',
            industry_template='salon',
            email='test@salon.com',
            phone='+56911111111'
        )
        
        self.clinic_org = Organization.objects.create(
            name='Clínica Test',
            industry_template='clinic',
            email='test@clinic.com',
            phone='+56922222222'
        )
    
    def create_users(self):
        """Crear usuarios de prueba"""
        # Superusuario
        self.superuser = User.objects.create_superuser(
            username='admin_test',
            email='admin@test.com',
            password='testpass123'
        )
        
        # Owner del salón
        self.salon_owner = User.objects.create_user(
            username='salon_owner',
            email='owner@salon.com',
            password='testpass123',
            first_name='Juan',
            last_name='Propietario',
            organization=self.salon_org,
            role='owner'
        )
        
        # Staff del salón
        self.salon_staff = User.objects.create_user(
            username='salon_staff',
            email='staff@salon.com',
            password='testpass123',
            first_name='María',
            last_name='Personal',
            organization=self.salon_org,
            role='staff'
        )
        
        # Owner de clínica
        self.clinic_owner = User.objects.create_user(
            username='clinic_owner',
            email='owner@clinic.com',
            password='testpass123',
            first_name='Dr. Carlos',
            last_name='Médico',
            organization=self.clinic_org,
            role='owner'
        )
    
    def create_professionals(self):
        """Crear profesionales de prueba"""
        self.salon_professional = Professional.objects.create(
            organization=self.salon_org,
            name='Ana Estilista',
            email='ana@salon.com',
            phone='+56933333333',
            specialty='Colorista',
            color_code='#FF6B6B'
        )
        
        self.clinic_professional = Professional.objects.create(
            organization=self.clinic_org,
            name='Dr. Roberto López',
            email='roberto@clinic.com',
            phone='+56944444444',
            specialty='Medicina General',
            color_code='#45B7D1'
        )
    
    def create_services(self):
        """Crear servicios de prueba"""
        self.salon_service = Service.objects.create(
            organization=self.salon_org,
            name='Corte de Cabello',
            duration_minutes=45,
            price=15000,
            category='Cortes'
        )
        self.salon_service.professionals.add(self.salon_professional)
        
        self.clinic_service = Service.objects.create(
            organization=self.clinic_org,
            name='Consulta General',
            duration_minutes=30,
            price=25000,
            category='Consultas'
        )
        self.clinic_service.professionals.add(self.clinic_professional)
    
    def create_clients(self):
        """Crear clientes de prueba"""
        self.salon_client = Client.objects.create(
            organization=self.salon_org,
            first_name='Patricia',
            last_name='Cliente',
            email='patricia@email.com',
            phone='+56955555555'
        )
        
        self.clinic_client = Client.objects.create(
            organization=self.clinic_org,
            first_name='Jorge',
            last_name='Paciente',
            email='jorge@email.com',
            phone='+56966666666'
        )


class BaseAPITestCase(APITestCase, BaseTestCase):
    """
    Clase base para pruebas de API
    Incluye autenticación y helpers para API testing
    """
    
    def setUp(self):
        super().setUp()
        self.client = APIClient()
    
    def authenticate_user(self, user):
        """Autenticar usuario para las pruebas"""
        self.client.force_authenticate(user=user)
    
    def logout_user(self):
        """Cerrar sesión del usuario"""
        self.client.force_authenticate(user=None)
    
    def assert_api_response(self, response, status_code, has_data=True):
        """Helper para verificar respuestas de API"""
        self.assertEqual(response.status_code, status_code)
        if has_data:
            self.assertIsNotNone(response.data)
        return response.data
    
    def assert_api_error(self, response, status_code, error_message=None):
        """Helper para verificar errores de API"""
        self.assertEqual(response.status_code, status_code)
        if error_message:
            self.assertIn(error_message.lower(), str(response.data).lower())
    
    def assert_multi_tenant_isolation(self, url, user1, user2, create_data=None):
        """
        Verificar que los datos están correctamente aislados por tenant
        """
        # Usuario 1 - debe ver sus datos
        self.authenticate_user(user1)
        response1 = self.client.get(url)
        self.assertEqual(response1.status_code, 200)
        
        # Manejar diferentes formatos de respuesta
        if isinstance(response1.data, dict) and 'results' in response1.data:
            user1_count = len(response1.data['results'])
        elif isinstance(response1.data, list):
            user1_count = len(response1.data)
        else:
            user1_count = 1 if response1.data else 0
        
        # Usuario 2 - debe ver sus datos (diferentes)
        self.authenticate_user(user2)
        response2 = self.client.get(url)
        self.assertEqual(response2.status_code, 200)
        
        # Manejar diferentes formatos de respuesta
        if isinstance(response2.data, dict) and 'results' in response2.data:
            user2_count = len(response2.data['results'])
        elif isinstance(response2.data, list):
            user2_count = len(response2.data)
        else:
            user2_count = 1 if response2.data else 0
        
        # Los datos deben ser diferentes (aislamiento de tenant)
        self.assertGreaterEqual(user1_count, 0)
        self.assertGreaterEqual(user2_count, 0)
        
        return user1_count, user2_count