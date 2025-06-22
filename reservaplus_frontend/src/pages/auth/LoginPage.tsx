// src/pages/auth/LoginPage.tsx
import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const location = useLocation()
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || '/dashboard'
    return <Navigate to={from} replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors) setErrors('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors('')

    try {
      await login(formData.username, formData.password)
      // La redirección se maneja automáticamente por el Navigate arriba
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrors(error.message)
      } else {
        setErrors('Error al iniciar sesión')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Información */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <h1 className="text-3xl font-bold text-primary-600 mb-2">
              ReservaPlus
            </h1>
            <h2 className="text-2xl font-bold text-gray-900">
              Inicia sesión en tu cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Accede a tu sistema de reservas
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Campo Usuario */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Usuario
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Ingresa tu usuario"
                  />
                </div>
              </div>

              {/* Campo Contraseña */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="input-field pr-10"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje de error */}
              {errors && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{errors}</div>
                </div>
              )}

              {/* Botón de envío */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogIn className="h-5 w-5 mr-2" />
                      Iniciar Sesión
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Enlaces adicionales */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    ¿Necesitas ayuda?
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Contacta a tu administrador para obtener acceso
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho - Imagen/Diseño */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white p-8">
              <h3 className="text-3xl font-bold mb-4">
                Gestiona tus reservas de forma inteligente
              </h3>
              <p className="text-xl opacity-90">
                Simplifica la administración de tu negocio con ReservaPlus
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center text-lg">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  Calendario inteligente
                </div>
                <div className="flex items-center text-lg">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  Gestión de clientes
                </div>
                <div className="flex items-center text-lg">
                  <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                  Notificaciones automáticas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage