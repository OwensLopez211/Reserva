# Integración MercadoPago para Reserva+

Esta documentación explica cómo configurar y usar la integración de MercadoPago para pagos automáticos de suscripciones en Reserva+.

## 🚀 Características Implementadas

- ✅ **Pagos recurrentes automáticos** por plan mensual/anual
- ✅ **Gestión de métodos de pago** (tarjetas de crédito/débito)
- ✅ **Webhooks automáticos** para sincronización de estados
- ✅ **Dashboard de pagos** con historial y estadísticas
- ✅ **Manejo de estados** (pendiente, aprobado, rechazado, etc.)
- ✅ **Reintentos automáticos** en caso de pagos fallidos
- ✅ **Admin interface** para gestión completa

## 🔧 Configuración Inicial

### 1. Configurar MercadoPago en el Admin

1. Accede al Django Admin: `/admin/`
2. Ve a `Payments > Configuraciones MercadoPago`
3. Crea una nueva configuración con:

```
Access Token: YOUR_ACCESS_TOKEN
Public Key: YOUR_PUBLIC_KEY
Client ID: YOUR_CLIENT_ID
Client Secret: YOUR_CLIENT_SECRET
Is Sandbox: ✅ (para testing)
Webhook URL: https://yourdomain.com/api/payments/webhook/
Auto Recurring: ✅
Retry Attempts: 3
Is Active: ✅
```

### 2. Configurar Webhooks en MercadoPago

1. Accede a tu cuenta de MercadoPago Developers
2. Ve a "Webhooks" y configura:
   - URL: `https://yourdomain.com/api/payments/webhook/`
   - Eventos: `payment`, `preapproval`

### 3. Variables de Entorno

Añade al archivo `.env`:

```env
# MercadoPago
MP_ACCESS_TOKEN=your_access_token
MP_PUBLIC_KEY=your_public_key
MP_CLIENT_ID=your_client_id
MP_CLIENT_SECRET=your_client_secret
MP_SANDBOX=True

# Frontend URLs para redirecciones
FRONTEND_URL=http://localhost:5173
```

## 📊 Modelos Implementados

### MercadoPagoConfig
Configuración global de MercadoPago.

### PaymentMethod
Métodos de pago guardados (tarjetas) por organización.

### SubscriptionPayment
Suscripciones automáticas vinculadas a OrganizationSubscription.

### Payment
Registro individual de cada pago realizado.

### WebhookEvent
Log de todos los webhooks recibidos de MercadoPago.

## 🔗 API Endpoints

### Métodos de Pago
```
GET /api/payments/payment-methods/           # Listar métodos de pago
POST /api/payments/save-payment-method/      # Guardar nuevo método
POST /api/payments/payment-methods/{id}/set_as_default/  # Establecer como default
DELETE /api/payments/payment-methods/{id}/   # Eliminar método
```

### Suscripciones
```
GET /api/payments/subscriptions/             # Listar suscripciones
POST /api/payments/create-subscription/      # Crear suscripción automática
POST /api/payments/cancel-subscription/      # Cancelar suscripción
```

### Pagos
```
GET /api/payments/payments/                  # Historial de pagos
GET /api/payments/summary/                   # Resumen estadístico
GET /api/payments/subscription-status/       # Estado de suscripción
```

### Preferencias de Pago
```
POST /api/payments/create-preference/        # Crear preferencia para pago inicial
```

### Webhooks
```
POST /api/payments/webhook/                  # Endpoint para webhooks de MP
```

## 🎯 Flujo de Integración

### 1. Setup Inicial de Pago

```typescript
import paymentService from '../services/paymentService'

// Crear preferencia de pago
const preference = await paymentService.createPaymentPreference({
  plan_id: 'plan-uuid',
  billing_cycle: 'monthly'
})

// Redirigir a MercadoPago
paymentService.redirectToCheckout(preference.preference_id, true) // true = sandbox
```

### 2. Guardar Método de Pago

```typescript
// Después del pago exitoso, guardar la tarjeta
const paymentMethod = await paymentService.savePaymentMethod({
  card_token: 'card_token_from_mp'
})
```

### 3. Crear Suscripción Automática

```typescript
// Una vez que hay método de pago, crear suscripción
const subscription = await paymentService.createSubscription({
  plan_id: 'plan-uuid',
  billing_cycle: 'monthly'
})
```

## 📱 Frontend Components

### PaymentDashboard
Componente principal que muestra:
- Estado de suscripción
- Próximo pago
- Métodos de pago guardados
- Historial de pagos

