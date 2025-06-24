// src/components/features/FeatureShowcase.tsx
import React from 'react'
import { CheckCircle, ArrowRight } from 'lucide-react'

interface Benefit {
  text: string
  highlight?: boolean
}

interface FeatureShowcaseProps {
  icon: React.ElementType
  title: string
  description: string
  benefits: (string | Benefit)[]
  imageUrl?: string
  isReversed?: boolean
  colorScheme?: {
    primary: string
    secondary: string
    background: string
    accent: string
  }
}

const FeatureShowcase: React.FC<FeatureShowcaseProps> = ({
  icon: Icon,
  title,
  description,
  benefits,
  imageUrl,
  isReversed = false,
  colorScheme = {
    primary: 'from-emerald-500 to-cyan-500',
    secondary: 'from-emerald-50 to-cyan-50',
    background: 'bg-emerald-100',
    accent: 'text-emerald-600'
  }
}) => {
  const processedBenefits = benefits.map(benefit => 
    typeof benefit === 'string' ? { text: benefit, highlight: false } : benefit
  )

  return (
    <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 py-16`}>
      
      {/* Content Section */}
      <div className="flex-1 space-y-8">
        
        {/* Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 ${colorScheme.background} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`w-8 h-8 ${colorScheme.accent}`} />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                {title}
              </h2>
              <div className={`w-16 h-1 bg-gradient-to-r ${colorScheme.primary} rounded-full`}></div>
            </div>
          </div>
          
          <p className="text-xl text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Lo que incluye:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {processedBenefits.map((benefit, index) => (
              <div 
                key={index} 
                className={`flex items-center p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                  benefit.highlight 
                    ? `bg-gradient-to-r ${colorScheme.secondary} border border-emerald-200 shadow-md`
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <CheckCircle className={`w-5 h-5 mr-3 flex-shrink-0 ${
                  benefit.highlight ? colorScheme.accent : 'text-emerald-500'
                }`} />
                <span className={`${
                  benefit.highlight ? 'font-semibold text-gray-900' : 'text-gray-700'
                }`}>
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="pt-6">
          <button className={`group inline-flex items-center px-6 py-3 bg-gradient-to-r ${colorScheme.primary} text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
            <span>Ver en acción</span>
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Visual Section */}
      <div className="flex-1">
        <div className="relative group">
          
          {/* Background decoration */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.primary} rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`}></div>
          
          {/* Main container */}
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 bg-gradient-to-br ${colorScheme.primary} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500">Vista previa</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>

            {/* Content preview based on feature type */}
            {title.includes('Calendario') && (
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-2">
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                    <div key={day} className="py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 35 }, (_, i) => (
                    <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-sm ${
                      [5, 12, 18, 25].includes(i) 
                        ? `bg-gradient-to-br ${colorScheme.primary} text-white font-semibold`
                        : i < 31 
                        ? 'bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors'
                        : 'text-gray-300'
                    }`}>
                      {i < 31 ? i + 1 : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {title.includes('Clientes') && (
              <div className="space-y-3">
                {[
                  { name: 'María González', service: 'Corte + Color', status: 'Activa', avatar: 'from-pink-400 to-rose-400' },
                  { name: 'Carlos Silva', service: 'Consulta', status: 'Pendiente', avatar: 'from-blue-400 to-indigo-400' },
                  { name: 'Ana López', service: 'Masaje', status: 'Completado', avatar: 'from-green-400 to-emerald-400' }
                ].map((client, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className={`w-10 h-10 bg-gradient-to-r ${client.avatar} rounded-full flex items-center justify-center text-white font-semibold mr-3`}>
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.service}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === 'Activa' ? 'bg-emerald-100 text-emerald-700' :
                      client.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {client.status}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {title.includes('Automatización') && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">Recordatorio enviado</span>
                  </div>
                  <p className="text-sm text-blue-600">María, tu cita es mañana a las 14:30</p>
                </div>
                
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-emerald-700">Cita confirmada</span>
                  </div>
                  <p className="text-sm text-emerald-600">Carlos confirmó su cita automáticamente</p>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-purple-700">Seguimiento enviado</span>
                  </div>
                  <p className="text-sm text-purple-600">¿Cómo fue tu experiencia, Ana?</p>
                </div>
              </div>
            )}

            {/* Floating elements */}
            <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeatureShowcase