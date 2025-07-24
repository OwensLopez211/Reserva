# ReservaPlus AWS Deployment Guide

## 🚀 Complete Setup Instructions

### Prerequisites

1. **AWS CLI** installed and configured
2. **AWS SAM CLI** installed  
3. **Node.js 18+** for Lambda functions
4. **npm** for dependency management

### Step 1: Deploy AWS Infrastructure

```bash
# Navigate to Lambda functions directory
cd aws-lambda

# Install dependencies for Lambda functions
cd functions && npm install && cd ..

# Build the SAM application
sam build

# Deploy to AWS (first time - guided)
sam deploy --guided

# For subsequent deployments
sam deploy
```

### Step 2: Configure Environment Variables

After deployment, SAM will output important values. Copy them to your frontend:

```bash
# Copy example environment file
cp reservaplus_frontend/.env.example reservaplus_frontend/.env

# Edit .env with your actual values from SAM outputs
```

**Example .env file:**
```env
VITE_AWS_REGION=us-east-1
VITE_API_GATEWAY_URL=https://abc123def4.execute-api.us-east-1.amazonaws.com/dev
VITE_COGNITO_USER_POOL_ID=us-east-1_AbC123DeF
VITE_COGNITO_CLIENT_ID=1a2b3c4d5e6f7g8h9i0j1k2l3m
VITE_APP_NAME=ReservaPlus
VITE_APP_ENV=development
```

### Step 3: Configure Frontend Authentication

Your frontend is already configured to use native AWS Cognito SDK (no Amplify needed):

- **Native Cognito Service**: `src/services/nativeCognitoService.ts`
- **Updated Auth Context**: `src/contexts/AuthContext.tsx` 
- **Updated Onboarding Service**: `src/services/onboardingService.ts`

The frontend will automatically connect to your AWS Lambda endpoints using the environment variables.

### Step 4: Test the Complete Flow

1. **Start Frontend Development Server:**
   ```bash
   cd reservaplus_frontend
   npm run dev
   ```

2. **Test User Registration:**
   - Go to `/onboarding/plan`
   - Select a plan
   - Fill registration form
   - Complete onboarding steps

3. **Test User Authentication:**
   - Login with created user
   - Check user profile loads correctly
   - Verify organization data appears

## 🗄️ DynamoDB Schema

Your DynamoDB table will be created with this structure:

### Table: `reservaplus-dev`
- **Partition Key:** PK (String)
- **Sort Key:** SK (String)
- **GSI1:** GSI1PK, GSI1SK
- **GSI2:** GSI2PK, GSI2SK
- **TTL:** TTL field for automatic cleanup

### Sample Data Structure

**User Profile:**
```json
{
  "PK": "USER#cognito-user-id",
  "SK": "PROFILE",
  "email": "user@example.com",
  "organization_id": "org123",
  "role": "owner",
  "onboarding_completed": true
}
```

**Organization:**
```json
{
  "PK": "ORG#org123",
  "SK": "METADATA",
  "name": "My Business",
  "industry_template": "salon",
  "subscription_status": "trial"
}
```

## 🔧 API Endpoints

After deployment, your API will have these endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Start user registration |
| GET | `/auth/registration/{token}` | Check registration status |
| GET | `/auth/user-status` | Check user onboarding status |
| POST | `/onboarding/complete` | Complete onboarding process |
| GET | `/users/profile` | Get user profile |

## 🛠️ Troubleshooting

### Common Issues

1. **"Invalid scope" error:**
   - Check your Cognito configuration
   - Ensure scopes are: `email openid phone profile`

2. **CORS errors:**
   - Verify API Gateway CORS settings
   - Check your frontend origin is allowed

3. **Authentication failures:**
   - Verify Cognito User Pool and Client IDs
   - Check AWS region configuration

4. **Lambda function errors:**
   - Check CloudWatch Logs for specific errors
   - Verify environment variables are set

### Useful Commands

```bash
# View SAM outputs
sam list stack-outputs

# Check Lambda logs
sam logs -n StartSignupFunction --tail

# Local testing
sam local start-api

# Delete stack (cleanup)
sam delete
```

## 📊 Monitoring

Monitor your deployment using:

1. **CloudWatch Logs** - Lambda function logs
2. **CloudWatch Metrics** - API Gateway and Lambda metrics  
3. **DynamoDB Console** - View stored data
4. **Cognito Console** - Manage users

## 🔄 Next Steps

After basic deployment works:

1. Setup custom domain for API Gateway
2. Configure CloudFront for frontend
3. Setup monitoring and alerting
4. Implement backup strategies
5. Configure CI/CD pipeline

## 💰 Cost Optimization

Your setup should stay within AWS Free Tier:

- **Lambda:** 1M requests/month free
- **DynamoDB:** 25GB storage + 25 WCU/RCU free
- **API Gateway:** 1M calls/month free
- **Cognito:** 50K MAU free

**Estimated monthly cost: $0.50** (Route 53 hosted zone only)

## 🔒 Security Best Practices

1. **Never commit secrets** to version control
2. **Use IAM roles** with least privilege
3. **Enable CloudTrail** for audit logging
4. **Regular security updates** for dependencies
5. **Monitor unusual activity** in CloudWatch