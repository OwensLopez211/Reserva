# DynamoDB Table Structure - Django Compatible

## 📋 Tabla Principal: `reservaplus-main`

### **Configuración Básica**
```yaml
TableName: reservaplus-main-{environment}
BillingMode: PAY_PER_REQUEST  # O PROVISIONED si prefieres
```

### **Atributos de Claves**
```yaml
KeySchema:
  - AttributeName: PK        # Partition Key
    KeyType: HASH
  - AttributeName: SK        # Sort Key  
    KeyType: RANGE

AttributeDefinitions:
  - AttributeName: PK
    AttributeType: S
  - AttributeName: SK
    AttributeType: S
  - AttributeName: GSI1PK
    AttributeType: S
  - AttributeName: GSI1SK
    AttributeType: S
  - AttributeName: GSI2PK
    AttributeType: S
  - AttributeName: GSI2SK
    AttributeType: S
```

### **Global Secondary Indexes (GSI)**
```yaml
GlobalSecondaryIndexes:
  - IndexName: GSI1
    KeySchema:
      - AttributeName: GSI1PK
        KeyType: HASH
      - AttributeName: GSI1SK
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
      
  - IndexName: GSI2
    KeySchema:
      - AttributeName: GSI2PK
        KeyType: HASH
      - AttributeName: GSI2SK
        KeyType: RANGE
    Projection:
      ProjectionType: ALL
```

### **TTL Configuration**
```yaml
TimeToLiveSpecification:
  AttributeName: TTL
  Enabled: true
```

## 🎯 Mapeo de Entidades Django → DynamoDB

### **1. PLANES DE SUSCRIPCIÓN**
```javascript
// Django Model: Plan
// DynamoDB Item:
{
  "PK": "PLANS#ACTIVE",
  "SK": "PLAN#{plan_id}",
  "GSI1PK": "PLAN#TYPE#{category}",
  "GSI1SK": "ORDER#{display_order}",
  
  // Campos del modelo Django
  "plan_id": "basico",
  "name": "Plan Básico", 
  "slug": "plan-basico",
  "description": "Ideal para empezar",
  "price_monthly": 0,
  "price_yearly": 0,
  "original_price": null,
  "discount_percentage": 0,
  "discount_text": "",
  "currency": "CLP",
  "billing_cycle": "monthly",
  
  // Features del plan
  "features": [
    "50 citas por mes",
    "1 profesional",
    "3 servicios"
  ],
  "limits": {
    "appointments_per_month": 50,
    "professionals": 1,
    "services": 3,
    "locations": 1
  },
  
  // UI/UX
  "is_popular": false,
  "is_featured": false,
  "is_coming_soon": false,
  "is_active": true,
  "badge_text": "Gratis",
  "color_scheme": "emerald",
  "display_order": 1,
  
  // Metadatos
  "created_at": 1703001600000,
  "updated_at": 1703001600000,
  "created_by": "admin",
  "version": "1.0"
}
```

### **2. TOKENS DE REGISTRO**
```javascript
// Django Model: UserRegistration
// DynamoDB Item:
{
  "PK": "REG#{token}",
  "SK": "METADATA",
  "TTL": 1703088000,  // Auto-expire en 24 horas
  
  // Campos del modelo Django
  "registration_token": "abc123...",
  "email": "user@example.com",
  "plan_id": "profesional",
  "status": "pending",
  
  // Datos del usuario
  "user_data": {
    "first_name": "Juan",
    "last_name": "Pérez", 
    "organization_name": "Mi Negocio",
    "phone": "+56912345678",
    "password_hash": "hashed_password"
  },
  
  // Cognito integration
  "cognito_user_id": "uuid-from-cognito",
  "cognito_username": "user@example.com",
  
  // Tracking
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "referrer": "https://...",
  
  // Timestamps
  "created_at": 1703001600000,
  "expires_at": 1703088000000,
  "completed_at": null,
  "is_expired": false,
  "is_completed": false
}
```

