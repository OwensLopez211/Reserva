# Data Migration Guide: Django → AWS Serverless

## 🎯 Overview

This guide explains how to migrate your existing Django data to the new AWS serverless architecture using DynamoDB.

## 📋 Migration Options

### Option 1: Fresh Start (Recommended for Development)
- Create new DynamoDB table
- Start with clean data
- Use hardcoded plans in Lambda as fallback
- Gradually migrate critical data

### Option 2: Full Migration (Production)
- Export Django data
- Transform to DynamoDB format
- Import to DynamoDB
- Validate data integrity

## 🚀 Quick Start (Fresh Start)

### Step 1: Deploy AWS Infrastructure
```bash
cd aws-lambda

# Build and deploy
sam build
sam deploy --guided

# Follow the prompts:
# - Stack name: reservaplus-dev
# - AWS Region: us-east-1 (or your preferred region)
# - Environment: dev
# - CorsOrigin: http://localhost:5173 (for development)
```

### Step 2: Create DynamoDB Table
```bash
cd aws-lambda/scripts

# Install dependencies
npm install

# Set environment variables
export TABLE_NAME="reservaplus-main-dev"  # From SAM outputs
export AWS_REGION="us-east-1"
export ENVIRONMENT="dev"

# Create table with initial data
node create-table.js --populate
```

### Step 3: Configure Frontend
```bash
cd reservaplus_frontend

# Create/update .env file
echo "VITE_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev" >> .env
echo "VITE_AWS_REGION=us-east-1" >> .env
echo "VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx" >> .env
echo "VITE_COGNITO_CLIENT_ID=your-client-id" >> .env

# Start development server
npm run dev
```

### Step 4: Test Plan Selection
1. Go to `http://localhost:5173/onboarding/plan`
2. Verify plans load from AWS Lambda
3. Continue with onboarding flow

## 📊 Full Migration Process

### Phase 1: Export Django Data

Create Django management command to export data:

```python
# management/commands/export_to_dynamodb.py
import json
from django.core.management.base import BaseCommand
from django.core import serializers
from myapp.models import Plan, User, Organization, Professional, Service

class Command(BaseCommand):
    def handle(self, *args, **options):
        data = {
            'plans': self.export_plans(),
            'users': self.export_users(),
            'organizations': self.export_organizations(),
            'professionals': self.export_professionals(),
            'services': self.export_services()
        }
        
        with open('django_export.json', 'w') as f:
            json.dump(data, f, indent=2, default=str)
    
    def export_plans(self):
        return [self.transform_plan(plan) for plan in Plan.objects.all()]
    
    def transform_plan(self, plan):
        return {
            'PK': 'PLANS#ACTIVE',
            'SK': f'PLAN#{plan.slug}',
            'plan_id': plan.slug,
            'name': plan.name,
            'price_monthly': plan.price_monthly,
            'price_yearly': plan.price_yearly,
            'description': plan.description,
            'features': plan.features,
            'is_active': plan.is_active,
            'created_at': int(plan.created_at.timestamp() * 1000)
        }
```

### Phase 2: Transform Data Format

```javascript
// scripts/transform-django-data.js
const fs = require('fs');

function transformDjangoData(djangoExport) {
    const dynamoItems = [];
    
    // Transform Plans
    djangoExport.plans.forEach(plan => {
        dynamoItems.push({
            PK: 'PLANS#ACTIVE',
            SK: `PLAN#${plan.plan_id}`,
            ...plan
        });
    });
    
    // Transform Users
    djangoExport.users.forEach(user => {
        dynamoItems.push({
            PK: `USER#${user.cognito_user_id}`,
            SK: 'PROFILE',
            GSI1PK: `EMAIL#${user.email}`,
            GSI1SK: 'USER',
            ...user
        });
    });
    
    return dynamoItems;
}
```

### Phase 3: Import to DynamoDB

```javascript
// scripts/import-to-dynamodb.js
const AWS = require('aws-sdk');
const fs = require('fs');

const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

