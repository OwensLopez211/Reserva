// src/pages/public/PricingPage.tsx
import React from 'react'
import { Shield, Zap, Users, Phone, Mail, MessageCircle } from 'lucide-react'
import PricingHeroSection from '../../components/pricing/PricingSection'
import PricingCard from '../../components/pricing/PricingCard'

export const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Básico',
      price: '29.990',
      originalPrice: '59.990',
      period: '/mes',
      description: 'Perfecto para negocios pequeños que están empezando',
      features: [
        'Hasta 2 profesionales',
        'Calendario básico con múltiples vistas',
        'Gestión completa de clientes',
        'Recordatorios automáticos por email',
        'Soporte por email prioritario',
        'Dashboard con métricas básicas'
      ],
      popular: false,
      comingSoon: false,
      discount: '50% OFF',
      color: 'gradient' as const,
    },
    {
      name: 'Profesional',
      price: '49.990',
      originalPrice: '99.990',
      period: '/mes',
      description: 'Ideal para negocios en crecimiento que necesitan más funciones',
      features: [
        'Hasta 10 profesionales',
        'Calendario avanzado con sincronización',
        'Recordatorios SMS + Email',
        'Reportes y analytics básicos',
        'Soporte prioritario por chat',
        'Personalización de marca básica',
        'Integración con Google Calendar'
      ],
      popular: false,
      comingSoon: true,
     

      badge: 'Recomendado'
    },
    {
      name: 'Empresarial',
      price: '99.990',
      originalPrice: '199.990',
      period: '/mes',
      description: 'Para empresas establecidas que necesitan funciones avanzadas',
      features: [
        'Profesionales ilimitados',
        'Todas las características premium',
        'Reportes avanzados y analytics',
        'Integraciones API completas',
        'Soporte 24/7 dedicado',
        'Personalización completa de marca',
        'Gestión multi-sucursales',
        'Entrenamiento personalizado'
      ],
      popular: false,
      comingSoon: true,
      color: 'purple' as const,
      
    }
  ]

  const faqs = [
    {
      question: '¿Puedo cambiar de plan en cualquier momento?',
      answer: 'Sí, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se reflejarán en tu próxima facturación.'
    },
    {
      question: '¿Hay costos ocultos o comisiones por transacción?',
      answer: 'No, nuestros precios son completamente transparentes. Solo pagas la suscripción mensual, sin costos adicionales.'
    },
    {
      question: '¿Qué incluye la prueba gratuita de 14 días?',
      answer: 'Tienes acceso completo a todas las funciones del plan Básico durante 14 días, sin necesidad de tarjeta de crédito.'
    },
    {
      question: '¿Ofrecen descuentos para pagos anuales?',
      answer: 'Sí, ofrecemos 20% de descuento adicional para suscripciones anuales. Contáctanos para más detalles.'
    }
  ]

  const handleGetStarted = (planName: string) => {
    console.log(`Starting with ${planName} plan`)
    // Aquí iría la lógica para redirigir al registro
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <PricingHeroSection 
        title="Precios Simples y Transparentes"
        subtitle="Elige el plan que mejor se adapte a tu negocio. Sin sorpresas, sin costos ocultos. Comienza gratis hoy mismo."
        variant="modern"
      />

      {/* Pricing Plans */}
      <section id="pricing-plans" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Oferta de Lanzamiento
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Elige tu{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                plan perfecto
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Todos los planes incluyen 14 días de prueba gratuita y apoyo personalizado para nuevos clientes
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                name={plan.name}
                price={plan.price}
                originalPrice={plan.originalPrice}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                popular={plan.popular}
                comingSoon={plan.comingSoon}
                color={plan.color}
                discount={plan.discount}
                badge={plan.badge}
                onGetStarted={() => handleGetStarted(plan.name)}
              />
            ))}
          </div>

          {/* Trust indicators */}
          <div className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3">
                <Shield className="w-6 h-6 text-emerald-500" />
                <span className="text-gray-600">Sin compromiso de permanencia</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Zap className="w-6 h-6 text-cyan-500" />
                <span className="text-gray-600">Configuración en 5 minutos</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Users className="w-6 h-6 text-blue-500" />
                <span className="text-gray-600">Apoyo personalizado incluido</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-600">
              Resolvemos las dudas más comunes sobre nuestros planes
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Necesitas un plan personalizado?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Si tu negocio tiene necesidades específicas, contáctanos y crearemos un plan a tu medida
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="flex items-center gap-2 text-emerald-200">
              <Mail className="w-5 h-5" />
              <span>hola@reservaplus.com</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-200">
              <Phone className="w-5 h-5" />
              <span>+56 9 1234 5678</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-200">
              <MessageCircle className="w-5 h-5" />
              <span>Chat en vivo</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PricingPage