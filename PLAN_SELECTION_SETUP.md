# Plan Selection Setup - AWS Lambda

## 🎯 Objetivo

Migrar la funcionalidad de selección de planes desde Django hacia AWS Lambda + DynamoDB.

## ✅ Cambios Implementados

### 1. **Lambda Function Creada**
```
📁 aws-lambda/functions/plans/get-available-plans.js
```
- **Endpoint**: `GET /plans/available`
- **Función**: Obtiene planes desde DynamoDB o devuelve planes por defecto
- **Sin autenticación**: Público para la selección inicial

### 2. **Frontend Actualizado**
```
📁 reservaplus_frontend/src/services/onboardingService.ts
```
- Método `getAvailablePlans()` ahora usa AWS Lambda
- Usa `fetch` nativo en lugar de API Django

### 3. **SAM Template Actualizado**
```
📁 aws-lambda/template.yaml
```
- Nueva función `GetAvailablePlansFunction`
- Endpoint configurado en API Gateway

### 4. **Scripts de Población** (Opcional)
```
📁 aws-lambda/scripts/populate-plans.js
```
- Script para poblar DynamoDB con planes
- Planes por defecto incluidos en Lambda como fallback

## 🚀 Pasos de Implementación

### Paso 1: Deploy de la Infrastructure

```bash
cd aws-lambda

# Build y deploy
sam build
sam deploy
```

### Paso 2: (Opcional) Poblar DynamoDB con Planes

```bash
cd aws-lambda/scripts
npm install

# Configurar variables de entorno
export TABLE_NAME="reservaplus-dev"  # Usar el nombre de tu tabla
export AWS_REGION="us-east-1"       # Tu región

# Ejecutar script
node populate-plans.js
```

### Paso 3: Configurar Frontend

Asegúrate de que tu `.env` tenga:
```env
VITE_API_GATEWAY_URL=https://tu-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
```

### Paso 4: Probar

```bash
cd reservaplus_frontend
npm run dev

# Ir a: http://localhost:3000/onboarding/plan
```

## 📊 Estructura de Datos - DynamoDB

### Planes (Opcional - si quieres almacenar en DynamoDB)
```json
{
  "PK": "PLANS#ACTIVE",
  "SK": "PLAN#basico", 
  "plan_id": "basico",
  "name": "Plan Básico",
  "price_monthly": 0,
  "price_yearly": 0,
  "description": "Ideal para empezar tu negocio",
  "features": ["50 citas/mes", "1 profesional", "..."],
  "is_popular": false,
  "is_coming_soon": false,
  "badge_text": "Gratis",
  "color_scheme": "emerald",
  "display_order": 1
}
```

## 🔧 API Response Format

La Lambda function devuelve el mismo formato que esperaba tu frontend:

```json
{
  "results": [
    {
      "id": "basico",
      "name": "Plan Básico", 
      "price_monthly": 0,
      "price_yearly": 0,
      "description": "Ideal para empezar tu negocio",
      "features": ["..."],
      "is_popular": false,
      "color_scheme": "emerald"
    }
  ],
  "count": 3
}
```

## 🧪 Testing

### Test Local (con SAM)
```bash
# Probar Lambda localmente
sam local start-api

# Test endpoint
curl http://localhost:3000/plans/available
```

### Test en AWS
```bash
# Obtener URL de API Gateway desde outputs
sam list stack-outputs

# Test directo
curl https://your-api-gateway-url/dev/plans/available
```

## ✨ Ventajas de este Approach

1. **🚀 Serverless**: No servidores que mantener
2. **💰 Económico**: Solo pagas por requests
3. **📈 Escalable**: Se ajusta automáticamente
4. **🔧 Flexible**: Planes hardcoded + DynamoDB opcional
5. **🔄 Compatible**: Mismo formato de respuesta

## 🎯 Siguientes Pasos

Una vez que esto funcione, podemos continuar con:

1. **Registro de usuario** (ya implementado)
2. **Team setup** 
3. **Services setup**
4. **Organization config**
5. **Completion**

¡Tu `PlanSelectionPage.tsx` funcionará exactamente igual pero ahora usando AWS Lambda! 🎉