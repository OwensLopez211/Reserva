// src/pages/auth/LoginPage.tsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginForm from '../../components/auth/LoginForm'
import LoginSection from '../../components/auth/LoginSection'

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/app/dashboard'
    return <Navigate to={from} replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    )
  }

  const handleLogin = async (username: string, password: string) => {
    await login(username, password)
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Formulario de login */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          
          {/* Header */}
          <div className="mb-10">
            {/* Logo */}
            <div className="flex items-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-white font-light text-xl">+</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Reserva<span className="text-emerald-600">+</span>
                </h1>
                <p className="text-sm text-emerald-600 font-medium">Gestión Inteligente</p>
              </div>
            </div>
            
            {/* Title */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bienvenido de vuelta
              </h2>
              <p className="text-lg text-gray-600">
                Accede a tu sistema de reservas
              </p>
            </div>
          </div>

          {/* Login Form */}
          <LoginForm 
            onSubmit={handleLogin}
            variant="modern"
          />

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Al iniciar sesión, aceptas nuestros{' '}
              <button className="text-emerald-600 hover:text-emerald-500 font-medium">
                Términos de Servicio
              </button>{' '}
              y{' '}
              <button className="text-emerald-600 hover:text-emerald-500 font-medium">
                Política de Privacidad
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Panel derecho - Hero Section */}
      <LoginSection variant="modern" />
    </div>
  )
}

export default LoginPage