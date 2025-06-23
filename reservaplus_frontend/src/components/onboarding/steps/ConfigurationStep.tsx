// src/components/onboarding/steps/ConfigurationStep.tsx
import React from 'react'
import { Settings } from 'lucide-react'

interface ConfigurationStepProps {
  organizationName: string
  professionalsCount: number
  servicesCount: number
  industryLabel: string
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  organizationName,
  professionalsCount,
  servicesCount,
  industryLabel
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Settings className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Configuración Final</h2>
        <p className="text-gray-600">Ajustes adicionales para tu sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Horarios de Atención</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lunes a Viernes:</span>
              <span className="text-sm font-medium">9:00 - 18:00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sábados:</span>
              <span className="text-sm font-medium">9:00 - 15:00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Domingos:</span>
              <span className="text-sm font-medium">Cerrado</span>
            </div>
          </div>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Reglas de Negocio</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span className="text-sm text-gray-700">Permitir cancelaciones hasta 2 horas antes</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span className="text-sm text-gray-700">Enviar recordatorios automáticos</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Requiere confirmación para todas las citas</span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">¡Casi listos!</h3>
          <p className="text-sm text-green-700 mb-3">
            Tu sistema estará configurado con:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• {organizationName} ({industryLabel})</li>
            <li>• {professionalsCount} profesional(es)</li>
            <li>• {servicesCount} servicio(s)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationStep
