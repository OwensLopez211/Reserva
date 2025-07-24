# ReservaPlus - AWS Serverless Migration Plan

## 🎯 Migration Overview

Transform ReservaPlus from Django + PostgreSQL to serverless AWS architecture using:
- **AWS Lambda** (API backend)
- **Amazon DynamoDB** (database)
- **API Gateway** (REST API)
- **AWS Cognito** (authentication & user management)
- **S3 + CloudFront** (frontend + file storage)
- **SES** (email notifications)
- **EventBridge** (scheduled tasks)

## 📊 Cost Analysis (Monthly FREE Tier Limits)

| Service | Free Tier | Current Usage Est. | Monthly Cost |
|---------|-----------|-------------------|--------------|
| Lambda | 1M requests + 400K GB-seconds | ~500K requests | **$0** |
| DynamoDB | 25GB + 25 WCU/RCU + 2.5M reads | ~15GB + moderate usage | **$0** |
| S3 | 5GB + 20K GET + 2K PUT | ~3GB + low traffic | **$0** |
| CloudFront | 50GB transfer + 2M requests | ~20GB | **$0** |
| API Gateway | 1M calls/month | ~500K calls | **$0** |
| Cognito | 50K MAU (Monthly Active Users) | ~1K users | **$0** |
| Route 53 | $0.50/hosted zone | 1 domain | **$0.50** |
| SES | 62K emails/month | ~5K emails | **$0** |
| **Total Monthly Cost** | | | **$0.50** |

## 🏗️ Migration Strategy (4 Phases)

### Phase 1: Infrastructure Setup + API Gateway (Weeks 1-2)
**Goal:** Create AWS foundation and migrate API layer while keeping PostgreSQL

#### Tasks:
1. **AWS Account Setup**
   - Configure IAM roles and policies
   - Setup development/staging/production environments
   - Install AWS CLI and SAM CLI

2. **Cognito User Pool Setup**
   - Create Cognito User Pool for organization users
   - Configure user attributes (organization_id, role, etc.)
   - Setup Cognito Identity Pool for temporary credentials
   - Configure pre/post authentication triggers

3. **API Gateway + Lambda Foundation**
   - Create API Gateway REST API
   - Setup Cognito authorizer for authentication
   - Create base Lambda functions structure
   - Implement CORS and error handling

4. **Django to Lambda Migration (Keep DB)**
   - Convert Django views to Lambda functions
   - Replace Django authentication with Cognito tokens
   - Maintain Django ORM with RDS PostgreSQL (temporary)
   - Implement Lambda layers for shared code

#### Expected Outcome:
- Functional API on AWS Lambda + API Gateway
- Cognito-based authentication fully integrated
- All endpoints working with existing database
- 90% feature parity with Django backend

### Phase 2: DynamoDB Design + Data Migration (Weeks 3-4)
**Goal:** Design and implement DynamoDB schema with zero-downtime migration

#### Tasks:
1. **DynamoDB Schema Design**
   - Single-table design for multi-tenant architecture
   - Global Secondary Indexes (GSI) for query patterns
   - Item collections and access patterns

2. **Data Access Layer**
   - Create DynamoDB client wrappers
   - Implement data access patterns
   - Build query and scan operations
   - Setup local DynamoDB for development

3. **Data Migration**
   - Create migration scripts (PostgreSQL → DynamoDB)
   - Implement dual-write pattern for zero downtime
   - Data validation and consistency checks
   - Gradual traffic shift from PostgreSQL to DynamoDB

#### Expected Outcome:
- Complete DynamoDB schema implementation
- All data migrated successfully
- PostgreSQL decommissioned

### Phase 3: Background Jobs + Event-Driven Architecture (Week 5)
**Goal:** Replace Django management commands with serverless event processing

#### Tasks:
1. **EventBridge Scheduled Rules**
   - Daily payment processing
   - Counter synchronization
   - Cleanup tasks

2. **SQS + Lambda for Webhooks**
   - MercadoPago webhook processing
   - Email notification queues
   - Dead letter queues for error handling

3. **SES Email Integration**
   - Replace Django email backend
   - Template management
   - Bounce/complaint handling

#### Expected Outcome:
- All background tasks running serverless
- Robust error handling and retries
- Email system fully functional

### Phase 4: Frontend + File Management (Week 6)
**Goal:** Deploy React frontend to S3/CloudFront and migrate file uploads

#### Tasks:
1. **S3 + CloudFront Setup**
   - Deploy React app to S3
   - Configure CloudFront distribution
   - Setup SSL certificates (ACM)
   - Route 53 DNS configuration

2. **File Upload Migration**
   - Client files to S3 with presigned URLs
   - Image processing with Lambda
   - CDN optimization for static assets

#### Expected Outcome:
- Complete serverless architecture
- Production-ready deployment
- Full feature parity with Django version

## 🗄️ DynamoDB Schema Design

### Single Table Design
```
Table: reservaplus-main
Partition Key: PK (string)
Sort Key: SK (string)
GSI1: GSI1PK, GSI1SK
GSI2: GSI2PK, GSI2SK
```

### Item Types and Access Patterns

#### Organizations
```javascript
PK: "ORG#orgId"
SK: "METADATA"
GSI1PK: "ORG#ACTIVE"
GSI1SK: "orgName"
Data: { name, industry, subscription, limits, ... }
```

#### Users (Synced from Cognito)
```javascript
PK: "ORG#orgId"
SK: "USER#cognitoUserId"
GSI1PK: "USER#email"
GSI1SK: "ORG#orgId"
Data: { cognitoUserId, email, role, profile, ... }
```

#### Professionals
```javascript
PK: "ORG#orgId"
SK: "PROF#profId"
GSI1PK: "PROF#orgId"
GSI1SK: "name"
Data: { name, services, schedule, active, ... }
```

#### Appointments
```javascript
PK: "ORG#orgId"
SK: "APPT#date#time#profId"
GSI1PK: "PROF#profId"
GSI1SK: "date#time"
GSI2PK: "CLIENT#clientId"
GSI2SK: "date#time"
Data: { client, service, status, ... }
```

### Query Patterns
1. **Get org data:** `PK = "ORG#orgId" AND SK = "METADATA"`
2. **Get org users:** `PK = "ORG#orgId" AND SK begins_with "USER#"`
3. **Get appointments by date:** `GSI1PK = "PROF#profId" AND GSI1SK between "2024-01-01" and "2024-01-31"`
4. **Find user by email:** `GSI1PK = "USER#email@domain.com"`

## 🔧 Lambda Functions Architecture

### API Functions (Python 3.12)
```
lambda/
├── cognito_triggers/     # Pre/post authentication triggers
├── auth/                # Registration, password reset (Cognito integration)
├── organizations/       # CRUD operations
├── professionals/       # Professional management
├── appointments/        # Booking system
├── availability/        # Schedule availability
├── payments/           # MercadoPago integration
├── clients/            # Client management
└── onboarding/         # User onboarding
```

### Background Functions
```
lambda/background/
├── process_payments/    # Daily payment processing
├── webhook_handler/     # MercadoPago webhooks
├── email_sender/       # SES email notifications
├── cleanup_tasks/      # Data maintenance
└── sync_counters/      # Usage counter sync
```

### Shared Layers
```
layers/
├── common/             # Utilities, constants
├── dynamodb/           # DynamoDB client wrapper
├── cognito/            # Cognito authentication helpers
└── external/           # Third-party integrations
```

## 📡 API Gateway Structure

### Endpoints Mapping
```
# Authentication (Cognito integration)
POST   /auth/register                 → lambda/auth (+ Cognito)
POST   /auth/confirm                  → lambda/auth (+ Cognito)
POST   /auth/forgot-password          → lambda/auth (+ Cognito)
POST   /auth/reset-password           → lambda/auth (+ Cognito)

GET    /organizations                 → lambda/organizations
POST   /organizations                 → lambda/organizations
PUT    /organizations/{id}            → lambda/organizations

GET    /professionals                 → lambda/professionals
POST   /professionals                 → lambda/professionals
PUT    /professionals/{id}            → lambda/professionals

GET    /appointments                  → lambda/appointments
POST   /appointments                  → lambda/appointments
PUT    /appointments/{id}             → lambda/appointments

GET    /availability/{profId}/{date}  → lambda/availability
POST   /availability/smart           → lambda/availability

POST   /payments/webhook             → lambda/payments
GET    /payments/methods             → lambda/payments

# Public endpoints (no auth)
GET    /public/organizations/{slug}   → lambda/organizations
POST   /public/booking               → lambda/appointments
```

