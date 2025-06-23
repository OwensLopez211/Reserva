// src/components/onboarding/OnboardingWelcome.tsx
// Componente de bienvenida específico para nuevos usuarios
import React from 'react'
import { Link } from 'react-router-dom'
import { Star, ArrowRight, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export const OnboardingWelcome: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="mx-auto w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mb-6">
          <Star className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          ¡Bienvenido a ReservaPlus, {user?.first_name || user?.username}!
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Tu cuenta ha sido creada exitosamente. Ahora configuremos tu sistema de reservas 
          para que puedas empezar a gestionar tu negocio de inmediato.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ¿Qué configuraremos juntos?
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center text-left">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Información básica de tu negocio</span>
            </div>
            <div className="flex items-center text-left">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Tu equipo de profesionales</span>
            </div>
            <div className="flex items-center text-left">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Los servicios que ofreces</span>
            </div>
            <div className="flex items-center text-left">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
              <span className="text-gray-700">Configuraciones específicas de tu industria</span>
            </div>
          </div>
        </div>

        <Link
          to="/onboarding"
          className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-lg"
        >
          Comenzar configuración
          <ArrowRight className="w-5 h-5 ml-2" />
        </Link>

        <p className="text-sm text-gray-500 mt-4">
          Este proceso toma solo unos minutos y podrás modificar cualquier configuración más tarde.
        </p>
      </div>
    </div>
  )
}
