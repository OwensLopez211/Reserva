// src/components/pricing/PricingCard.tsx
import React from 'react'
import { Check, Zap, Star, Crown, ArrowRight } from 'lucide-react'

interface PricingCardProps {
  name: string
  price: string
  originalPrice?: string
  period: string
  description: string
  features: string[]
  popular?: boolean
  comingSoon?: boolean
  discount?: string
  badge?: string
  color: 'emerald' | 'blue' | 'purple' | 'gradient'
  onGetStarted: () => void
}

const PricingCard: React.FC<PricingCardProps> = ({
  name,
  price,
  originalPrice,
  period,
  description,
  features,
  popular = false,
  comingSoon = false,
  discount,
  badge,
  color,
  onGetStarted
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'emerald':
        return {
          gradient: 'from-emerald-500 to-emerald-600',
          bg: 'bg-emerald-500',
          bgHover: 'hover:bg-emerald-600',
          border: 'border-emerald-200',
          text: 'text-emerald-600',
          lightBg: 'bg-emerald-50',
          darkText: 'text-emerald-900',
          icon: 'text-emerald-500'
        }
      case 'blue':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-500',
          bgHover: 'hover:bg-blue-600',
          border: 'border-blue-200',
          text: 'text-blue-600',
          lightBg: 'bg-blue-50',
          darkText: 'text-blue-900',
          icon: 'text-blue-500'
        }
      case 'purple':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-500',
          bgHover: 'hover:bg-purple-600',
          border: 'border-purple-200',
          text: 'text-purple-600',
          lightBg: 'bg-purple-50',
          darkText: 'text-purple-900',
          icon: 'text-purple-500'
        }
      case 'gradient':
      default:
        return {
          gradient: 'from-emerald-500 to-cyan-500',
          bg: 'bg-gradient-to-r from-emerald-500 to-cyan-500',
          bgHover: 'hover:from-emerald-600 hover:to-cyan-600',
          border: 'border-emerald-200',
          text: 'text-emerald-600',
          lightBg: 'bg-gradient-to-br from-emerald-50 to-cyan-50',
          darkText: 'text-emerald-900',
          icon: 'text-emerald-500'
        }
    }
  }

  const colorClasses = getColorClasses()

  const getIcon = () => {
    switch (color) {
      case 'blue':
        return <Star className="w-5 h-5" />
      case 'purple':
        return <Crown className="w-5 h-5" />
      case 'emerald':
      default:
        return <Zap className="w-5 h-5" />
    }
  }

  return (
    <div className={`
      relative w-full max-w-sm mx-auto
      ${popular ? 'transform scale-105 lg:scale-110' : ''}
      ${popular ? 'z-10' : 'z-0'}
      transition-all duration-300 hover:scale-105
    `}>
      {/* Popular Badge */}
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className={`
            px-4 py-2 rounded-full text-white text-sm font-bold shadow-lg
            ${colorClasses.bg}
            flex items-center gap-2
          `}>
            <Star className="w-4 h-4" />
            Más Popular
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className={`
        relative bg-white rounded-2xl mt-20 shadow-xl border-2 overflow-hidden
        ${popular ? colorClasses.border : 'border-gray-200'}
        ${popular ? 'shadow-2xl' : 'shadow-lg hover:shadow-xl'}
        transition-all duration-300
        h-full flex flex-col
      `}>
        
        {/* Card Header */}
        <div className={`
          px-6 pt-8 pb-6 text-center relative
          ${popular ? colorClasses.lightBg : 'bg-gray-50'}
        `}>
          {/* Discount Badge */}
          {discount && (
            <div className="absolute top-4 right-4">
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                {discount}
              </span>
            </div>
          )}

          {/* Plan Icon */}
          <div className={`
            w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center
            ${popular ? colorClasses.bg : 'bg-gray-200'}
            ${popular ? 'text-white' : 'text-gray-500'}
          `}>
            {getIcon()}
          </div>

          {/* Plan Name */}
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{name}</h3>

          {/* Badge */}
          {badge && (
            <div className={`
              inline-block px-3 py-1 rounded-full text-xs font-medium mb-4
              ${colorClasses.lightBg} ${colorClasses.darkText}
            `}>
              {badge}
            </div>
          )}

          {/* Price */}
          <div className="mb-4">
            {originalPrice && (
              <div className="text-gray-400 line-through text-lg mb-1">
                ${originalPrice}
              </div>
            )}
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl lg:text-5xl font-bold text-gray-900">
                ${price}
              </span>
              <span className="text-gray-600 text-lg">{period}</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto">
            {description}
          </p>
        </div>

        {/* Features List */}
        <div className="px-6 py-6 flex-grow">
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className={`
                  w-5 h-5 mt-0.5 flex-shrink-0
                  ${colorClasses.icon}
                `} />
                <span className="text-gray-700 text-sm leading-relaxed">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-8 mt-auto">
          <button
            onClick={onGetStarted}
            disabled={comingSoon}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white
              transition-all duration-300 flex items-center justify-center gap-2
              ${comingSoon 
                ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                : `${colorClasses.bg} ${colorClasses.bgHover} hover:shadow-lg transform hover:-translate-y-0.5`
              }
            `}
          >
            {comingSoon ? (
              'Próximamente'
            ) : (
              <>
                Comenzar Ahora
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Trial info */}
          {!comingSoon && (
            <p className="text-center text-gray-500 text-xs mt-3">
              Prueba 14 días gratis
            </p>
          )}
        </div>

        {/* Coming Soon Overlay */}
        {comingSoon && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <Star className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-xl font-bold text-gray-700 mb-2">Próximamente</h4>
              <p className="text-gray-500 text-sm px-4">
                Este plan estará disponible pronto
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PricingCard