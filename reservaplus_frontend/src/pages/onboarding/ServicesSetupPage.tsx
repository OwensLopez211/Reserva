// src/pages/onboarding/ServicesSetupPage.tsx - NUEVA PÁGINA PARA CONFIGURAR SERVICIOS

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Trash2, Clock, DollarSign, Tag, AlertCircle, Lightbulb } from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'

const ServicesSetupPage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    services, 
    addService, 
    updateService, 
    removeService,
    loadSuggestedServices,
    organizationData,
    canProceedFromStep,
    nextStep,
    registrationToken
  } = useOnboarding()
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string[]}>({})
  const [showSuggested, setShowSuggested] = useState(true)

  // Cargar servicios sugeridos basados en la industria
  useEffect(() => {
    if (!registrationToken) {
      navigate('/onboarding/plan')
      return
    }

    if (services.length === 0 && organizationData.industry_template) {
      loadSuggestedServices(organizationData.industry_template)
    }
  }, [registrationToken, services.length, organizationData.industry_template, loadSuggestedServices, navigate])

  const getIndustryTerms = () => {
    const terms: {[key: string]: {service: string, services: string}} = {
      salon: { service: 'Servicio', services: 'Servicios' },
      clinic: { service: 'Consulta', services: 'Consultas' },
      dental: { service: 'Tratamiento', services: 'Tratamientos' },
      spa: { service: 'Tratamiento', services: 'Tratamientos' },
      fitness: { service: 'Sesión', services: 'Sesiones' },
      veterinary: { service: 'Consulta', services: 'Consultas' },
      beauty: { service: 'Tratamiento', services: 'Tratamientos' }
    }

    return terms[organizationData.industry_template] || { service: 'Servicio', services: 'Servicios' }
  }

  const suggestedServices = [
    // Servicios adicionales sugeridos que pueden agregar
    ...(organizationData.industry_template === 'salon' ? [
      {
        name: 'Manicure',
        description: 'Cuidado completo de uñas',
        category: 'Uñas',
        duration_minutes: 45,
        price: 12000,
        buffer_time_after: 10,
        is_active: true,
        requires_preparation: false
      },
      {
        name: 'Mechas',
        description: 'Mechas y reflejos',
        category: 'Color',
        duration_minutes: 120,
        price: 40000,
        buffer_time_before: 10,
        buffer_time_after: 15,
        is_active: true,
        requires_preparation: true
      }
    ] : []),
    ...(organizationData.industry_template === 'clinic' ? [
      {
        name: 'Examen Físico',
        description: 'Examen médico completo',
        category: 'Exámenes',
        duration_minutes: 45,
        price: 35000,
        buffer_time_after: 15,
        is_active: true,
        requires_preparation: false
      }
    ] : [])
  ]

  const handleUpdateService = (index: number, field: string, value: string | number | boolean) => {
    updateService(index, { [field]: value })

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[`${index}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${index}.${field}`]
        return newErrors
      })
    }
  }

  const handleAddService = (suggested?: any) => {
    if (services.length >= 20) {
      alert('El Plan Básico permite máximo 20 servicios')
      return
    }
    
    addService(suggested)
  }

  const handleRemoveService = (index: number) => {
    removeService(index)
  }

  const handleAddSuggestedService = (suggested: any) => {
    handleAddService(suggested)
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string[]} = {}

    services.forEach((service, index) => {
      if (!service.name.trim()) {
        newErrors[`${index}.name`] = ['El nombre es requerido']
      }
      if (!service.price || service.price <= 0) {
        newErrors[`${index}.price`] = ['El precio debe ser mayor a 0']
      }
      if (!service.duration_minutes || service.duration_minutes <= 0) {
        newErrors[`${index}.duration_minutes`] = ['La duración debe ser mayor a 0']
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      nextStep()
    } catch (error) {
      console.error('Error al guardar servicios:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/onboarding/team')
  }

  const industryTerms = getIndustryTerms()
  const canProceed = canProceedFromStep(3) // Step 3 es Services

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
              Paso 4 de 6
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 h-2">
            <div className="w-4/6 bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Tag className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Configura tus{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              {industryTerms.services}
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Define los {industryTerms.services.toLowerCase()} que ofrece {organizationData.name || 'tu negocio'}
          </p>
        </div>

        {/* Suggested Services */}
        {showSuggested && suggestedServices.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl border-2 border-dashed border-yellow-300 p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Lightbulb className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-yellow-900">
                  {industryTerms.services} Sugeridos
                </h3>
              </div>
              <button
                onClick={() => setShowSuggested(false)}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ✕
              </button>
            </div>
            <p className="text-yellow-800 mb-4">
              Basado en tu tipo de negocio, estos son algunos {industryTerms.services.toLowerCase()} populares que podrías ofrecer:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedServices.map((service, index) => (
                <button
                  key={index}
                  onClick={() => handleAddSuggestedService(service)}
                  className="text-left p-4 bg-white rounded-xl border hover:border-yellow-400 transition-all"
                >
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-600">{service.description}</div>
                  <div className="text-sm text-yellow-700 mt-1">
                    ${service.price.toLocaleString()} • {service.duration_minutes} min
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services Setup Form */}
        <div className="bg-white rounded-3xl shadow-2xl border p-8 mb-8">
          <div className="space-y-8">
            
            {/* Current Services */}
            {services.map((service, index) => (
              <div key={index} className="relative">
                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200">
                  
                  {/* Header del servicio */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                        <Tag className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.name || `${industryTerms.service} ${index + 1}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {service.category || 'Sin categoría'}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemoveService(index)}
                      className="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Campos del formulario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del {industryTerms.service} *
                      </label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => handleUpdateService(index, 'name', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors[`${index}.name`] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Corte de cabello"
                      />
                      {errors[`${index}.name`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${index}.name`][0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                      </label>
                      <input
                        type="text"
                        value={service.category}
                        onChange={(e) => handleUpdateService(index, 'category', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ej: Cabello, Uñas, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => handleUpdateService(index, 'price', parseInt(e.target.value) || 0)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.price`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="15000"
                          min="0"
                        />
                      </div>
                      {errors[`${index}.price`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${index}.price`][0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración (minutos) *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={service.duration_minutes}
                          onChange={(e) => handleUpdateService(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.duration_minutes`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="60"
                          min="5"
                          step="5"
                        />
                      </div>
                      {errors[`${index}.duration_minutes`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${index}.duration_minutes`][0]}
                        </p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        rows={2}
                        value={service.description}
                        onChange={(e) => handleUpdateService(index, 'description', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Descripción del servicio..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiempo antes (min)
                      </label>
                      <input
                        type="number"
                        value={service.buffer_time_before || 0}
                        onChange={(e) => handleUpdateService(index, 'buffer_time_before', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="0"
                        min="0"
                        max="60"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tiempo de preparación</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiempo después (min)
                      </label>
                      <input
                        type="number"
                        value={service.buffer_time_after || 10}
                        onChange={(e) => handleUpdateService(index, 'buffer_time_after', parseInt(e.target.value) || 10)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="10"
                        min="0"
                        max="60"
                      />
                      <p className="text-xs text-gray-500 mt-1">Tiempo de limpieza</p>
                    </div>
                  </div>

                  {/* Configuraciones adicionales */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                        <div>
                          <h4 className="font-medium text-gray-900">Servicio activo</h4>
                          <p className="text-sm text-gray-500">Disponible para reservas</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={service.is_active}
                          onChange={(e) => handleUpdateService(index, 'is_active', e.target.checked)}
                          className="w-6 h-6 text-emerald-600 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                        <div>
                          <h4 className="font-medium text-gray-900">Requiere preparación</h4>
                          <p className="text-sm text-gray-500">Necesita tiempo extra</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={service.requires_preparation}
                          onChange={(e) => handleUpdateService(index, 'requires_preparation', e.target.checked)}
                          className="w-6 h-6 text-emerald-600 rounded"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Service Button */}
            {services.length < 20 && (
              <button
                type="button"
                onClick={() => handleAddService()}
                className="w-full py-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Plus className="w-6 h-6" />
                <span className="font-medium">Agregar {industryTerms.service}</span>
              </button>
            )}

            {/* Límite alcanzado */}
            {services.length >= 20 && (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  Has alcanzado el límite de {industryTerms.services.toLowerCase()} para el Plan Básico (20 servicios)
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Podrás agregar más {industryTerms.services.toLowerCase()} después de completar el registro
                </p>
              </div>
            )}

            {/* Servicios vacíos notice */}
            {services.length === 0 && (
              <div className="text-center py-12">
                <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes {industryTerms.services.toLowerCase()} configurados
                </h3>
                <p className="text-gray-500 mb-6">
                  Agrega al menos un {industryTerms.service.toLowerCase()} para continuar
                </p>
                <button
                  onClick={() => handleAddService()}
                  className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar primer {industryTerms.service.toLowerCase()}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Equipo
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading || !canProceed}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                Finalizar Configuración
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-1">
              <Tag className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-medium text-emerald-900 mb-2">Plan Básico - Límites de {industryTerms.services}</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Hasta 20 {industryTerms.services.toLowerCase()} diferentes</li>
                <li>• Precios y duraciones personalizables</li>
                <li>• Categorización automática</li>
                <li>• Configuración de tiempos de preparación</li>
                <li>• Activación/desactivación individual</li>
              </ul>
              <div className="mt-3 text-sm">
                <span className="font-medium text-emerald-900">Progreso actual:</span>
                <span className="ml-2 text-emerald-700">{services.length}/20 {industryTerms.services.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Notice */}
        {!canProceed && services.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Completa la información requerida</p>
                <p>Asegúrate de que todos los {industryTerms.services.toLowerCase()} tengan nombre, precio y duración válidos.</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Box */}
        {services.length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
            <h4 className="font-medium text-gray-900 mb-4">Vista previa de tus {industryTerms.services.toLowerCase()}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.slice(0, 4).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-500">{service.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-emerald-600">${service.price?.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{service.duration_minutes} min</div>
                  </div>
                </div>
              ))}
              {services.length > 4 && (
                <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg text-gray-500">
                  +{services.length - 4} más
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ServicesSetupPage