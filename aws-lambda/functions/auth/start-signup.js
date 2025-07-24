const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const cognito = new AWS.CognitoIdentityServiceProvider();
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// Generate secure random token
const generateToken = () => {
  return uuidv4().replace(/-/g, '');
};

// Generate temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result + '!'; // Add special character for password policy
};

exports.handler = async (event) => {
  console.log('Start Signup Request:', JSON.stringify(event, null, 2));
  
  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }
  
  try {
    const { email, plan_id, user_data } = JSON.parse(event.body);
    
    // Validate input
    if (!email || !plan_id || !user_data) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify({
          error: 'Missing required fields: email, plan_id, user_data'
        })
      };
    }
    
    const { first_name, last_name, organization_name, password } = user_data;
    
    if (!first_name || !last_name || !organization_name || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing required user data fields'
        })
      };
    }

    // Check if user already exists in Cognito
    try {
      await cognito.adminGetUser({
        UserPoolId: USER_POOL_ID,
        Username: email
      }).promise();
      
      // User already exists
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'User already exists with this email'
        })
      };
    } catch (error) {
      // User doesn't exist, continue with creation
      if (error.code !== 'UserNotFoundException') {
        throw error;
      }
    }

    // Create user in Cognito (inactive until onboarding completion)
    const cognitoUserId = uuidv4();
    const tempPassword = generateTempPassword();
    
    await cognito.adminCreateUser({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: `${first_name} ${last_name}` },
        { Name: 'email_verified', Value: 'true' }
      ],
      TemporaryPassword: tempPassword,
      MessageAction: 'SUPPRESS' // Don't send welcome email yet
    }).promise();

    // Set permanent password
    await cognito.adminSetUserPassword({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    }).promise();

    // Generate registration token
    const registrationToken = generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // Store registration data in DynamoDB with TTL
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: {
        PK: `REG#${registrationToken}`,
        SK: 'METADATA',
        email,
        plan_id,
        user_data: {
          first_name,
          last_name,
          organization_name
        },
        cognito_user_id: email, // Cognito uses email as username
        expires_at: expiresAt,
        created_at: Date.now(),
        TTL: Math.floor(expiresAt / 1000) // DynamoDB TTL requires seconds
      }
    }).promise();

    console.log('User created successfully:', { email, registrationToken });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        message: 'Signup successful',
        registration_token: registrationToken,
        expires_at: new Date(expiresAt).toISOString(),
        selected_plan: {
          id: plan_id,
          name: plan_id === 'basic' ? 'Plan Básico' : 'Plan Premium'
        },
        next_step: 'onboarding'
      })
    };

  } catch (error) {
    console.error('Signup error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error during signup',
        details: error.message
      })
    };
  }
};