# organizations/tests.py

from django.urls import reverse
from rest_framework import status
from core.test_base import BaseAPITestCase
from organizations.models import Organization, Professional, Service, Client


class OrganizationModelTests(BaseAPITestCase):
    """Pruebas para el modelo Organization"""
    
    def test_create_organization(self):
        """Probar creación de organización"""
        org = Organization.objects.create(
            name='Nueva Organización',
            industry_template='spa',
            email='info@nueva.com'
        )
        
        self.assertEqual(org.name, 'Nueva Organización')
        self.assertEqual(org.industry_template, 'spa')
        self.assertEqual(org.slug, 'nueva-organizacion')  # Auto-generado
        self.assertTrue(org.is_active)
        self.assertTrue(org.is_trial)
    
    def test_organization_business_config(self):
        """Probar configuración de negocio por industria"""
        # Salón debe tener configuración de salón
        config = self.salon_org.get_business_config()
        self.assertEqual(config['name'], 'Peluquería/Salón de Belleza')
        self.assertTrue(config['business_rules']['allow_walk_ins'])
        
        # Clínica debe tener configuración de clínica
        config = self.clinic_org.get_business_config()
        self.assertEqual(config['name'], 'Clínica/Consultorio Médico')
        self.assertFalse(config['business_rules']['allow_walk_ins'])
    
    def test_organization_terminology(self):
        """Probar terminología específica por industria"""
        # Salón
        terminology = self.salon_org.terminology
        self.assertEqual(terminology['professional']['singular'], 'Estilista')
        self.assertEqual(terminology['client']['singular'], 'Cliente')
        
        # Clínica
        terminology = self.clinic_org.terminology
        self.assertEqual(terminology['professional']['singular'], 'Doctor')
        self.assertEqual(terminology['client']['singular'], 'Paciente')


class OrganizationAPITests(BaseAPITestCase):
    """Pruebas para las APIs de organización"""
    
    def test_my_organization(self):
        """Probar endpoint mi organización"""
        self.authenticate_user(self.salon_owner)
        
        response = self.client.get('/api/organizations/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Salón Test')
        self.assertEqual(response.data['industry_template'], 'salon')
        self.assertIn('terminology', response.data)
        self.assertIn('business_rules', response.data)
    
    def test_my_organization_no_org(self):
        """Probar mi organización sin organización asignada"""
        # Usuario sin organización
        user_no_org = self.superuser
        user_no_org.organization = None
        user_no_org.save()
        
        self.authenticate_user(user_no_org)
        
        response = self.client.get('/api/organizations/me/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('error', response.data)
    
    def test_organization_list_isolation(self):
        """Probar que cada usuario ve solo su organización"""
        # Usuario del salón
        self.authenticate_user(self.salon_owner)
        response = self.client.get('/api/organizations/organizations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Salón Test')
        
        # Usuario de clínica
        self.authenticate_user(self.clinic_owner)
        response = self.client.get('/api/organizations/organizations/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Clínica Test')


class ProfessionalAPITests(BaseAPITestCase):
    """Pruebas para las APIs de profesionales"""
    
    def test_list_professionals_by_org(self):
        """Probar listar profesionales por organización"""
        self.authenticate_user(self.salon_owner)
        
        response = self.client.get('/api/organizations/professionals/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Ana Estilista')
    
    def test_create_professional(self):
        """Probar crear profesional"""
        self.authenticate_user(self.salon_owner)
        
        data = {
            'name': 'Carlos Nuevo',
            'email': 'carlos@salon.com',
            'phone': '+56977777777',
            'specialty': 'Barbero',
            'color_code': '#00FF00'
        }
        
        response = self.client.post('/api/organizations/professionals/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Carlos Nuevo')
        self.assertEqual(response.data['organization'], str(self.salon_org.id))
        
        # Verificar que se creó en la base de datos
        professional = Professional.objects.get(name='Carlos Nuevo')
        self.assertEqual(professional.organization, self.salon_org)
    
    def test_professional_multi_tenant_isolation(self):
        """Probar aislamiento de profesionales por tenant"""
        self.assert_multi_tenant_isolation(
            '/api/organizations/professionals/',
            self.salon_owner,
            self.clinic_owner
        )


class ServiceAPITests(BaseAPITestCase):
    """Pruebas para las APIs de servicios"""
    
    def test_list_services_by_org(self):
        """Probar listar servicios por organización"""
        self.authenticate_user(self.salon_owner)
        
        response = self.client.get('/api/organizations/services/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Corte de Cabello')
    
    def test_create_service(self):
        """Probar crear servicio"""
        self.authenticate_user(self.salon_owner)
        
        data = {
            'name': 'Peinado',
            'duration_minutes': 30,
            'price': '12000',
            'category': 'Peinados',
            'description': 'Peinado profesional',
            'professionals': [str(self.salon_professional.id)]
        }
        
        response = self.client.post('/api/organizations/services/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Peinado')
        self.assertEqual(response.data['organization'], str(self.salon_org.id))
        
        # Verificar que se creó en la base de datos
        service = Service.objects.get(name='Peinado')
        self.assertEqual(service.organization, self.salon_org)
        self.assertEqual(service.professionals.count(), 1)
    
    def test_service_total_duration(self):
        """Probar cálculo de duración total del servicio"""
        service = Service.objects.create(
            organization=self.salon_org,
            name='Servicio con Buffer',
            duration_minutes=60,
            price=20000,
            buffer_time_before=10,
            buffer_time_after=15
        )
        
        self.assertEqual(service.total_duration_minutes, 85)  # 60 + 10 + 15
    
    def test_service_multi_tenant_isolation(self):
        """Probar aislamiento de servicios por tenant"""
        self.assert_multi_tenant_isolation(
            '/api/organizations/services/',
            self.salon_owner,
            self.clinic_owner
        )


class ClientAPITests(BaseAPITestCase):
    """Pruebas para las APIs de clientes"""
    
    def test_list_clients_by_org(self):
        """Probar listar clientes por organización"""
        self.authenticate_user(self.salon_owner)
        
        response = self.client.get('/api/organizations/clients/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['full_name'], 'Patricia Cliente')
    
    def test_create_client(self):
        """Probar crear cliente"""
        self.authenticate_user(self.salon_owner)
        
        data = {
            'first_name': 'Luis',
            'last_name': 'Nuevo',
            'email': 'luis@email.com',
            'phone': '+56988888888',
            'notes': 'Cliente nuevo de prueba'
        }
        
        response = self.client.post('/api/organizations/clients/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['full_name'], 'Luis Nuevo')
        self.assertEqual(response.data['organization'], str(self.salon_org.id))
        
        # Verificar que se creó en la base de datos
        client = Client.objects.get(first_name='Luis', last_name='Nuevo')
        self.assertEqual(client.organization, self.salon_org)
    
    def test_client_full_name_property(self):
        """Probar propiedad full_name del cliente"""
        self.assertEqual(self.salon_client.full_name, 'Patricia Cliente')
    
    def test_client_multi_tenant_isolation(self):
        """Probar aislamiento de clientes por tenant"""
        self.assert_multi_tenant_isolation(
            '/api/organizations/clients/',
            self.salon_owner,
            self.clinic_owner
        )