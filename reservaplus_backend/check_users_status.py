#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.settings')
django.setup()

from users.models import User
from plans.models import OrganizationSubscription
from organizations.models import Organization

def check_user_status():
    print("=== ESTADO ACTUAL DE USUARIOS ===")
    
    # Obtener primera organización
    org = Organization.objects.first()
    if not org:
        print("No hay organizaciones en la base de datos")
        return
    
    print(f"Organización: {org.name}")
    
    # Contar usuarios por rol
    users = User.objects.filter(organization=org)
    print(f"Usuarios totales en BD: {users.count()}")
    print("Usuarios por rol:")
    
    for role_key, role_name in [
        ('owner', 'Propietario'),
        ('admin', 'Administrador'),
        ('professional', 'Profesional'),
        ('reception', 'Recepcionista'),
        ('staff', 'Staff')
    ]:
        count = users.filter(role=role_key).count()
        if count > 0:
            role_users = users.filter(role=role_key)
            print(f"  - {role_name}: {count}")
            for user in role_users:
                print(f"    • {user.first_name} {user.last_name} ({user.email}) - Activo: {user.is_active}")
    
    # Verificar suscripción
    subscription = getattr(org, 'subscription', None)
    if subscription:
        print(f"\n=== ESTADO DE SUSCRIPCIÓN ===")
        print(f"Plan: {subscription.plan.name}")
        print(f"Límites del plan:")
        print(f"  - Máximo usuarios: {subscription.plan.max_users}")
        print(f"  - Máximo profesionales: {subscription.plan.max_professionals}")
        print(f"Contadores actuales en suscripción:")
        print(f"  - current_users_count: {subscription.current_users_count}")
        print(f"  - current_professionals_count: {subscription.current_professionals_count}")
        
        # Comparar con conteos reales
        real_users = users.count()
        real_professionals = users.filter(role='professional').count()
        
        print(f"\n=== COMPARACIÓN CONTADORES ===")
        print(f"Usuarios reales: {real_users} vs Contador suscripción: {subscription.current_users_count}")
        print(f"Profesionales reales: {real_professionals} vs Contador suscripción: {subscription.current_professionals_count}")
        
        # Verificar si hay desajuste
        if real_users != subscription.current_users_count:
            print("❌ DESAJUSTE EN CONTADOR DE USUARIOS")
        else:
            print("✅ Contador de usuarios correcto")
            
        if real_professionals != subscription.current_professionals_count:
            print("❌ DESAJUSTE EN CONTADOR DE PROFESIONALES")
        else:
            print("✅ Contador de profesionales correcto")
            
        # Verificar límites
        print(f"\n=== VERIFICACIÓN DE LÍMITES ===")
        print(f"¿Puede agregar usuarios? {subscription.can_add_user()}")
        print(f"¿Puede agregar profesionales? {subscription.can_add_professional()}")
        
    else:
        print("\n❌ Sin suscripción activa")

if __name__ == "__main__":
    check_user_status() 