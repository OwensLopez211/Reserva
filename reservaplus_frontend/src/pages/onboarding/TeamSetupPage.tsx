// src/pages/onboarding/TeamSetupPage.tsx - VERSIÓN ACTUALIZADA Y ALINEADA

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Trash2, User, Mail, Phone, Users, AlertCircle } from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'

const TeamSetupPage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    professionals, 
    addProfessional, 
    updateProfessional, 
    removeProfessional,
    organizationData,
    updateOrganizationData,
    canProceedFromStep,
    nextStep,
    registrationToken
  } = useOnboarding()
  
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string[]}>({})
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')

  // Cargar datos del formulario de registro
  useEffect(() => {
    if (!registrationToken) {
      navigate('/onboarding/plan')
      return
    }

    const registrationFormData = localStorage.getItem('registration_form_data')
    if (registrationFormData) {
      try {
        const data = JSON.parse(registrationFormData)
        setSelectedIndustry(data.industryTemplate)
        
        // Actualizar datos de organización en el contexto
        updateOrganizationData({
          name: data.formData.organizationName,
          industry_template: data.industryTemplate,
          email: data.businessInfo.email,
          phone: data.businessInfo.phone,
          address: data.businessInfo.address,
          city: data.businessInfo.city,
          country: data.businessInfo.country
        })

        // Si no hay profesionales, agregar uno inicial con datos del admin
        if (professionals.length === 0) {
          addProfessional()
          updateProfessional(0, {
            name: `${data.formData.firstName} ${data.formData.lastName}`,
            email: data.formData.email,
            phone: data.formData.phone,
            specialty: getDefaultSpecialty(data.industryTemplate, 'admin'),
            accepts_walk_ins: false
          })
        }
      } catch (error) {
        console.error('Error parsing registration data:', error)
      }
    }
  }, [registrationToken, navigate, updateOrganizationData, professionals.length, addProfessional, updateProfessional])

  const getDefaultSpecialty = (industry: string, role: 'admin' | 'professional'): string => {
    const specialties: {[key: string]: {admin: string, professional: string}} = {
      salon: { admin: 'Director/Propietario', professional: 'Estilista' },
      clinic: { admin: 'Director Médico', professional: 'Doctor' },
      dental: { admin: 'Director Dental', professional: 'Dentista' },
      spa: { admin: 'Director de Spa', professional: 'Terapeuta' },
      fitness: { admin: 'Director Técnico', professional: 'Entrenador Personal' },
      veterinary: { admin: 'Director Veterinario', professional: 'Veterinario' },
      beauty: { admin: 'Director de Estética', professional: 'Esteticista' }
    }

    return specialties[industry]?.[role] || (role === 'admin' ? 'Director' : 'Profesional')
  }

  const getIndustryTerms = (industry: string) => {
    const terms: {[key: string]: {professional: string, professionals: string}} = {
      salon: { professional: 'Estilista', professionals: 'Estilistas' },
      clinic: { professional: 'Doctor', professionals: 'Doctores' },
      dental: { professional: 'Dentista', professionals: 'Dentistas' },
      spa: { professional: 'Terapeuta', professionals: 'Terapeutas' },
      fitness: { professional: 'Entrenador', professionals: 'Entrenadores' },
      veterinary: { professional: 'Veterinario', professionals: 'Veterinarios' },
      beauty: { professional: 'Esteticista', professionals: 'Esteticistas' }
    }

    return terms[industry] || { professional: 'Profesional', professionals: 'Profesionales' }
  }

  const handleAddProfessional = () => {
    if (professionals.length >= 3) {
      alert('El Plan Básico permite máximo 3 profesionales + administrador')
      return
    }
    
    addProfessional()
    // Actualizar con especialidad por defecto
    setTimeout(() => {
      updateProfessional(professionals.length, {
        specialty: getDefaultSpecialty(selectedIndustry, 'professional')
      })
    }, 100)
  }

  const handleRemoveProfessional = (index: number) => {
    if (index === 0) {
      alert('No puedes eliminar al administrador principal')
      return
    }
    
    removeProfessional(index)
  }

  const handleUpdateProfessional = (index: number, field: string, value: string | boolean) => {
    updateProfessional(index, { [field]: value })

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[`${index}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${index}.${field}`]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string[]} = {}

    professionals.forEach((professional, index) => {
      if (!professional.name.trim()) {
        newErrors[`${index}.name`] = ['El nombre es requerido']
      }
      if (!professional.email.trim()) {
        newErrors[`${index}.email`] = ['El email es requerido']
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professional.email)) {
        newErrors[`${index}.email`] = ['Email inválido']
      }
      if (!professional.phone.trim()) {
        newErrors[`${index}.phone`] = ['El teléfono es requerido']
      }

      // Verificar emails duplicados
      const emailCount = professionals.filter(p => p.email === professional.email).length
      if (emailCount > 1 && professional.email.trim()) {
        newErrors[`${index}.email`] = ['Este email ya está en uso']
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Usar el método del contexto para avanzar
      nextStep()
    } catch (error) {
      console.error('Error al guardar equipo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/onboarding/register')
  }

  const industryTerms = getIndustryTerms(selectedIndustry)
  const canProceed = canProceedFromStep(2) // Step 2 es Team

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
              Paso 3 de 6
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 h-2">
            <div className="w-3/6 bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Configura tu{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Equipo
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Agrega a los {industryTerms.professionals.toLowerCase()} que trabajarán en {organizationData.name || 'tu negocio'}
          </p>
        </div>

        {/* Team Setup Form */}
        <div className="bg-white rounded-3xl shadow-2xl border p-8 mb-8">
          <div className="space-y-8">
            
            {/* Current Team Members */}
            {professionals.map((professional, index) => (
              <div key={index} className="relative">
                <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200">
                  
                  {/* Header del profesional */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                        style={{ backgroundColor: professional.color_code + '20' }}
                      >
                        <User className="w-6 h-6" style={{ color: professional.color_code }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {index === 0 ? 'Administrador Principal' : `${industryTerms.professional} ${index}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {index === 0 ? 'Acceso completo al sistema' : 'Gestión de citas y clientes'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Color picker */}
                      <div className="flex space-x-1">
                        {['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'].map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleUpdateProfessional(index, 'color_code', color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              professional.color_code === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      {/* Eliminar (solo para no-admin) */}
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveProfessional(index)}
                          className="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Campos del formulario */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={professional.name}
                          onChange={(e) => handleUpdateProfessional(index, 'name', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.name`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Juan Pérez"
                          disabled={index === 0}
                        />
                      </div>
                      {errors[`${index}.name`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${index}.name`][0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={professional.email}
                          onChange={(e) => handleUpdateProfessional(index, 'email', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.email`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="juan@ejemplo.com"
                          disabled={index === 0}
                        />
                      </div>
                      {errors[`${index}.email`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${index}.email`][0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={professional.phone}
                          onChange={(e) => handleUpdateProfessional(index, 'phone', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.phone`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                      {errors[`${index}.phone`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${index}.phone`][0]}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Especialidad
                      </label>
                      <input
                        type="text"
                        value={professional.specialty}
                        onChange={(e) => handleUpdateProfessional(index, 'specialty', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={`Ej: ${getDefaultSpecialty(selectedIndustry, index === 0 ? 'admin' : 'professional')}`}
                      />
                    </div>

                    {/* Configuraciones adicionales para no-admin */}
                    {index !== 0 && (
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                          <div>
                            <h4 className="font-medium text-gray-900">Acepta citas sin reserva</h4>
                            <p className="text-sm text-gray-500">Puede atender clientes que lleguen sin cita previa</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={professional.accepts_walk_ins}
                            onChange={(e) => handleUpdateProfessional(index, 'accepts_walk_ins', e.target.checked)}
                            className="w-6 h-6 text-emerald-600 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Professional Button */}
            {professionals.length < 4 && (
              <button
                type="button"
                onClick={handleAddProfessional}
                className="w-full py-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Plus className="w-6 h-6" />
                <span className="font-medium">Agregar {industryTerms.professional}</span>
              </button>
            )}

            {/* Límite alcanzado */}
            {professionals.length >= 4 && (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  Has alcanzado el límite de {industryTerms.professionals.toLowerCase()} para el Plan Básico (3 + administrador)
                </p>
                <p className="text-sm text-emerald-600 mt-1">
                  Podrás agregar más {industryTerms.professionals.toLowerCase()} después de completar el registro
                </p>
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
            Volver al Registro
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
                Continuar a Servicios
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-1">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-2">Plan Básico - Límites del Equipo</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 1 Usuario Administrador (tú)</li>
                <li>• 1 Usuario Recepcionista (opcional)</li>
                <li>• 3 {industryTerms.professionals} máximo</li>
                <li>• Cada {industryTerms.professional.toLowerCase()} puede gestionar su calendario</li>
                <li>• Invitaciones por email automáticas</li>
              </ul>
              <div className="mt-3 text-sm">
                <span className="font-medium text-blue-900">Progreso actual:</span>
                <span className="ml-2 text-blue-700">{professionals.length}/4 miembros del equipo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Notice */}
        {!canProceed && professionals.length > 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Completa la información requerida</p>
                <p>Asegúrate de que todos los profesionales tengan nombre, email y teléfono válidos.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamSetupPage