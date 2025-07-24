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
      console.log('🧭 Auto-navegando al paso:', currentStep, '→', targetUrl)
      navigate(targetUrl, { replace: true })
      return
    }

    console.log('🔍 OnboardingNavigator - Estado actual:', {
      currentPath: location.pathname,
      currentStep,
      registrationToken: !!registrationToken
    })

    // Mapeo de URLs a números de paso para validación
    const urlToStepMap: { [key: string]: number } = {
      '/onboarding/plan': 0,
      '/onboarding/services': 1,
      '/onboarding/team': 2,
      '/onboarding/register': 3, 
      '/onboarding/organization': 4,
      '/onboarding/welcome': 5
    }

    const currentStepFromUrl = urlToStepMap[location.pathname]
    
    // Si la URL no es una ruta de onboarding válida, no hacer nada
    if (currentStepFromUrl === undefined) return

    // Permitir navegación hacia adelante si es solo un paso más que el actual
    // (esto permite avanzar naturalmente cuando se completa un paso)
    const isNextStep = currentStepFromUrl === currentStep + 1
    
    // Permitir navegación si es un paso consecutivo válido o si estamos en el paso actual
    if (currentStepFromUrl === currentStep || isNextStep || currentStepFromUrl < currentStep) {
      console.log('✅ Navegación permitida:', { currentStepFromUrl, currentStep, isNextStep })
      return
    }

    // Solo bloquear si realmente es un salto muy grande (más de 1 paso adelante)
    if (currentStepFromUrl > currentStep + 1) {
      console.log('⚠️ Intento de acceso muy futuro, redirigiendo al paso actual:', currentStep)
      console.log('🔍 Debug: currentStepFromUrl:', currentStepFromUrl, 'currentStep:', currentStep, 'location:', location.pathname)
      const expectedUrl = navigateToCurrentStep()
      navigate(expectedUrl, { replace: true })
      return
    }

    // Si el usuario está intentando acceder a un paso sin registro y es paso protegido
    if (!registrationToken && currentStepFromUrl > 2) {
      console.log('🔒 Sin token de registro, redirigiendo al plan')
      navigate('/onboarding/plan', { replace: true })
      return
    }

    // Si llegamos aquí, permitir la navegación
    console.log('✅ Navegación final permitida:', { currentStepFromUrl, currentStep, isNextStep })

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
        1: { title: 'Servicios', url: '/onboarding/services' },
        2: { title: 'Equipo', url: '/onboarding/team' },
        3: { title: 'Registro', url: '/onboarding/register' },
        4: { title: 'Organización', url: '/onboarding/organization' },
        5: { title: 'Bienvenida', url: '/onboarding/welcome' }
      }
      return stepInfo[step as keyof typeof stepInfo] || { title: 'Desconocido', url: '/onboarding' }
    }
  }
} 