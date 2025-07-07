#!/usr/bin/env python3
"""
Script para verificar que las URLs de suscripción funcionan correctamente
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(url, method="GET", headers=None, data=None):
    """Test a specific endpoint"""
    print(f"\n🔍 Probando: {method} {url}")
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Endpoint funcionando correctamente")
            try:
                data = response.json()
                print(f"   📊 Datos recibidos: {type(data)}")
                if isinstance(data, dict) and 'message' in data:
                    print(f"   📝 Mensaje: {data['message']}")
            except:
                print("   📄 Respuesta no JSON")
        
        elif response.status_code == 404:
            print("   ❌ Endpoint no encontrado (404)")
        
        elif response.status_code == 401:
            print("   🔒 Requiere autenticación (401)")
        
        elif response.status_code == 403:
            print("   🚫 Acceso prohibido (403)")
        
        else:
            print(f"   ⚠️  Status inesperado: {response.status_code}")
        
        return response
        
    except requests.exceptions.ConnectionError:
        print("   💥 Error de conexión - ¿Está el servidor funcionando?")
        return None
    except Exception as e:
        print(f"   💥 Error: {e}")
        return None

def main():
    print("🚀 Verificación de URLs de Suscripción")
    print("=" * 50)
    
    # Test health check
    test_endpoint(f"{BASE_URL}/api/plans/health/")
    
    # Test plans list
    test_endpoint(f"{BASE_URL}/api/plans/plans/")
    
    # Test subscription endpoints (sin autenticación)
    test_endpoint(f"{BASE_URL}/api/plans/subscription/me/")
    test_endpoint(f"{BASE_URL}/api/plans/subscription/me/usage/")
    
    print("\n" + "=" * 50)
    print("📋 Resumen:")
    print("- Health check: /api/plans/health/ debería retornar 200")
    print("- Plans list: /api/plans/plans/ debería retornar 200")
    print("- Subscription endpoints: deberían retornar 401 (sin auth)")
    print("\n💡 Para probar con autenticación, logueate en el frontend")
    print("   y revisa las llamadas en la consola del navegador")

if __name__ == "__main__":
    main() 