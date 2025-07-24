// src/components/onboarding/OnboardingProgressIndicator.tsx
// Componente visual para mostrar el progreso del onboarding

import React from 'react'
import { useOnboarding } from '../../contexts/OnboardingContext'

export const OnboardingProgressIndicator: React.FC = () => {
  const { currentStep, completedSteps } = useOnboarding()

  const steps = [
    { id: 0, title: 'Plan', icon: '📋' },
    { id: 1, title: 'Servicios', icon: '🔧' },
    { id: 2, title: 'Equipo', icon: '👥' },
    { id: 3, title: 'Registro', icon: '👤' },
    { id: 4, title: 'Organización', icon: '🏢' },
    { id: 5, title: 'Finalizar', icon: '🎉' }
  ]

  const getStepStatus = (stepId: number) => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    if (stepId < currentStep) return 'completed'
    return 'pending'
  }

  const getStepClasses = (status: string) => {
    const baseClasses = 'flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-medium transition-all duration-300'
    
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-emerald-500 border-emerald-500 text-white`
      case 'current':
        return `${baseClasses} bg-emerald-100 border-emerald-500 text-emerald-700 ring-4 ring-emerald-200`
      default:
        return `${baseClasses} bg-gray-100 border-gray-300 text-gray-500`
    }
  }

  const getConnectorClasses = (stepId: number) => {
    const isCompleted = completedSteps.includes(stepId) || stepId < currentStep
    return `flex-1 h-0.5 mx-2 transition-colors duration-300 ${
      isCompleted ? 'bg-emerald-500' : 'bg-gray-300'
    }`
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id)
            const isLast = index === steps.length - 1

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Paso */}
                <div className="flex flex-col items-center">
                  <div className={getStepClasses(status)}>
                    {status === 'completed' ? (
                      <span className="text-lg">✓</span>
                    ) : (
                      <span className="text-lg">{step.icon}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${
                      status === 'current' ? 'text-emerald-700' : 
                      status === 'completed' ? 'text-emerald-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    {status === 'current' && (
                      <div className="text-xs text-emerald-600 mt-1">En progreso</div>
                    )}
                  </div>
                </div>

                {/* Conector */}
                {!isLast && (
                  <div className={getConnectorClasses(step.id)} />
                )}
              </div>
            )
          })}
        </div>

        {/* Información adicional */}
        <div className="mt-4 text-center">
          <div className="text-sm text-gray-600">
            Paso {currentStep + 1} de {steps.length}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente compacto para usar en páginas individuales
export const OnboardingProgressMini: React.FC = () => {
  const { currentStep } = useOnboarding()
  const totalSteps = 6

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <span>Paso {currentStep + 1} de {totalSteps}</span>
      <div className="w-24 bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
} 