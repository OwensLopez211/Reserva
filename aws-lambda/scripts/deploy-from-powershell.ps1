# ReservaPlus AWS Lambda Deployment Script - PowerShell Version
# This script deploys the complete onboarding infrastructure from PowerShell

Write-Host "🚀 Starting ReservaPlus Lambda deployment from PowerShell..." -ForegroundColor Green

# Configuration
$STACK_NAME = "reservaplus-onboarding"
$S3_BUCKET_NAME = "reservaplus-lambda-deployment-$(Get-Date -UFormat '%s')"
$REGION = "sa-east-1"

Write-Host "📋 Configuration:" -ForegroundColor Blue
Write-Host "  Stack Name: $STACK_NAME"
Write-Host "  Region: $REGION"
Write-Host "  S3 Bucket: $S3_BUCKET_NAME"
Write-Host ""

# Check AWS CLI configuration
Write-Host "🔍 Checking AWS CLI configuration..." -ForegroundColor Blue
try {
    $AWS_ACCOUNT = aws sts get-caller-identity --region $REGION --query 'Account' --output text
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ AWS CLI is configured (Account: $AWS_ACCOUNT)" -ForegroundColor Green
    } else {
        throw "AWS CLI test failed"
    }
} catch {
    Write-Host "❌ AWS CLI is not configured properly." -ForegroundColor Red
    Write-Host "💡 Please run: aws configure" -ForegroundColor Yellow
    exit 1
}

# Navigate to the project directory
Set-Location (Split-Path $PSScriptRoot -Parent)

# Create temporary deployment directory
$TEMP_DIR = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
Write-Host "📁 Created temporary directory: $TEMP_DIR" -ForegroundColor Blue

# Copy Lambda functions
Write-Host "📦 Copying Lambda functions..." -ForegroundColor Blue
Copy-Item -Path "functions\*" -Destination $TEMP_DIR -Recurse
Copy-Item -Path "package.json" -Destination $TEMP_DIR

# Install dependencies
Write-Host "📦 Installing Lambda dependencies..." -ForegroundColor Blue
Push-Location $TEMP_DIR
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}

# Create deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue
if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    7z a lambda-functions.zip . -xr!'*.git*' -xr!'*.DS_Store*' -xr!'node_modules\.cache\*'
} else {
    # Use PowerShell's Compress-Archive as fallback
    Compress-Archive -Path ".\*" -DestinationPath "lambda-functions.zip" -Force
}

Pop-Location

# Create S3 bucket for deployment artifacts
Write-Host "🪣 Creating S3 bucket for deployment..." -ForegroundColor Blue
aws s3 mb "s3://$S3_BUCKET_NAME" --region $REGION
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ S3 bucket might already exist, continuing..." -ForegroundColor Yellow
}

# Upload Lambda package to S3
Write-Host "⬆️ Uploading Lambda package to S3..." -ForegroundColor Blue
aws s3 cp "$TEMP_DIR\lambda-functions.zip" "s3://$S3_BUCKET_NAME/lambda-functions.zip"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload Lambda package" -ForegroundColor Red
    exit 1
}

# Deploy CloudFormation stack
Write-Host "☁️ Deploying CloudFormation stack..." -ForegroundColor Blue
aws cloudformation deploy `
    --template-file complete-onboarding-template.yaml `
    --stack-name $STACK_NAME `
    --parameter-overrides S3Bucket=$S3_BUCKET_NAME `
    --capabilities CAPABILITY_IAM `
    --region $REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ CloudFormation deployment failed" -ForegroundColor Red
    exit 1
}

# Get stack outputs
Write-Host "📋 Getting stack outputs..." -ForegroundColor Blue
$API_URL = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $REGION `
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' `
    --output text

$USER_POOL_ID = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $REGION `
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' `
    --output text

$USER_POOL_CLIENT_ID = aws cloudformation describe-stacks `
    --stack-name $STACK_NAME `
    --region $REGION `
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolClientId`].OutputValue' `
    --output text

# Create DynamoDB table if it doesn't exist
Write-Host "🗄️ Checking DynamoDB table..." -ForegroundColor Blue
aws dynamodb describe-table --table-name "reservaplus-dev" --region $REGION > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ DynamoDB table 'reservaplus-dev' doesn't exist. Creating it..." -ForegroundColor Yellow
    
    aws dynamodb create-table `
        --table-name "reservaplus-dev" `
        --attribute-definitions `
            AttributeName=PK,AttributeType=S `
            AttributeName=SK,AttributeType=S `
            AttributeName=GSI1PK,AttributeType=S `
            AttributeName=GSI1SK,AttributeType=S `
            AttributeName=GSI2PK,AttributeType=S `
            AttributeName=GSI2SK,AttributeType=S `
        --key-schema `
            AttributeName=PK,KeyType=HASH `
            AttributeName=SK,KeyType=RANGE `
        --global-secondary-indexes `
            'IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH},{AttributeName=GSI1SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' `
            'IndexName=GSI2,KeySchema=[{AttributeName=GSI2PK,KeyType=HASH},{AttributeName=GSI2SK,KeyType=RANGE}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5}' `
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
        --region $REGION
    
    Write-Host "⏳ Waiting for table to be created..." -ForegroundColor Blue
    aws dynamodb wait table-exists --table-name "reservaplus-dev" --region $REGION
    Write-Host "✅ DynamoDB table created successfully" -ForegroundColor Green
} else {
    Write-Host "✅ DynamoDB table 'reservaplus-dev' already exists" -ForegroundColor Green
}

# Populate plans data
Write-Host "📊 Populating plans data..." -ForegroundColor Blue
Push-Location scripts
if (Test-Path "populate-plans.js") {
    $env:AWS_REGION = $REGION
    $env:TABLE_NAME = "reservaplus-dev"
    node populate-plans.js
    Write-Host "✅ Plans data populated" -ForegroundColor Green
} else {
    Write-Host "⚠️ populate-plans.js not found, skipping plans population" -ForegroundColor Yellow
}
Pop-Location

# Clean up
Write-Host "🧹 Cleaning up temporary files..." -ForegroundColor Blue
Remove-Item -Path $TEMP_DIR -Recurse -Force

# Display results
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Environment Configuration:" -ForegroundColor Blue
Write-Host "  API Gateway URL: $API_URL" -ForegroundColor Yellow
Write-Host "  Cognito User Pool ID: $USER_POOL_ID" -ForegroundColor Yellow
Write-Host "  Cognito Client ID: $USER_POOL_CLIENT_ID" -ForegroundColor Yellow
Write-Host "  DynamoDB Table: reservaplus-dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔧 Update your .env file with:" -ForegroundColor Blue
Write-Host "VITE_API_GATEWAY_URL=$API_URL"
Write-Host "VITE_COGNITO_USER_POOL_ID=$USER_POOL_ID"
Write-Host "VITE_COGNITO_CLIENT_ID=$USER_POOL_CLIENT_ID"
Write-Host "VITE_AWS_REGION=$REGION"
Write-Host ""
Write-Host "🌐 Test your API:" -ForegroundColor Blue
Write-Host "curl -X GET `"$API_URL/plans`""
Write-Host ""
Write-Host "✅ Your ReservaPlus onboarding infrastructure is ready!" -ForegroundColor Green