const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log('Get User Profile Request:', JSON.stringify(event, null, 2));
  
  try {
    // Get user ID from Cognito authorizer context
    const userId = event.requestContext.authorizer.claims.sub;
    
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

    // Get user profile
    const userProfileResult = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { 
        PK: `USER#${userId}`, 
        SK: 'PROFILE' 
      }
    }).promise();

    if (!userProfileResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'User profile not found'
        })
      };
    }

    const userProfile = userProfileResult.Item;

    // Get organization details if user belongs to one
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
        const org = orgResult.Item;
        organizationData = {
          id: org.PK.replace('ORG#', ''),
          name: org.name,
          industry_template: org.industry_template,
          email: org.email,
          phone: org.phone,
          address: org.address,
          city: org.city,
          country: org.country,
          subscription_status: org.subscription_status,
          trial_end: org.trial_end,
          is_active: org.is_active,
          created_at: org.created_at
        };

        // Get professionals count
        const professionalsResult = await dynamodb.query({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `ORG#${userProfile.organization_id}`,
            ':sk': 'PROF#'
          }
        }).promise();

        // Get services count
        const servicesResult = await dynamodb.query({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: {
            ':pk': `ORG#${userProfile.organization_id}`,
            ':sk': 'SERVICE#'
          }
        }).promise();

        organizationData.stats = {
          professionals_count: professionalsResult.Items.length,
          services_count: servicesResult.Items.length
        };
      }
    }

    // Get user's organization memberships
    const membershipsResult = await dynamodb.query({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'ORG#'
      }
    }).promise();

    const memberships = membershipsResult.Items.map(item => ({
      organization_id: item.GSI1SK.replace('ORG#', ''),
      role: item.role,
      permissions: item.permissions || [],
      joined_at: item.joined_at,
      is_active: item.is_active
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        profile: {
          id: userId,
          email: userProfile.email,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          full_name: `${userProfile.first_name} ${userProfile.last_name}`,
          role: userProfile.role,
          organization_id: userProfile.organization_id,
          organization_name: userProfile.organization_name,
          onboarding_completed: userProfile.onboarding_completed,
          subscription_status: userProfile.subscription_status,
          trial_end: userProfile.trial_end,
          is_active: userProfile.is_active,
          created_at: userProfile.created_at,
          last_login: userProfile.last_login
        },
        organization: organizationData,
        memberships
      })
    };

  } catch (error) {
    console.error('Get user profile error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error getting user profile',
        details: error.message
      })
    };
  }
};