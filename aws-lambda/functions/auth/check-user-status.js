const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log('Check User Status Request:', JSON.stringify(event, null, 2));
  
  try {
    // Get user ID from Cognito authorizer context
    const userId = event.requestContext.authorizer.claims.sub;
    const userEmail = event.requestContext.authorizer.claims.email;
    
    if (!userId) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'User not authenticated'
        })
      };
    }

    // Get user profile from DynamoDB
    const userProfileResult = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { 
        PK: `USER#${userId}`, 
        SK: 'PROFILE' 
      }
    }).promise();

    // User doesn't have a profile yet - needs onboarding
    if (!userProfileResult.Item) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          needsOnboarding: true,
          hasProfile: false,
          userInfo: {
            id: userId,
            email: userEmail
          }
        })
      };
    }

    const userProfile = userProfileResult.Item;

    // Check if onboarding is completed
    if (!userProfile.onboarding_completed) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          needsOnboarding: true,
          hasProfile: true,
          organizationData: {
            id: userProfile.organization_id,
            name: userProfile.organization_name,
            role: userProfile.role,
            subscription_status: userProfile.subscription_status
          }
        })
      };
    }

    // User has completed onboarding
    // Get organization details
    let organizationData = null;
    if (userProfile.organization_id) {
      const orgResult = await dynamodb.get({
        TableName: TABLE_NAME,
        Key: { 
          PK: `ORG#${userProfile.organization_id}`, 
          SK: 'METADATA' 
        }
      }).promise();

      if (orgResult.Item) {
        organizationData = {
          id: orgResult.Item.PK.replace('ORG#', ''),
          name: orgResult.Item.name,
          industry_template: orgResult.Item.industry_template,
          email: orgResult.Item.email,
          phone: orgResult.Item.phone,
          subscription_status: orgResult.Item.subscription_status,
          trial_end: orgResult.Item.trial_end
        };
      }
    }

    // Update last login
    await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { 
        PK: `USER#${userId}`, 
        SK: 'PROFILE' 
      },
      UpdateExpression: 'SET last_login = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': Date.now()
      }
    }).promise();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        needsOnboarding: false,
        hasProfile: true,
        userProfile: {
          id: userId,
          email: userProfile.email,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          role: userProfile.role,
          organization_id: userProfile.organization_id,
          subscription_status: userProfile.subscription_status,
          trial_end: userProfile.trial_end,
          last_login: userProfile.last_login
        },
        organizationData
      })
    };

  } catch (error) {
    console.error('Check user status error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error checking user status',
        details: error.message
      })
    };
  }
};