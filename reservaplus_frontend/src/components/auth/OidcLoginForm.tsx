// src/components/auth/OidcLoginForm.tsx
import React from 'react'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import { LogIn, AlertCircle } from 'lucide-react'

interface OidcLoginFormProps {
  variant?: 'default' | 'modern' | 'minimal'
}

const OidcLoginForm: React.FC<OidcLoginFormProps> = ({ variant = 'modern' }) => {
  const auth = useOidcAuth()

  const handleLogin = () => {
    auth.signinRedirect()
  }

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (auth.error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">
              Error de autenticación: {auth.error.message}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogin}
          className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
        >
          <LogIn className="w-5 h-5" />
          <span>Intentar nuevamente</span>
        </button>
      </div>
    )
  }

  if (auth.isAuthenticated) {
    return (
      <div className="text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-green-700">¡Autenticación exitosa! Redirigiendo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Iniciar Sesión
        </h2>
        <p className="text-gray-600">
          Accede a tu cuenta de Reserva+
        </p>
      </div>

      <button
        onClick={handleLogin}
        disabled={auth.isLoading}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <LogIn className="w-5 h-5" />
        <span>Iniciar Sesión con AWS Cognito</span>
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          ¿No tienes cuenta?{' '}
          <a href="/onboarding/plan" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Regístrate aquí
          </a>
        </p>
      </div>
    </div>
  )
}

export default OidcLoginForm