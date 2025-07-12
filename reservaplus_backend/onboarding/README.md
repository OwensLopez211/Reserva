# Módulo de Onboarding - ReservaPlus

## 📋 Descripción

El módulo de onboarding refactorizado proporciona una arquitectura modular y mantenible para el proceso de incorporación de nuevos usuarios y organizaciones en ReservaPlus. 

## 🏗️ Arquitectura

### Estructura del módulo:
```
onboarding/
├── __init__.py           # Exportaciones del módulo
├── apps.py              # Configuración de la app
├── exceptions.py        # Excepciones personalizadas
├── managers.py          # Orquestador principal
├── services.py          # Servicios específicos por entidad
├── validators.py        # Validadores centralizados
├── views.py             # Vistas de la API
├── urls.py              # URLs del módulo
├── tests.py             # Tests unitarios
└── README.md            # Esta documentación
```

## 🔧 Componentes Principales

### 1. OnboardingManager
**Archivo**: `managers.py`

Orquestador principal que coordina todo el proceso de onboarding:
- Validación de datos
- Ejecución de pasos en orden
- Manejo de transacciones
- Rollback automático en caso de error

### 2. Servicios Especializados
**Archivo**: `services.py`

Cada servicio se encarga de crear un tipo específico de entidad:
- `UserCreationService`: Creación de usuarios
- `OrganizationCreationService`: Creación de organizaciones
- `ProfessionalCreationService`: Creación de profesionales
- `ServiceCreationService`: Creación de servicios
- `SubscriptionCreationService`: Creación de suscripciones
- `OnboardingCleanupService`: Limpieza en caso de error

### 3. Validadores Centralizados
**Archivo**: `validators.py`

Validación estructurada de todos los datos:
- Validación de tokens
- Validación de datos de organización
- Validación de profesionales
- Validación de servicios
- Verificación de límites del plan

### 4. Excepciones Personalizadas
**Archivo**: `exceptions.py`

Manejo granular de errores:
- `OnboardingError`: Excepción base
- `OnboardingValidationError`: Errores de validación
- `OnboardingLimitError`: Errores de límites
- `OnboardingTokenError`: Errores de token
- `OnboardingDuplicateError`: Errores de duplicados

## 🚀 Uso

### Completar Onboarding
```python
from onboarding.managers import OnboardingManager

# Datos del onboarding
onboarding_data = {
    'registration_token': 'token-temporal',
    'organization': {
        'name': 'Mi Salón',
        'industry_template': 'salon',
        'email': 'info@misalon.com',
        'phone': '+56912345678'
    },
    'professionals': [
        {
            'name': 'Ana García',
            'email': 'ana@misalon.com',
            'role': 'professional'
        }
    ],
    'services': [
        {
            'name': 'Corte de Cabello',
            'price': 15000,
            'duration_minutes': 45
        }
    ]
}

# Ejecutar onboarding
manager = OnboardingManager()
result = manager.complete_onboarding(onboarding_data)
```

### Validar Datos
```python
from onboarding.managers import OnboardingManager

# Solo validar sin ejecutar
result = OnboardingManager.validate_onboarding_data(onboarding_data)
if result['valid']:
    print("Datos válidos")
else:
    print("Errores:", result['error'])
```

## 📡 Endpoints de la API

### POST /api/core/onboarding/complete/
Completar el proceso de onboarding completo.

**Payload:**
```json
{
  "registration_token": "token-temporal",
  "organization": {
    "name": "Mi Salón",
    "industry_template": "salon",
    "email": "info@misalon.com",
    "phone": "+56912345678"
  },
  "professionals": [
    {
      "name": "Ana García",
      "email": "ana@misalon.com",
      "role": "professional"
    }
  ],
  "services": [
    {
      "name": "Corte de Cabello",
      "price": 15000,
      "duration_minutes": 45
    }
  ]
}
```

### POST /api/core/onboarding/validate/
Validar datos de onboarding sin ejecutar el proceso.

### GET /api/core/onboarding/health/
Health check del servicio de onboarding.

## 🧪 Tests

### Ejecutar Tests
```bash
# Todos los tests del módulo
python manage.py test onboarding

# Tests específicos
python manage.py test onboarding.tests.OnboardingManagerTest
python manage.py test onboarding.tests.OnboardingValidatorTest
python manage.py test onboarding.tests.OnboardingAPITest
```

### Cobertura de Tests
- ✅ Validación de tokens
- ✅ Validación de datos de organización
- ✅ Validación de profesionales
- ✅ Validación de servicios
- ✅ Verificación de límites del plan
- ✅ Proceso completo de onboarding
- ✅ Manejo de errores
- ✅ API endpoints

## 🔍 Logging

El módulo usa logging estructurado:
```python
import logging
logger = logging.getLogger('onboarding')

# Logs disponibles
logger.info("🚀 Starting onboarding process")
logger.warning("⚠️ Validation error")
logger.error("❌ Onboarding failed")
```

## 🛠️ Configuración

### Agregar a INSTALLED_APPS
```python
# settings.py
INSTALLED_APPS = [
    # ... otras apps
    'onboarding',
]
```

### Configurar URLs
```python
# urls.py
urlpatterns = [
    # ... otras URLs
    path('api/core/onboarding/', include('onboarding.urls')),
]
```

## 📈 Mejoras Implementadas

### ✅ Antes (Vista monolítica)
- Una sola vista de 244 líneas
- Lógica mezclada
- Manejo de errores básico
- Logging manual con prints
- Transacciones complejas
- Difícil de mantener y testear

### ✅ Después (Arquitectura modular)
- Módulo separado con responsabilidades claras
- Servicios especializados por entidad
- Manejo de errores granular
- Logging estructurado
- Validaciones centralizadas
- Rollback automático
- Tests comprehensivos
- Fácil de mantener y extender

## 🚀 Ventajas de la Refactorización

1. **Mantenibilidad**: Código organizado en módulos específicos
2. **Testabilidad**: Cada componente se puede testear independientemente
3. **Escalabilidad**: Fácil agregar nuevos pasos o validaciones
4. **Robustez**: Manejo de errores granular y rollback automático
5. **Observabilidad**: Logging estructurado para debugging
6. **Reutilización**: Servicios pueden usarse en otros contextos

## 🔄 Compatibilidad

El módulo mantiene **compatibilidad completa** con el frontend existente:
- Mismo endpoint: `/api/core/onboarding/complete/`
- Mismo formato de request
- Mismo formato de response
- Mismos códigos de estado HTTP

## 📚 Próximos Pasos

1. **Monitoring**: Agregar métricas de performance
2. **Caching**: Implementar cache para validaciones
3. **Async**: Considerar procesamiento asíncrono
4. **Webhooks**: Notificaciones de eventos de onboarding
5. **Recovery**: Herramientas para recuperación de procesos fallidos 