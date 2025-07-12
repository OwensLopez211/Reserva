import React, { useState } from 'react'
import { Crown, Users, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { PlanInfo } from '../../services/userService'

interface PlanInfoCardProps {
  planInfo: PlanInfo | null
  className?: string
}

const PlanInfoCard: React.FC<PlanInfoCardProps> = ({ planInfo, className = '' }) => {
  const [showRoleDistribution, setShowRoleDistribution] = useState(false)
  
  if (!planInfo) {
    return null
  }

  // Excluir al owner del conteo (restar 1 si hay usuarios)
  const adjustedCurrent = Math.max(0, planInfo.limits.total_users.current - 1)
  const adjustedMax = planInfo.limits.total_users.max - 1
  
  const usagePercentage = adjustedMax > 0 ? Math.round((adjustedCurrent / adjustedMax) * 100) : 0
  const isLimitReached = adjustedCurrent >= adjustedMax
  const isNearLimit = usagePercentage > 80

  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4 border-b border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-500 rounded-lg">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Plan {planInfo.plan_name}
              </h3>
              <p className="text-sm text-primary-600">
                Gestión de usuarios y permisos
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              isLimitReached ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-primary-600'
            }`}>
              {usagePercentage}%
            </div>
            <p className="text-xs text-gray-500">Utilizado</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Usage Summary */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Usuarios disponibles</span>
            </div>
            <div className="flex items-center space-x-2">
              {isLimitReached ? (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className={`text-sm font-medium ${
                isLimitReached ? 'text-red-600' : 'text-green-600'
              }`}>
                {adjustedCurrent} de {adjustedMax}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ease-out relative ${
                  isLimitReached 
                    ? 'bg-gradient-to-r from-red-500 to-red-600' 
                    : isNearLimit
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500'
                    : 'bg-gradient-to-r from-primary-500 to-primary-600'
                }`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              >
                {/* Progress shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12"></div>
              </div>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-3">
            {isLimitReached ? (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Has alcanzado el límite de usuarios</span>
              </div>
            ) : isNearLimit ? (
              <div className="flex items-center space-x-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Te estás acercando al límite</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Puedes agregar {adjustedMax - adjustedCurrent} usuarios más
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Role Distribution */}
        <div>
          <button
            onClick={() => setShowRoleDistribution(!showRoleDistribution)}
            className="flex items-center justify-between w-full text-left mb-4 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <h4 className="text-sm font-semibold text-gray-900">Distribución por roles</h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {showRoleDistribution ? 'Ocultar' : 'Ver detalles'}
              </span>
              {showRoleDistribution ? (
                <ChevronUp className="h-4 w-4 text-gray-500 transition-transform duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500 transition-transform duration-200" />
              )}
            </div>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showRoleDistribution ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
              <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-all duration-200 hover:scale-105">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-500 mb-1">Profesionales</p>
                <p className="text-xl font-bold text-gray-900">
                  {planInfo.limits.professionals.current}
                </p>
                <p className="text-xs text-gray-400">
                  de {planInfo.limits.professionals.max}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-all duration-200 hover:scale-105">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-500 mb-1">Recepcionistas</p>
                <p className="text-xl font-bold text-gray-900">
                  {planInfo.limits.receptionists.current}
                </p>
                <p className="text-xs text-gray-400">
                  de {planInfo.limits.receptionists.max}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center transform transition-all duration-200 hover:scale-105">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-500 mb-1">Staff</p>
                <p className="text-xl font-bold text-gray-900">
                  {planInfo.limits.staff.current}
                </p>
                <p className="text-xs text-gray-400">
                  de {planInfo.limits.staff.max}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Owner Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-700">
              <span className="font-medium">Nota:</span> El propietario no cuenta hacia el límite de usuarios.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlanInfoCard