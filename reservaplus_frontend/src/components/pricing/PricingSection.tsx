// src/components/pricing/PricingHeroSection.tsx
import React from 'react'
import { DollarSign, ArrowDown } from 'lucide-react'

interface PricingHeroSectionProps {
  title?: string
  subtitle?: string
  variant?: 'default' | 'modern' | 'minimal'
}

const PricingHeroSection: React.FC<PricingHeroSectionProps> = ({
  title = "Precios Simples y Transparentes",
  subtitle = "Elige el plan que mejor se adapte a tu negocio. Sin sorpresas, sin costos ocultos.",
  variant = 'modern'
}) => {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing-plans')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

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

export default PricingHeroSection