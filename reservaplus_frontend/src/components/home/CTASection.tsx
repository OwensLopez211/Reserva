// src/components/home/CTASection.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Shield, Clock, Users, CheckCircle2, Sparkles, Zap } from 'lucide-react'

interface CTASectionProps {
  title?: string
  subtitle?: string
  buttonText?: string
  variant?: 'default' | 'modern' | 'premium'
}

const CTASection: React.FC<CTASectionProps> = ({
  title = "¿Listo para transformar tu negocio?",
  subtitle = "Únete a miles de negocios que ya están usando Reserva+ para crecer",
  buttonText = "Empezar Gratis Ahora",
  variant = 'modern'
}) => {
  const benefits = [
    { icon: Clock, text: 'Configuración en 5 minutos' },
    { icon: Users, text: 'Apoyo de uso para nuevos clientes' },
    { icon: Zap, text: 'Acceso Early Adopter' },
    { icon: CheckCircle2, text: 'Sin compromisos a largo plazo' }
  ]

  const values = [
    { icon: Zap, title: 'Rápido', description: 'Lista en 5 minutos' },
    { icon: Shield, title: 'Seguro', description: 'Datos protegidos' },
    { icon: Users, title: 'Apoyo Personal', description: 'Te ayudamos a empezar' }
  ]

  if (variant === 'default') {
    return (
      <section className="py-16 md:py-24 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {title}
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            {subtitle}
          </p>
          <Link
            to="/login"
            className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold hover:bg-indigo-50 transition-all duration-300 inline-flex items-center justify-center shadow-lg hover:scale-105"
          >
            {buttonText}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <p className="text-sm text-indigo-200 mt-4">
            Configúralo en 5 minutos • Apoyo personalizado incluido
          </p>
        </div>
      </section>
    )
  }

  if (variant === 'premium') {
    return (
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white overflow-hidden">
        {/* Premium background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/10 via-cyan-600/10 to-blue-600/10"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 backdrop-blur-sm rounded-full border border-emerald-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-emerald-300 text-sm font-medium">Lanzamiento Especial - Precio Introductorio</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {title.split(' ').slice(0, -2).join(' ')}{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {title.split(' ').slice(-2).join(' ')}
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              {subtitle}
            </p>

            {/* Value proposition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="text-xl font-bold text-white mb-2">{value.title}</div>
                    <div className="text-gray-400">{value.description}</div>
                  </div>
                )
              })}
            </div>

            {/* CTA Button */}
            <div className="mb-8">
              <Link
                to="/login"
                className="group relative bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-10 py-4 rounded-2xl text-lg font-bold hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105 overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative">{buttonText}</span>
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform relative" />
              </Link>
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <div key={index} className="flex items-center justify-center gap-2 text-sm text-gray-300">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span>{benefit.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Modern variant (default)
  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-emerald-600 via-cyan-600 to-blue-600 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-500/20"></div>
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-500 transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
        <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-pink-300 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-300 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-emerald-300 rounded-full animate-ping delay-700"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Zap className="w-4 h-4 text-yellow-300 mr-2" />
              <span className="text-sm font-medium">Nueva plataforma, grandes posibilidades</span>
            </div>

            {/* Headline */}
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold leading-tight">
                {title.split(' ').slice(0, -2).join(' ')}{' '}
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                  {title.split(' ').slice(-2).join(' ')}
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl text-cyan-100 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon
                return (
                  <div key={index} className="flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-300" />
                    </div>
                    <span className="text-cyan-100 text-sm font-medium">{benefit.text}</span>
                  </div>
                )
              })}
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link
                to="/login"
                className="group bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-8 py-4 rounded-2xl font-bold hover:from-yellow-300 hover:to-orange-300 transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-yellow-400/25 transform hover:scale-105 mr-4"
              >
                <Sparkles className="mr-3 w-5 h-5" />
                {buttonText}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-6 border-t border-white/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-white font-semibold">Plataforma Segura</span>
                </div>
                <span className="text-cyan-200">• Desarrollada con las mejores prácticas</span>
              </div>
              <p className="text-cyan-200 text-sm">
                "Creada por emprendedores, para emprendedores que buscan crecer"
              </p>
            </div>
          </div>

          {/* Right Content - Stats & Social Proof */}
          <div className="space-y-8">
            {/* Value Cards */}
            <div className="grid grid-cols-1 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon
                return (
                  <div key={index} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white mb-1">{value.title}</div>
                        <div className="text-cyan-200 text-sm">{value.description}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Early adopter element */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-6 border border-emerald-300/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-emerald-200 font-semibold text-sm">EARLY ADOPTER</span>
              </div>
              <p className="text-white font-semibold mb-2">Apoyo personalizado de lanzamiento</p>
              <p className="text-emerald-200 text-sm">Como early adopter, recibes ayuda directa para configurar y usar la plataforma</p>
            </div>

            {/* Guarantee */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                <Users className="w-6 h-6 text-emerald-400" />
                <div className="text-left">
                  <div className="text-white font-semibold">Apoyo personalizado incluido</div>
                  <div className="text-cyan-200 text-sm">Te ayudamos a configurar y sacar el máximo provecho</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTASection