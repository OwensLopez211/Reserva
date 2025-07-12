import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useOnboarding } from '../contexts/OnboardingContext'

interface ProtectedRouteProps {
  children: React.ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const { registrationToken } = useOnboarding()
  const location = useLocation()

  const isOnboardingRoute = location.pathname.startsWith('/onboarding')

  // Mientras carga, muestra loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Permitir si está autenticado
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Permitir si está en onboarding y tiene token de registro
  if (isOnboardingRoute && registrationToken) {
    return <>{children}</>
  }

  // Si no, redirigir a login
  return <Navigate to="/login" state={{ from: location }} replace />
}

export default ProtectedRoute