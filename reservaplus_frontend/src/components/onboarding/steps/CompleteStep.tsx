// src/components/onboarding/steps/CompleteStep.tsx
import React from 'react'
import { Check, ArrowRight, Building2, Users, Settings } from 'lucide-react'

interface CompleteStepProps {
  isCompleting: boolean
  onComplete: () => void
}

const CompleteStep: React.FC<CompleteStepProps> = ({ isCompleting, onComplete }) => {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Todo está listo!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tu sistema ReservaPlus ha sido configurado exitosamente. 
          Ya puedes empezar a recibir y gestionar reservas.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="p-4 bg-blue-50 rounded-lg">
          <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-medium text-blue-900">Gestiona Reservas</h3>
          <p className="text-sm text-blue-700">Calendario inteligente y fácil de usar</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-medium text-purple-900">Base de Clientes</h3>
          <p className="text-sm text-purple-700">Historial completo de cada cliente</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <Settings className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-medium text-green-900">Automatización</h3>
          <p className="text-sm text-green-700">Recordatorios y notificaciones</p>
        </div>
      </div>

      {isCompleting ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Finalizando configuración...</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={onComplete}
          className="btn-primary text-lg px-8 py-3"
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          Ir a mi Dashboard
        </button>
      )}
    </div>
  )
}

export default CompleteStep