# ReservaPlus AWS Deployment Guide

This guide will help you deploy your complete ReservaPlus onboarding infrastructure to AWS.

## 🏗️ Architecture Overview

Your AWS infrastructure will include:
- **DynamoDB Table**: `reservaplus-dev` (single table design)
- **Lambda Functions**: 6 functions for complete onboarding flow
- **API Gateway**: RESTful API endpoints with CORS
- **Cognito User Pool**: User authentication and management

## 📋 Prerequisites

1. **AWS CLI Configured**
   ```bash
   aws configure
   # Enter your AWS Access Key, Secret Key, Region (us-east-1), and output format (json)
   ```

2. **Required Permissions**
   Your AWS user needs permissions for:
   - CloudFormation (full access)
   - Lambda (full access)
   - DynamoDB (full access)
   - API Gateway (full access)
   - Cognito (full access)
   - IAM (create/update roles)
   - S3 (create buckets, upload files)

## 🚀 Deployment Steps

### Step 1: Deploy Infrastructure

Navigate to your Lambda directory and run the deployment script:

```bash
cd aws-lambda
./scripts/deploy-onboarding.sh
```

This script will:
- Create a temporary S3 bucket for deployment artifacts
- Package all Lambda functions with dependencies
- Deploy CloudFormation stack with all infrastructure
- Create DynamoDB table `reservaplus-dev` if it doesn't exist
- Populate initial plans data
- Output configuration values for your frontend

### Step 2: Update Frontend Configuration

After deployment, update your `.env` file with the output values:

```env
# AWS Configuration
VITE_AWS_REGION=us-east-1
VITE_API_GATEWAY_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev

# Cognito Configuration  
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx

# Application Configuration
VITE_APP_NAME=ReservaPlus
VITE_APP_ENV=development
```

### Step 3: Test Your API

Test the API endpoints:

```bash
# Test plans endpoint
curl -X GET "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/plans"

# Test with CORS
curl -X OPTIONS "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/plans" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET"
```

## 📊 API Endpoints

Your deployed API will have these endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/plans` | Get available subscription plans |
| POST | `/auth/signup` | Start user signup process |
| GET | `/auth/registration/{token}` | Check registration status |
| GET | `/auth/user-status` | Check user onboarding status |
| POST | `/onboarding/complete` | Complete full onboarding |
| GET | `/users/profile` | Get user profile |

## 🗄️ DynamoDB Schema

Your `reservaplus-dev` table uses a single-table design with these access patterns:

### Primary Key Structure
- **PK (Partition Key)**: Entity type and ID (e.g., `ORG#org123`, `USER#user456`)
- **SK (Sort Key)**: Sub-entity or metadata (e.g., `METADATA`, `PROF#prof789`)

### Global Secondary Indexes
- **GSI1**: Alternative access patterns (email lookups, organization queries)
- **GSI2**: Client and appointment cross-references

### Item Types
- **Registration Tokens**: `REG#{token}` - Temporary signup tokens
- **Organizations**: `ORG#{orgId}` - Business information
- **Users**: `USER#{userId}` - User profiles and memberships  
- **Professionals**: `ORG#{orgId}#PROF#{profId}` - Team members
- **Services**: `ORG#{orgId}#SERVICE#{serviceId}` - Business services
- **Plans**: `PLAN#{planId}` - Subscription plans

## 💰 AWS Costs Estimate

For development/testing with moderate usage:
- **DynamoDB**: ~$1-5/month (with on-demand billing)
- **Lambda**: ~$0-1/month (generous free tier)
- **API Gateway**: ~$1-3/month (first 1M requests free)
- **Cognito**: Free up to 50,000 MAUs
- **S3**: ~$0.50/month for deployment artifacts

**Total estimated cost: $2-10/month**

## 🔧 Local Development Setup

For local development, you can still use your existing Django backend:

1. Keep your current `.env` for local development
2. Create `.env.production` for AWS configuration
3. Switch between environments as needed

## 🐛 Troubleshooting

### Common Issues

**1. "AWS CLI not configured"**
```bash
aws configure
aws sts get-caller-identity  # Verify configuration
```

**2. "Access denied" errors**
- Check your AWS permissions
- Ensure IAM user has required policies

**3. "Table already exists"**
- This is normal if you've run the script before
- The script will skip table creation if it exists

**4. CORS errors in browser**
- Verify API Gateway CORS configuration
- Check that OPTIONS methods are deployed
- Ensure your frontend origin is allowed

**5. Lambda timeout errors**
- Check CloudWatch logs: `aws logs describe-log-groups`
- Increase timeout in CloudFormation template if needed

### Debugging Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name reservaplus-onboarding

# View Lambda logs
aws logs tail /aws/lambda/reservaplus-complete-onboarding --follow

# Test DynamoDB connection
aws dynamodb describe-table --table-name reservaplus-dev

# List API Gateway endpoints
aws apigateway get-rest-apis
```

## 🔄 Updates and Redeployment

To update your Lambda functions:

1. Modify the function code in `aws-lambda/functions/`
2. Run the deployment script again:
   ```bash
   ./scripts/deploy-onboarding.sh
   ```

The script will:
- Create a new deployment package
- Update the CloudFormation stack
- Deploy the new Lambda code

## 📞 Support

If you encounter issues:

1. Check the deployment script output for specific error messages
2. Review CloudWatch logs for Lambda function errors
3. Verify your AWS CLI configuration and permissions
4. Ensure your DynamoDB table structure matches the schema

## 🎉 Next Steps

Once deployed successfully:

1. ✅ Test the complete onboarding flow in your frontend
2. ✅ Verify data is being created in DynamoDB
3. ✅ Check Cognito user creation
4. ✅ Monitor costs in AWS console
5. ✅ Set up CloudWatch alarms for monitoring

Your ReservaPlus infrastructure is now ready for production use! 🚀