### **3. USUARIOS**
```javascript
// Django Model: User + Profile
// DynamoDB Item:
{
  "PK": "USER#{cognito_user_id}",
  "SK": "PROFILE",
  "GSI1PK": "EMAIL#{email}",
  "GSI1SK": "USER",
  "GSI2PK": "ORG#{organization_id}",
  "GSI2SK": "USER#{user_id}",
  
  // Campos básicos del usuario
  "user_id": "cognito-uuid",
  "email": "user@example.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "full_name": "Juan Pérez",
  "phone": "+56912345678",
  
  // Organización
  "organization_id": "org_123",
  "organization_name": "Mi Negocio",
  "role": "owner",  // owner, admin, professional, reception
  "permissions": [
    "manage_org",
    "manage_users", 
    "manage_appointments",
    "manage_services"
  ],
  
  // Estado de onboarding
  "onboarding_completed": true,
  "onboarding_step": 5,
  "completed_steps": ["plan", "register", "team", "services", "organization"],
  
  // Suscripción
  "subscription_status": "trial", // trial, active, suspended, cancelled
  "subscription_plan": "profesional",
  "trial_start": 1703001600000,
  "trial_end": 1704124800000,
  "subscription_start": null,
  "subscription_end": null,
  
  // Metadatos
  "is_active": true,
  "is_verified": true,
  "timezone": "America/Santiago",
  "language": "es",
  "created_at": 1703001600000,
  "updated_at": 1703001600000,
  "last_login": 1703001600000
}
```

### **4. ORGANIZACIONES**
```javascript
// Django Model: Organization
// DynamoDB Item:
{
  "PK": "ORG#{org_id}",
  "SK": "METADATA",
  "GSI1PK": "ORG#ACTIVE",
  "GSI1SK": "{name}",
  "GSI2PK": "INDUSTRY#{industry}",
  "GSI2SK": "{name}",
  
  // Información básica
  "organization_id": "org_123",
  "name": "Mi Salón de Belleza",
  "slug": "mi-salon-belleza",
  "legal_name": "Mi Salón de Belleza SPA",
  "tax_id": "12345678-9",
  "industry_template": "salon",
  "business_type": "salon",
  
  // Contacto
  "email": "contacto@minalon.cl",
  "phone": "+56912345678",
  "website": "https://minalon.cl",
  
  // Dirección
  "address": "Av. Principal 123",
  "city": "Santiago",
  "state": "Región Metropolitana", 
  "postal_code": "12345",
  "country": "CL",
  "timezone": "America/Santiago",
  
  // Configuración
  "currency": "CLP",
  "language": "es",
  "date_format": "DD/MM/YYYY",
  "time_format": "24h",
  
  // Suscripción y límites
  "subscription_plan": "profesional",
  "subscription_status": "trial",
  "subscription_limits": {
    "professionals": 5,
    "services": -1,  // unlimited
    "appointments_per_month": -1,
    "locations": 1
  },
  
  // Trial info
  "trial_start": 1703001600000,
  "trial_end": 1704124800000,
  "trial_days_remaining": 14,
  
  // Owner info
  "owner_user_id": "cognito-uuid",
  "owner_email": "owner@minalon.cl",
  
  // Estado
  "is_active": true,
  "is_verified": false,
  "setup_completed": true,
  "onboarding_completed": true,
  
  // Metadatos
  "created_at": 1703001600000,
  "updated_at": 1703001600000,
  "created_by": "cognito-uuid"
}
```

