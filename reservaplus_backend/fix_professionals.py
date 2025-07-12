#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.settings')
django.setup()

from users.models import User
from organizations.models import Organization
from appointments.models import Appointment, Client, Service
from datetime import datetime, timedelta
from django.utils import timezone

print("=== Corrigiendo profesionales ===")

# Corregir usuarios con rol professional
professionals = User.objects.filter(role='professional')
print(f"Usuarios con rol 'professional': {professionals.count()}")

for prof in professionals:
    if not prof.is_professional:
        prof.is_professional = True
        prof.save()
        print(f"✓ Activado is_professional para {prof.full_name}")
    else:
        print(f"✓ {prof.full_name} ya tiene is_professional=True")

print("\n=== Verificando profesionales corregidos ===")
professionals = User.objects.filter(is_professional=True)
print(f"Total profesionales: {professionals.count()}")

for prof in professionals:
    print(f"- {prof.full_name} (ID: {prof.id}) - Organización: {prof.organization.name}")

print("\n=== Verificando clientes y servicios ===")

# Ver si hay clientes
clients = Client.objects.all()
print(f"Clientes disponibles: {clients.count()}")

# Ver si hay servicios
services = Service.objects.all()
print(f"Servicios disponibles: {services.count()}")

if clients.count() > 0 and services.count() > 0 and professionals.count() > 0:
    print("\n=== Creando citas de prueba ===")
    
    # Tomar el primer profesional, cliente y servicio
    professional = professionals.first()
    client = clients.first()
    service = services.first()
    
    # Crear algunas citas para la próxima semana
    base_date = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
    
    appointments_created = 0
    for i in range(5):  # 5 citas
        appointment_date = base_date + timedelta(days=i, hours=i*2)
        
        # Verificar si ya existe una cita similar
        existing = Appointment.objects.filter(
            professional=professional,
            client=client,
            start_datetime=appointment_date
        ).first()
        
        if not existing:
            appointment = Appointment.objects.create(
                organization=professional.organization,
                professional=professional,
                client=client,
                service=service,
                start_datetime=appointment_date,
                end_datetime=appointment_date + timedelta(minutes=service.duration_minutes),
                duration_minutes=service.duration_minutes,
                price=service.price,
                status='confirmed' if i % 2 == 0 else 'pending',
                notes=f"Cita de prueba {i+1}",
                created_by=professional
            )
            appointments_created += 1
            print(f"✓ Cita creada: {appointment.start_datetime} - {appointment.client.full_name}")
    
    print(f"\nCitas creadas: {appointments_created}")
    
    # Mostrar resumen
    print("\n=== Resumen de datos de prueba ===")
    print(f"Profesional: {professional.full_name} (ID: {professional.id})")
    print(f"Cliente: {client.full_name} (ID: {client.id})")
    print(f"Servicio: {service.name} (ID: {service.id})")
    print(f"Organización: {professional.organization.name} (ID: {professional.organization.id})")
    
    # Mostrar URL de prueba
    start_date = base_date.strftime('%Y-%m-%d')
    end_date = (base_date + timedelta(days=7)).strftime('%Y-%m-%d')
    print(f"\n=== URL de prueba ===")
    print(f"GET /api/appointments/calendar/?start={start_date}&end={end_date}&professional_id={professional.id}")

else:
    print("❌ No hay suficientes datos para crear citas de prueba")
    print(f"Clientes: {clients.count()}, Servicios: {services.count()}, Profesionales: {professionals.count()}") 