async function importData() {
    const djangoData = JSON.parse(fs.readFileSync('django_export.json'));
    const dynamoItems = transformDjangoData(djangoData);
    
    // Batch write items (25 at a time)
    for (let i = 0; i < dynamoItems.length; i += 25) {
        const batch = dynamoItems.slice(i, i + 25);
        
        const params = {
            RequestItems: {
                [TABLE_NAME]: batch.map(item => ({
                    PutRequest: { Item: item }
                }))
            }
        };
        
        await dynamodb.batchWrite(params).promise();
        console.log(`Imported batch ${Math.floor(i/25) + 1}`);
    }
}
```

## 🔄 Data Mapping Reference

### Plans
```
Django Plan → DynamoDB Item
├── id → plan_id
├── name → name
├── price_monthly → price_monthly
├── price_yearly → price_yearly
├── description → description
├── features (JSON) → features (list)
├── is_active → is_active
└── created_at → created_at (timestamp)
```

### Users
```
Django User + Profile → DynamoDB Item
├── cognito_user_id → PK: USER#{id}
├── email → GSI1PK: EMAIL#{email}
├── first_name → first_name
├── last_name → last_name
├── organization_id → organization_id
└── role → role
```

### Organizations
```
Django Organization → DynamoDB Item
├── id → organization_id
├── name → name
├── slug → slug
├── email → email
├── phone → phone
├── address → address
└── subscription_plan → subscription_plan
```

## 🧪 Testing Migration

### Validation Scripts
```javascript
// scripts/validate-migration.js
async function validateMigration() {
    // Check plan count
    const plans = await dynamodb.query({
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': 'PLANS#ACTIVE' }
    }).promise();
    
    console.log(`Found ${plans.Items.length} plans`);
    
    // Validate data integrity
    plans.Items.forEach(plan => {
        if (!plan.name || !plan.plan_id) {
            console.error('Invalid plan:', plan);
        }
    });
}
```

## 🔧 Rollback Strategy

### Backup Before Migration
```bash
# Export current DynamoDB data
aws dynamodb scan --table-name reservaplus-main-dev > backup.json

# Keep Django database as backup
pg_dump reservaplus > django_backup.sql
```

### Quick Rollback
1. Keep Django backend running in parallel
2. Switch frontend endpoints back to Django
3. Restore DynamoDB from backup if needed

## 📈 Performance Considerations

### DynamoDB Optimization
- Use consistent read for critical operations
- Implement pagination for large data sets
- Monitor read/write capacity usage
- Use batch operations when possible

### Lambda Optimization
- Keep functions warm with CloudWatch Events
- Use connection pooling for DynamoDB
- Implement proper error handling and retries

## 🛡️ Security Checklist

- [ ] Configure IAM roles with minimal permissions
- [ ] Enable DynamoDB encryption at rest
- [ ] Set up VPC if needed
- [ ] Configure CloudTrail for audit logging
- [ ] Implement proper CORS policies
- [ ] Use environment variables for secrets

## 📊 Monitoring Setup

### CloudWatch Metrics
- Lambda execution duration
- DynamoDB read/write capacity
- API Gateway response times
- Error rates and logs

### Alarms
- High Lambda error rate
- DynamoDB throttling
- API Gateway 5xx errors
- Cognito authentication failures

## 🎯 Next Steps After Migration

1. **Monitor Performance**: Track metrics for 1-2 weeks
2. **Optimize Costs**: Review DynamoDB usage patterns
3. **Scale Testing**: Test with production-like load
4. **Feature Migration**: Move remaining Django features
5. **Cleanup**: Remove Django infrastructure when stable

## 🆘 Troubleshooting

### Common Issues
- **DynamoDB Access Denied**: Check IAM permissions
- **Lambda Timeout**: Increase timeout or optimize code
- **CORS Errors**: Verify API Gateway CORS settings
- **Cognito Issues**: Check user pool configuration

### Support Resources
- AWS Documentation
- SAM CLI troubleshooting
- DynamoDB best practices
- Lambda optimization guides