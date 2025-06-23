// src/contexts/OnboardingContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react'
import { OnboardingService, OnboardingData, OrganizationCreateData, ProfessionalCreateData, ServiceCreateData } from '../services/onboardingService'

interface OnboardingContextType {
  // Estado del onboarding
  currentStep: number
  completedSteps: number[]
  isCompleting: boolean
  
  // Datos del onboarding
  organizationData: OrganizationCreateData
  professionals: ProfessionalCreateData[]
  services: ServiceCreateData[]
  
  // Métodos de navegación
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  markStepCompleted: (step: number) => void
  
  // Métodos de datos
  updateOrganizationData: (data: Partial<OrganizationCreateData>) => void
  addProfessional: () => void
  updateProfessional: (index: number, data: Partial<ProfessionalCreateData>) => void
  removeProfessional: (index: number) => void
  addService: (suggested?: Partial<ServiceCreateData>) => void
  updateService: (index: number, data: Partial<ServiceCreateData>) => void
  removeService: (index: number) => void
  loadSuggestedServices: (industryType: string) => void
  
  // Validación y finalización
  canProceedFromStep: (step: number) => boolean
  validateCurrentData: () => { isValid: boolean; errors: string[] }
  completeOnboarding: () => Promise<void>
  
  // Reset
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

interface OnboardingProviderProps {
  children: ReactNode
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  // Estados principales
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  
  // Datos del onboarding
  const [organizationData, setOrganizationData] = useState<OrganizationCreateData>({
    name: '',
    industry_template: 'salon',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Chile',
    settings: {}
  })
  
  const [professionals, setProfessionals] = useState<ProfessionalCreateData[]>([])
  const [services, setServices] = useState<ServiceCreateData[]>([])

  // Configuración de pasos
  const totalSteps = 6 // 0: Welcome, 1: Org, 2: Professionals, 3: Services, 4: Config, 5: Complete
  
  // Colores predefinidos para profesionales
  const professionalColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  // Métodos de navegación
  const nextStep = () => {
    if (currentStep < totalSteps - 1 && canProceedFromStep(currentStep)) {
      markStepCompleted(currentStep)
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const markStepCompleted = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step])
    }
  }

  // Métodos de datos de organización
  const updateOrganizationData = (data: Partial<OrganizationCreateData>) => {
    setOrganizationData(prev => ({ ...prev, ...data }))
  }

  // Métodos de profesionales
  const addProfessional = () => {
    const newProfessional: ProfessionalCreateData = {
      name: '',
      email: '',
      phone: '',
      specialty: '',
      license_number: '',
      bio: '',
      color_code: professionalColors[professionals.length % professionalColors.length],
      is_active: true,
      accepts_walk_ins: true
    }
    setProfessionals([...professionals, newProfessional])
  }

  const updateProfessional = (index: number, data: Partial<ProfessionalCreateData>) => {
    const updated = [...professionals]
    updated[index] = { ...updated[index], ...data }
    setProfessionals(updated)
  }

  const removeProfessional = (index: number) => {
    setProfessionals(professionals.filter((_, i) => i !== index))
  }

  // Métodos de servicios
  const addService = (suggested?: Partial<ServiceCreateData>) => {
    const newService: ServiceCreateData = {
      name: suggested?.name || '',
      description: suggested?.description || '',
      category: suggested?.category || '',
      duration_minutes: suggested?.duration_minutes || 30,
      price: suggested?.price || 0,
      buffer_time_before: suggested?.buffer_time_before || 0,
      buffer_time_after: suggested?.buffer_time_after || 10,
      is_active: suggested?.is_active ?? true,
      requires_preparation: suggested?.requires_preparation ?? false,
      professionals: []
    }
    setServices([...services, newService])
  }

  const updateService = (index: number, data: Partial<ServiceCreateData>) => {
    const updated = [...services]
    updated[index] = { ...updated[index], ...data }
    setServices(updated)
  }

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index))
  }

  const loadSuggestedServices = (industryType: string) => {
    const suggested = OnboardingService.getSuggestedServices(industryType)
    setServices(suggested.map(s => ({
      name: s.name || '',
      description: s.description || '',
      category: s.category || '',
      duration_minutes: s.duration_minutes || 30,
      price: s.price || 0,
      buffer_time_before: s.buffer_time_before || 0,
      buffer_time_after: s.buffer_time_after || 10,
      is_active: s.is_active ?? true,
      requires_preparation: s.requires_preparation ?? false,
      professionals: []
    })))
  }

  // Validación
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: // Welcome
        return true
      case 1: // Organization
        return !!(organizationData.name?.trim() && 
                 organizationData.email?.trim() && 
                 organizationData.phone?.trim())
      case 2: // Professionals
        return professionals.length > 0 && 
               professionals.every(p => p.name?.trim() && p.email?.trim())
      case 3: // Services
        return services.length > 0 && 
               services.every(s => s.name?.trim() && s.price > 0 && s.duration_minutes > 0)
      case 4: // Configuration
        return true
      case 5: // Complete
        return true
      default:
        return false
    }
  }

  const validateCurrentData = () => {
    const onboardingData: OnboardingData = {
      organization: organizationData,
      professionals,
      services,
      settings: OnboardingService.getIndustryTemplate(organizationData.industry_template)
    }
    return OnboardingService.validateOnboardingData(onboardingData)
  }

  // Finalización del onboarding
  const completeOnboarding = async () => {
    setIsCompleting(true)
    try {
      const onboardingData: OnboardingData = {
        organization: {
          ...organizationData,
          settings: OnboardingService.getIndustryTemplate(organizationData.industry_template)
        },
        professionals,
        services,
        settings: OnboardingService.getIndustryTemplate(organizationData.industry_template)
      }

      const result = await OnboardingService.completeOnboarding(onboardingData)
      
      if (result.success) {
        markStepCompleted(currentStep)
        // Redirigir al dashboard o mostrar éxito
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    } finally {
      setIsCompleting(false)
    }
  }

  // Reset del onboarding
  const resetOnboarding = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    setIsCompleting(false)
    setOrganizationData({
      name: '',
      industry_template: 'salon',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Chile',
      settings: {}
    })
    setProfessionals([])
    setServices([])
  }

  const value: OnboardingContextType = {
    // Estado
    currentStep,
    completedSteps,
    isCompleting,
    
    // Datos
    organizationData,
    professionals,
    services,
    
    // Navegación
    setCurrentStep,
    nextStep,
    prevStep,
    markStepCompleted,
    
    // Métodos de datos
    updateOrganizationData,
    addProfessional,
    updateProfessional,
    removeProfessional,
    addService,
    updateService,
    removeService,
    loadSuggestedServices,
    
    // Validación y finalización
    canProceedFromStep,
    validateCurrentData,
    completeOnboarding,
    
    // Reset
    resetOnboarding
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

// Hook personalizado
export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding debe ser usado dentro de un OnboardingProvider')
  }
  return context
}

// Hook para verificar si el usuario necesita onboarding
export const useOnboardingStatus = () => {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
    try {
      // Verificar si la organización ya está configurada
      const orgResponse = await fetch('/api/organizations/me/')
      
      if (orgResponse.ok) {
        const orgData = await orgResponse.json()
        
        // Verificar si tiene profesionales y servicios
        const [profResponse, servResponse] = await Promise.all([
          fetch('/api/organizations/professionals/'),
          fetch('/api/organizations/services/')
        ])
        
        if (profResponse.ok && servResponse.ok) {
          const [professionals, services] = await Promise.all([
            profResponse.json(),
            servResponse.json()
          ])
          
          // Si tiene organización, profesionales y servicios, no necesita onboarding
          const hasCompleteSetup = orgData && 
                                  professionals.results?.length > 0 && 
                                  services.results?.length > 0
          
          setNeedsOnboarding(!hasCompleteSetup)
        } else {
          setNeedsOnboarding(true)
        }
      } else {
        setNeedsOnboarding(true)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setNeedsOnboarding(true)
    } finally {
      setLoading(false)
    }
  }

  return { needsOnboarding, loading, recheckOnboardingStatus: checkOnboardingStatus }
}