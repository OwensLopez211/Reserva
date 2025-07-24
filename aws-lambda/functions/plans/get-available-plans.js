const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME;

exports.handler = async (event) => {
  console.log('Get Available Plans Request:', JSON.stringify(event, null, 2));
  
  try {
    // Get all active plans from DynamoDB
    const result = await dynamodb.query({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': 'PLANS#ACTIVE'
      }
    }).promise();

    // If no plans found in DynamoDB, return hardcoded plans
    if (!result.Items || result.Items.length === 0) {
      console.log('No plans found in DynamoDB, returning default plans');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        body: JSON.stringify({
          results: getDefaultPlans(),
          count: 3
        })
      };
    }

    // Sort plans by display order
    const plans = result.Items
      .map(item => ({
        id: item.plan_id,
        name: item.name,
        price_monthly: item.price_monthly,
        price_yearly: item.price_yearly,
        original_price: item.original_price,
        discount_text: item.discount_text,
        description: item.description,
        features: item.features,
        is_popular: item.is_popular,
        is_coming_soon: item.is_coming_soon,
        badge_text: item.badge_text,
        color_scheme: item.color_scheme,
        display_order: item.display_order || 0
      }))
      .sort((a, b) => a.display_order - b.display_order);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify({
        results: plans,
        count: plans.length
      })
    };

  } catch (error) {
    console.error('Get plans error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error getting plans',
        details: error.message
      })
    };
  }
};

// Default plans fallback (same as your current plans)
function getDefaultPlans() {
  return [
    {
      id: 'basico',
      name: 'Plan Básico',
      price_monthly: 0,
      price_yearly: 0,
      description: 'Ideal para empezar tu negocio',
      features: [
        'Hasta 50 citas por mes',
        '1 profesional',
        '3 servicios',
        'Agenda básica',
        'Recordatorios por email',
        'Soporte básico'
      ],
      is_popular: false,
      is_coming_soon: false,
      badge_text: 'Gratis',
      color_scheme: 'emerald'
    },
    {
      id: 'profesional',
      name: 'Plan Profesional',
      price_monthly: 29900,
      price_yearly: 299000,
      original_price: 359000,
      discount_text: '17% OFF',
      description: 'Para negocios en crecimiento',
      features: [
        'Citas ilimitadas',
        'Hasta 5 profesionales',
        'Servicios ilimitados',
        'Agenda avanzada',
        'Recordatorios por SMS',
        'Reportes básicos',
        'Integración con pagos',
        'Soporte prioritario'
      ],
      is_popular: true,
      is_coming_soon: false,
      badge_text: 'Más Popular',
      color_scheme: 'blue'
    },
    {
      id: 'empresarial',
      name: 'Plan Empresarial',
      price_monthly: 59900,
      price_yearly: 599000,
      original_price: 719000,
      discount_text: '17% OFF',
      description: 'Para equipos grandes y múltiples ubicaciones',
      features: [
        'Todo en Plan Profesional',
        'Profesionales ilimitados',
        'Múltiples ubicaciones',
        'Agenda compartida',
        'Reportes avanzados',
        'API personalizada',
        'Integración completa',
        'Soporte dedicado 24/7'
      ],
      is_popular: false,
      is_coming_soon: false,
      badge_text: 'Enterprise',
      color_scheme: 'purple'
    }
  ];
}