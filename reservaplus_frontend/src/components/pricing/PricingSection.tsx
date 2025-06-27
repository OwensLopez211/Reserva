// src/components/pricing/PricingSection.tsx - SECCIÓN COMPLETA DE PRICING CON BACKEND
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DollarSign, ArrowDown, Check, Star } from 'lucide-react'
import PricingCard from './PricingCard'
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

interface PricingSectionProps {
  title?: string
  subtitle?: string
  variant?: 'default' | 'modern' | 'minimal'
  showHero?: boolean
  onPlanSelect?: (planId: string) => void
}

const PricingSection: React.FC<PricingSectionProps> = ({
  title = "Precios Simples y Transparentes",
  subtitle = "Elige el plan que mejor se adapte a tu negocio. Sin sorpresas, sin costos ocultos.",
  variant = 'modern',
  showHero = true,
  onPlanSelect
}) => {
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
      console.log('📋 Planes cargados en PricingSection:', response)
      
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
      setError('Error al cargar los planes.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-plans')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSelectPlan = async (planId: string) => {
    // Si hay un callback personalizado, usarlo
    if (onPlanSelect) {
      onPlanSelect(planId)
      return
    }

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
      
      // Navegar al onboarding
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

  // Hero Section Component
  const HeroSection = () => {
    if (!showHero) return null

    if (variant === 'minimal') {
      return (
        <section className="pt-24 pb-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {title}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </div>
        </section>
      )
    }

    if (variant === 'default') {
      return (
        <section className="pt-24 pb-16 bg-gradient-to-br from-emerald-600 to-cyan-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {title}
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto mb-8">
              {subtitle}
            </p>
            <button
              onClick={scrollToPricing}
              className="inline-flex items-center text-emerald-200 hover:text-white transition-colors"
            >
              <span className="mr-2">Ver planes disponibles</span>
              <ArrowDown className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        </section>
      )
    }

    // Modern variant (default)
    return (
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10"></div>
          
          {/* Animated orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
          <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-emerald-300 rounded-full animate-ping delay-700"></div>
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 backdrop-blur-sm rounded-full border border-emerald-500/20 mb-6">
              <DollarSign className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-emerald-300 text-sm font-medium">Precios de Lanzamiento</span>
            </div>

            {/* Main Title */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="block">Precios</span>
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent block">
                  Transparentes
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Value propositions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-emerald-400">Sin compromisos</div>
                <div className="text-gray-400">Cancela cuando quieras</div>
              </div>
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-cyan-400">Precio fijo</div>
                <div className="text-gray-400">Sin costos ocultos</div>
              </div>
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-blue-400">14 días gratis</div>
                <div className="text-gray-400">Prueba sin riesgo</div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="pt-16">
              <button
                onClick={scrollToPricing}
                className="group inline-flex flex-col items-center text-gray-400 hover:text-emerald-400 transition-all duration-300"
              >
                <span className="text-sm font-medium mb-2 group-hover:text-emerald-300">
                  Ver planes disponibles
                </span>
                <div className="w-6 h-10 border-2 border-gray-500 group-hover:border-emerald-400 rounded-full flex justify-center transition-colors duration-300">
                  <div className="w-1 h-3 bg-gray-500 group-hover:bg-emerald-400 rounded-full mt-2 animate-bounce transition-colors duration-300"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <div>
      {/* Hero Section */}
      <HeroSection />

      {/* Pricing Plans Section */}
      <section id="pricing-plans" className="py-16 lg:py-24 bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              Oferta de Lanzamiento
            </div>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Elige tu plan ideal
            </h2>
            
            <p className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
              Comienza tu transformación digital con nuestras herramientas profesionales
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12 lg:mb-16">
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

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando planes...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">❌ {error}</div>
              <button 
                onClick={loadPlans}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Pricing Cards */}
          {!loading && !error && (
            <div className="mb-12 lg:mb-16">
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
          )}

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
      </section>
    </div>
  )
}

export default PricingSection