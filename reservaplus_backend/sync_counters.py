#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.settings')
django.setup()

from users.models import User
from plans.models import OrganizationSubscription
from organizations.models import Organization

def sync_all_counters():
    print("=== SINCRONIZANDO CONTADORES DE SUSCRIPCIÓN ===\n")
    
    organizations = Organization.objects.all()
    
    for org in organizations:
        print(f"Organización: {org.name}")
        
        subscription = getattr(org, 'subscription', None)
        if not subscription:
            print("  ❌ Sin suscripción activa\n")
            continue
        
        # Contar usuarios reales por rol
        users = User.objects.filter(organization=org, is_active_in_org=True)
        
        real_counts = {
            'total': users.count(),
            'professionals': users.filter(role='professional').count(),
            'receptionists': users.filter(role='reception').count(),
            'staff': users.filter(role='staff').count(),
        }
        
        current_counts = {
            'total': subscription.current_users_count,
            'professionals': subscription.current_professionals_count,
            'receptionists': subscription.current_receptionists_count,
            'staff': subscription.current_staff_count,
        }
        
        print(f"  Plan: {subscription.plan.name}")
        print(f"  Contadores actuales vs reales:")
        
        needs_update = False
        for key in real_counts:
            current = current_counts[key]
            real = real_counts[key]
            status = "✅" if current == real else "❌"
            print(f"    {key}: {current} → {real} {status}")
            if current != real:
                needs_update = True
        
        if needs_update:
            print(f"  🔄 Actualizando contadores...")
            subscription.current_users_count = real_counts['total']
            subscription.current_professionals_count = real_counts['professionals']
            subscription.current_receptionists_count = real_counts['receptionists']
            subscription.current_staff_count = real_counts['staff']
            subscription.save()
            print(f"  ✅ Contadores sincronizados")
        else:
            print(f"  ✅ Contadores ya están sincronizados")
        
        # Mostrar límites y disponibilidad
        print(f"  Límites del plan:")
        print(f"    Total usuarios: {real_counts['total']}/{subscription.plan.max_users}")
        print(f"    Profesionales: {real_counts['professionals']}/{subscription.plan.max_professionals}")
        print(f"    Recepcionistas: {real_counts['receptionistas']}/{subscription.plan.max_receptionists}")
        print(f"    Staff: {real_counts['staff']}/{subscription.plan.max_staff}")
        
        print(f"  Puede agregar:")
        print(f"    Usuarios: {'Sí' if subscription.can_add_user() else 'No'}")
        print(f"    Profesionales: {'Sí' if subscription.can_add_professional() else 'No'}")
        print(f"    Recepcionistas: {'Sí' if subscription.can_add_receptionist() else 'No'}")
        print(f"    Staff: {'Sí' if subscription.can_add_staff() else 'No'}")
        print()

if __name__ == "__main__":
    sync_all_counters() 