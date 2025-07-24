// src/components/auth/CallbackPage.tsx
import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

export const CallbackPage = () => {
  const auth = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (auth.isAuthenticated) {
      // Redirect to dashboard or intended page after successful login
      navigate('/dashboard')
    } else if (auth.error) {
      console.error('Authentication error:', auth.error)
      navigate('/login')
    }
  }, [auth.isAuthenticated, auth.error, navigate])

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Procesando autenticación...</p>
        </div>
      </div>
    )
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error en la autenticación</p>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Volver al login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirigiendo...</p>
      </div>
    </div>
  )
}