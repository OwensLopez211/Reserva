#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.settings')
django.setup()

from users.models import User
from plans.models import OrganizationSubscription
from organizations.models import Organization

def fix_counters():
    print("=== CORRIGIENDO CONTADORES DE SUSCRIPCIÓN ===")
    
    # Obtener primera organización
    org = Organization.objects.first()
    if not org:
        print("No hay organizaciones en la base de datos")
        return
    
    print(f"Organización: {org.name}")
    
    # Obtener suscripción
    subscription = getattr(org, 'subscription', None)
    if not subscription:
        print("❌ Sin suscripción activa")
        return
    
    # Contar usuarios reales
    users = User.objects.filter(organization=org)
    real_users_count = users.count()
    real_professionals_count = users.filter(role='professional').count()
    
    print(f"\nContadores actuales (incorrectos):")
    print(f"  - Usuarios: {subscription.current_users_count}")
    print(f"  - Profesionales: {subscription.current_professionals_count}")
    
    print(f"\nContadores reales:")
    print(f"  - Usuarios: {real_users_count}")
    print(f"  - Profesionales: {real_professionals_count}")
    
    # Actualizar contadores
    subscription.current_users_count = real_users_count
    subscription.current_professionals_count = real_professionals_count
    subscription.save()
    
    print(f"\n✅ Contadores corregidos:")
    print(f"  - Usuarios: {subscription.current_users_count}")
    print(f"  - Profesionales: {subscription.current_professionals_count}")
    
    # Verificar límites después de la corrección
    print(f"\n=== VERIFICACIÓN DESPUÉS DE LA CORRECCIÓN ===")
    print(f"Plan: {subscription.plan.name}")
    print(f"Límites del plan:")
    print(f"  - Máximo usuarios: {subscription.plan.max_users}")
    print(f"  - Máximo profesionales: {subscription.plan.max_professionals}")
    print(f"¿Puede agregar usuarios? {subscription.can_add_user()}")
    print(f"¿Puede agregar profesionales? {subscription.can_add_professional()}")

if __name__ == "__main__":
    fix_counters() 