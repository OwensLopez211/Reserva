// src/pages/onboarding/RegistrationPage.tsx - VERSIÓN ACTUALIZADA Y ALINEADA

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Check, AlertCircle, User, Building, Mail, Phone, MapPin, Globe } from 'lucide-react'
import { OnboardingService } from '../../services/onboardingService'
import { useOnboarding } from '../../contexts/OnboardingContext'

interface RegistrationData {
  // Datos del usuario admin
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  
  // Datos de la organización
  organizationName: string
  industryTemplate: string
  businessEmail: string
  businessPhone: string
  address: string
  city: string
  country: string
  
  // Términos y condiciones
  acceptedTerms: boolean
  acceptedPrivacy: boolean
}

interface ValidationErrors {
  [key: string]: string[]
}

interface IndustryOption {
  value: string
  label: string
  icon: string
  description: string
  disabled?: boolean
}

// Definición local mínima del tipo Plan para evitar errores de tipo
type Plan = {
  id: string
  name: string
  price_monthly: number
  price_yearly?: number
}

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate()
  const { initializeFromToken } = useOnboarding()
  
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    industryTemplate: 'salon',
    businessEmail: '',
    businessPhone: '',
    address: '',
    city: '',
    country: 'Chile',
    acceptedTerms: false,
    acceptedPrivacy: false
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

  // Cargar plan seleccionado del paso anterior
  useEffect(() => {
    const planId = localStorage.getItem('selected_plan_id')
    const planData = localStorage.getItem('selected_plan_data')
    
    if (!planId || !planData) {
      // Si no hay plan seleccionado, volver al paso anterior
      navigate('/onboarding/plan')
      return
    }

    try {
      setSelectedPlan(JSON.parse(planData))
    } catch (error) {
      console.error('Error parsing plan data:', error)
      navigate('/onboarding/plan')
    }
  }, [navigate])

  const industryOptions: IndustryOption[] = [
    {
      value: 'salon',
      label: 'Peluquería/Salón de Belleza',
      icon: '💇‍♀️',
      description: 'Servicios de cabello, uñas y estética'
    },
    {
      value: 'clinic',
      label: 'Clínica/Consultorio Médico',
      icon: '🏥',
      description: 'Atención médica y consultas'
    },
    {
      value: 'dental',
      label: 'Clínica Dental',
      icon: '🦷',
      description: 'Servicios odontológicos',
      disabled: true
    },
    {
      value: 'spa',
      label: 'Spa/Centro de Bienestar',
      icon: '🧘‍♀️',
      description: 'Masajes y tratamientos de relajación',
      disabled: true
    },
    {
      value: 'fitness',
      label: 'Entrenamiento Personal',
      icon: '💪',
      description: 'Fitness y entrenamiento personalizado',
      disabled: true
    },
    {
      value: 'veterinary',
      label: 'Veterinaria',
      icon: '🐕',
      description: 'Atención veterinaria',
      disabled: true
    },
    {
      value: 'beauty',
      label: 'Centro de Estética',
      icon: '✨',
      description: 'Tratamientos de belleza',
      disabled: true
    },
    {
      value: 'other',
      label: 'Otro',
      icon: '🏢',
      description: 'Otro tipo de negocio'
    }
  ]

  const handleInputChange = (field: keyof RegistrationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar errores del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Auto-completar email de negocio si no está definido
    if (field === 'email' && !formData.businessEmail) {
      setFormData(prev => ({ ...prev, businessEmail: value as string }))
    }

    // Auto-completar teléfono de negocio si no está definido
    if (field === 'phone' && !formData.businessPhone) {
      setFormData(prev => ({ ...prev, businessPhone: value as string }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validar datos del usuario
    if (!formData.firstName.trim()) {
      newErrors.firstName = ['El nombre es requerido']
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = ['El apellido es requerido']
    }
    if (!formData.email.trim()) {
      newErrors.email = ['El email es requerido']
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = ['El email no tiene un formato válido']
    }
    if (!formData.phone.trim()) {
      newErrors.phone = ['El teléfono es requerido']
    }
    if (!formData.password) {
      newErrors.password = ['La contraseña es requerida']
    } else if (formData.password.length < 6) {
      newErrors.password = ['La contraseña debe tener al menos 6 caracteres']
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = ['Las contraseñas no coinciden']
    }

    // Validar datos de la organización
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = ['El nombre de la organización es requerido']
    }
    if (!formData.businessEmail.trim()) {
      newErrors.businessEmail = ['El email del negocio es requerido']
    }
    if (!formData.businessPhone.trim()) {
      newErrors.businessPhone = ['El teléfono del negocio es requerido']
    }

    // Validar términos y condiciones
    if (!formData.acceptedTerms) {
      newErrors.acceptedTerms = ['Debes aceptar los términos y condiciones']
    }
    if (!formData.acceptedPrivacy) {
      newErrors.acceptedPrivacy = ['Debes aceptar la política de privacidad']
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    if (!selectedPlan) {
      setErrors({ submit: ['Error: Plan no seleccionado'] })
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🚀 Iniciando signup con datos:', formData)

      // Usar el servicio actualizado para hacer signup
      const signupResponse = await OnboardingService.startSignup(
        selectedPlan.id,
        {
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          organization_name: formData.organizationName
        }
      )

      console.log('✅ Signup exitoso:', signupResponse)

      // Inicializar el contexto de onboarding con el token
      const tokenValid = await initializeFromToken(signupResponse.registration_token)
      
      if (tokenValid) {
        // Guardar datos adicionales del formulario para usar en pasos posteriores
        const additionalData = {
          formData,
          industryTemplate: formData.industryTemplate,
          businessInfo: {
            email: formData.businessEmail,
            phone: formData.businessPhone,
            address: formData.address,
            city: formData.city,
            country: formData.country
          }
        }
        localStorage.setItem('registration_form_data', JSON.stringify(additionalData))

        // Navegar al siguiente paso
        navigate('/onboarding/team')
      } else {
        setErrors({ submit: ['Error al inicializar el proceso de registro'] })
      }
      
    } catch (error) {
      console.error('❌ Error en registro:', error)
      
      if (error && typeof error === 'object' && 'message' in error) {
        setErrors({ submit: [(error as { message: string }).message] })
      } else {
        setErrors({ submit: ['Hubo un error al procesar el registro. Por favor intenta de nuevo.'] })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/onboarding/plan')
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  const billingCycle = localStorage.getItem('selected_billing') || 'monthly'
  const price = billingCycle === 'monthly' ? selectedPlan.price_monthly : (selectedPlan.price_yearly || selectedPlan.price_monthly * 12)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3">
                <span className="text-white font-light text-lg">+</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reserva+</h1>
            </div>
            <div className="text-sm text-gray-500">
              Paso 2 de 6
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 h-2">
            <div className="w-2/6 bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Crea tu Cuenta de{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Administrador
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Configura tu cuenta y la información básica de tu negocio
          </p>
        </div>

        {/* Plan Summary */}
        <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                <Check className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedPlan.name} Seleccionado</h3>
                <p className="text-gray-600">
                  ${price?.toLocaleString()} {billingCycle === 'monthly' ? '/mes' : '/año'}
                  <span className="ml-2 text-emerald-600">• 14 días gratis</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Cambiar plan
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-3xl shadow-2xl border p-8">
          <form className="space-y-8">
            
            {/* Sección: Datos del Administrador */}
            <div>
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Datos del Administrador</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tu nombre"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.firstName[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tu apellido"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.lastName[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Personal *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono Personal *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.phone[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.password[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Repite tu contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sección: Datos del Negocio */}
            <div className="border-t pt-8">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                  <Building className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Datos de tu Negocio</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Negocio *
                  </label>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.organizationName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Salón María, Clínica Dental Sur, etc."
                  />
                  {errors.organizationName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.organizationName[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Negocio *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {industryOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => !option.disabled && handleInputChange('industryTemplate', option.value)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          formData.industryTemplate === option.value
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={option.disabled}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-medium text-gray-900 text-sm">{option.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                        {option.disabled && (
                          <div className="text-xs text-orange-600 mt-1 font-medium">Próximamente</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email del Negocio *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={formData.businessEmail}
                        onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.businessEmail ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="contacto@tunegocio.com"
                      />
                    </div>
                    {errors.businessEmail && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.businessEmail[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono del Negocio *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.businessPhone}
                        onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.businessPhone ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="+56 2 1234 5678"
                      />
                    </div>
                    {errors.businessPhone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.businessPhone[0]}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección (Opcional)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Av. Principal 123, Santiago"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad (Opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Santiago"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Chile">Chile</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Colombia">Colombia</option>
                        <option value="Perú">Perú</option>
                        <option value="México">México</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Términos y Condiciones */}
            <div className="border-t pt-8">
              <div className="space-y-4">
                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.acceptedTerms}
                      onChange={(e) => handleInputChange('acceptedTerms', e.target.checked)}
                      className="mt-1 mr-3 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">
                      Acepto los{' '}
                      <a href="/terms" target="_blank" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Términos y Condiciones
                      </a>{' '}
                      de uso de la plataforma *
                    </span>
                  </label>
                  {errors.acceptedTerms && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.acceptedTerms[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.acceptedPrivacy}
                      onChange={(e) => handleInputChange('acceptedPrivacy', e.target.checked)}
                      className="mt-1 mr-3 h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">
                      Acepto la{' '}
                      <a href="/privacy" target="_blank" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        Política de Privacidad
                      </a>{' '}
                      y el tratamiento de mis datos *
                    </span>
                  </label>
                  {errors.acceptedPrivacy && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.acceptedPrivacy[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Error general */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.submit[0]}
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al Plan
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Continuar al Equipo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-lg border">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">Datos Seguros</div>
              <div className="text-sm text-gray-600">Protegemos tu información con encriptación SSL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationPage