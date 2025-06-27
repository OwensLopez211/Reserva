// src/pages/onboarding/PlanSelectionPage.tsx - VERSIÓN ACTUALIZADA Y ALINEADA

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star } from 'lucide-react'
import PricingCard from '../../components/pricing/PricingCard'
import { OnboardingService } from '../../services/onboardingService'
import { formatPrice } from '../../utils/formatters'

interface Plan {
  id: string
  name: string
  price_monthly: number
  price_yearly?: number
  original_price?: number
  discount_text?: string
  description: string
  features: string[]
  is_popular: boolean
  is_coming_soon?: boolean
  badge_text?: string
  color_scheme: 'emerald' | 'blue' | 'purple' | 'gradient'
}

const PlanSelectionPage: React.FC = () => {
  const navigate = useNavigate()
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar planes desde el backend
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await OnboardingService.getAvailablePlans()
      console.log('📋 Planes cargados:', response)
      
      // Mapear respuesta del backend a formato del frontend
      const mappedPlans = response.results?.map((plan: Plan) => ({
        id: plan.id,
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        original_price: plan.original_price,
        discount_text: plan.discount_text,
        description: plan.description,
        features: plan.features,
        is_popular: plan.is_popular,
        is_coming_soon: plan.is_coming_soon,
        badge_text: plan.badge_text,
        color_scheme: plan.color_scheme
      })) || []

      setPlans(mappedPlans)
    } catch (error) {
      console.error('❌ Error cargando planes:', error)
      setError('Error al cargar los planes. Por favor recarga la página.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    // Validar que el plan no esté "coming soon"
    const selectedPlan = plans.find(p => p.id === planId)
    if (!selectedPlan) return
    
    if (selectedPlan.is_coming_soon) {
      alert('Este plan estará disponible pronto')
      return
    }

    setIsSubmitting(true)
    
    try {
      console.log('🎯 Plan seleccionado:', planId)
      
      // Guardar plan seleccionado temporalmente
      localStorage.setItem('selected_plan_id', planId)
      localStorage.setItem('selected_billing', selectedBilling)
      localStorage.setItem('selected_plan_data', JSON.stringify(selectedPlan))
      
      // Navegar directamente al registro
      // El signup se hará en la página de registro con todos los datos
      navigate('/onboarding/register')
      
    } catch (error) {
      console.error('❌ Error al seleccionar plan:', error)
      setError('Error al seleccionar el plan. Por favor intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPlanPrice = (plan: Plan) => {
    const price = selectedBilling === 'monthly' ? plan.price_monthly : (plan.price_yearly || plan.price_monthly * 12)
    return formatPrice(price)
  }

  const formatOriginalPrice = (plan: Plan) => {
    if (selectedBilling === 'monthly' && plan.original_price) {
      return formatPrice(plan.original_price)
    }
    // Para anual, calcular descuento si existe
    if (selectedBilling === 'yearly' && plan.price_yearly && plan.price_monthly) {
      const originalYearly = plan.price_monthly * 12
      return formatPrice(originalYearly)
    }
    return undefined
  }

  const getPeriod = () => {
    return selectedBilling === 'monthly' ? '/mes' : '/año'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando planes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌ {error}</div>
          <button 
            onClick={loadPlans}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
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
            Elige el plan perfecto{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              para tu negocio
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            Comienza tu transformación digital con nuestras herramientas profesionales
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
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay planes disponibles en este momento</p>
            </div>
          ) : (
            <>
              {/* Mobile: Stack vertically */}
              <div className="block lg:hidden space-y-6">
                {plans.map((plan) => (
                  <div key={plan.id} className="max-w-sm mx-auto">
                    <PricingCard
                      name={plan.name}
                      price={formatPlanPrice(plan)}
                      originalPrice={formatOriginalPrice(plan)}
                      period={getPeriod()}
                      description={plan.description}
                      features={plan.features}
                      popular={plan.is_popular}
                      comingSoon={plan.is_coming_soon}
                      discount={plan.discount_text}
                      badge={plan.badge_text}
                      color={plan.color_scheme}
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
                        price={formatPlanPrice(plan)}
                        originalPrice={formatOriginalPrice(plan)}
                        period={getPeriod()}
                        description={plan.description}
                        features={plan.features}
                        popular={plan.is_popular}
                        comingSoon={plan.is_coming_soon}
                        discount={plan.discount_text}
                        badge={plan.badge_text}
                        color={plan.color_scheme}
                        onGetStarted={() => handleSelectPlan(plan.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Trust Indicators */}
        <div className="text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-600 text-sm lg:text-base">14 días gratis</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-600 text-sm lg:text-base">Sin compromisos</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <span className="text-gray-600 text-sm lg:text-base">Soporte incluido</span>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-2xl mx-4">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mr-3"></div>
                <span className="text-base lg:text-lg font-medium text-gray-700">Procesando selección...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PlanSelectionPage