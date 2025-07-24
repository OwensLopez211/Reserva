#!/bin/bash

# ReservaPlus AWS Lambda Deployment Script
# This script packages and deploys the complete onboarding infrastructure

set -e

echo "🚀 Starting ReservaPlus Lambda deployment..."

# Configuration
STACK_NAME="reservaplus-onboarding"
S3_BUCKET_NAME="reservaplus-lambda-deployment-$(date +%s)"
REGION="${AWS_DEFAULT_REGION:-sa-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Configuration:${NC}"
echo -e "  Stack Name: ${STACK_NAME}"
echo -e "  Region: ${REGION}"
echo -e "  S3 Bucket: ${S3_BUCKET_NAME}"
echo ""

# Check if AWS CLI is configured
echo -e "${BLUE}🔍 Checking AWS CLI configuration...${NC}"

# Try to get caller identity with explicit region and timeout
echo -e "${BLUE}  Testing AWS connection...${NC}"
timeout 10 aws sts get-caller-identity --region "$REGION" --query 'Account' --output text > /tmp/aws_test.txt 2>&1
AWS_TEST_RESULT=$?
AWS_ACCOUNT=""

if [ $AWS_TEST_RESULT -eq 0 ]; then
    AWS_ACCOUNT=$(cat /tmp/aws_test.txt)
else
    echo -e "${YELLOW}  AWS CLI test failed with exit code: $AWS_TEST_RESULT${NC}"
    if [ -f /tmp/aws_test.txt ]; then
        echo -e "${YELLOW}  Error output: $(cat /tmp/aws_test.txt)${NC}"
    fi
fi

rm -f /tmp/aws_test.txt

if [ -z "$AWS_ACCOUNT" ] || [ "$AWS_ACCOUNT" = "None" ]; then
    echo -e "${RED}❌ AWS CLI is not configured or credentials not accessible.${NC}"
    echo -e "${YELLOW}💡 Debug info:${NC}"
    echo -e "  Current user: $(whoami)"
    echo -e "  AWS config location: $HOME/.aws/"
    echo -e "  Trying to list config files:"
    ls -la "$HOME/.aws/" 2>/dev/null || echo "  No AWS config directory found"
    echo ""
    echo -e "${YELLOW}💡 Solutions:${NC}"
    echo -e "  1. Run from PowerShell: \$env:AWS_PROFILE = 'default'; bash ./scripts/deploy-onboarding.sh"
    echo -e "  2. Or export credentials: export AWS_ACCESS_KEY_ID=your_key AWS_SECRET_ACCESS_KEY=your_secret"
    echo -e "  3. Or copy AWS config to bash location"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI is configured (Account: $AWS_ACCOUNT)${NC}"

# Navigate to the project directory
cd "$(dirname "$0")/.."

# Create temporary deployment directory
TEMP_DIR=$(mktemp -d)
echo -e "${BLUE}📁 Created temporary directory: ${TEMP_DIR}${NC}"

