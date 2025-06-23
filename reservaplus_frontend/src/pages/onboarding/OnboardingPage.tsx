// src/pages/onboarding/OnboardingPage.tsx
import React, { /* useEffect */ } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { OnboardingProvider, useOnboardingStatus } from '../../contexts/OnboardingContext'
import IntegratedOnboarding from '../../components/onboarding/IntegratedOnboarding'

const OnboardingPageContent: React.FC = () => {
  const { /* user, */ isAuthenticated } = useAuth()
  const { needsOnboarding, loading } = useOnboardingStatus()

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Mientras verifica si necesita onboarding
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando configuración...</p>
        </div>
      </div>
    )
  }

  // Si ya completó el onboarding, redirigir al dashboard
  if (needsOnboarding === false) {
    return <Navigate to="/dashboard" replace />
  }

  // Mostrar el onboarding
  return <IntegratedOnboarding />
}

const OnboardingPage: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingPageContent />
    </OnboardingProvider>
  )
}

export default OnboardingPage