# DynamoDB Schema for ReservaPlus

## Single Table Design

**Table Name:** `reservaplus-main`
- **Partition Key (PK):** String
- **Sort Key (SK):** String
- **GSI1PK:** String (Global Secondary Index 1)
- **GSI1SK:** String
- **GSI2PK:** String (Global Secondary Index 2)
- **GSI2SK:** String

## Item Types and Access Patterns

### 1. Registration Tokens (Temporary)
```json
{
  "PK": "REG#abc123token",
  "SK": "METADATA",
  "email": "user@example.com",
  "plan_id": "basic",
  "cognito_user_id": "uuid-from-cognito",
  "user_data": {
    "first_name": "John",
    "last_name": "Doe",
    "organization_name": "My Business"
  },
  "expires_at": 1703001600000,
  "created_at": 1702915200000,
  "TTL": 1703001600
}
```

### 2. User Profiles
```json
{
  "PK": "USER#cognito-user-id",
  "SK": "PROFILE",
  "GSI1PK": "EMAIL#user@example.com",
  "GSI1SK": "USER",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "organization_id": "org123",
  "role": "owner",
  "organization_name": "My Business",
  "onboarding_completed": true,
  "subscription_status": "trial",
  "trial_end": 1704124800000,
  "created_at": 1702915200000,
  "last_login": 1702915200000,
  "is_active": true
}
```

### 3. Organizations
```json
{
  "PK": "ORG#org123",
  "SK": "METADATA",
  "GSI1PK": "ORG#ACTIVE",
  "GSI1SK": "My Business",
  "name": "My Business",
  "industry_template": "salon",
  "email": "contact@mybusiness.com",
  "phone": "+1234567890",
  "address": "123 Main St",
  "city": "Santiago",
  "country": "Chile",
  "subscription_status": "trial",
  "trial_end": 1704124800000,
  "owner_user_id": "cognito-user-id",
  "created_at": 1702915200000,
  "updated_at": 1702915200000,
  "is_active": true
}
```

### 4. Organization Members
```json
{
  "PK": "ORG#org123",
  "SK": "USER#cognito-user-id",
  "GSI1PK": "USER#cognito-user-id",
  "GSI1SK": "ORG#org123",
  "user_id": "cognito-user-id",
  "email": "user@example.com",
  "role": "owner",
  "permissions": ["manage_org", "manage_users", "manage_appointments"],
  "joined_at": 1702915200000,
  "is_active": true
}
```

### 5. Professionals
```json
{
  "PK": "ORG#org123",
  "SK": "PROF#prof123",
  "GSI1PK": "PROF#org123",
  "GSI1SK": "John Smith",
  "name": "John Smith",
  "email": "john@mybusiness.com",
  "phone": "+1234567890",
  "specialty": "Hair Stylist",
  "color_code": "#4CAF50",
  "accepts_walk_ins": true,
  "is_active": true,
  "created_at": 1702915200000,
  "updated_at": 1702915200000
}
```

### 6. Services
```json
{
  "PK": "ORG#org123",
  "SK": "SERVICE#serv123",
  "GSI1PK": "SERVICE#org123",
  "GSI1SK": "Haircut",
  "name": "Haircut",
  "description": "Professional haircut service",
  "category": "Hair",
  "duration_minutes": 45,
  "price": 15000,
  "buffer_time_before": 10,
  "buffer_time_after": 10,
  "is_active": true,
  "requires_preparation": false,
  "created_at": 1702915200000,
  "updated_at": 1702915200000
}
```

### 7. Appointments
```json
{
  "PK": "ORG#org123",
  "SK": "APPT#2024-01-15#10:00#prof123",
  "GSI1PK": "PROF#prof123",
  "GSI1SK": "2024-01-15#10:00",
  "GSI2PK": "CLIENT#client123",
  "GSI2SK": "2024-01-15#10:00",
  "appointment_id": "appt123",
  "professional_id": "prof123",
  "service_id": "serv123",
  "client_id": "client123",
  "client_name": "Jane Doe",
  "client_email": "jane@example.com",
  "client_phone": "+1234567890",
  "date": "2024-01-15",
  "start_time": "10:00",
  "end_time": "10:45",
  "status": "confirmed",
  "price": 15000,
  "notes": "Regular customer",
  "created_at": 1702915200000,
  "updated_at": 1702915200000
}
```

## Query Patterns

### User-Related Queries
1. **Get user profile:** `PK = "USER#cognito-user-id" AND SK = "PROFILE"`
2. **Find user by email:** `GSI1PK = "EMAIL#user@example.com"`
3. **Get organization members:** `PK = "ORG#org123" AND SK begins_with "USER#"`

### Organization-Related Queries
1. **Get organization:** `PK = "ORG#org123" AND SK = "METADATA"`
2. **Get user's organizations:** `GSI1PK = "USER#cognito-user-id" AND GSI1SK begins_with "ORG#"`
3. **List active organizations:** `GSI1PK = "ORG#ACTIVE"`

### Professional & Service Queries
1. **Get organization professionals:** `GSI1PK = "PROF#org123"`
2. **Get organization services:** `GSI1PK = "SERVICE#org123"`

### Appointment Queries
1. **Get professional's appointments:** `GSI1PK = "PROF#prof123" AND GSI1SK between "2024-01-01" and "2024-01-31"`
2. **Get client's appointments:** `GSI2PK = "CLIENT#client123"`

## Global Secondary Indexes

### GSI1 (GSI1PK, GSI1SK)
- User lookups by email
- Organization member queries
- Professional and service queries by organization

### GSI2 (GSI2PK, GSI2SK)
- Client appointment history
- Cross-reference queries

## TTL Configuration
- Registration tokens: TTL field for automatic cleanup after 24 hours
- Temporary sessions: TTL for security