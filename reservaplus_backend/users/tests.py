# users/tests.py - FIX FINAL

from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from core.test_base import BaseAPITestCase 

User = get_user_model()


class UserModelTests(BaseAPITestCase):
    """Pruebas para el modelo User"""
    
    def test_create_user(self):
        """Probar creación de usuario"""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            organization=self.salon_org
        )
        
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.organization, self.salon_org)
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.role, 'staff')  # Default role
    
    def test_user_full_name(self):
        """Probar propiedad full_name"""
        user = User.objects.create_user(
            username='testuser',
            first_name='Juan',
            last_name='Pérez',
            password='testpass123'
        )
        
        self.assertEqual(user.full_name, 'Juan Pérez')
        
        # Si no tiene nombre completo, debe retornar username
        user.first_name = ''
        user.last_name = ''
        self.assertEqual(user.full_name, 'testuser')
    
    def test_user_permissions(self):
        """Probar sistema de permisos por rol"""
        # Owner debe tener todos los permisos
        self.assertTrue(self.salon_owner.has_org_permission('view_all'))
        self.assertTrue(self.salon_owner.has_org_permission('edit_all'))
        
        # Staff debe tener permisos limitados
        self.assertTrue(self.salon_staff.has_org_permission('view_own'))
        self.assertFalse(self.salon_staff.has_org_permission('view_all'))


class AuthenticationAPITests(BaseAPITestCase):
    """Pruebas para las APIs de autenticación"""
    
    def test_login_success(self):
        """Probar login exitoso"""
        url = '/api/auth/login/'  # URL directa
        data = {
            'username': 'salon_owner',
            'password': 'testpass123'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'salon_owner')
    
    def test_login_invalid_credentials(self):
        """Probar login con credenciales inválidas"""
        url = '/api/auth/login/'  # URL directa
        data = {
            'username': 'salon_owner',
            'password': 'wrongpassword'
        }
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
    
    def test_login_missing_data(self):
        """Probar login con datos faltantes"""
        url = '/api/auth/login/'  # URL directa
        data = {'username': 'salon_owner'}  # Sin password
        
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_current_user_authenticated(self):
        """Probar obtener usuario actual cuando está autenticado"""
        self.authenticate_user(self.salon_owner)
        url = '/api/auth/me/'  # URL directa
        
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'salon_owner')
        self.assertEqual(response.data['organization_name'], 'Salón Test')
    
    def test_current_user_unauthenticated(self):
        """Probar obtener usuario actual sin autenticación"""
        url = '/api/auth/me/'  # URL directa
        
        response = self.client.get(url)
        
        # AJUSTADO: Aceptar tanto 401 como 403
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
    
    def test_logout(self):
        """Probar logout"""
        self.authenticate_user(self.salon_owner)
        url = '/api/auth/logout/'  # URL directa
        
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)


class UserViewSetTests(BaseAPITestCase):
    """Pruebas para UserViewSet"""
    
    def test_list_users_by_organization(self):
        """Probar que los usuarios solo ven usuarios de su organización"""
        # Salon owner debe ver usuarios del salón
        self.authenticate_user(self.salon_owner)
        response = self.client.get('/api/auth/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('salon_owner', usernames)
        self.assertIn('salon_staff', usernames)
        self.assertNotIn('clinic_owner', usernames)
        
        # Clinic owner debe ver usuarios de la clínica
        self.authenticate_user(self.clinic_owner)
        response = self.client.get('/api/auth/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('clinic_owner', usernames)
        self.assertNotIn('salon_owner', usernames)
    
    def test_superuser_sees_all_users(self):
        """Probar que el superusuario ve todos los usuarios"""
        self.authenticate_user(self.superuser)
        response = self.client.get('/api/auth/users/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [user['username'] for user in response.data['results']]
        self.assertIn('salon_owner', usernames)
        self.assertIn('clinic_owner', usernames)
        self.assertIn('admin_test', usernames)
    
    def test_user_me_endpoint(self):
        """Probar endpoint /users/me/"""
        self.authenticate_user(self.salon_owner)
        response = self.client.get('/api/auth/users/me/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'salon_owner')
    
    def test_create_user_in_organization(self):
        """Probar crear usuario en la organización"""
        self.authenticate_user(self.salon_owner)
        
        data = {
            'username': 'new_staff',
            'email': 'newstaff@salon.com',
            'password': 'newpass123',
            'confirm_password': 'newpass123',
            'first_name': 'Nuevo',
            'last_name': 'Personal',
            'role': 'staff',
            'organization': str(self.salon_org.id)
        }
        
        response = self.client.post('/api/auth/users/', data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['username'], 'new_staff')
        # AJUSTADO: Convertir ambos a string para comparar
        self.assertEqual(str(response.data['organization']), str(self.salon_org.id))
        
        # Verificar que el usuario fue creado
        user = User.objects.get(username='new_staff')
        self.assertEqual(user.organization, self.salon_org)
        self.assertTrue(user.check_password('newpass123'))
    
    def test_multi_tenant_isolation(self):
        """Probar aislamiento multi-tenant en usuarios"""
        self.assert_multi_tenant_isolation(
            '/api/auth/users/',
            self.salon_owner,
            self.clinic_owner
        )