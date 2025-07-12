# test_db_connection.py
# Ejecutar este script para verificar que todo funciona

import os
import sys
import django
from django.conf import settings
from django.db import connection
from django.core.cache import cache
import redis

def test_database():
    """Probar conexión a PostgreSQL"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print("✅ PostgreSQL conectado correctamente")
            print(f"   Versión: {version}")
            
            # Probar que podemos crear tablas
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS test_table (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100)
                );
            """)
            cursor.execute("DROP TABLE IF EXISTS test_table;")
            print("✅ Permisos de creación/eliminación de tablas OK")
            
    except Exception as e:
        print(f"❌ Error en PostgreSQL: {e}")
        return False
    return True

def test_redis():
    """Probar conexión a Redis"""
    try:
        # Probar cache de Django
        cache.set('test_key', 'test_value', 30)
        value = cache.get('test_key')
        if value == 'test_value':
            print("✅ Redis (Django Cache) conectado correctamente")
        
        # Probar conexión directa
        r = redis.Redis(host='localhost', port=6379, db=1)
        r.ping()
        print("✅ Redis (directo) conectado correctamente")
        
    except Exception as e:
        print(f"❌ Error en Redis: {e}")
        return False
    return True

def test_environment():
    """Verificar variables de entorno"""
    required_vars = [
        'SECRET_KEY', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Variables de entorno faltantes: {missing_vars}")
        return False
    else:
        print("✅ Variables de entorno configuradas correctamente")
        return True

if __name__ == "__main__":
    print("🔍 Probando configuración de ReservaPlus...")
    print("=" * 50)
    
    # Configurar Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'reservaplus_backend.settings')
    django.setup()
    
    # Ejecutar pruebas
    env_ok = test_environment()
    db_ok = test_database()
    redis_ok = test_redis()
    
    print("=" * 50)
    if all([env_ok, db_ok, redis_ok]):
        print("🎉 ¡Todo configurado correctamente! Listo para desarrollar.")
    else:
        print("⚠️  Hay problemas en la configuración. Revisa los errores arriba.")
        sys.exit(1)