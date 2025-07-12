// src/contexts/OnboardingContext.tsx - VERSIÓN ALINEADA CON BACKEND REFACTORIZADO

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { OnboardingService } from '../services/onboardingService'

// Tipos alineados con el backend refactorizado
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
  planInfo: { id: string; name: string; price_monthly: number } | null
  
  // Métodos de navegación
  setCurrentStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  markStepCompleted: (step: number) => void
  navigateToCurrentStep: () => string
  
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
  const [planInfo, setPlanInfo] = useState<{ id: string; name: string; price_monthly: number } | null>(null)
  
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

  // Configuración de pasos - CORREGIDO para 6 pasos
  const totalSteps = 6
  
  // Mapeo de pasos a URLs - ACTUALIZADO
  const stepToUrlMap = {
    0: '/onboarding/plan',
    1: '/onboarding/register', 
    2: '/onboarding/team',
    3: '/onboarding/services',
    4: '/onboarding/organization',
    5: '/onboarding/welcome'
  }
  
  // Colores predefinidos para profesionales
  const professionalColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  // Clave para localStorage
  const STORAGE_KEY = 'onboarding_progress'

  // Guardar progreso en localStorage
  const saveProgress = useCallback(() => {
    if (!initialized) return
    
    const progressData = {
      currentStep,
      completedSteps,
      organizationData,
      professionals,
      services,
      registrationToken,
      planInfo,
      timestamp: Date.now()
    }
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressData))
      console.log('💾 Progreso guardado:', { currentStep, completedSteps: completedSteps.length })
    } catch (error) {
      console.error('Error guardando progreso:', error)
    }
  }, [currentStep, completedSteps, organizationData, professionals, services, registrationToken, planInfo, initialized])

  // Cargar progreso desde localStorage
  const loadProgress = useCallback(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      if (!savedData) return null
      
      const parsed = JSON.parse(savedData)
      
      // Verificar que los datos no sean muy antiguos (7 días)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      if (parsed.timestamp && parsed.timestamp < sevenDaysAgo) {
        console.log('🕐 Datos de onboarding obsoletos, limpiando...')
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      
      return parsed
    } catch (error) {
      console.error('Error cargando progreso:', error)
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  }, [])

  // Obtener URL del paso actual
  const navigateToCurrentStep = useCallback((): string => {
    return stepToUrlMap[currentStep as keyof typeof stepToUrlMap] || '/onboarding/plan'
  }, [currentStep])

  // Inicializar desde token de registro
  const initializeFromToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const status = await OnboardingService.checkRegistrationStatus(token)
      
      if (status.is_valid) {
        setRegistrationToken(token)
        setPlanInfo(status.selected_plan || null)
        console.log('✅ Token válido, datos cargados:', status)
        return true
      } else {
        console.log('❌ Token inválido o expirado')
        return false
      }
    } catch (error) {
      console.error('Error verificando token:', error)
      return false
    }
  }, [])

  // Inicialización - Cargar progreso guardado y token
  useEffect(() => {
    if (initialized) return

    console.log('🚀 Inicializando OnboardingContext...')
    
    // Cargar progreso guardado
        const savedProgress = loadProgress()
    if (savedProgress) {
      console.log('📄 Cargando progreso guardado:', savedProgress)
      setCurrentStep(savedProgress.currentStep || 0)
      setCompletedSteps(savedProgress.completedSteps || [])
      setOrganizationData(savedProgress.organizationData || organizationData)
      setProfessionals(savedProgress.professionals || [])
      setServices(savedProgress.services || [])
      setRegistrationToken(savedProgress.registrationToken || null)
      setPlanInfo(savedProgress.planInfo || null)
    }

    // Verificar token almacenado
    const storedToken = OnboardingService.getStoredToken()
    if (storedToken && !savedProgress?.registrationToken) {
      console.log('🔍 Verificando token almacenado...')
      initializeFromToken(storedToken)
    }

    setInitialized(true)
    console.log('✅ OnboardingContext inicializado')
  }, [loadProgress, initializeFromToken, organizationData, initialized])

  // Guardar progreso cuando cambien los datos
  useEffect(() => {
    if (initialized) {
        saveProgress()
    }
  }, [saveProgress, initialized])

  // Métodos de navegación
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      console.log('➡️ Avanzando al paso:', newStep)
    }
  }, [currentStep, totalSteps])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      console.log('⬅️ Retrocediendo al paso:', newStep)
    }
  }, [currentStep])

  const markStepCompleted = useCallback((step: number) => {
    setCompletedSteps(prev => {
      if (!prev.includes(step)) {
        const newCompleted = [...prev, step]
        console.log('✅ Paso completado:', step, 'Total completados:', newCompleted)
        return newCompleted
      }
      return prev
    })
  }, [])

  // Métodos de datos - Organización
  const updateOrganizationData = useCallback((data: Partial<OrganizationData>) => {
    setOrganizationData(prev => {
      const updated = { ...prev, ...data }
      console.log('🏢 Datos de organización actualizados:', data)
      return updated
    })
  }, [])

  // Métodos de datos - Profesionales
  const addProfessional = useCallback(() => {
    const newProfessional: ProfessionalData = {
      name: '',
      email: '',
      phone: '',
      specialty: '',
      color_code: professionalColors[professionals.length % professionalColors.length],
      accepts_walk_ins: true
    }
    
    setProfessionals(prev => {
      const updated = [...prev, newProfessional]
      console.log('👤 Profesional agregado, total:', updated.length)
      return updated
    })
  }, [professionals.length])

  const updateProfessional = useCallback((index: number, data: Partial<ProfessionalData>) => {
    setProfessionals(prev => {
      const updated = [...prev]
        updated[index] = { ...updated[index], ...data }
      console.log('👤 Profesional actualizado:', index, data)
      return updated
    })
  }, [])

  const removeProfessional = useCallback((index: number) => {
    setProfessionals(prev => {
      const updated = prev.filter((_, i) => i !== index)
      console.log('🗑️ Profesional eliminado:', index, 'Restantes:', updated.length)
      return updated
    })
  }, [])

  // Métodos de datos - Servicios
  const addService = useCallback((suggested?: Partial<ServiceData>) => {
    const newService: ServiceData = {
      name: '',
      description: '',
      category: '',
      duration_minutes: 60,
      price: 0,
      buffer_time_before: 0,
      buffer_time_after: 10,
      is_active: true,
      requires_preparation: false,
      ...suggested
    }
    
    setServices(prev => {
      const updated = [...prev, newService]
      console.log('🔧 Servicio agregado, total:', updated.length)
      return updated
    })
  }, [])

  const updateService = useCallback((index: number, data: Partial<ServiceData>) => {
    setServices(prev => {
      const updated = [...prev]
        updated[index] = { ...updated[index], ...data }
      console.log('🔧 Servicio actualizado:', index, data)
      return updated
    })
  }, [])

  const removeService = useCallback((index: number) => {
    setServices(prev => {
      const updated = prev.filter((_, i) => i !== index)
      console.log('🗑️ Servicio eliminado:', index, 'Restantes:', updated.length)
      return updated
    })
  }, [])

  const loadSuggestedServices = useCallback((industryType: string) => {
    const suggested = OnboardingService.getSuggestedServices(industryType)
    setServices(suggested)
    console.log('💡 Servicios sugeridos cargados para:', industryType, 'Cantidad:', suggested.length)
  }, [])

  // Validación
  const canProceedFromStep = useCallback((step: number): boolean => {
    switch (step) {
      case 0: // Plan selection
        return !!planInfo
      case 1: // Registration
        return !!registrationToken && !!planInfo
      case 2: // Team setup
        return professionals.length > 0 && professionals.every(p => p.name && p.email)
      case 3: // Services setup
        return services.length > 0 && services.every(s => s.name && s.price > 0 && s.duration_minutes > 0)
      case 4: // Organization config
        return !!(organizationData.name && organizationData.email && organizationData.phone)
      case 5: // Welcome/Complete
        return true
      default:
        return false
    }
  }, [planInfo, registrationToken, professionals, services, organizationData])

  const validateCurrentData = useCallback((): { isValid: boolean; errors: string[] } => {
    return OnboardingService.validateOnboardingData({
      organization: organizationData,
      professionals,
      services
    })
  }, [organizationData, professionals, services])

  // Completar onboarding - ALINEADO CON BACKEND
  const completeOnboarding = useCallback(async () => {
    if (!registrationToken) {
      throw new Error('No hay token de registro válido')
    }

    setIsCompleting(true)
    
    try {
      // Validar datos básicos antes de enviar
      if (!organizationData.name) {
        throw new Error('Falta el nombre de la organización')
      }
      if (!organizationData.email) {
        throw new Error('Falta el email de la organización')
      }
      if (!organizationData.phone) {
        throw new Error('Falta el teléfono de la organización')
      }
      if (professionals.length === 0) {
        throw new Error('Debe agregar al menos un profesional')
      }
      if (services.length === 0) {
        throw new Error('Debe agregar al menos un servicio')
      }

      // Preparar datos en el formato exacto que espera el backend
      const onboardingData = {
        registration_token: registrationToken,
        organization: {
          name: organizationData.name,
          industry_template: organizationData.industry_template,
          email: organizationData.email,
          phone: organizationData.phone,
          address: organizationData.address || '',
          city: organizationData.city || '',
          country: organizationData.country || 'Chile'
        },
        professionals: professionals.map(prof => ({
          name: prof.name,
          email: prof.email,
          phone: prof.phone || '',
          specialty: prof.specialty || '',
          color_code: prof.color_code || '#4CAF50',
          accepts_walk_ins: prof.accepts_walk_ins !== undefined ? prof.accepts_walk_ins : true
        })),
        services: services.map(serv => ({
          name: serv.name,
          description: serv.description || '',
          category: serv.category || '',
          duration_minutes: serv.duration_minutes,
          price: serv.price,
          buffer_time_before: serv.buffer_time_before || 0,
          buffer_time_after: serv.buffer_time_after || 10,
          is_active: serv.is_active !== undefined ? serv.is_active : true,
          requires_preparation: serv.requires_preparation !== undefined ? serv.requires_preparation : false
        }))
      }

      console.log('🚀 Enviando datos de onboarding al backend:', JSON.stringify(onboardingData, null, 2))
      
      const result = await OnboardingService.completeOnboarding(onboardingData)
      
      console.log('✅ Onboarding completado exitosamente:', result)
      
      // Limpiar datos temporales y progreso guardado
      OnboardingService.clearOnboardingData()
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('team_setup_data')
      localStorage.removeItem('registration_form_data')
      localStorage.removeItem('selected_plan_data')
      console.log('🗑️ Progreso limpiado después de completar onboarding')
      
      markStepCompleted(currentStep)
    } catch (error) {
      console.error('❌ Error completando onboarding:', error)
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
    localStorage.removeItem(STORAGE_KEY)
    console.log('🔄 Onboarding reseteado completamente')
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
    navigateToCurrentStep,
    
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