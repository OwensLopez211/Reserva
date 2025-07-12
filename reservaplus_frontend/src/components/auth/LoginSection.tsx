// src/components/auth/LoginSection.tsx
import React from 'react'
import { Calendar, Users, Bell, BarChart3, CheckCircle } from 'lucide-react'

interface LoginHeroSectionProps {
  variant?: 'default' | 'modern' | 'minimal'
}

const LoginSection: React.FC<LoginHeroSectionProps> = ({ variant = 'modern' }) => {
  const features = [
    {
      icon: Calendar,
      title: 'Calendario Inteligente',
      description: 'Gestiona todas tus citas desde una vista unificada'
    },
    {
      icon: Users,
      title: 'Gestión de Clientes',
      description: 'Base de datos completa con historial detallado'
    },
    {
      icon: Bell,
      title: 'Notificaciones Automáticas',
      description: 'Recordatorios por SMS y email sin intervención'
    },
    {
      icon: BarChart3,
      title: 'Reportes Avanzados',
      description: 'Analytics en tiempo real para tu negocio'
    }
  ]

  if (variant === 'minimal') {
    return (
      <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-br from-emerald-600 to-cyan-700">
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="text-center text-white max-w-md">
            <h3 className="text-3xl font-bold mb-4">
              Gestiona tu negocio con inteligencia
            </h3>
            <p className="text-xl opacity-90">
              Simplifica la administración con Reserva+
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'default') {
    return (
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-cyan-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8 max-w-lg">
              <h3 className="text-3xl font-bold mb-4">
                Gestiona tus reservas de forma inteligente
              </h3>
              <p className="text-xl opacity-90 mb-8">
                Simplifica la administración de tu negocio con Reserva+
              </p>
              <div className="space-y-4">
                {features.slice(0, 3).map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <div key={index} className="flex items-center text-lg">
                      <Icon className="w-6 h-6 mr-3" />
                      <span>{feature.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Modern variant (default)
  return (
    <div className="hidden lg:block relative w-0 flex-1 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
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
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-center p-8 xl:p-12">
        <div className="max-w-lg mx-auto w-full">
          
          {/* Header */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-light text-xl">+</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Reserva+</h1>
                <p className="text-emerald-400 text-sm">Gestión Inteligente</p>
              </div>
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4 leading-tight">
              Gestiona tu negocio con{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                inteligencia
              </span>
            </h2>
            
            <p className="text-lg text-gray-300 leading-relaxed">
              La plataforma completa para administrar reservas, clientes y servicios de forma profesional.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div 
                  key={index} 
                  className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 group hover:bg-white/10 transition-all duration-300"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500/30 transition-all duration-300">
                    <Icon className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-sm leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-xs leading-tight mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">5 min</div>
              <div className="text-gray-400 text-sm">Setup rápido</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-bold text-cyan-400 mb-1">98%</div>
              <div className="text-gray-400 text-sm">Disponibilidad</div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Datos seguros</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Apoyo incluido</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginSection