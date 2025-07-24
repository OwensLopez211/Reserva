const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log('Check Registration Status Request:', JSON.stringify(event, null, 2));
  
  try {
    const { token } = event.pathParameters;
    
    if (!token) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Registration token is required'
        })
      };
    }

    // Get registration data from DynamoDB
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { 
        PK: `REG#${token}`, 
        SK: 'METADATA' 
      }
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          is_valid: false,
          error: 'Invalid registration token'
        })
      };
    }

    const registration = result.Item;
    
    // Check if token has expired
    if (registration.expires_at < Date.now()) {
      return {
        statusCode: 410,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          is_valid: false,
          error: 'Registration token has expired'
        })
      };
    }

    // Token is valid
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        is_valid: true,
        selected_plan: {
          id: registration.plan_id,
          name: registration.plan_id === 'basic' ? 'Plan Básico' : 'Plan Premium',
          price_monthly: registration.plan_id === 'basic' ? 0 : 50000
        },
        expires_at: new Date(registration.expires_at).toISOString(),
        user_data: {
          email: registration.email,
          first_name: registration.user_data.first_name,
          last_name: registration.user_data.last_name,
          organization_name: registration.user_data.organization_name
        }
      })
    };

  } catch (error) {
    console.error('Check registration status error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error checking registration status',
        details: error.message
      })
    };
  }
};