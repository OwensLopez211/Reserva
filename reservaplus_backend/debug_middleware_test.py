#!/usr/bin/env python
# debug_middleware_test.py - Test específico para debuggear middlewares

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.test_settings')
django.setup()

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from datetime import timedelta
from django.utils import timezone

from plans.models import Plan, OrganizationSubscription
from organizations.models import Organization, Professional

User = get_user_model()


class MiddlewareDebugTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Crear plan con límites muy bajos para testing
        self.plan = Plan.objects.create(
            name='Plan Test Límites',
            slug='test-limits',
            price_monthly=1000,
            max_professionals=1,  # LÍMITE MUY BAJO
            max_services=1,       # LÍMITE MUY BAJO
            max_monthly_appointments=10,
            max_clients=100,
            is_active=True
        )
        
        # Crear organización
        self.organization = Organization.objects.create(
            name='Test Org',
            industry_template='salon',
            email='test@org.com',
            phone='+56912345678',
            onboarding_completed=True
        )
        
        # Crear usuario
        self.user = User.objects.create_user(
            username='testuser',
            email='test@user.com',
            password='testpass123',
            organization=self.organization,
            role='owner'
        )
        
        # Crear suscripción con contadores ya en el límite
        self.subscription = OrganizationSubscription.objects.create(
            organization=self.organization,
            plan=self.plan,
            status='active',
            current_period_start=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=30),
            current_professionals_count=1,  # YA EN EL LÍMITE
            current_services_count=1         # YA EN EL LÍMITE
        )
        
        # Crear un profesional existente para estar en el límite
        self.existing_professional = Professional.objects.create(
            organization=self.organization,
            name='Profesional Existente',
            email='existing@test.com'
        )
        
        # Autenticar usuario
        self.client.force_authenticate(user=self.user)
        
    def test_middleware_direct(self):
        """Test directo del middleware"""
        print("\n=== TEST DIRECTO DEL MIDDLEWARE ===")
        
        # Import del middleware
        from core.middleware import SubscriptionLimitsMiddleware
        
        middleware = SubscriptionLimitsMiddleware(lambda x: None)
        
        # Crear request mock
        from django.http import HttpRequest
        request = HttpRequest()
        request.method = 'POST'
        request.path_info = '/api/organizations/professionals/'
        request.user = self.user
        
        print(f"User: {request.user}")
        print(f"Organization: {request.user.organization}")
        print(f"Path: {request.path_info}")
        print(f"Method: {request.method}")
        
        # Verificar suscripción
        print(f"Subscription: {self.subscription}")
        print(f"Plan: {self.subscription.plan.name}")
        print(f"Max professionals: {self.subscription.plan.max_professionals}")
        print(f"Current professionals: {self.subscription.current_professionals_count}")
        print(f"Can add professional: {self.subscription.can_add_professional()}")
        
        # Ejecutar middleware
        response = middleware.process_request(request)
        
        if response:
            print(f"Middleware returned: {response.status_code}")
            print(f"Content: {response.content}")
        else:
            print("Middleware returned None (no blocking)")
    
    def test_api_call_with_limit(self):
        """Test de llamada API real con límite"""
        print("\n=== TEST API CALL CON LÍMITE ===")
        
        url = '/api/organizations/professionals/'
        data = {
            'name': 'Nuevo Profesional',
            'email': 'nuevo@test.com',
            'specialty': 'Test'
        }
        
        print(f"Making POST to: {url}")
        print(f"Data: {data}")
        print(f"Current count: {self.subscription.current_professionals_count}")
        print(f"Max allowed: {self.subscription.plan.max_professionals}")
        
        response = self.client.post(url, data, format='json')
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.content}")
        
        # Verificar si el middleware se ejecutó
        if response.status_code == 403:
            print("✅ Middleware blocked the request (403)")
        elif response.status_code == 400:
            print("❌ Serializer validation failed (400)")
        elif response.status_code == 201:
            print("❌ Request was successful - middleware didn't block")
        else:
            print(f"❓ Unexpected status: {response.status_code}")
    
    def test_onboarding_with_limits(self):
        """Test del endpoint de onboarding con límites"""
        print("\n=== TEST ONBOARDING CON LÍMITES ===")
        
        # Simular datos de onboarding que exceden límites
        url = '/api/onboarding/complete/'
        data = {
            'registration_token': 'fake-token',
            'organization': {
                'name': 'Test Org Onboarding',
                'industry_template': 'salon',
                'email': 'onboarding@test.com',
                'phone': '+56987654321'
            },
            'professionals': [
                {'name': 'Prof 1', 'email': 'p1@test.com'},
                {'name': 'Prof 2', 'email': 'p2@test.com'}  # Esto excede el límite de 1
            ],
            'services': [
                {'name': 'Service 1', 'duration_minutes': 30, 'price': 1000},
                {'name': 'Service 2', 'duration_minutes': 45, 'price': 2000}  # Esto excede el límite de 1
            ]
        }
        
        print(f"Making POST to: {url}")
        print(f"Professionals count: {len(data['professionals'])}")
        print(f"Services count: {len(data['services'])}")
        print(f"Current professionals: {self.subscription.current_professionals_count}")
        print(f"Max professionals: {self.subscription.plan.max_professionals}")
        
        response = self.client.post(url, data, format='json')
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.content}")


if __name__ == "__main__":
    import unittest
    
    # Crear el test
    test = MiddlewareDebugTest()
    test.setUp()
    
    # Ejecutar tests individuales
    test.test_middleware_direct()
    test.test_api_call_with_limit()
    test.test_onboarding_with_limits()