### PaymentMethodCard
Tarjeta para mostrar método de pago guardado.

### PaymentHistoryTable
Tabla con historial completo de pagos.

### SubscriptionStatus
Componente para mostrar estado actual de la suscripción.

## 🔄 Estados de Pago

### Payment Status
- `pending`: Pago pendiente
- `approved`: Pago aprobado ✅
- `authorized`: Pago autorizado ✅
- `in_process`: En proceso de pago
- `in_mediation`: En mediación
- `rejected`: Pago rechazado ❌
- `cancelled`: Pago cancelado ❌
- `refunded`: Pago reembolsado
- `charged_back`: Contracargo

### Subscription Status
- `pending`: Suscripción pendiente
- `authorized`: Suscripción activa ✅
- `paused`: Suscripción pausada ⏸️
- `cancelled`: Suscripción cancelada ❌

## 🔧 Servicios Backend

### MercadoPagoService
Servicio principal que maneja:
- Creación de customers
- Guardado de métodos de pago
- Creación de suscripciones
- Procesamiento de webhooks
- Manejo de pagos

```python
from payments.services import mercadopago_service

# Crear suscripción
subscription = mercadopago_service.create_subscription(organization_subscription)

# Cancelar suscripción
success = mercadopago_service.cancel_subscription(subscription_payment)

# Procesar webhook
mercadopago_service.process_payment_webhook(webhook_data)
```

## 🚨 Manejo de Errores

### Pagos Fallidos
- Automáticamente reintenta hasta 3 veces
- Cambia estado de suscripción a `past_due`
- Notifica al usuario via email/dashboard

### Webhooks Fallidos
- Se guardan en `WebhookEvent` con estado `failed`
- Pueden reintentarse manualmente desde el admin
- Log completo de errores para debugging

## 📊 Monitoring y Logs

### Django Admin
- Panel completo para gestionar todas las entidades
- Filtros por estado, fecha, organización
- Búsqueda por múltiples campos

### Logs
```python
import logging
logger = logging.getLogger('payments')

# Todos los eventos importantes se logean:
logger.info(f"Pago procesado: {payment.mp_payment_id}")
logger.error(f"Error procesando webhook: {str(e)}")
```

## 🧪 Testing

### Sandbox Testing
1. Usa las credenciales de sandbox de MercadoPago
2. Utiliza tarjetas de prueba de MercadoPago
3. Webhooks se pueden simular desde el dashboard de MP

### Tarjetas de Prueba
```
Visa: 4509 9535 6623 3704
Mastercard: 5031 7557 3453 0604
CVV: 123
Fecha: Cualquier fecha futura
```

## 🔐 Seguridad

### Datos Sensibles
- Los números de tarjeta completos NUNCA se guardan
- Solo se almacenan primeros 6 y últimos 4 dígitos
- Tokens de MercadoPago se usan para todos los pagos

### Webhooks
- Verificación de origen desde MercadoPago
- Procesamiento idempotente (evita duplicados)
- Rate limiting en endpoint de webhook

## 📈 Dashboard de Pagos

### Métricas Disponibles
- Total de pagos realizados
- Tasa de éxito/fallo
- Monto total recaudado
- Próximos pagos programados
- Estado de suscripciones activas

### Ejemplo de uso en Frontend
```typescript
const dashboardData = await paymentService.getPaymentDashboardData()

// Contiene:
// - summary: PaymentSummary
// - status: SubscriptionStatus  
// - paymentMethods: PaymentMethod[]
// - recentPayments: Payment[]
```

## 🚀 Deployment

### Producción
1. Cambiar `is_sandbox=False` en la configuración
2. Usar credenciales de producción de MercadoPago
3. Configurar webhook URL de producción
4. Verificar SSL en el dominio

### Variables de Entorno Producción
```env
MP_SANDBOX=False
FRONTEND_URL=https://yourproductiondomain.com
```

## 📞 Soporte

Para problemas con la integración:
1. Revisar logs en Django Admin > Webhook Events
2. Verificar configuración en MercadoPago Dashboard
3. Comprobar estado de webhooks
4. Revisar logs de aplicación para errores específicos

---

## 🎉 ¡Integración Completa!

La integración de MercadoPago está lista para manejar:
- Pagos automáticos recurrentes
- Gestión completa de suscripciones  
- Dashboard de pagos y estadísticas
- Manejo robusto de errores y reintentos
- Interfaz administrativa completa

¡Tu SaaS ahora puede cobrar automáticamente a sus clientes! 🚀