// src/components/onboarding/steps/WelcomeStep.tsx
import React from 'react'
import { Star, Building2, Users, Briefcase, Settings } from 'lucide-react'

const WelcomeStep: React.FC = () => {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
        <Star className="w-10 h-10 text-primary-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Bienvenido a ReservaPlus!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Te ayudaremos a configurar tu sistema de reservas en solo unos minutos. 
          Vamos a personalizar ReservaPlus según las necesidades de tu negocio.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Building2 className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Configura tu negocio</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Agrega tu equipo</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Define servicios</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Settings className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">¡Listo para usar!</p>
        </div>
      </div>
    </div>
  )
}

export default WelcomeStep
