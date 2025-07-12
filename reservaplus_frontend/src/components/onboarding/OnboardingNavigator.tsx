// src/components/onboarding/OnboardingNavigator.tsx
// Componente para manejar la navegación automática al paso correcto del onboarding

import React, { useEffect } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { useOnboarding } from '../../contexts/OnboardingContext'

export const OnboardingNavigator: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentStep, navigateToCurrentStep, registrationToken } = useOnboarding()

  useEffect(() => {
    // Solo redirigir si estamos en la ruta base del onboarding
    if (location.pathname === '/onboarding' || location.pathname === '/onboarding/') {
      const targetUrl = navigateToCurrentStep()
      console.log('🧭 Navegando automáticamente al paso:', currentStep, '→', targetUrl)
      navigate(targetUrl, { replace: true })
      return
    }

    // Mapeo de URLs a números de paso para validación
    const urlToStepMap: { [key: string]: number } = {
      '/onboarding/plan': 0,
      '/onboarding/register': 1,
      '/onboarding/team': 2,
      '/onboarding/services': 3, 
      '/onboarding/organization': 4,
      '/onboarding/welcome': 5
    }

    const currentStepFromUrl = urlToStepMap[location.pathname]
    
    // Si la URL no es una ruta de onboarding válida, no hacer nada
    if (currentStepFromUrl === undefined) return

    // Permitir navegación hacia adelante si es solo un paso más que el actual
    // (esto permite avanzar naturalmente cuando se completa un paso)
    const isNextStep = currentStepFromUrl === currentStep + 1
    
    // Si el usuario está intentando acceder a un paso muy futuro (más de 1 paso adelante)
    if (currentStepFromUrl > currentStep + 1) {
      console.log('⚠️ Intento de acceso muy futuro, redirigiendo al paso actual:', currentStep)
      const expectedUrl = navigateToCurrentStep()
      navigate(expectedUrl, { replace: true })
      return
    }

    // Si el usuario está intentando acceder a un paso sin registro y es paso protegido
    if (!registrationToken && currentStepFromUrl > 1) {
      console.log('🔒 Sin token de registro, redirigiendo al plan')
      navigate('/onboarding/plan', { replace: true })
      return
    }

    // Si está en el paso correcto o uno anterior/siguiente, permitir navegación
    console.log('✅ Navegación permitida:', { currentStepFromUrl, currentStep, isNextStep })

  }, [currentStep, navigateToCurrentStep, navigate, location.pathname, registrationToken])

  return <Outlet />
}

// Hook para obtener información del paso actual
export const useOnboardingNavigation = () => {
  const { currentStep, navigateToCurrentStep, canProceedFromStep, completedSteps } = useOnboarding()
  
  return {
    currentStep,
    navigateToCurrentStep,
    canProceedFromStep,
    completedSteps,
    isStepCompleted: (step: number) => completedSteps.includes(step),
    getStepInfo: (step: number) => {
      const stepInfo = {
        0: { title: 'Selección de Plan', url: '/onboarding/plan' },
        1: { title: 'Registro', url: '/onboarding/register' },
        2: { title: 'Equipo', url: '/onboarding/team' },
        3: { title: 'Servicios', url: '/onboarding/services' },
        4: { title: 'Organización', url: '/onboarding/organization' },
        5: { title: 'Bienvenida', url: '/onboarding/welcome' }
      }
      return stepInfo[step as keyof typeof stepInfo] || { title: 'Desconocido', url: '/onboarding' }
    }
  }
} 