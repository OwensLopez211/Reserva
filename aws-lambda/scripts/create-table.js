// Script para crear la tabla DynamoDB con toda la estructura
const AWS = require('aws-sdk');

// Configurar AWS
const dynamodb = new AWS.DynamoDB({
  region: process.env.AWS_REGION || 'sa-east-1'
});

const TABLE_NAME = process.env.TABLE_NAME || 'reservaplus-dev';

const tableParams = {
  TableName: TABLE_NAME,
  
  // Definir claves principales
  KeySchema: [
    {
      AttributeName: 'PK',
      KeyType: 'HASH'  // Partition Key
    },
    {
      AttributeName: 'SK', 
      KeyType: 'RANGE' // Sort Key
    }
  ],
  
  // Definir atributos
  AttributeDefinitions: [
    {
      AttributeName: 'PK',
      AttributeType: 'S'
    },
    {
      AttributeName: 'SK',
      AttributeType: 'S'  
    },
    {
      AttributeName: 'GSI1PK',
      AttributeType: 'S'
    },
    {
      AttributeName: 'GSI1SK',
      AttributeType: 'S'
    },
    {
      AttributeName: 'GSI2PK', 
      AttributeType: 'S'
    },
    {
      AttributeName: 'GSI2SK',
      AttributeType: 'S'
    }
  ],
  
  // Global Secondary Indexes
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        {
          AttributeName: 'GSI1PK',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'GSI1SK', 
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'ALL'
      }
    },
    {
      IndexName: 'GSI2',
      KeySchema: [
        {
          AttributeName: 'GSI2PK',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'GSI2SK',
          KeyType: 'RANGE'
        }
      ],
      Projection: {
        ProjectionType: 'ALL' 
      }
    }
  ],
  
  // Configuración de facturación
  BillingMode: 'PAY_PER_REQUEST',
  
  // Stream settings para triggers (opcional)
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES'
  },
  
  // Tags
  Tags: [
    {
      Key: 'Project',
      Value: 'ReservaPlus'
    },
    {
      Key: 'Environment', 
      Value: process.env.ENVIRONMENT || 'dev'
    },
    {
      Key: 'Purpose',
      Value: 'Main application data'
    }
  ]
};

async function createTable() {
  console.log('🏗️  Creando tabla DynamoDB...');
  console.log('📋 Nombre de tabla:', TABLE_NAME);
  
  try {
    // Verificar si la tabla ya existe
    try {
      await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
      console.log('⚠️  La tabla ya existe:', TABLE_NAME);
      
      // Preguntar si quiere continuar (en un script real usarías readline)
      console.log('ℹ️  Para eliminar la tabla existente, ejecuta:');
      console.log(`   aws dynamodb delete-table --table-name ${TABLE_NAME}`);
      return;
      
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
      // La tabla no existe, continuar con la creación
    }
    
    // Crear la tabla
    console.log('🚀 Iniciando creación de tabla...');
    const result = await dynamodb.createTable(tableParams).promise();
    
    console.log('✅ Tabla creada exitosamente!');
    console.log('📊 ARN:', result.TableDescription.TableArn);
    
    // Esperar a que la tabla esté activa
    console.log('⏳ Esperando que la tabla esté disponible...');
    await dynamodb.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    
    // Configurar TTL
    console.log('⏱️  Configurando TTL...');
    await dynamodb.updateTimeToLive({
      TableName: TABLE_NAME,
      TimeToLiveSpecification: {
        AttributeName: 'TTL',
        Enabled: true
      }
    }).promise();

    // Configurar Point-in-time recovery
    console.log('🔄 Configurando Point-in-time recovery...');
    await dynamodb.updateContinuousBackups({
      TableName: TABLE_NAME,
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: true
      }
    }).promise();
    
    console.log('🎉 ¡Tabla completamente configurada!');
    console.log('');
    console.log('📋 Resumen de la tabla:');
    console.log('   - Nombre:', TABLE_NAME);
    console.log('   - Billing Mode: PAY_PER_REQUEST');
    console.log('   - Índices: GSI1, GSI2'); 
    console.log('   - TTL: Habilitado (campo TTL)');
    console.log('   - Point-in-time Recovery: Habilitado');
    console.log('   - Streams: Habilitado');
    console.log('');
    console.log('🚀 ¡Ya puedes usar la tabla en tu aplicación!');
    
  } catch (error) {
    console.error('❌ Error creando la tabla:', error);
    
    if (error.code === 'ResourceInUseException') {
      console.log('⚠️  La tabla ya existe. Si necesitas recrearla:');
      console.log(`   1. aws dynamodb delete-table --table-name ${TABLE_NAME}`);
      console.log(`   2. Espera a que se elimine completamente`);
      console.log(`   3. Ejecuta este script nuevamente`);
    }
    
    process.exit(1);
  }
}

// Función para poblar con datos iniciales
async function populateInitialData() {
  console.log('📊 Poblando datos iniciales...');
  
  const docClient = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'sa-east-1'
  });
  
  // Planes iniciales
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
      limits: {
        appointments_per_month: 50,
        professionals: 1,
        services: 3,
        locations: 1
      },
      is_popular: false,
      is_coming_soon: false,
      badge_text: 'Gratis',
      color_scheme: 'emerald',
      display_order: 1,
      is_active: true,
      created_at: Date.now()
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
      limits: {
        appointments_per_month: -1, // unlimited
        professionals: 5,
        services: -1,
        locations: 1
      },
      is_popular: true,
      is_coming_soon: false,
      badge_text: 'Más Popular',
      color_scheme: 'blue',
      display_order: 2,
      is_active: true,
      created_at: Date.now()
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
      limits: {
        appointments_per_month: -1,
        professionals: -1,
        services: -1,
        locations: -1
      },
      is_popular: false,
      is_coming_soon: false,
      badge_text: 'Enterprise',
      color_scheme: 'purple',
      display_order: 3,
      is_active: true,
      created_at: Date.now()
    }
  ];
  
  // Insertar planes
  for (const plan of plans) {
    await docClient.put({
      TableName: TABLE_NAME,
      Item: plan
    }).promise();
    console.log(`✅ Plan insertado: ${plan.name}`);
  }
  
  console.log('🎉 Datos iniciales poblados exitosamente!');
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log('📖 Uso:');
    console.log('  node create-table.js              - Crear tabla');
    console.log('  node create-table.js --populate   - Crear tabla y poblar datos');
    console.log('  node create-table.js --only-data  - Solo poblar datos (tabla debe existir)');
    console.log('');
    console.log('🔧 Variables de entorno:');
    console.log('  TABLE_NAME=reservaplus-dev   - Nombre de la tabla');
    console.log('  AWS_REGION=sa-east-1         - Región AWS');
    console.log('  ENVIRONMENT=dev              - Ambiente (dev/staging/prod)');
    return;
  }
  
  if (args.includes('--only-data')) {
    await populateInitialData();
    return;
  }
  
  await createTable();
  
  if (args.includes('--populate')) {
    console.log('');
    await populateInitialData();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTable, populateInitialData };