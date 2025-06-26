// src/pages/onboarding/TeamSetupPage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Plus, Trash2, User, Mail, Phone, Users, AlertCircle } from 'lucide-react'

interface Professional {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  license_number: string
  bio: string
  color_code: string
  is_active: boolean
  accepts_walk_ins: boolean
}

interface TeamSetupData {
  professionals: Professional[]
}

const TeamSetupPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string[]}>({})
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')
  const [teamData, setTeamData] = useState<TeamSetupData>({
    professionals: [
      {
        id: 'admin',
        name: '',
        email: '',
        phone: '',
        specialty: '',
        license_number: '',
        bio: '',
        color_code: '#10B981',
        is_active: true,
        accepts_walk_ins: false
      }
    ]
  })

  // Colores predefinidos para profesionales
  const availableColors = [
    '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]

  useEffect(() => {
    const registrationData = localStorage.getItem('registrationData')
    if (registrationData) {
      const data = JSON.parse(registrationData)
      setSelectedIndustry(data.industryTemplate)
      
      // Pre-llenar con datos del administrador
      setTeamData(prev => ({
        ...prev,
        professionals: [{
          ...prev.professionals[0],
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          specialty: getDefaultSpecialty(data.industryTemplate, 'admin')
        }]
      }))
    } else {
      navigate('/onboarding/register')
    }
  }, [navigate])

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

  const addProfessional = () => {
    const usedColors = teamData.professionals.map(p => p.color_code)
    const availableColor = availableColors.find(color => !usedColors.includes(color)) || availableColors[0]

    const newProfessional: Professional = {
      id: `prof-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      specialty: getDefaultSpecialty(selectedIndustry, 'professional'),
      license_number: '',
      bio: '',
      color_code: availableColor,
      is_active: true,
      accepts_walk_ins: true
    }

    setTeamData(prev => ({
      ...prev,
      professionals: [...prev.professionals, newProfessional]
    }))
  }

  const removeProfessional = (id: string) => {
    if (id === 'admin') return // No se puede eliminar al admin

    setTeamData(prev => ({
      ...prev,
      professionals: prev.professionals.filter(p => p.id !== id)
    }))
  }

  const updateProfessional = (id: string, field: keyof Professional, value: string | boolean) => {
    setTeamData(prev => ({
      ...prev,
      professionals: prev.professionals.map(p =>
        p.id === id ? { ...p, [field]: value } : p
      )
    }))

    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[`${id}.${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${id}.${field}`]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string[]} = {}

    teamData.professionals.forEach((professional) => {
      if (!professional.name.trim()) {
        newErrors[`${professional.id}.name`] = ['El nombre es requerido']
      }
      if (!professional.email.trim()) {
        newErrors[`${professional.id}.email`] = ['El email es requerido']
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(professional.email)) {
        newErrors[`${professional.id}.email`] = ['Email inválido']
      }
      if (!professional.phone.trim()) {
        newErrors[`${professional.id}.phone`] = ['El teléfono es requerido']
      }

      // Verificar emails duplicados
      const emailCount = teamData.professionals.filter(p => p.email === professional.email).length
      if (emailCount > 1 && professional.email.trim()) {
        newErrors[`${professional.id}.email`] = ['Este email ya está en uso']
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Guardar datos del equipo para el siguiente paso
      const existingData = JSON.parse(localStorage.getItem('onboardingData') || '{}')
      localStorage.setItem('onboardingData', JSON.stringify({
        ...existingData,
        teamData: teamData
      }))

      navigate('/onboarding/organization')
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
            Agrega a los {industryTerms.professionals.toLowerCase()} que trabajarán en tu negocio
          </p>
        </div>

        {/* Team Setup Form */}
        <div className="bg-white rounded-3xl shadow-2xl border p-8 mb-8">
          <div className="space-y-8">
            
            {/* Current Team Members */}
            {teamData.professionals.map((professional, index) => (
              <div key={professional.id} className="relative">
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
                          {professional.id === 'admin' ? 'Administrador Principal' : `${industryTerms.professional} ${index}`}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {professional.id === 'admin' ? 'Acceso completo al sistema' : 'Gestión de citas y clientes'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Color picker */}
                      <div className="flex space-x-1">
                        {availableColors.slice(0, 5).map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateProfessional(professional.id, 'color_code', color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              professional.color_code === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      
                      {/* Eliminar (solo para no-admin) */}
                      {professional.id !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => removeProfessional(professional.id)}
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
                          onChange={(e) => updateProfessional(professional.id, 'name', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${professional.id}.name`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Juan Pérez"
                          disabled={professional.id === 'admin'}
                        />
                      </div>
                      {errors[`${professional.id}.name`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${professional.id}.name`][0]}
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
                          onChange={(e) => updateProfessional(professional.id, 'email', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${professional.id}.email`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="juan@ejemplo.com"
                          disabled={professional.id === 'admin'}
                        />
                      </div>
                      {errors[`${professional.id}.email`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${professional.id}.email`][0]}
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
                          onChange={(e) => updateProfessional(professional.id, 'phone', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${professional.id}.phone`] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="+56 9 1234 5678"
                        />
                      </div>
                      {errors[`${professional.id}.phone`] && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors[`${professional.id}.phone`][0]}
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
                        onChange={(e) => updateProfessional(professional.id, 'specialty', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder={`Ej: ${getDefaultSpecialty(selectedIndustry, 'professional')}`}
                      />
                    </div>

                    {(selectedIndustry === 'clinic' || selectedIndustry === 'dental') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Número de Licencia
                        </label>
                        <input
                          type="text"
                          value={professional.license_number}
                          onChange={(e) => updateProfessional(professional.id, 'license_number', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="Ej: 12345"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Biografía (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        value={professional.bio}
                        onChange={(e) => updateProfessional(professional.id, 'bio', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Experiencia, certificaciones, intereses..."
                      />
                    </div>
                  </div>

                  {/* Configuraciones adicionales para no-admin */}
                  {professional.id !== 'admin' && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Acepta citas sin reserva</h4>
                          <p className="text-sm text-gray-500">Puede atender clientes que lleguen sin cita previa</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={professional.accepts_walk_ins}
                          onChange={(e) => updateProfessional(professional.id, 'accepts_walk_ins', e.target.checked)}
                          className="w-6 h-6 text-emerald-600 rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Add Professional Button */}
            {teamData.professionals.length < 4 && (
              <button
                type="button"
                onClick={addProfessional}
                className="w-full py-6 border-2 border-dashed border-gray-300 rounded-2xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Plus className="w-6 h-6" />
                <span className="font-medium">Agregar {industryTerms.professional}</span>
              </button>
            )}

            {/* Límite alcanzado */}
            {teamData.professionals.length >= 4 && (
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
            disabled={isLoading}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                Continuar a Configuración
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamSetupPage