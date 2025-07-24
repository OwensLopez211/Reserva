// Script para poblar DynamoDB con planes de suscripción
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configurar AWS
const dynamodbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const docClient = DynamoDBDocumentClient.from(dynamodbClient);
const TABLE_NAME = process.env.TABLE_NAME || 'reservaplus-dev';

const plans = [
  {
    PK: 'PLANS#ACTIVE',
    SK: 'PLAN#basico',
    plan_id: 'basico',
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
    color_scheme: 'emerald',
    display_order: 1,
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    PK: 'PLANS#ACTIVE',
    SK: 'PLAN#profesional',
    plan_id: 'profesional',
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
    color_scheme: 'blue',
    display_order: 2,
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now()
  },
  {
    PK: 'PLANS#ACTIVE',
    SK: 'PLAN#empresarial',
    plan_id: 'empresarial',
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
    color_scheme: 'purple',
    display_order: 3,
    is_active: true,
    created_at: Date.now(),
    updated_at: Date.now()
  }
];

async function populatePlans() {
  console.log('📋 Poblando DynamoDB con planes...');
  
  try {
    // Insertar planes uno por uno
    for (const plan of plans) {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: plan
      }));
      
      console.log(`✅ Plan insertado: ${plan.name}`);
    }
    
    console.log('🎉 Todos los planes han sido insertados exitosamente');
    
  } catch (error) {
    console.error('❌ Error insertando planes:', error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  populatePlans();
}

module.exports = { populatePlans };