# Copy Lambda functions
echo -e "${BLUE}📦 Copying Lambda functions...${NC}"
cp -r functions/* "$TEMP_DIR/"
cp package.json "$TEMP_DIR/"

# Install dependencies
echo -e "${BLUE}📦 Installing Lambda dependencies...${NC}"
cd "$TEMP_DIR"
npm install --production

# Create deployment package
echo -e "${BLUE}📦 Creating deployment package...${NC}"
if command -v zip >/dev/null 2>&1; then
    zip -r lambda-functions.zip . -x "*.git*" "*.DS_Store*" "node_modules/.cache/*"
else
    # Use Python to create zip if zip command is not available
    echo -e "${YELLOW}  zip not found, using Python...${NC}"
    python3 -c "
import zipfile
import os

def should_exclude(path):
    excludes = ['.git', '.DS_Store', 'node_modules/.cache', '__pycache__']
    return any(exclude in path for exclude in excludes)

with zipfile.ZipFile('lambda-functions.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Skip excluded directories
        dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]
        
        for file in files:
            file_path = os.path.join(root, file)
            if not should_exclude(file_path) and file != 'lambda-functions.zip':
                arc_path = os.path.relpath(file_path, '.')
                zipf.write(file_path, arc_path)
                print(f'Added: {arc_path}')

print('ZIP package created successfully')
"
fi

# Create S3 bucket for deployment artifacts
echo -e "${BLUE}🪣 Creating S3 bucket for deployment...${NC}"
aws s3 mb "s3://${S3_BUCKET_NAME}" --region "$REGION" || {
    echo -e "${YELLOW}⚠️  S3 bucket might already exist, continuing...${NC}"
}

# Upload Lambda package to S3
echo -e "${BLUE}⬆️  Uploading Lambda package to S3...${NC}"
aws s3 cp lambda-functions.zip "s3://${S3_BUCKET_NAME}/lambda-functions.zip"

# Deploy CloudFormation stack
echo -e "${BLUE}☁️  Deploying CloudFormation stack...${NC}"
# Go back to the aws-lambda directory
cd /mnt/c/Users/Owens/Desktop/Codigo/Proyectos\ con\ Clientes/Reserva/aws-lambda

aws cloudformation deploy \
    --template-file complete-onboarding-template.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        S3Bucket="$S3_BUCKET_NAME" \
    --capabilities CAPABILITY_IAM \
    --region "$REGION"

# Get stack outputs
echo -e "${BLUE}📋 Getting stack outputs...${NC}"
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

USER_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
    --output text)

USER_POOL_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolClientId`].OutputValue' \
    --output text)

# Create DynamoDB table if it doesn't exist
echo -e "${BLUE}🗄️  Checking DynamoDB table...${NC}"
if ! aws dynamodb describe-table --table-name "reservaplus-dev" --region "$REGION" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  DynamoDB table 'reservaplus-dev' doesn't exist. Creating it...${NC}"
    
    aws dynamodb create-table \
        --table-name "reservaplus-dev" \
        --attribute-definitions \
            AttributeName=PK,AttributeType=S \
            AttributeName=SK,AttributeType=S \
            AttributeName=GSI1PK,AttributeType=S \
            AttributeName=GSI1SK,AttributeType=S \
            AttributeName=GSI2PK,AttributeType=S \
            AttributeName=GSI2SK,AttributeType=S \
        --key-schema \
            AttributeName=PK,KeyType=HASH \
            AttributeName=SK,KeyType=RANGE \
        --global-secondary-indexes \
            IndexName=GSI1,KeySchema='[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}]',Projection='{ProjectionType=ALL}',ProvisionedThroughput='{ReadCapacityUnits=5,WriteCapacityUnits=5}' \
            IndexName=GSI2,KeySchema='[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}]',Projection='{ProjectionType=ALL}',ProvisionedThroughput='{ReadCapacityUnits=5,WriteCapacityUnits=5}' \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
        --region "$REGION"
    
    echo -e "${BLUE}⏳ Waiting for table to be created...${NC}"
    aws dynamodb wait table-exists --table-name "reservaplus-dev" --region "$REGION"
    echo -e "${GREEN}✅ DynamoDB table created successfully${NC}"
else
    echo -e "${GREEN}✅ DynamoDB table 'reservaplus-dev' already exists${NC}"
fi

# Populate plans data
echo -e "${BLUE}📊 Populating plans data...${NC}"
cd /mnt/c/Users/Owens/Desktop/Codigo/Proyectos\ con\ Clientes/Reserva/aws-lambda/scripts
if [ -f "populate-plans.js" ]; then
    node populate-plans.js
    echo -e "${GREEN}✅ Plans data populated${NC}"
else
    echo -e "${YELLOW}⚠️  populate-plans.js not found, skipping plans population${NC}"
fi

# Clean up
echo -e "${BLUE}🧹 Cleaning up temporary files...${NC}"
rm -rf "$TEMP_DIR"

# Display results
echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Environment Configuration:${NC}"
echo -e "  ${YELLOW}API Gateway URL:${NC} $API_URL"
echo -e "  ${YELLOW}Cognito User Pool ID:${NC} $USER_POOL_ID"
echo -e "  ${YELLOW}Cognito Client ID:${NC} $USER_POOL_CLIENT_ID"
echo -e "  ${YELLOW}DynamoDB Table:${NC} reservaplus-dev"
echo ""
echo -e "${BLUE}🔧 Update your .env file with:${NC}"
echo -e "VITE_API_GATEWAY_URL=$API_URL"
echo -e "VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo -e "VITE_COGNITO_CLIENT_ID=$USER_POOL_CLIENT_ID"
echo -e "VITE_AWS_REGION=$REGION"
echo ""
echo -e "${BLUE}🌐 Test your API:${NC}"
echo -e "curl -X GET \"$API_URL/plans\""
echo ""
echo -e "${GREEN}✅ Your ReservaPlus onboarding infrastructure is ready!${NC}"