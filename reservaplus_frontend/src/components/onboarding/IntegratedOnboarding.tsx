// src/components/onboarding/IntegratedOnboarding.tsx - REFACTORIZADO
import React, { useState, useCallback, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Check, Building2, Users, Briefcase, Settings, Star, AlertTriangle } from 'lucide-react'

// Importar los componentes granulares
import WelcomeStep from './steps/WelcomeStep'
import OrganizationStep from './steps/OrganizationStep'
import ProfessionalsStep from './steps/ProfessionalsStep'
import ServicesStep from './steps/ServicesStep'
import ConfigurationStep from './steps/ConfigurationStep'
import CompleteStep from './steps/CompleteStep'

// Interfaces
interface OrganizationData {
  name: string
  industry_template: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}

interface ProfessionalData {
  name: string
  email: string
  phone: string
  specialty: string
  color_code: string
  accepts_walk_ins: boolean
}

interface ServiceData {
  name: string
  description: string
  category: string
  duration_minutes: number
  price: number
  buffer_time_after: number
}

const IntegratedOnboarding: React.FC = () => {
  // Estado del onboarding
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isCompleting, setIsCompleting] = useState(false)

  // Datos del onboarding
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    name: '',
    industry_template: 'salon',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Chile'
  })

  const [professionals, setProfessionals] = useState<ProfessionalData[]>([])
  const [services, setServices] = useState<ServiceData[]>([])

  // Configuración de pasos (memoizado)
  const steps = useMemo(() => [
    { id: 0, title: 'Bienvenida', icon: Star, description: 'Te damos la bienvenida a ReservaPlus' },
    { id: 1, title: 'Tu Organización', icon: Building2, description: 'Información básica de tu negocio' },
    { id: 2, title: 'Profesionales', icon: Users, description: 'Agrega a tu equipo de trabajo' },
    { id: 3, title: 'Servicios', icon: Briefcase, description: 'Define los servicios que ofreces' },
    { id: 4, title: 'Configuración', icon: Settings, description: 'Ajustes finales de tu sistema' },
    { id: 5, title: 'Finalizar', icon: Check, description: 'Todo listo para empezar' }
  ], [])

  // Templates de industria (memoizado)
  const industryTemplates = useMemo(() => [
    { value: 'salon', label: 'Peluquería/Salón de Belleza', icon: '💇‍♀️' },
    { value: 'clinic', label: 'Clínica/Consultorio Médico', icon: '🏥' },
    { value: 'fitness', label: 'Entrenamiento Personal/Fitness', icon: '💪' },
    { value: 'spa', label: 'Spa/Centro de Bienestar', icon: '🧘‍♀️' },
    { value: 'dental', label: 'Clínica Dental', icon: '🦷' },
    { value: 'veterinary', label: 'Veterinaria', icon: '🐕' },
    { value: 'beauty', label: 'Centro de Estética', icon: '✨' },
    { value: 'massage', label: 'Centro de Masajes', icon: '💆‍♀️' },
    { value: 'other', label: 'Otro', icon: '🏢' }
  ], [])

  // Colores para profesionales (memoizado)
  const professionalColors = useMemo(() => [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ], [])

  // FUNCIONES DE VALIDACIÓN (simplificadas y específicas)
  const validateOrganization = useCallback(() => {
    return organizationData.name.trim() !== '' && 
           organizationData.email.trim() !== '' && 
           organizationData.phone.trim() !== ''
  }, [organizationData.name, organizationData.email, organizationData.phone])

  const validateProfessionals = useCallback(() => {
    return professionals.length > 0 && 
           professionals.every(p => p.name.trim() !== '' && p.email.trim() !== '')
  }, [professionals])

  const validateServices = useCallback(() => {
    return services.length > 0 && 
           services.every(s => s.name.trim() !== '' && s.price > 0 && s.duration_minutes > 0)
  }, [services])

  // Función principal de validación del paso actual
  const canProceedFromCurrentStep = useCallback(() => {
    console.log('Validando paso:', currentStep)
    switch (currentStep) {
      case 0: 
        return true
      case 1: {
        const orgValid = validateOrganization()
        console.log('Organización válida:', orgValid, organizationData)
        return orgValid
      }
      case 2: {
        const profValid = validateProfessionals()
        console.log('Profesionales válidos:', profValid, professionals)
        return profValid
      }
      case 3:  {
        const servValid = validateServices()
        console.log('Servicios válidos:', servValid, services)
        return servValid
      }
      case 4: {
        return true
      } 
      case 5: 
        return true
      default: 
        return false
    }
  }, [currentStep, validateOrganization, validateProfessionals, validateServices])

  // MÉTODOS DE NAVEGACIÓN (con logs para debug)
  const nextStep = useCallback(() => {
    console.log('Intentando avanzar desde paso:', currentStep)
    console.log('¿Puede proceder?:', canProceedFromCurrentStep())
    
    if (currentStep < steps.length - 1 && canProceedFromCurrentStep()) {
      console.log('Avanzando al paso:', currentStep + 1)
      setCompletedSteps(prev => [...prev, currentStep])
      setCurrentStep(currentStep + 1)
    } else {
      console.log('No se puede avanzar. Current step:', currentStep, 'Max steps:', steps.length - 1, 'Can proceed:', canProceedFromCurrentStep())
    }
  }, [currentStep, steps.length, canProceedFromCurrentStep])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

  // MÉTODOS PARA ORGANIZACIÓN
  const updateOrganizationData = useCallback((field: keyof OrganizationData, value: string) => {
    console.log('Actualizando organización:', field, value)
    setOrganizationData(prev => ({ ...prev, [field]: value }))
  }, [])

  const selectIndustryTemplate = useCallback((template: string) => {
    console.log('Seleccionando template:', template)
    setOrganizationData(prev => ({ ...prev, industry_template: template }))
  }, [])

  // MÉTODOS PARA PROFESIONALES
  const addProfessional = useCallback(() => {
    console.log('Agregando profesional')
    const newProfessional: ProfessionalData = {
      name: '',
      email: '',
      phone: '',
      specialty: '',
      color_code: professionalColors[professionals.length % professionalColors.length],
      accepts_walk_ins: true
    }
    setProfessionals(prev => [...prev, newProfessional])
  }, [professionals.length, professionalColors])

  const updateProfessional = useCallback((index: number, field: keyof ProfessionalData, value: ProfessionalData[keyof ProfessionalData]) => {
    console.log('Actualizando profesional:', index, field, value)
    setProfessionals(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const removeProfessional = useCallback((index: number) => {
    console.log('Eliminando profesional:', index)
    setProfessionals(prev => prev.filter((_, i) => i !== index))
  }, [])

  // MÉTODOS PARA SERVICIOS
  const addService = useCallback((suggested?: Partial<ServiceData>) => {
    console.log('Agregando servicio:', suggested)
    const newService: ServiceData = {
      name: suggested?.name || '',
      description: suggested?.description || '',
      category: suggested?.category || '',
      duration_minutes: suggested?.duration_minutes || 30,
      price: suggested?.price || 0,
      buffer_time_after: 10
    }
    setServices(prev => [...prev, newService])
  }, [])

  const updateService = useCallback((index: number, field: keyof ServiceData, value: ServiceData[keyof ServiceData]) => {
    console.log('Actualizando servicio:', index, field, value)
    setServices(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }, [])

  const removeService = useCallback((index: number) => {
    console.log('Eliminando servicio:', index)
    setServices(prev => prev.filter((_, i) => i !== index))
  }, [])

  // FINALIZAR ONBOARDING
  const completeOnboarding = useCallback(async () => {
    console.log('Finalizando onboarding...')
    setIsCompleting(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/onboarding/complete/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          organization: organizationData,
          professionals,
          services
        })
      })

      if (response.ok) {
        console.log('Onboarding completado exitosamente')
        window.location.href = '/dashboard'
      } else {
        throw new Error('Error en la respuesta del servidor')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Hubo un error al completar la configuración. Por favor intenta de nuevo.')
    } finally {
      setIsCompleting(false)
    }
  }, [organizationData, professionals, services])

  // RENDERIZAR PASO ACTUAL
  const renderCurrentStep = useCallback(() => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />
      
      case 1:
        return (
          <OrganizationStep
            data={organizationData}
            onUpdate={updateOrganizationData}
            onSelectIndustry={selectIndustryTemplate}
          />
        )
      
      case 2:
        return (
          <ProfessionalsStep
            professionals={professionals}
            onAdd={addProfessional}
            onUpdate={updateProfessional}
            onRemove={removeProfessional}
          />
        )
      
      case 3:
        return (
          <ServicesStep
            services={services}
            industryTemplate={organizationData.industry_template}
            onAdd={addService}
            onUpdate={updateService}
            onRemove={removeService}
          />
        )
      
      case 4: {
        const selectedIndustry = industryTemplates.find(t => t.value === organizationData.industry_template)
        return (
          <ConfigurationStep
            organizationName={organizationData.name}
            professionalsCount={professionals.length}
            servicesCount={services.length}
            industryLabel={selectedIndustry?.label || 'N/A'}
          />
        )
      }
      
      case 5:
        return (
          <CompleteStep
            isCompleting={isCompleting}
            onComplete={completeOnboarding}
          />
        )
      
      default:
        return <WelcomeStep />
    }
  }, [
    currentStep, 
    organizationData, 
    professionals, 
    services, 
    isCompleting,
    updateOrganizationData,
    selectIndustryTemplate,
    addProfessional,
    updateProfessional,
    removeProfessional,
    addService,
    updateService,
    removeService,
    completeOnboarding,
    industryTemplates
  ])

  // OBTENER ERRORES DEL PASO ACTUAL
  const getCurrentStepErrors = useCallback(() => {
    const errors: string[] = []
    
    if (currentStep === 1) {
      if (!organizationData.name.trim()) errors.push('Nombre requerido')
      if (!organizationData.email.trim()) errors.push('Email requerido')
      if (!organizationData.phone.trim()) errors.push('Teléfono requerido')
    }
    
    if (currentStep === 2) {
      if (professionals.length === 0) errors.push('Agrega al menos un profesional')
      professionals.forEach((p, i) => {
        if (!p.name.trim()) errors.push(`Nombre del profesional ${i + 1} requerido`)
        if (!p.email.trim()) errors.push(`Email del profesional ${i + 1} requerido`)
      })
    }
    
    if (currentStep === 3) {
      if (services.length === 0) errors.push('Agrega al menos un servicio')
      services.forEach((s, i) => {
        if (!s.name.trim()) errors.push(`Nombre del servicio ${i + 1} requerido`)
        if (s.price <= 0) errors.push(`Precio del servicio ${i + 1} debe ser mayor a 0`)
        if (s.duration_minutes <= 0) errors.push(`Duración del servicio ${i + 1} debe ser mayor a 0`)
      })
    }
    
    return errors
  }, [currentStep, organizationData, professionals, services])

  const currentStepErrors = useMemo(() => getCurrentStepErrors(), [getCurrentStepErrors])

  // Efecto para agregar primer profesional automáticamente
  React.useEffect(() => {
    if (professionals.length === 0 && currentStep === 2) {
      console.log('Agregando primer profesional automáticamente')
      addProfessional()
    }
  }, [currentStep, professionals.length, addProfessional])

  // Efecto para agregar primer servicio automáticamente
  React.useEffect(() => {
    if (services.length === 0 && currentStep === 3) {
      console.log('Agregando primer servicio automáticamente')
      addService()
    }
  }, [currentStep, services.length, addService])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary-600">ReservaPlus</h1>
                <p className="text-sm text-gray-600">Configuración inicial</p>
              </div>
              <div className="text-sm text-gray-500">
                Paso {currentStep + 1} de {steps.length}
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="flex items-center space-x-4 overflow-x-auto">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = completedSteps.includes(index)
                const isAccessible = index <= currentStep

                return (
                  <div key={step.id} className="flex items-center flex-shrink-0">
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => isAccessible && setCurrentStep(index)}
                        disabled={!isAccessible}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-primary-600 text-white'
                            : isAccessible
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </button>
                      <span className={`mt-2 text-xs text-center max-w-16 ${
                        isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-2 ${
                        completedSteps.includes(index) ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {renderCurrentStep()}
        </div>

        {/* Errores del paso actual */}
        {currentStepErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Errores en este paso:</h3>
                <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                  {currentStepErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Debug info (remover en producción) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <strong>Debug:</strong> Paso actual: {currentStep}, Puede proceder: {canProceedFromCurrentStep().toString()}
          </div>
        )}

        {/* Botones de navegación */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Anterior
            </button>
            
            <button
              type="button"
              onClick={() => {
                console.log('Botón siguiente clickeado')
                nextStep()
              }}
              disabled={!canProceedFromCurrentStep()}
              className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                canProceedFromCurrentStep()
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Siguiente
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        )}

        {currentStep === 0 && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={nextStep}
              className="btn-primary text-lg px-8 py-3"
            >
              Comenzar configuración
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedOnboarding