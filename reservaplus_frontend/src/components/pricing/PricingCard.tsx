// src/components/pricing/PricingCard.tsx
import React from 'react'
import { CheckCircle, Star, Zap, Crown, ArrowRight } from 'lucide-react'

interface PricingCardProps {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  popular?: boolean
  comingSoon?: boolean
  originalPrice?: string
  discount?: string
  badge?: string
  color?: 'emerald' | 'blue' | 'purple' | 'gradient'
  onGetStarted?: () => void
}

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  period,
  description,
  features,
  popular = false,
  comingSoon = false,
  originalPrice,
  discount,
  badge,
  color = 'emerald',
  onGetStarted
}) => {
  const colorSchemes = {
    emerald: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-50',
      gradient: 'from-emerald-500 to-cyan-500',
      badgeBg: 'bg-emerald-500',
      buttonPrimary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      buttonSecondary: 'border-emerald-500 text-emerald-600 hover:bg-emerald-50',
      iconColor: 'text-emerald-500',
      accent: 'text-emerald-600'
    },
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      gradient: 'from-blue-500 to-indigo-500',
      badgeBg: 'bg-blue-500',
      buttonPrimary: 'bg-blue-500 hover:bg-blue-600 text-white',
      buttonSecondary: 'border-blue-500 text-blue-600 hover:bg-blue-50',
      iconColor: 'text-blue-500',
      accent: 'text-blue-600'
    },
    purple: {
      border: 'border-purple-500',
      bg: 'bg-purple-50',
      gradient: 'from-purple-500 to-pink-500',
      badgeBg: 'bg-purple-500',
      buttonPrimary: 'bg-purple-500 hover:bg-purple-600 text-white',
      buttonSecondary: 'border-purple-500 text-purple-600 hover:bg-purple-50',
      iconColor: 'text-purple-500',
      accent: 'text-purple-600'
    },
    gradient: {
      border: 'border-transparent',
      bg: 'bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50',
      gradient: 'from-emerald-500 via-cyan-500 to-blue-500',
      badgeBg: 'bg-gradient-to-r from-emerald-500 to-cyan-500',
      buttonPrimary: 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white',
      buttonSecondary: 'border-emerald-500 text-emerald-600 hover:bg-emerald-50',
      iconColor: 'text-emerald-500',
      accent: 'text-emerald-600'
    }
  }

  const scheme = colorSchemes[color]
  const isHighlighted = popular || color === 'gradient'

  return (
    <div className={`
      relative flex flex-col h-full rounded-3xl p-8 transition-all duration-500 group
      ${isHighlighted 
        ? `border-2 ${scheme.border} ${scheme.bg} shadow-2xl scale-105 hover:scale-110` 
        : 'border-2 border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl hover:scale-105'
      }
      ${comingSoon ? 'opacity-75' : ''}
      min-h-[600px]
    `}>
      
      {/* Gradient overlay for highlighted cards */}
      {isHighlighted && (
        <div className={`absolute inset-0 bg-gradient-to-br ${scheme.gradient} opacity-5 rounded-3xl`}></div>
      )}

      {/* Badges */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        {popular && (
          <div className={`${scheme.badgeBg} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2`}>
            <Star className="w-4 h-4 fill-current" />
            Más Popular
          </div>
        )}
        {comingSoon && (
          <div className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
            Próximamente
          </div>
        )}
        {badge && !popular && !comingSoon && (
          <div className={`${scheme.badgeBg} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg`}>
            {badge}
          </div>
        )}
        {discount && (
          <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            {discount}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="relative text-center mb-8 pt-4">
        <div className="flex items-center justify-center mb-4">
          {name === 'Básico' && <Zap className={`w-8 h-8 ${scheme.iconColor} mr-2`} />}
          {name === 'Profesional' && <Star className={`w-8 h-8 ${scheme.iconColor} mr-2`} />}
          {name === 'Empresarial' && <Crown className={`w-8 h-8 ${scheme.iconColor} mr-2`} />}
          <h3 className="text-3xl font-bold text-gray-900">
            {name}
          </h3>
        </div>
        
        <p className="text-gray-600 mb-6 text-lg">
          {description}
        </p>
        
        <div className="flex items-baseline justify-center mb-2">
          {originalPrice && (
            <span className="text-xl text-gray-400 line-through mr-2">
              ${originalPrice}
            </span>
          )}
          <span className="text-5xl font-bold text-gray-900">
            ${price}
          </span>
          <span className="text-gray-500 ml-2 text-lg">
            {period}
          </span>
        </div>
        
        {/* Special pricing note for Básico */}
        {name === 'Básico' && (
          <div className="mt-3">
            <span className={`${scheme.bg} ${scheme.accent} px-4 py-2 rounded-full text-sm font-semibold border ${scheme.border}`}>
              $12.990 por profesional adicional
            </span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex-1">
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center group/item">
              <div className={`w-6 h-6 ${scheme.bg} rounded-full flex items-center justify-center mr-4 group-hover/item:scale-110 transition-transform duration-200`}>
                <CheckCircle className={`w-4 h-4 ${scheme.iconColor}`} />
              </div>
              <span className="text-gray-700 group-hover/item:text-gray-900 transition-colors">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="mt-auto pt-6">
        {comingSoon ? (
          <button
            className="w-full py-4 px-6 rounded-2xl font-bold bg-gray-300 text-gray-500 cursor-not-allowed text-lg"
            disabled
          >
            Próximamente
          </button>
        ) : (
          <div className="space-y-3">
            {isHighlighted ? (
              <button
                onClick={onGetStarted}
                className={`group w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg ${scheme.buttonPrimary} relative overflow-hidden`}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative flex items-center justify-center">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className={`w-full py-4 px-6 rounded-2xl font-bold border-2 transition-all duration-300 hover:scale-105 text-lg ${scheme.buttonSecondary}`}
              >
                Comenzar Gratis
              </button>
            )}
            
            {/* Trial info */}
            <p className="text-sm text-gray-500 text-center">
              {isHighlighted ? 'Prueba 14 días gratis' : 'Sin compromiso'}
            </p>
          </div>
        )}
      </div>

      {/* Floating elements */}
      {isHighlighted && (
        <>
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl"></div>
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
        </>
      )}
    </div>
  )
}

export default PricingCard