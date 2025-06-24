// src/components/home/FeaturesSection.tsx
import React from 'react'

type Feature = {
  icon: React.ElementType,
  title: string,
  description: string,
  color?: string,
  bgColor?: string,
  iconBg?: string,
  iconColor?: string
}

interface FeaturesSectionProps {
  features: Feature[]
  title?: string
  subtitle?: string
  variant?: 'default' | 'modern' | 'minimal'
}

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ 
  features, 
  title = "Todo lo que necesitas en un solo lugar",
  subtitle = "Reserva+ te ofrece todas las herramientas para gestionar tu negocio de forma eficiente y profesional.",
  variant = 'modern'
}) => {
  
  // Color schemes for different features when not provided
  const defaultColorSchemes = [
    {
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600'
    },
    {
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      color: 'from-orange-500 to-red-500',
      bgColor: 'from-orange-50 to-red-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-50 to-purple-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600'
    },
    {
      color: 'from-pink-500 to-rose-500',
      bgColor: 'from-pink-50 to-rose-50',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    },
    {
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ]

  const getFeatureColors = (feature: Feature, index: number) => {
    const scheme = defaultColorSchemes[index % defaultColorSchemes.length]
    return {
      color: feature.color || scheme.color,
      bgColor: feature.bgColor || scheme.bgColor,
      iconBg: feature.iconBg || scheme.iconBg,
      iconColor: feature.iconColor || scheme.iconColor
    }
  }

  if (variant === 'minimal') {
    return (
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colors = getFeatureColors(feature, index)
              return (
                <div
                  key={index}
                  className="text-center p-6 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
                >
                  <div className={`w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 hover:scale-110`}>
                    <Icon className={`w-8 h-8 ${colors.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  if (variant === 'default') {
    return (
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {subtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colors = getFeatureColors(feature, index)
              return (
                <div
                  key={index}
                  className={`text-center p-6 rounded-xl border border-gray-200 bg-gradient-to-br ${colors.bgColor} hover:shadow-2xl transition-all duration-300 hover:-translate-y-1`}
                >
                  <div className={`w-16 h-16 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4 shadow-md`}>
                    <Icon className={`w-8 h-8 ${colors.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    )
  }

  // Modern variant (default)
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-emerald-200/30 to-cyan-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-pink-200/20 to-orange-200/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
            Funcionalidades Poderosas
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            {title.split(' ').map((word, index) => {
              if (word === 'necesitas' || word === 'lugar') {
                return (
                  <span key={index} className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                    {word}{' '}
                  </span>
                )
              }
              return word + ' '
            })}
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            const colors = getFeatureColors(feature, index)
            
            return (
              <div 
                key={index} 
                className={`group relative p-8 rounded-3xl border border-gray-200/50 hover:border-transparent bg-gradient-to-br ${colors.bgColor} hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.color} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
                
                {/* Icon */}
                <div className={`relative w-16 h-16 ${colors.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon className={`w-8 h-8 ${colors.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                </div>
                
                {/* Content */}
                <div className="relative">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                </div>

                {/* Hover effect indicator */}
                <div className={`absolute bottom-4 right-4 w-8 h-8 bg-gradient-to-r ${colors.color} rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-300 flex items-center justify-center`}>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>

                {/* Floating particles */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-500"></div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection