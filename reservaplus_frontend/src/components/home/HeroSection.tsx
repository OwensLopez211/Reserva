// src/components/home/HeroSection.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Clock, Users } from 'lucide-react'

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white overflow-hidden min-h-screen flex items-center">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent"></div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
        <div className="absolute top-2/3 left-1/4 w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-emerald-300 rounded-full animate-ping delay-700"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Content */}
          <div className="space-y-8">


            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Gestiona tu{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                  negocio
                </span>{' '}
                con inteligencia
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl">
                La plataforma completa para administrar reservas, clientes y servicios. 
                Aumenta tu productividad y mejora la experiencia de tus clientes.
              </p>
            </div>



            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                to="/login"
                className="group bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-2xl font-semibold hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 inline-flex items-center justify-center shadow-2xl hover:shadow-emerald-500/25 transform hover:scale-105"
              >
                <Calendar className="mr-3 w-5 h-5" />
                Empezar Gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                to="/features"
                className="group border-2 border-emerald-500/30 backdrop-blur-sm text-emerald-300 px-8 py-4 rounded-2xl font-semibold hover:bg-emerald-500/10 hover:border-emerald-400/50 transition-all duration-300 inline-flex items-center justify-center"
              >
                Ver Características
                <Users className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
              </Link>
            </div>


          </div>

          {/* Dashboard Preview - Mejorado */}
          <div className="relative">
            {/* Floating background elements */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-r from-cyan-400/20 to-emerald-400/20 rounded-full blur-xl"></div>

            <div className="relative z-10 bg-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="bg-white rounded-2xl p-6 shadow-xl">
                
                {/* Header with better styling */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Panel de Control</h3>
                      <p className="text-sm text-gray-500">Viernes, 23 Junio 2025</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    12 citas
                  </div>
                </div>

                {/* Stats mini cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Siguiente</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-900">14:30</div>
                    <div className="text-xs text-emerald-600">en 30 min</div>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-cyan-600" />
                      <span className="text-xs font-medium text-cyan-700">Hoy</span>
                    </div>
                    <div className="text-xl font-bold text-cyan-900">12</div>
                    <div className="text-xs text-cyan-600">clientes</div>
                  </div>
                </div>

                {/* Appointments with enhanced design */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    Próximas Citas
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <div className="w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mr-4 animate-pulse"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-emerald-800 transition-colors">María López</p>
                        <p className="text-xs text-gray-600">Corte y Peinado • 14:30</p>
                      </div>
                      <div className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                        Próxima
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mr-4"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-800 transition-colors">Carlos Silva</p>
                        <p className="text-xs text-gray-600">Consulta • 15:00</p>
                      </div>
                      <div className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                        Confirmada
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                      <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-4"></div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-800 transition-colors">Ana García</p>
                        <p className="text-xs text-gray-600">Masaje • 16:30</p>
                      </div>
                      <div className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                        Pendiente
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection