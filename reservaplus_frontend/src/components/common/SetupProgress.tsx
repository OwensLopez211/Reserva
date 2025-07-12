// src/components/common/SetupProgress.tsx
// Componente para mostrar progreso de configuración en el dashboard
import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Circle, ArrowRight, Settings } from 'lucide-react'
import { useOrganizationSetup } from '../../hooks/useOrganizationSetup'

export const SetupProgress: React.FC = () => {
  const { setupStatus, loading } = useOrganizationSetup()

  if (loading || !setupStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const { hasOrganization, hasProfessionals, hasServices, professionalsCount, servicesCount } = setupStatus
  const totalSteps = 3
  const completedSteps = [hasOrganization, hasProfessionals, hasServices].filter(Boolean).length
  const isComplete = completedSteps === totalSteps

  if (isComplete) {
    return null // No mostrar si está todo completo
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Completa la configuración de tu sistema
          </h3>
          <p className="text-blue-700 mb-4">
            {completedSteps}/{totalSteps} pasos completados
          </p>
          
          <div className="space-y-3 mb-4">
            <div className="flex items-center">
              {hasOrganization ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 mr-3" />
              )}
              <span className={hasOrganization ? 'text-gray-900' : 'text-gray-600'}>
                Información de organización
              </span>
            </div>
            
            <div className="flex items-center">
              {hasProfessionals ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 mr-3" />
              )}
              <span className={hasProfessionals ? 'text-gray-900' : 'text-gray-600'}>
                Profesionales ({professionalsCount})
              </span>
            </div>
            
            <div className="flex items-center">
              {hasServices ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 mr-3" />
              )}
              <span className={hasServices ? 'text-gray-900' : 'text-gray-600'}>
                Servicios ({servicesCount})
              </span>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
        
        <Link
          to="/onboarding"
          className="ml-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings className="w-4 h-4 mr-2" />
          Completar
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  )
}