### Authentication
- **Cognito User Pool Authorizer** validates all protected endpoints
- **Organization-based isolation** via custom user attributes
- **Role-based permissions** (Owner, Admin, Professional, Reception) in custom attributes
- **Pre/Post authentication triggers** for user validation and data sync

## 🔐 AWS Cognito Configuration

### User Pool Setup
```json
{
  "UserPoolName": "reservaplus-users",
  "Schema": [
    {
      "Name": "email",
      "AttributeDataType": "String",
      "Required": true,
      "Mutable": true
    },
    {
      "Name": "organization_id",
      "AttributeDataType": "String",
      "DeveloperOnlyAttribute": false,
      "Mutable": true,
      "Required": false
    },
    {
      "Name": "role",
      "AttributeDataType": "String",
      "DeveloperOnlyAttribute": false,
      "Mutable": true,
      "Required": false
    },
    {
      "Name": "organization_name",
      "AttributeDataType": "String",
      "DeveloperOnlyAttribute": false,
      "Mutable": true,
      "Required": false
    }
  ],
  "UsernameAttributes": ["email"],
  "AutoVerifiedAttributes": ["email"],
  "PasswordPolicy": {
    "MinimumLength": 8,
    "RequireUppercase": true,
    "RequireLowercase": true,
    "RequireNumbers": true,
    "RequireSymbols": false
  }
}
```

### Lambda Triggers
```python
# Pre Authentication Trigger
def pre_auth_handler(event, context):
    """Validate user belongs to active organization"""
    user_attrs = event['request']['userAttributes']
    org_id = user_attrs.get('custom:organization_id')
    
    # Validate organization is active
    if not validate_organization_active(org_id):
        raise Exception("Organization is inactive")
    
    return event

# Post Authentication Trigger  
def post_auth_handler(event, context):
    """Sync user data to DynamoDB after successful login"""
    user_attrs = event['request']['userAttributes']
    
    # Sync user data to DynamoDB
    sync_user_to_dynamodb({
        'cognito_user_id': event['userName'],
        'email': user_attrs['email'],
        'organization_id': user_attrs.get('custom:organization_id'),
        'role': user_attrs.get('custom:role'),
        'last_login': datetime.utcnow().isoformat()
    })
    
    return event
```

### User Registration Flow
```python
# Lambda function for organization signup
def register_organization(event, context):
    """Register new organization and admin user"""
    body = json.loads(event['body'])
    
    # 1. Create organization in DynamoDB
    org_id = create_organization(body['organization'])
    
    # 2. Create admin user in Cognito
    cognito_client.admin_create_user(
        UserPoolId=USER_POOL_ID,
        Username=body['email'],
        UserAttributes=[
            {'Name': 'email', 'Value': body['email']},
            {'Name': 'custom:organization_id', 'Value': org_id},
            {'Name': 'custom:role', 'Value': 'owner'},
            {'Name': 'custom:organization_name', 'Value': body['organization']['name']}
        ],
        TemporaryPassword=generate_temp_password(),
        MessageAction='SUPPRESS'  # Send custom welcome email
    )
    
    # 3. Send custom welcome email with SES
    send_welcome_email(body['email'], temp_password, org_id)
    
    return {
        'statusCode': 200,
        'body': json.dumps({'organization_id': org_id})
    }
```

### API Gateway Integration
```yaml
# SAM Template for API Gateway with Cognito
Resources:
  ReservaPlusUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: reservaplus-users
      Schema:
        - Name: email
          AttributeDataType: String
          Required: true
        - Name: organization_id
          AttributeDataType: String
          Mutable: true
      LambdaConfig:
        PreAuthentication: !GetAtt PreAuthFunction.Arn
        PostAuthentication: !GetAtt PostAuthFunction.Arn

  ReservaPlusAPI:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt ReservaPlusUserPool.Arn
            AuthType: COGNITO_USER_POOLS
```

## 🔄 Migration Scripts

### Data Migration (PostgreSQL → DynamoDB + Cognito)
```python
# migration/migrate_organizations.py
# migration/migrate_users_to_cognito.py  # Special handling for Cognito
# migration/migrate_appointments.py
# migration/validate_migration.py
```

### User Migration to Cognito
```python
# migration/migrate_users_to_cognito.py
def migrate_django_users_to_cognito():
    """Migrate Django users to Cognito User Pool"""
    django_users = get_django_users()
    
    for user in django_users:
        try:
            # Create user in Cognito
            cognito_client.admin_create_user(
                UserPoolId=USER_POOL_ID,
                Username=user['email'],
                UserAttributes=[
                    {'Name': 'email', 'Value': user['email']},
                    {'Name': 'custom:organization_id', 'Value': user['organization_id']},
                    {'Name': 'custom:role', 'Value': user['role']},
                    {'Name': 'custom:organization_name', 'Value': user['organization_name']}
                ],
                MessageAction='SUPPRESS'  # Don't send welcome email during migration
            )
            
            # Set permanent password (users will reset on first login)
            cognito_client.admin_set_user_password(
                UserPoolId=USER_POOL_ID,
                Username=user['email'],
                Password=generate_migration_password(),
                Permanent=False  # Force password change on first login
            )
            
            # Store migration mapping
            store_user_migration_mapping(user['django_id'], user['email'])
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'UsernameExistsException':
                logger.warning(f"User {user['email']} already exists in Cognito")
            else:
                logger.error(f"Failed to migrate user {user['email']}: {e}")
```

### Dual-Write Implementation
```python
# Temporary layer for zero-downtime migration
class DualWriteService:
    def create_appointment(self, data):
        # Write to PostgreSQL (primary)
        pg_result = self.pg_service.create(data)
        
        # Write to DynamoDB (secondary)
        try:
            self.dynamo_service.create(data)
        except Exception as e:
            logger.error(f"DynamoDB write failed: {e}")
        
        return pg_result
```

## 🚀 Deployment Strategy

### Infrastructure as Code (SAM)
```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  ReservaPlusAPI:
    Type: AWS::Serverless::Api
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: JWTAuthorizer
      
  AuthFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: python3.12
      Handler: auth.handler
      Environment:
        Variables:
          DYNAMODB_TABLE: !Ref MainTable
```

### CI/CD Pipeline
1. **GitHub Actions** for automated testing
2. **SAM build and deploy** for infrastructure
3. **CloudFormation** for stack management
4. **Environment-specific deployments** (dev/staging/prod)

### Monitoring and Observability
- **CloudWatch Logs** for Lambda function logging
- **X-Ray** for distributed tracing
- **CloudWatch Metrics** for performance monitoring
- **Custom dashboards** for business metrics

## 📋 Pre-Migration Checklist

### Development Environment
- [ ] AWS CLI configured
- [ ] SAM CLI installed
- [ ] Python 3.12 environment
- [ ] DynamoDB Local setup
- [ ] Postman/Insomnia API collection

### AWS Account Setup
- [ ] IAM roles and policies created
- [ ] VPC and security groups (if needed)
- [ ] Parameter Store/Secrets Manager configured
- [ ] CloudWatch Log Groups created

### Code Preparation
- [ ] Extract business logic from Django views
- [ ] Create data access layer interfaces
- [ ] Implement error handling patterns
- [ ] Setup logging and monitoring

## 🎯 Success Metrics

### Performance Goals
- **API Response Time:** < 200ms (95th percentile)
- **Availability:** 99.9% uptime
- **Cold Start:** < 1s for Lambda functions
- **Database:** < 10ms read operations

### Cost Goals
- **Monthly Cost:** Stay within free tier limits
- **Scalability:** Support 10x current traffic without cost increase
- **Efficiency:** 90% reduction in infrastructure management

### Migration Goals
- **Zero Downtime:** No service interruption during migration
- **Data Integrity:** 100% data consistency
- **Feature Parity:** All current functionality preserved
- **Timeline:** Complete migration in 6 weeks

## 🔧 Development Workflow

### Local Development
```bash
# Start local DynamoDB
docker run -p 8000:8000 amazon/dynamodb-local

# Start SAM local API
sam local start-api --env-vars env.json

# Run frontend (React)
cd reservaplus_frontend && npm start
```

### Testing Strategy
- **Unit Tests:** Each Lambda function
- **Integration Tests:** API Gateway + Lambda + DynamoDB
- **End-to-End Tests:** Full user workflows
- **Load Testing:** Concurrent user scenarios

### Deployment Commands
```bash
# Build and deploy
sam build
sam deploy --guided

# Deploy specific function
sam deploy --parameter-overrides Environment=dev

# Rollback if needed
aws cloudformation cancel-update-stack --stack-name reservaplus-dev
```

---

This migration plan provides a systematic approach to transforming ReservaPlus into a cost-effective, scalable serverless application while maintaining all existing functionality and ensuring zero downtime during the transition.