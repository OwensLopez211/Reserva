const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const cognito = new AWS.CognitoIdentityServiceProvider();
const TABLE_NAME = process.env.TABLE_NAME;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

// Generate IDs
const generateId = () => uuidv4().replace(/-/g, '').substring(0, 12);

// Get permissions based on role
const getPermissionsByRole = (role) => {
  const rolePermissions = {
    'owner': ['manage_org', 'manage_users', 'manage_appointments', 'manage_services', 'view_reports', 'manage_billing'],
    'professional': ['manage_appointments', 'view_schedule', 'manage_services'],
    'reception': ['manage_appointments', 'view_schedule', 'manage_clients'],
    'staff': ['view_schedule', 'manage_appointments']
  };
  
  return rolePermissions[role] || rolePermissions['staff'];
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
  console.log('Complete Onboarding Request:', JSON.stringify(event, null, 2));
  
  try {
    const { registration_token, organization, professionals, services } = JSON.parse(event.body);
    
    // Validate input
    if (!registration_token || !organization || !professionals || !services) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Missing required fields: registration_token, organization, professionals, services'
        })
      };
    }

    // 1. Validate registration token
    const registrationResult = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { 
        PK: `REG#${registration_token}`, 
        SK: 'METADATA' 
      }
    }).promise();

    if (!registrationResult.Item) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Invalid registration token'
        })
      };
    }

    const registration = registrationResult.Item;
    
    if (registration.expires_at < Date.now()) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Registration token has expired'
        })
      };
    }

    const orgId = generateId();
    const userId = registration.cognito_user_id;
    const timestamp = Date.now();
    const trialEnd = timestamp + (14 * 24 * 60 * 60 * 1000); // 14 days trial

    // 2. Create organization in DynamoDB
    const orgItem = {
      PK: `ORG#${orgId}`,
      SK: 'METADATA',
      GSI1PK: 'ORG#ACTIVE',
      GSI1SK: organization.name,
      name: organization.name,
      industry_template: organization.industry_template || 'salon',
      email: organization.email,
      phone: organization.phone,
      address: organization.address || '',
      city: organization.city || '',
      country: organization.country || 'Chile',
      subscription_status: 'trial',
      trial_end: trialEnd,
      owner_user_id: userId,
      created_at: timestamp,
      updated_at: timestamp,
      is_active: true
    };

    // 3. Create user profile
    const userProfileItem = {
      PK: `USER#${userId}`,
      SK: 'PROFILE',
      GSI1PK: `EMAIL#${registration.email}`,
      GSI1SK: 'USER',
      email: registration.email,
      first_name: registration.user_data.first_name,
      last_name: registration.user_data.last_name,
      organization_id: orgId,
      role: 'owner',
      organization_name: organization.name,
      onboarding_completed: true,
      subscription_status: 'trial',
      trial_end: trialEnd,
      created_at: timestamp,
      last_login: timestamp,
      is_active: true
    };

    // 4. Create organization member record
    const orgMemberItem = {
      PK: `ORG#${orgId}`,
      SK: `USER#${userId}`,
      GSI1PK: `USER#${userId}`,
      GSI1SK: `ORG#${orgId}`,
      user_id: userId,
      email: registration.email,
      role: 'owner',
      permissions: ['manage_org', 'manage_users', 'manage_appointments', 'manage_services'],
      joined_at: timestamp,
      is_active: true
    };

    // 5. Prepare batch write operations
    const writeOperations = [
      {
        PutRequest: { Item: orgItem }
      },
      {
        PutRequest: { Item: userProfileItem }
      },
      {
        PutRequest: { Item: orgMemberItem }
      }
    ];

    // 6. Create professionals and their Cognito users
    const professionalItems = [];
    const cognitoPromises = [];
    
    for (const prof of professionals) {
      const profId = generateId();
      const tempPassword = generateTempPassword();
      
      // Create professional record
      professionalItems.push({
        PutRequest: {
          Item: {
            PK: `ORG#${orgId}`,
            SK: `PROF#${profId}`,
            GSI1PK: `PROF#${orgId}`,
            GSI1SK: prof.name,
            professional_id: profId,
            name: prof.name,
            email: prof.email,
            phone: prof.phone || '',
            specialty: prof.specialty || '',
            role: prof.role || 'professional',
            color_code: prof.color_code || '#4CAF50',
            accepts_walk_ins: prof.accepts_walk_ins !== undefined ? prof.accepts_walk_ins : true,
            is_active: true,
            created_at: timestamp,
            updated_at: timestamp
          }
        }
      });

      // Create user profile for the professional
      professionalItems.push({
        PutRequest: {
          Item: {
            PK: `USER#${prof.email}`,
            SK: 'PROFILE',
            GSI1PK: `EMAIL#${prof.email}`,
            GSI1SK: 'USER',
            email: prof.email,
            first_name: prof.name.split(' ')[0],
            last_name: prof.name.split(' ').slice(1).join(' ') || '',
            organization_id: orgId,
            role: prof.role || 'professional',
            organization_name: organization.name,
            onboarding_completed: true,
            subscription_status: 'active',
            created_at: timestamp,
            last_login: null,
            is_active: true,
            professional_id: profId
          }
        }
      });

      // Create organization member record for the professional
      const permissions = getPermissionsByRole(prof.role || 'professional');
      professionalItems.push({
        PutRequest: {
          Item: {
            PK: `ORG#${orgId}`,
            SK: `USER#${prof.email}`,
            GSI1PK: `USER#${prof.email}`,
            GSI1SK: `ORG#${orgId}`,
            user_id: prof.email,
            email: prof.email,
            role: prof.role || 'professional',
            permissions: permissions,
            joined_at: timestamp,
            is_active: true,
            professional_id: profId
          }
        }
      });

      // Create Cognito user (async operation)
      cognitoPromises.push(
        cognito.adminCreateUser({
          UserPoolId: USER_POOL_ID,
          Username: prof.email,
          UserAttributes: [
            { Name: 'email', Value: prof.email },
            { Name: 'name', Value: prof.name },
            { Name: 'email_verified', Value: 'true' }
          ],
          TemporaryPassword: tempPassword,
          MessageAction: 'SUPPRESS' // Don't send welcome email
        }).promise().then(() => {
          console.log(`Cognito user created for professional: ${prof.email}`);
        }).catch(error => {
          console.error(`Error creating Cognito user for ${prof.email}:`, error);
          // Don't fail the whole process if one user creation fails
        })
      );
    }

    // Execute all Cognito user creations in parallel
    await Promise.allSettled(cognitoPromises);

    // 7. Create services
    const serviceItems = services.map((service) => {
      const serviceId = generateId();
      return {
        PutRequest: {
          Item: {
            PK: `ORG#${orgId}`,
            SK: `SERVICE#${serviceId}`,
            GSI1PK: `SERVICE#${orgId}`,
            GSI1SK: service.name,
            service_id: serviceId,
            name: service.name,
            description: service.description || '',
            category: service.category || '',
            duration_minutes: service.duration_minutes,
            price: service.price,
            buffer_time_before: service.buffer_time_before || 0,
            buffer_time_after: service.buffer_time_after || 10,
            is_active: service.is_active !== undefined ? service.is_active : true,
            requires_preparation: service.requires_preparation !== undefined ? service.requires_preparation : false,
            created_at: timestamp,
            updated_at: timestamp
          }
        }
      };
    });

    // Add professionals and services to write operations
    writeOperations.push(...professionalItems, ...serviceItems);

    // 8. Execute batch write
    const batchSize = 25; // DynamoDB batch write limit
    for (let i = 0; i < writeOperations.length; i += batchSize) {
      const batch = writeOperations.slice(i, i + batchSize);
      await dynamodb.batchWrite({
        RequestItems: {
          [TABLE_NAME]: batch
        }
      }).promise();
    }

    // 9. Clean up registration token
    await dynamodb.delete({
      TableName: TABLE_NAME,
      Key: { 
        PK: `REG#${registration_token}`, 
        SK: 'METADATA' 
      }
    }).promise();

    console.log('Onboarding completed successfully:', { 
      orgId, 
      userId, 
      professionals: professionals.length, 
      services: services.length 
    });

    // 10. Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        message: 'Onboarding completed successfully',
        data: {
          organization: {
            id: orgId,
            name: organization.name,
            industry_template: organization.industry_template
          },
          user: {
            id: userId,
            email: registration.email,
            full_name: `${registration.user_data.first_name} ${registration.user_data.last_name}`,
            role: 'owner'
          },
          subscription: {
            plan: registration.plan_id,
            status: 'trial',
            trial_end: new Date(trialEnd).toISOString()
          },
          team_members: [{
            id: userId,
            name: `${registration.user_data.first_name} ${registration.user_data.last_name}`,
            email: registration.email,
            role: 'owner'
          }],
          professionals: professionals.map((prof, index) => ({
            id: `prof_${index}`,
            name: prof.name,
            email: prof.email,
            specialty: prof.specialty
          })),
          services: services.map((service, index) => ({
            id: `service_${index}`,
            name: service.name,
            price: service.price,
            duration_minutes: service.duration_minutes
          }))
        }
      })
    };

  } catch (error) {
    console.error('Complete onboarding error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error during onboarding completion',
        details: error.message
      })
    };
  }
};