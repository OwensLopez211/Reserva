#!/usr/bin/env python3
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from users.views import get_chile_local_time
import pytz

print("=== PRUEBA DE LAST_LOGIN EN HORA LOCAL ===")
print()

# Obtener horas actuales
utc_now = timezone.now()
chile_local = get_chile_local_time()
chile_tz = pytz.timezone('America/Santiago')
chile_with_tz = utc_now.astimezone(chile_tz)

print("=== COMPARACIÓN DE HORAS ===")
print(f"UTC ahora: {utc_now}")
print(f"Chile con timezone: {chile_with_tz}")
print(f"Chile local (naive): {chile_local}")
print(f"Diferencia UTC vs Local: {utc_now.hour - chile_local.hour} horas")
print()

# Simular actualización de last_login
User = get_user_model()
print("=== SIMULACIÓN DE LAST_LOGIN ===")

user = User.objects.first()
if user:
    old_last_login = user.last_login
    old_last_login_local = user.last_login_local
    print(f"Usuario: {user.username}")
    print(f"Last login anterior (UTC): {old_last_login}")
    print(f"Last login local anterior: {old_last_login_local}")
    print()
    
    # Simular actualización (como en LoginView)
    user.last_login = timezone.now()  # UTC
    user.last_login_local = get_chile_local_time()  # Local
    user.save(update_fields=['last_login', 'last_login_local'])
    
    print(f"Last login nuevo (UTC): {user.last_login}")
    print(f"Last login local nuevo: {user.last_login_local}")
    print(f"Tipo de last_login_local: {type(user.last_login_local)}")
    print()
    
    # Verificar que se guardó correctamente
    user.refresh_from_db()
    print(f"Verificación desde DB (UTC): {user.last_login}")
    print(f"Verificación desde DB (local): {user.last_login_local}")
    
    # Comparar con hora actual
    hora_chile_actual = get_chile_local_time()
    print(f"Hora actual Chile: {hora_chile_actual}")
    print(f"Last login guardado: {user.last_login_local}")
    
    # Verificar que las horas son similares (parsing simple)
    if user.last_login_local and hora_chile_actual:
        from datetime import datetime
        try:
            saved_time = datetime.strptime(user.last_login_local, '%Y-%m-%d %H:%M:%S')
            current_time = datetime.strptime(hora_chile_actual, '%Y-%m-%d %H:%M:%S')
            diferencia = abs((saved_time - current_time).total_seconds())
            print(f"Diferencia: {diferencia:.2f} segundos")
            
            if diferencia < 60:  # Menos de 1 minuto
                print("✅ El last_login_local se está guardando correctamente en hora de Chile")
            else:
                print("❌ Hay diferencia significativa")
        except ValueError as e:
            print(f"❌ Error parsing fechas: {e}")
    else:
        print("❌ Falta información para comparar")
        
else:
    print("No hay usuarios en la base de datos") 