### **5. PROFESIONALES**
```javascript
// Django Model: Professional
// DynamoDB Item:
{
  "PK": "ORG#{org_id}",
  "SK": "PROF#{professional_id}",
  "GSI1PK": "PROF#{org_id}",
  "GSI1SK": "{name}",
  "GSI2PK": "EMAIL#{email}",
  "GSI2SK": "PROF",
  
  // Información básica
  "professional_id": "prof_123",
  "name": "María González",
  "email": "maria@minalon.cl",
  "phone": "+56987654321",
  "specialty": "Estilista Senior",
  "bio": "10 años de experiencia...",
  
  // Configuración visual
  "color_code": "#4CAF50",
  "avatar_url": "https://...",
  
  // Configuración de trabajo
  "accepts_walk_ins": true,
  "accepts_online_booking": true,
  "requires_confirmation": false,
  "advance_booking_days": 30,
  
  // Servicios que ofrece
  "services": ["serv_1", "serv_2", "serv_3"],
  "service_categories": ["cabello", "color"],
  
  // Horarios de trabajo
  "working_hours": {
    "monday": {"start": "09:00", "end": "18:00", "breaks": [{"start": "13:00", "end": "14:00"}]},
    "tuesday": {"start": "09:00", "end": "18:00", "breaks": []},
    // ... resto de días
  },
  
  // Estado
  "is_active": true,
  "is_available": true,
  "employment_type": "employee", // employee, contractor, owner
  
  // Metadatos
  "created_at": 1703001600000,
  "updated_at": 1703001600000,
  "created_by": "cognito-uuid"
}
```

### **6. SERVICIOS**
```javascript
// Django Model: Service
// DynamoDB Item:
{
  "PK": "ORG#{org_id}",
  "SK": "SERVICE#{service_id}",
  "GSI1PK": "SERVICE#{org_id}",
  "GSI1SK": "{category}#{name}",
  "GSI2PK": "CATEGORY#{category}",
  "GSI2SK": "{name}",
  
  // Información básica
  "service_id": "serv_123",
  "name": "Corte de Cabello",
  "description": "Corte personalizado según tu estilo",
  "category": "cabello",
  "subcategory": "cortes",
  
  // Pricing
  "price": 15000,
  "currency": "CLP",
  "price_type": "fixed", // fixed, variable, starting_at
  "original_price": null,
  "discount_percentage": 0,
  
  // Duración y buffer
  "duration_minutes": 45,
  "buffer_time_before": 10,
  "buffer_time_after": 10,
  "cleanup_time": 5,
  
  // Configuración
  "requires_preparation": false,
  "requires_consultation": false,
  "max_advance_booking_days": 30,
  "min_advance_booking_hours": 2,
  
  // Disponibilidad
  "is_active": true,
  "is_online_bookable": true,
  "is_walk_in_available": true,
  
  // Profesionales que lo ofrecen
  "professionals": ["prof_1", "prof_2"],
  "default_professional": "prof_1",
  
  // Recursos necesarios
  "resources_required": [],
  "equipment_needed": [],
  
  // Metadatos
  "created_at": 1703001600000,
  "updated_at": 1703001600000,
  "created_by": "cognito-uuid"
}
```

## 🔧 Queries Principales

### **Obtener planes activos**
```javascript
// Query: PK = "PLANS#ACTIVE"
dynamodb.query({
  KeyConditionExpression: 'PK = :pk',
  ExpressionAttributeValues: { ':pk': 'PLANS#ACTIVE' }
})
```

### **Obtener usuario por email**
```javascript
// Query GSI1: GSI1PK = "EMAIL#user@example.com"
dynamodb.query({
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :email',
  ExpressionAttributeValues: { ':email': 'EMAIL#user@example.com' }
})
```

### **Obtener profesionales de una organización**
```javascript
// Query: PK = "ORG#org_123" AND SK begins_with "PROF#"
dynamodb.query({
  KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
  ExpressionAttributeValues: { 
    ':pk': 'ORG#org_123',
    ':sk': 'PROF#'
  }
})
```

## 📊 Capacidad y Costos

### **Estimación Free Tier**
- **Almacenamiento**: 25 GB gratis
- **Read Capacity**: 25 RCU gratis  
- **Write Capacity**: 25 WCU gratis
- **Costo estimado**: $0/mes dentro del free tier

### **Escalabilidad**
- **PAY_PER_REQUEST**: Ideal para comenzar
- **Auto Scaling**: Se ajusta automáticamente
- **Global Tables**: Para múltiples regiones (futuro)