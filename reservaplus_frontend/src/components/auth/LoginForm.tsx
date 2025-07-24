// src/components/auth/LoginForm.tsx
import React, { useState } from 'react'
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'

interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>
  isSubmitting?: boolean
  errors?: string
  variant?: 'default' | 'modern' | 'minimal'
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  isSubmitting = false,
  errors,
  variant = 'modern'
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await onSubmit(formData.username, formData.password)
    } catch (error) {
      // Error handling is done in the parent component (LoginLayout/LoginPage)
      console.error('Login form error:', error)
    }
  }

  if (variant === 'minimal') {
    return (
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Ingresa tu usuario"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

        {errors && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{errors}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
      </form>
    )
  }

  // Modern variant (default)
  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      {/* Username Field */}
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-semibold text-gray-800">
          Usuario o Email
        </label>
        <div className="relative group">
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
            focusedField === 'username' ? 'text-emerald-500' : 'text-gray-400'
          }`}>
            <Mail className="h-5 w-5" />
          </div>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleInputChange}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-12 pr-4 py-4 bg-gray-50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:bg-white ${
              focusedField === 'username' 
                ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder="usuario@ejemplo.com"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
          Contraseña
        </label>
        <div className="relative group">
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 ${
            focusedField === 'password' ? 'text-emerald-500' : 'text-gray-400'
          }`}>
            <Lock className="h-5 w-5" />
          </div>
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleInputChange}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            className={`w-full pl-12 pr-12 py-4 bg-gray-50 border-2 rounded-2xl text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none focus:bg-white ${
              focusedField === 'password' 
                ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            placeholder="••••••••••"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errors && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div className="text-sm text-red-700 font-medium">{errors}</div>
          </div>
        </div>
      )}

      {/* Success indicators */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
            formData.username.length > 0 ? 'bg-emerald-500' : 'bg-gray-300'
          }`}></div>
          <span className={`text-sm transition-colors duration-200 ${
            formData.username.length > 0 ? 'text-emerald-600 font-medium' : 'text-gray-500'
          }`}>
            Usuario ingresado
          </span>
          {formData.username.length > 0 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-colors duration-200 ${
            formData.password.length >= 6 ? 'bg-emerald-500' : 'bg-gray-300'
          }`}></div>
          <span className={`text-sm transition-colors duration-200 ${
            formData.password.length >= 6 ? 'text-emerald-600 font-medium' : 'text-gray-500'
          }`}>
            Contraseña válida
          </span>
          {formData.password.length >= 6 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !formData.username || formData.password.length < 6}
        className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 overflow-hidden"
      >
        {/* Button shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        {isSubmitting ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            <span>Iniciando sesión...</span>
          </div>
        ) : (
          <div className="relative flex items-center">
            <LogIn className="h-6 w-6 mr-3 group-hover:translate-x-1 transition-transform duration-200" />
            <span>Iniciar Sesión</span>
          </div>
        )}
      </button>

      {/* Additional Options */}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500 font-medium">
              ¿Necesitas ayuda?
            </span>
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            Contacta a tu administrador para obtener acceso
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <button type="button" className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors">
              Soporte técnico
            </button>
            <button type="button" className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}

export default LoginForm