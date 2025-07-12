// src/pages/onboarding/TeamSetupPage.tsx - VERSIÓN MEJORADA CON LÍMITES DE PLAN

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Trash2, User, Mail, Phone, Users, AlertCircle, Crown, UserCheck, Briefcase, Loader2 } from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { formatPhoneNumber } from '../../utils/formatters'
import { OnboardingProgressIndicator } from '../../components/onboarding/OnboardingProgressIndicator'
import { OnboardingService } from '../../services/onboardingService'

// Interfaces para el equipo
interface TeamMember {
  name: string
  email: string
  phone: string
  role: 'owner' | 'professional' | 'reception' | 'staff'
  specialty?: string
  is_professional: boolean
  color_code: string
  accepts_walk_ins: boolean
  isReadOnly?: boolean // Para el administrador principal
}

// Información del plan con límites (directamente desde el backend)
interface PlanData {
  id: string
  name: string
  max_users: number
  max_professionals: number
  max_receptionists: number
  max_staff: number
  max_services: number
  max_monthly_appointments: number
  max_clients: number
  price_monthly: number
  price_yearly?: number
  description: string
  features: string[]
}

const TeamSetupPage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    organizationData,
    registrationToken,
    markStepCompleted,
    setCurrentStep,
    addProfessional,
    updateProfessional,
    removeProfessional,
    professionals
  } = useOnboarding()
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [planInfo, setPlanInfo] = useState<PlanData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string[]}>({})
  const [initialized, setInitialized] = useState(false)

  // Colores predefinidos para miembros del equipo
  const availableColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  // Función para cargar plan desde el backend
  const loadPlanFromBackend = useCallback(async (planId: string) => {
    try {
      const response = await OnboardingService.getAvailablePlans()
      const plans = response.results || []
      const selectedPlan = plans.find((plan: PlanData) => plan.id === planId)
      
      if (selectedPlan) {
        console.log('📋 Plan cargado desde backend:', selectedPlan)
        
        // Ajuste específico para plan básico
        const isBasicPlan = selectedPlan.name.toLowerCase().includes('básico') || selectedPlan.name.toLowerCase().includes('basico')
        
        setPlanInfo({
          id: selectedPlan.id,
          name: selectedPlan.name,
          max_users: isBasicPlan ? 6 : selectedPlan.max_users,
          max_professionals: selectedPlan.max_professionals,
          max_receptionists: selectedPlan.max_receptionists,
          max_staff: selectedPlan.max_staff,
          max_services: selectedPlan.max_services,
          max_monthly_appointments: selectedPlan.max_monthly_appointments,
          max_clients: selectedPlan.max_clients,
          price_monthly: selectedPlan.price_monthly,
          price_yearly: selectedPlan.price_yearly,
          description: selectedPlan.description,
          features: selectedPlan.features
        })
      } else {
        console.error('❌ Plan no encontrado:', planId)
        // Fallback con valores por defecto
        setPlanInfo({
          id: planId,
          name: 'Plan Básico',
          max_users: 6,
          max_professionals: 3,
          max_receptionists: 2,
          max_staff: 1,
          max_services: 10,
          max_monthly_appointments: 100,
          max_clients: 500,
          price_monthly: 29990,
          description: 'Plan básico',
          features: []
        })
      }
    } catch (error) {
      console.error('❌ Error cargando plan:', error)
      // Fallback con valores por defecto
      setPlanInfo({
        id: planId,
        name: 'Plan Básico',
        max_users: 6,
        max_professionals: 3,
        max_receptionists: 2,
        max_staff: 1,
        max_services: 10,
        max_monthly_appointments: 100,
        max_clients: 500,
        price_monthly: 29990,
        description: 'Plan básico',
        features: []
      })
    }
  }, [setPlanInfo])

  // Cargar datos del formulario de registro y crear administrador principal
  useEffect(() => {
    const initializeTeamSetup = async () => {
    if (initialized) return
    
    if (!registrationToken) {
      navigate('/onboarding/plan')
      return
    }

    const registrationFormData = localStorage.getItem('registration_form_data')
      const selectedPlanData = localStorage.getItem('selected_plan_data')
    
      if (registrationFormData && selectedPlanData) {
      try {
          const formData = JSON.parse(registrationFormData)
          const planData = JSON.parse(selectedPlanData)
          
          // Obtener información completa del plan desde el backend
          await loadPlanFromBackend(planData.id || planData.name)

        // Crear administrador principal (owner) - no editable
        const adminMember: TeamMember = {
          name: `${formData.formData.firstName} ${formData.formData.lastName}`,
          email: formData.formData.email,
          phone: formData.formData.phone,
          role: 'owner',
          specialty: 'Propietario/Director',
          is_professional: false, // El owner NO cuenta como profesional
          color_code: '#4CAF50',
          accepts_walk_ins: false,
          isReadOnly: true
        }

          setTeamMembers([adminMember])
          setInitialized(true)
      } catch (error) {
        console.error('Error parsing registration data:', error)
          navigate('/onboarding/register')
        }
      } else {
        navigate('/onboarding/register')
      }
    }

    initializeTeamSetup()
  }, [registrationToken, navigate, initialized, loadPlanFromBackend])

  const getIndustryTerms = useCallback(() => {
    const terms: {[key: string]: {professional: string, professionals: string}} = {
      salon: { professional: 'Estilista', professionals: 'Estilistas' },
      clinic: { professional: 'Doctor', professionals: 'Doctores' },
      dental: { professional: 'Dentista', professionals: 'Dentistas' },
      spa: { professional: 'Terapeuta', professionals: 'Terapeutas' },
      fitness: { professional: 'Entrenador', professionals: 'Entrenadores' },
      veterinary: { professional: 'Veterinario', professionals: 'Veterinarios' },
      beauty: { professional: 'Esteticista', professionals: 'Esteticistas' }
    }

    return terms[organizationData.industry_template] || { professional: 'Profesional', professionals: 'Profesionales' }
  }, [organizationData.industry_template])

  const getDefaultSpecialty = useCallback((industry: string, role: string): string => {
    const specialties: {[key: string]: {[key: string]: string}} = {
      salon: { 
        professional: 'Estilista', 
        reception: 'Recepcionista', 
        staff: 'Asistente' 
      },
      clinic: { 
        professional: 'Doctor General', 
        reception: 'Recepcionista Médica', 
        staff: 'Asistente Médico' 
      },
      dental: { 
        professional: 'Dentista', 
        reception: 'Recepcionista Dental', 
        staff: 'Asistente Dental' 
      }
    }

    return specialties[industry]?.[role] || 'Especialista'
  }, [])

  const canAddRole = useCallback((role: 'professional' | 'reception' | 'staff'): boolean => {
    if (!planInfo) return false

    const currentCounts = {
      total: teamMembers.length,
      professionals: teamMembers.filter(m => m.role === 'professional').length,
      receptionists: teamMembers.filter(m => m.role === 'reception').length,
      staff: teamMembers.filter(m => m.role === 'staff').length
    }

    // Verificar límite total de usuarios
    if (currentCounts.total >= planInfo.max_users) return false

    // Lógica específica por rol
    switch (role) {
      case 'professional':
        // Solo verificar límite específico de profesionales
        return currentCounts.professionals < planInfo.max_professionals
      case 'reception':
      case 'staff':
        // Para recepcionistas y staff, solo verificar que no exceda el límite total
        // El espacio disponible es: total_users - owner(1) - profesionales_actuales = espacios_libres
        return currentCounts.total < planInfo.max_users
      default:
        return false
    }
  }, [planInfo, teamMembers])

  const getRoleIcon = (role: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      owner: Crown,
      professional: UserCheck,
      reception: Users,
      staff: Briefcase
    }
    return iconMap[role] || Briefcase
  }



  const getRoleName = (role: string) => {
    const nameMap: Record<string, string> = {
      owner: 'Propietario',
      professional: 'Profesional',
      reception: 'Recepcionista',
      staff: 'Staff'
    }
    return nameMap[role] || role
  }

  const addTeamMember = useCallback((role: 'professional' | 'reception' | 'staff') => {
    if (!canAddRole(role)) {
      alert(`No puedes agregar más usuarios de tipo ${getRoleName(role)} según tu plan`)
      return
    }
    
    const newMember: TeamMember = {
      name: '',
      email: '',
      phone: '',
      role,
      specialty: getDefaultSpecialty(organizationData.industry_template, role),
      is_professional: role === 'professional',
      color_code: availableColors[teamMembers.length % availableColors.length],
      accepts_walk_ins: false,
      isReadOnly: false
    }

    setTeamMembers(prev => [...prev, newMember])
  }, [canAddRole, getRoleName, getDefaultSpecialty, organizationData.industry_template, teamMembers.length, availableColors])

  const updateTeamMember = useCallback((index: number, field: string, value: string | boolean) => {
    setTeamMembers(prev => {
      const updated = [...prev]
      if (updated[index] && !updated[index].isReadOnly) {
        let processedValue = value
        
        // Formatear números de teléfono
        if (field === 'phone' && typeof value === 'string') {
          processedValue = formatPhoneNumber(value)
        }
        
        updated[index] = { ...updated[index], [field]: processedValue }
      }
      return updated
    })

    // Limpiar errores
    if (errors[`${index}.${field}`]) {
    setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${index}.${field}`]
        return newErrors
      })
    }
  }, [errors])

  const removeTeamMember = useCallback((index: number) => {
    if (index === 0) {
      alert('No puedes eliminar al propietario principal')
      return
    }

    setTeamMembers(prev => prev.filter((_, i) => i !== index))
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: {[key: string]: string[]} = {}

    teamMembers.forEach((member, index) => {
      if (!member.name.trim()) {
        newErrors[`${index}.name`] = ['El nombre es requerido']
      }
      if (!member.email.trim()) {
        newErrors[`${index}.email`] = ['El email es requerido']
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email)) {
        newErrors[`${index}.email`] = ['Email inválido']
      }
      if (!member.phone.trim()) {
        newErrors[`${index}.phone`] = ['El teléfono es requerido']
      }

      // Verificar emails duplicados
      const emailCount = teamMembers.filter(m => m.email === member.email).length
      if (emailCount > 1 && member.email.trim()) {
        newErrors[`${index}.email`] = ['Este email ya está en uso']
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [teamMembers])

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    if (teamMembers.length === 0) {
      alert('Debes tener al menos el administrador principal')
      return
    }

    // Verificar que haya al menos 1 profesional
    const professionalsCount = teamMembers.filter(member => member.role === 'professional').length
    if (professionalsCount === 0) {
      alert('Debes agregar al menos 1 profesional para poder continuar')
      return
    }

    setIsLoading(true)
    
    try {
      // Actualizar el contexto de onboarding con los datos de los profesionales
      // Primero, limpiar profesionales existentes (si los hay)
      while (professionals.length > 0) {
        removeProfessional(0)
      }
      
      // Agregar solo los profesionales (no owners, receptionist, staff)
      const professionalsFromTeam = teamMembers.filter(member => member.role === 'professional')
      professionalsFromTeam.forEach(() => {
        addProfessional()
      })
      
      // Actualizar cada profesional con sus datos
      professionalsFromTeam.forEach((member, index) => {
        updateProfessional(index, {
          name: member.name,
          email: member.email,
          phone: member.phone,
          specialty: member.specialty,
          color_code: member.color_code,
          accepts_walk_ins: member.accepts_walk_ins
        })
      })
      
      // Guardar datos del equipo para el siguiente paso (mantenemos para compatibilidad)
      const teamData = {
        teamMembers: teamMembers.map(member => ({
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
          specialty: member.specialty,
          is_professional: member.is_professional,
          color_code: member.color_code,
          accepts_walk_ins: member.accepts_walk_ins
        }))
      }
      
      localStorage.setItem('team_setup_data', JSON.stringify(teamData))
      
      console.log('✅ Equipo actualizado en contexto:', {
        profesionales: professionalsFromTeam.length,
        totalMiembros: teamMembers.length
      })
      
      // Marcar paso como completado
      markStepCompleted(2)
      setCurrentStep(3)
      
      // Navegar al siguiente paso
      navigate('/onboarding/services')
    } catch (error) {
      console.error('Error al guardar equipo:', error)
      alert('Error al guardar el equipo. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }, [validateForm, teamMembers, markStepCompleted, setCurrentStep, navigate, professionals, addProfessional, updateProfessional, removeProfessional])

  const handleBack = useCallback(() => {
    navigate('/onboarding/register')
  }, [navigate])

  const industryTerms = getIndustryTerms()

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
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <OnboardingProgressIndicator />

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
            Agrega a las personas que trabajarán en {organizationData.name || 'tu negocio'}
          </p>
        </div>

        {/* Plan Information */}
        {planInfo && (
          <div className="bg-white rounded-xl shadow-lg border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Plan {planInfo.name} - Límites del Equipo</h3>
              <span className="text-sm text-gray-500">{teamMembers.length}/{planInfo.max_users} usuarios</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Profesionales</div>
                <div className="font-semibold text-gray-900">
                  {teamMembers.filter(m => m.role === 'professional').length}/{planInfo.max_professionals}
                </div>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="text-sm text-emerald-600">Total Usuarios</div>
                <div className="font-semibold text-emerald-900">
                  {teamMembers.length}/{planInfo.max_users}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Members List */}
        <div className="bg-white rounded-3xl shadow-2xl border p-8 mb-8">
          <div className="space-y-8">
            
            {/* Current Team Members */}
            {teamMembers.map((member, index) => {
              const Icon = getRoleIcon(member.role)
              return (
              <div key={index} className="relative">
                  <div className={`rounded-2xl p-6 border-2 ${
                    member.isReadOnly 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                      : 'bg-gray-50 border-dashed border-gray-200'
                  }`}>
                  
                    {/* Header del miembro */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                          style={{ backgroundColor: member.color_code + '20' }}
                      >
                          <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            {member.isReadOnly && <Crown className="w-4 h-4 text-yellow-500 mr-2" />}
                            {member.isReadOnly ? 'Administrador Principal' : getRoleName(member.role)}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {member.isReadOnly 
                              ? 'Acceso completo al sistema' 
                              : `${getRoleName(member.role)} del equipo`
                            }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {/* Color picker - solo para no-admin */}
                        {!member.isReadOnly && (
                      <div className="flex space-x-1">
                            {availableColors.slice(0, 5).map(color => (
                          <button
                            key={color}
                            type="button"
                                onClick={() => updateTeamMember(index, 'color_code', color)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  member.color_code === color ? 'border-gray-400 scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                        )}
                      
                      {/* Eliminar (solo para no-admin) */}
                        {!member.isReadOnly && (
                        <button
                          type="button"
                            onClick={() => removeTeamMember(index)}
                          className="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                        {/* Badge de propietario */}
                        {member.isReadOnly && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Crown className="w-3 h-3 mr-1" />
                            Propietario
                          </span>
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
                            value={member.name}
                            onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.name`] ? 'border-red-300' : 'border-gray-300'
                            } ${member.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="Nombre completo"
                            readOnly={member.isReadOnly}
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
                            value={member.email}
                            onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.email`] ? 'border-red-300' : 'border-gray-300'
                            } ${member.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="correo@ejemplo.com"
                            readOnly={member.isReadOnly}
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
                            value={member.phone}
                            onChange={(e) => updateTeamMember(index, 'phone', e.target.value)}
                          className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors[`${index}.phone`] ? 'border-red-300' : 'border-gray-300'
                            } ${member.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder="+56 9 1234 5678"
                            readOnly={member.isReadOnly}
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
                          value={member.specialty || ''}
                          onChange={(e) => updateTeamMember(index, 'specialty', e.target.value)}
                          className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            member.isReadOnly ? 'bg-gray-100 cursor-not-allowed' : ''
                          }`}
                          placeholder={`Ej: ${getDefaultSpecialty(organizationData.industry_template, member.role)}`}
                          readOnly={member.isReadOnly}
                      />
                    </div>

                    {/* Configuraciones adicionales para no-admin */}
                      {!member.isReadOnly && (
                      <div className="md:col-span-2">
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border">
                          <div>
                            <h4 className="font-medium text-gray-900">Acepta citas sin reserva</h4>
                            <p className="text-sm text-gray-500">Puede atender clientes que lleguen sin cita previa</p>
                          </div>
                          <input
                            type="checkbox"
                              checked={member.accepts_walk_ins}
                              onChange={(e) => updateTeamMember(index, 'accepts_walk_ins', e.target.checked)}
                            className="w-6 h-6 text-emerald-600 rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )
            })}

            {/* Add Team Member Buttons */}
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Agregar miembro del equipo</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Máximo 3 profesionales. Los espacios restantes pueden ser recepcionistas o staff según prefieras.
                </p>
                {teamMembers.filter(m => m.role === 'professional').length === 0 && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Debes agregar al menos 1 profesional para continuar
                </p>
              </div>
            )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Agregar Profesional */}
                <button
                  type="button"
                  onClick={() => addTeamMember('professional')}
                  disabled={!canAddRole('professional')}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all text-left ${
                    canAddRole('professional')
                      ? 'border-blue-300 text-blue-600 hover:border-blue-500 hover:bg-blue-50'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <UserCheck className="w-5 h-5 mr-2" />
                    <span className="font-medium">Profesional</span>
                  </div>
                  <div className="text-sm">
                    {canAddRole('professional') 
                      ? `Agregar ${industryTerms.professional.toLowerCase()}`
                      : `Límite alcanzado (${planInfo?.max_professionals})`
                    }
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Actual: {teamMembers.filter(m => m.role === 'professional').length}/{planInfo?.max_professionals}
                  </div>
                </button>

                {/* Agregar Recepcionista */}
                <button
                  type="button"
                  onClick={() => addTeamMember('reception')}
                  disabled={!canAddRole('reception')}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all text-left ${
                    canAddRole('reception')
                      ? 'border-purple-300 text-purple-600 hover:border-purple-500 hover:bg-purple-50'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 mr-2" />
                    <span className="font-medium">Recepcionista</span>
                  </div>
                  <div className="text-sm">
                    {canAddRole('reception') 
                      ? 'Agregar recepcionista'
                      : `Capacidad total alcanzada`
                    }
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Espacios disponibles: {planInfo ? planInfo.max_users - teamMembers.length : 0}
                  </div>
                </button>

                {/* Agregar Staff */}
                <button
                  type="button"
                  onClick={() => addTeamMember('staff')}
                  disabled={!canAddRole('staff')}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all text-left ${
                    canAddRole('staff')
                      ? 'border-orange-300 text-orange-600 hover:border-orange-500 hover:bg-orange-50'
                      : 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Briefcase className="w-5 h-5 mr-2" />
                    <span className="font-medium">Staff</span>
                  </div>
                  <div className="text-sm">
                    {canAddRole('staff') 
                      ? 'Agregar staff'
                      : `Capacidad total alcanzada`
                    }
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Espacios disponibles: {planInfo ? planInfo.max_users - teamMembers.length : 0}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <h4 className="font-medium text-red-900 mb-2">Errores de validación:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([field, fieldErrors]) => (
                <li key={field}>• {fieldErrors[0]}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Registro
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading || teamMembers.length === 0 || teamMembers.filter(m => m.role === 'professional').length === 0}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
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
              <h4 className="font-medium text-blue-900 mb-2">Información del Equipo</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• El <strong>Propietario</strong> tiene acceso completo al sistema</li>
                <li>• Los <strong>Profesionales</strong> pueden gestionar sus citas y servicios</li>
                <li>• Los <strong>Recepcionistas</strong> gestionan la agenda y clientes</li>
                <li>• El <strong>Staff</strong> tiene acceso básico al sistema</li>
                <li>• <strong>Requisito:</strong> Debes tener al menos 1 profesional para continuar</li>
                <li>• Podrás invitar más miembros después de completar el registro</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TeamSetupPage