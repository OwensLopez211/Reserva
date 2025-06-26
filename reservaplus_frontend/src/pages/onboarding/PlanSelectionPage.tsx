// src/pages/onboarding/PlanSelectionPage.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star } from 'lucide-react'
import PricingCard from '../../components/pricing/PricingCard'

interface Plan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
  originalMonthlyPrice?: number
  originalYearlyPrice?: number
  discount?: string
  description: string
  features: string[]
  popular: boolean
  comingSoon?: boolean
  badge?: string
  color: 'emerald' | 'blue' | 'purple' | 'gradient'
}

const PlanSelectionPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [, setSelectedPlan] = useState<string>('basic')
  const [isLoading, setIsLoading] = useState(false)

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Básico',
      monthlyPrice: 29990,
      yearlyPrice: 299900,
      originalMonthlyPrice: 59990,
      originalYearlyPrice: 599900,
      discount: '50% OFF',
      description: 'Todo lo que necesitas para profesionalizar tu negocio',
      features: [
        '1 Usuario Admin',
        '1 Recepcionista',
        '3 Profesionales',
        '500 citas por mes',
        '5 GB de almacenamiento',
        'Calendario inteligente',
        'Base de datos centralizada',
        'Notificaciones automáticas',
        'Panel de control básico',
        'Soporte personalizado',
        'Recordatorios por email',
        '$12.990 por profesional adicional'
      ],
      popular: true,
      badge: 'Disponible Ahora',
      color: 'gradient'
    },
    {
      id: 'professional',
      name: 'Profesional',
      monthlyPrice: 49990,
      yearlyPrice: 499900,
      originalMonthlyPrice: 99990,
      originalYearlyPrice: 999900,
      discount: '50% OFF',
      description: 'Para negocios en crecimiento con múltiples servicios',
      features: [
        '3 Usuarios Admin',
        '5 Recepcionistas',
        '15 Profesionales',
        '2,000 citas por mes',
        '25 GB de almacenamiento',
        'Todas las funciones básicas',
        'Panel de control avanzado',
        'Reportes y análisis',
        'Integraciones básicas',
        'Soporte prioritario',
        'Recordatorios SMS',
        'Multi-ubicación (hasta 3)'
      ],
      popular: false,
      comingSoon: true,
      color: 'blue'
    },
    {
      id: 'enterprise',
      name: 'Empresarial',
      monthlyPrice: 99990,
      yearlyPrice: 999900,
      originalMonthlyPrice: 199990,
      originalYearlyPrice: 1999900,
      discount: '50% OFF',
      description: 'Para empresas con múltiples ubicaciones y equipos grandes',
      features: [
        'Usuarios Admin ilimitados',
        'Recepcionistas ilimitadas',
        'Profesionales ilimitados',
        'Citas ilimitadas',
        '100 GB de almacenamiento',
        'Todas las funciones profesionales',
        'Multi-ubicación ilimitada',
        'API personalizada',
        'Integraciones avanzadas',
        'Soporte 24/7',
        'Capacitación personalizada',
        'Gerente de cuenta dedicado'
      ],
      popular: false,
      comingSoon: true,
      color: 'purple'
    }
  ]

  const handleSelectPlan = async (planId: string) => {
    setIsLoading(true)
    setSelectedPlan(planId)
    
    try {
      const plan = plans.find(p => p.id === planId)
      if (!plan) return

      const selectedPrice = selectedBilling === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice

      // Guardar plan seleccionado en localStorage para el siguiente paso
      localStorage.setItem('selectedPlan', JSON.stringify({
        planId: plan.id,
        billingCycle: selectedBilling,
        price: selectedPrice,
        planName: plan.name
      }))
      
      // Navegar al registro
      navigate('/onboarding/register')
    } catch (error) {
      console.error('Error al seleccionar plan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (plan: Plan) => {
    const price = selectedBilling === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
    return price.toLocaleString()
  }

  const formatOriginalPrice = (plan: Plan) => {
    if (selectedBilling === 'monthly' && plan.originalMonthlyPrice) {
      return plan.originalMonthlyPrice.toLocaleString()
    }
    if (selectedBilling === 'yearly' && plan.originalYearlyPrice) {
      return plan.originalYearlyPrice.toLocaleString()
    }
    return undefined
  }

  const getPeriod = () => {
    return selectedBilling === 'monthly' ? '/mes' : '/año'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3">
                <span className="text-white font-light text-lg">+</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reserva+</h1>
            </div>
            <div className="text-sm text-gray-500">
              Paso 1 de 6
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 h-2">
            <div className="w-1/6 bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Header Section */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4 lg:mb-6">
            <Star className="w-4 h-4 mr-2" />
            Oferta de Lanzamiento
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6">
            Comienza con nuestro{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Plan Básico
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Inicia tu transformación digital con todo lo esencial. Más planes llegarán pronto.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8 lg:mb-12">
          <div className="bg-white rounded-xl p-1 shadow-lg border">
            <div className="flex">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-4 lg:px-6 py-3 rounded-lg font-medium transition-all text-sm lg:text-base ${
                  selectedBilling === 'monthly'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-4 lg:px-6 py-3 rounded-lg font-medium transition-all relative text-sm lg:text-base ${
                  selectedBilling === 'yearly'
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Anual
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                  -17%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div id="pricing-plans" className="mb-8 lg:mb-12">
          {/* Mobile: Stack vertically */}
          <div className="block lg:hidden space-y-6">
            {plans.map((plan) => (
              <div key={plan.id} className="max-w-sm mx-auto">
                <PricingCard
                  name={plan.name}
                  price={formatPrice(plan)}
                  originalPrice={formatOriginalPrice(plan)}
                  period={getPeriod()}
                  description={plan.description}
                  features={plan.features}
                  popular={plan.popular}
                  comingSoon={plan.comingSoon}
                  discount={plan.discount}
                  badge={plan.badge}
                  color={plan.color}
                  onGetStarted={() => handleSelectPlan(plan.id)}
                />
              </div>
            ))}
          </div>

          {/* Desktop: Grid layout */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-6 xl:gap-8">
            {plans.map((plan) => (
              <div key={plan.id} className="flex justify-center">
                <div className="w-full max-w-sm">
                  <PricingCard
                    name={plan.name}
                    price={formatPrice(plan)}
                    originalPrice={formatOriginalPrice(plan)}
                    period={getPeriod()}
                    description={plan.description}
                    features={plan.features}
                    popular={plan.popular}
                    comingSoon={plan.comingSoon}
                    discount={plan.discount}
                    badge={plan.badge}
                    color={plan.color}
                    onGetStarted={() => handleSelectPlan(plan.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-600 text-sm lg:text-base">Sin compromisos</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-600 text-sm lg:text-base">Datos seguros</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-600 text-sm lg:text-base">Soporte personalizado</span>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-2xl mx-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
                <span className="text-base lg:text-lg font-medium text-gray-700">Configurando tu plan...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlanSelectionPage