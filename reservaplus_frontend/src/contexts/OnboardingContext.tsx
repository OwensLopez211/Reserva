// src/contexts/OnboardingContext.tsx - SIN LOOPS INFINITOS

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { OnboardingService } from '../services/onboardingService'

// Tipos alineados con el backend
interface OrganizationData {
  name: string
  industry_template: string
  email: string
  phone: string
  address?: string
  city?: string
  country: string
}

interface ProfessionalData {
  name: string
  email: string
  phone?: string
  specialty?: string
  color_code: string
  accepts_walk_ins: boolean
}

interface ServiceData {
  name: string
  description?: string
  category?: string
  duration_minutes: number
  price: number
  buffer_time_before?: number
  buffer_time_after?: number
  is_active: boolean
  requires_preparation: boolean
}

interface OnboardingContextType {
  // Estado del flujo
  currentStep: number
  completedSteps: number[]
  isCompleting: boolean
  
  // Datos del onboarding
  organizationData: OrganizationData
  professionals: ProfessionalData[]
  services: ServiceData[]
  
  // Información del registro
  registrationToken: string | null
  planInfo: any
  
  // Métodos de navegación
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  markStepCompleted: (step: number) => void
  
  // Métodos de datos
  updateOrganizationData: (data: Partial<OrganizationData>) => void
  addProfessional: () => void
  updateProfessional: (index: number, data: Partial<ProfessionalData>) => void
  removeProfessional: (index: number) => void
  addService: (suggested?: Partial<ServiceData>) => void
  updateService: (index: number, data: Partial<ServiceData>) => void
  removeService: (index: number) => void
  loadSuggestedServices: (industryType: string) => void
  
  // Validación y finalización
  canProceedFromStep: (step: number) => boolean
  validateCurrentData: () => { isValid: boolean; errors: string[] }
  completeOnboarding: () => Promise<void>
  
  // Reset y manejo de token
  resetOnboarding: () => void
  initializeFromToken: (token: string) => Promise<boolean>
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
  
  // Token de registro
  const [registrationToken, setRegistrationToken] = useState<string | null>(null)
  const [planInfo, setPlanInfo] = useState<any>(null)
  
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

  // Flag para evitar inicialización múltiple
  const [initialized, setInitialized] = useState(false)

  // Configuración de pasos
  const totalSteps = 6
  
  // Colores predefinidos para profesionales
  const professionalColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  // Guardar progreso en localStorage - usando useCallback para evitar recreación
  const saveProgress = useCallback(() => {
    const progressData = {
      currentStep,
      completedSteps,
      organizationData,
      professionals,
      services
    }
    localStorage.setItem('onboarding_progress', JSON.stringify(progressData))
  }, [currentStep, completedSteps, organizationData, professionals, services])

  // Inicializar desde token de registro - usando useCallback
  const initializeFromToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const status = await OnboardingService.checkRegistrationStatus(token)
      
      if (status.is_valid) {
        setRegistrationToken(token)
        setPlanInfo(status.selected_plan)
        
        // Cargar datos guardados si existen
        const savedData = localStorage.getItem('onboarding_progress')
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData)
            
            if (parsed.organizationData) setOrganizationData(parsed.organizationData)
            if (parsed.professionals) setProfessionals(parsed.professionals)
            if (parsed.services) setServices(parsed.services)
            if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep)
            if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps)
          } catch (e) {
            console.error('Error parsing saved progress:', e)
          }
        }
        
        setInitialized(true)
        return true
      } else {
        OnboardingService.clearOnboardingData()
        setRegistrationToken(null)
        setInitialized(true)
        return false
      }
    } catch (error) {
      console.error('Error al inicializar desde token:', error)
      setInitialized(true)
      return false
    }
  }, [])

  // Inicializar desde localStorage al cargar - SOLO UNA VEZ
  useEffect(() => {
    if (!initialized) {
      const token = OnboardingService.getStoredToken()
      if (token) {
        initializeFromToken(token)
      } else {
        setInitialized(true)
      }
    }
  }, [initialized, initializeFromToken])

  // Validación usando useCallback para evitar recreación constante
  const canProceedFromStep = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Plan selection
        return !!registrationToken
        
      case 1: // Registration
        return !!registrationToken
        
      case 2: // Team
        if (professionals.length === 0) {
          return false
        }
        
        return professionals.every((p) => {
          const hasRequired = !!(p.name?.trim() && p.email?.trim() && p.phone?.trim())
          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '')
          return hasRequired && isValidEmail
        })
        
      case 3: // Services
        return services.length > 0 && 
               services.every(s => s.name?.trim() && s.price > 0 && s.duration_minutes > 0)
               
      case 4: // Complete
        return true
        
      case 5: // Welcome
        return true
        
      default:
        return false
    }
  }, [registrationToken, professionals, services])

  // Métodos de navegación usando useCallback
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1 && canProceedFromStep(currentStep)) {
      const newCompletedSteps = [...completedSteps]
      if (!newCompletedSteps.includes(currentStep)) {
        newCompletedSteps.push(currentStep)
      }
      
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      setCompletedSteps(newCompletedSteps)
      
      // Guardar después de actualizar el estado
      setTimeout(() => {
        saveProgress()
      }, 100)
    }
  }, [currentStep, totalSteps, canProceedFromStep, completedSteps, saveProgress])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setTimeout(() => {
        saveProgress()
      }, 100)
    }
  }, [currentStep, saveProgress])

  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps(prev => {
      if (!prev.includes(step)) {
        const newCompleted = [...prev, step]
        return newCompleted
      }
      return prev
    })
  }, [])

  // Métodos de datos usando useCallback
  const updateOrganizationData = useCallback((data: Partial<OrganizationData>) => {
    setOrganizationData(prev => ({ ...prev, ...data }))
  }, [])

  const addProfessional = useCallback(() => {
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

  const updateProfessional = useCallback((index: number, data: Partial<ProfessionalData>) => {
    setProfessionals(prev => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { ...updated[index], ...data }
      }
      return updated
    })
  }, [])

  const removeProfessional = useCallback((index: number) => {
    setProfessionals(prev => prev.filter((_, i) => i !== index))
  }, [])

  const addService = useCallback((suggested?: Partial<ServiceData>) => {
    const newService: ServiceData = {
      name: suggested?.name || '',
      description: suggested?.description || '',
      category: suggested?.category || '',
      duration_minutes: suggested?.duration_minutes || 30,
      price: suggested?.price || 0,
      buffer_time_before: suggested?.buffer_time_before || 0,
      buffer_time_after: suggested?.buffer_time_after || 10,
      is_active: suggested?.is_active ?? true,
      requires_preparation: suggested?.requires_preparation ?? false
    }
    setServices(prev => [...prev, newService])
  }, [])

  const updateService = useCallback((index: number, data: Partial<ServiceData>) => {
    setServices(prev => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { ...updated[index], ...data }
      }
      return updated
    })
  }, [])

  const removeService = useCallback((index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index))
  }, [])

  const loadSuggestedServices = useCallback((industryType: string) => {
    const suggested = OnboardingService.getSuggestedServices(industryType)
    setServices(suggested)
  }, [])

  const validateCurrentData = useCallback(() => {
    return OnboardingService.validateOnboardingData({
      organization: organizationData,
      professionals,
      services
    })
  }, [organizationData, professionals, services])

  // Finalización del onboarding
  const completeOnboarding = useCallback(async () => {
    if (!registrationToken) {
      throw new Error('No se encontró token de registro')
    }

    setIsCompleting(true)
    try {
      const onboardingData = {
        registration_token: registrationToken,
        organization: organizationData,
        professionals: professionals.map(prof => ({
          name: prof.name,
          email: prof.email,
          phone: prof.phone || '',
          specialty: prof.specialty || '',
          color_code: prof.color_code,
          accepts_walk_ins: prof.accepts_walk_ins
        })),
        services: services.map(serv => ({
          name: serv.name,
          description: serv.description || '',
          category: serv.category || '',
          duration_minutes: serv.duration_minutes,
          price: serv.price,
          buffer_time_before: serv.buffer_time_before || 0,
          buffer_time_after: serv.buffer_time_after || 10,
          is_active: serv.is_active,
          requires_preparation: serv.requires_preparation
        }))
      }

      const result = await OnboardingService.completeOnboarding(onboardingData)
      
      // Limpiar datos temporales
      OnboardingService.clearOnboardingData()
      markStepCompleted(currentStep)
      
      return result
    } catch (error) {
      console.error('Error completando onboarding:', error)
      throw error
    } finally {
      setIsCompleting(false)
    }
  }, [registrationToken, organizationData, professionals, services, markStepCompleted, currentStep])

  // Reset del onboarding
  const resetOnboarding = useCallback(() => {
    setCurrentStep(0)
    setCompletedSteps([])
    setIsCompleting(false)
    setRegistrationToken(null)
    setPlanInfo(null)
    setOrganizationData({
      name: '',
      industry_template: 'salon',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Chile'
    })
    setProfessionals([])
    setServices([])
    setInitialized(false)
    OnboardingService.clearOnboardingData()
  }, [])

  const value: OnboardingContextType = {
    // Estado
    currentStep,
    completedSteps,
    isCompleting,
    
    // Datos
    organizationData,
    professionals,
    services,
    registrationToken,
    planInfo,
    
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
    
    // Reset y token
    resetOnboarding,
    initializeFromToken
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
    let isMounted = true
    
    const checkOnboardingStatus = async () => {
      try {
        setLoading(true)
        
        const status = await OnboardingService.checkOnboardingStatus()
        
        if (isMounted) {
          setNeedsOnboarding(status.needsOnboarding)
        }
        
      } catch (error) {
        console.error('Error checking onboarding status:', error)
        if (isMounted) {
          setNeedsOnboarding(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkOnboardingStatus()

    return () => {
      isMounted = false
    }
  }, [])

  const recheckOnboardingStatus = useCallback(async () => {
    try {
      setLoading(true)
      const status = await OnboardingService.checkOnboardingStatus()
      setNeedsOnboarding(status.needsOnboarding)
    } catch (error) {
      console.error('Error checking onboarding status:', error)
      setNeedsOnboarding(true)
    } finally {
      setLoading(false)
    }
  }, [])

  return { needsOnboarding, loading, recheckOnboardingStatus }
}