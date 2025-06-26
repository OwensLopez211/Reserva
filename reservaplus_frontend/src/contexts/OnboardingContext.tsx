// src/contexts/OnboardingContext.tsx - VERSIÓN CORREGIDA Y ALINEADA

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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

  // Configuración de pasos
  const totalSteps = 6 // 0: Plan, 1: Register, 2: Team, 3: Organization, 4: Payment, 5: Welcome
  
  // Colores predefinidos para profesionales
  const professionalColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  // Inicializar desde localStorage al cargar
  useEffect(() => {
    const token = OnboardingService.getStoredToken()
    if (token) {
      initializeFromToken(token)
    }
  }, [])

  // Inicializar desde token de registro
  const initializeFromToken = async (token: string): Promise<boolean> => {
    try {
      const status = await OnboardingService.checkRegistrationStatus(token)
      
      if (status.is_valid) {
        setRegistrationToken(token)
        setPlanInfo(status.selected_plan)
        
        // Cargar datos guardados si existen
        const savedData = localStorage.getItem('onboarding_progress')
        if (savedData) {
          const parsed = JSON.parse(savedData)
          if (parsed.organizationData) setOrganizationData(parsed.organizationData)
          if (parsed.professionals) setProfessionals(parsed.professionals)
          if (parsed.services) setServices(parsed.services)
          if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep)
          if (parsed.completedSteps) setCompletedSteps(parsed.completedSteps)
        }
        
        return true
      } else {
        // Token inválido, limpiar
        OnboardingService.clearOnboardingData()
        setRegistrationToken(null)
        return false
      }
    } catch (error) {
      console.error('Error al inicializar desde token:', error)
      return false
    }
  }

  // Guardar progreso en localStorage
  const saveProgress = () => {
    const progressData = {
      currentStep,
      completedSteps,
      organizationData,
      professionals,
      services
    }
    localStorage.setItem('onboarding_progress', JSON.stringify(progressData))
  }

  // Métodos de navegación
  const nextStep = () => {
    if (currentStep < totalSteps - 1 && canProceedFromStep(currentStep)) {
      markStepCompleted(currentStep)
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      saveProgress()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      saveProgress()
    }
  }

  const markStepCompleted = (step: number) => {
    if (!completedSteps.includes(step)) {
      const newCompleted = [...completedSteps, step]
      setCompletedSteps(newCompleted)
      saveProgress()
    }
  }

  // Métodos de datos de organización
  const updateOrganizationData = (data: Partial<OrganizationData>) => {
    const newData = { ...organizationData, ...data }
    setOrganizationData(newData)
    saveProgress()
  }

  // Métodos de profesionales
  const addProfessional = () => {
    const newProfessional: ProfessionalData = {
      name: '',
      email: '',
      phone: '',
      specialty: '',
      color_code: professionalColors[professionals.length % professionalColors.length],
      accepts_walk_ins: true
    }
    const newProfessionals = [...professionals, newProfessional]
    setProfessionals(newProfessionals)
    saveProgress()
  }

  const updateProfessional = (index: number, data: Partial<ProfessionalData>) => {
    const updated = [...professionals]
    updated[index] = { ...updated[index], ...data }
    setProfessionals(updated)
    saveProgress()
  }

  const removeProfessional = (index: number) => {
    const filtered = professionals.filter((_, i) => i !== index)
    setProfessionals(filtered)
    saveProgress()
  }

  // Métodos de servicios
  const addService = (suggested?: Partial<ServiceData>) => {
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
    const newServices = [...services, newService]
    setServices(newServices)
    saveProgress()
  }

  const updateService = (index: number, data: Partial<ServiceData>) => {
    const updated = [...services]
    updated[index] = { ...updated[index], ...data }
    setServices(updated)
    saveProgress()
  }

  const removeService = (index: number) => {
    const filtered = services.filter((_, i) => i !== index)
    setServices(filtered)
    saveProgress()
  }

  const loadSuggestedServices = (industryType: string) => {
    const suggested = OnboardingService.getSuggestedServices(industryType)
    setServices(suggested)
    saveProgress()
  }

  // Validación
  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: // Plan selection
        return !!registrationToken
      case 1: // Registration - ya debería estar validado por el token
        return !!registrationToken
      case 2: // Team
        return professionals.length > 0 && 
               professionals.every(p => p.name?.trim() && p.email?.trim())
      case 3: // Organization
        return !!(organizationData.name?.trim() && 
                 organizationData.email?.trim() && 
                 organizationData.phone?.trim())
      case 4: // Payment
        return true // El pago se maneja en el servidor
      case 5: // Welcome
        return true
      default:
        return false
    }
  }

  const validateCurrentData = () => {
    return OnboardingService.validateOnboardingData({
      organization: organizationData,
      professionals,
      services
    })
  }

  // Finalización del onboarding
  const completeOnboarding = async () => {
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

      console.log('🔄 Completando onboarding:', onboardingData)
      const result = await OnboardingService.completeOnboarding(onboardingData)
      
      console.log('✅ Onboarding completado:', result)
      
      // Limpiar datos temporales
      OnboardingService.clearOnboardingData()
      markStepCompleted(currentStep)
      
      return result
    } catch (error) {
      console.error('❌ Error completando onboarding:', error)
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
    OnboardingService.clearOnboardingData()
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
    checkOnboardingStatus()
  }, [])

  const checkOnboardingStatus = async () => {
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
  }

  return { needsOnboarding, loading, recheckOnboardingStatus: checkOnboardingStatus }
}