// src/config/cognito.ts
export const cognitoConfig = {
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID || '',
}

// Validation
export const validateCognitoConfig = () => {
  const missingVars: string[] = []
  
  if (!cognitoConfig.userPoolId) missingVars.push('VITE_COGNITO_USER_POOL_ID')
  if (!cognitoConfig.clientId) missingVars.push('VITE_COGNITO_CLIENT_ID')
  if (!cognitoConfig.region) missingVars.push('VITE_AWS_REGION')
  
  if (missingVars.length > 0) {
    throw new Error(`Missing Cognito environment variables: ${missingVars.join(', ')}`)
  }
  
  return true
}