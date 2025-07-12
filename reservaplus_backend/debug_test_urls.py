#!/usr/bin/env python
# debug_test_urls.py - Script para debuggear las URLs de los tests

import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.test_settings')
django.setup()

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from users.models import User
from organizations.models import Organization
from plans.models import Plan, OrganizationSubscription

class URLDebugger:
    def __init__(self):
        self.client = APIClient()
        
    def debug_urls(self):
        """Debug las URLs que usan los tests"""
        
        # Intentar encontrar las URLs que usan los tests
        print("=== DEBUGGING URLs de Tests ===")
        
        try:
            # URLs de profesionales
            professionals_url = reverse('organizations:professionals-list')
            print(f"Professionals URL: {professionals_url}")
        except:
            print("No se pudo resolver 'organizations:professionals-list'")
            
        try:
            # URLs de servicios  
            services_url = reverse('organizations:services-list')
            print(f"Services URL: {services_url}")
        except:
            print("No se pudo resolver 'organizations:services-list'")
            
        try:
            # URLs de clientes
            clients_url = reverse('organizations:clients-list')
            print(f"Clients URL: {clients_url}")
        except:
            print("No se pudo resolver 'organizations:clients-list'")
            
        # URLs hardcodeadas comunes
        common_urls = [
            '/api/organizations/professionals/',
            '/api/organizations/services/',
            '/api/organizations/clients/',
            '/api/onboarding/complete/',
            '/api/plans/signup/',
        ]
        
        print("\n=== URLs Hardcodeadas Comunes ===")
        for url in common_urls:
            print(f"URL: {url}")
            
    def test_middleware_patterns(self):
        """Probar los patrones del middleware"""
        print("\n=== Patrones del Middleware ===")
        
        patterns = {
            'professionals': [
                '/api/organizations/professionals/',
                '/api/organizations/professionals',
                'professionals/',
                'professionals',
            ],
            'services': [
                '/api/organizations/services/',
                '/api/organizations/services',
                'services/',
                'services',
            ],
            'onboarding': [
                '/api/onboarding/complete/',
                '/api/onboarding/complete',
                'onboarding/complete/',
                'onboarding/complete',
            ]
        }
        
        test_urls = [
            '/api/organizations/professionals/',
            '/api/organizations/professionals',
            '/api/organizations/services/',
            '/api/onboarding/complete/',
            '/api/plans/signup/',
        ]
        
        for url in test_urls:
            print(f"\nTesting URL: {url}")
            for category, patterns_list in patterns.items():
                matches = [pattern for pattern in patterns_list if pattern in url]
                if matches:
                    print(f"  ✅ Matches {category}: {matches}")
                else:
                    print(f"  ❌ No matches for {category}")

if __name__ == "__main__":
    debugger = URLDebugger()
    debugger.debug_urls()
    debugger.test_middleware_patterns()