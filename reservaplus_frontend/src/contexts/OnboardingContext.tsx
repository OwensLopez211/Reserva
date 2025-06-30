// src/contexts/OnboardingContext.tsx - VERSIÓN CON PERSISTENCIA COMPLETA

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

interface TeamMemberData {
  name: string
  email: string
  phone: string
  role: 'owner' | 'professional' | 'reception' | 'staff'
  specialty?: string
  is_professional: boolean
  color_code: string
  accepts_walk_ins: boolean
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
  navigateToCurrentStep: () => string // Nuevo método para obtener la URL del paso actual
  
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

  // Configuración de pasos
  const totalSteps = 5
  
  // Mapeo de pasos a URLs
  const stepToUrlMap = {
    0: '/onboarding/plan',
    1: '/onboarding/register', 
    2: '/onboarding/team',
    3: '/onboarding/services',
    4: '/onboarding/complete'
  }
  
  // Colores predefinidos para profesionales
  const professionalColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  // Clave para localStorage
  const STORAGE_KEY = 'onboarding_progress'

  // Guardar progreso en localStorage - mejorado
  const saveProgress = useCallback(() => {
    if (!initialized) return // No guardar hasta que esté inicializado
    
    const progressData = {
      currentStep,
      completedSteps,
      organizationData,
      professionals,
      services,
      registrationToken,
      planInfo,
      timestamp: Date.now() // Para detectar datos obsoletos
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

  // Inicializar desde token de registro - usando useCallback
  const initializeFromToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      const status = await OnboardingService.checkRegistrationStatus(token)
      
      if (status.is_valid) {
        setRegistrationToken(token)
        setPlanInfo(status.selected_plan || null)
        
        // Cargar progreso guardado si existe
        const savedProgress = loadProgress()
        if (savedProgress) {
          console.log('📂 Cargando progreso guardado:', savedProgress.currentStep)
          
          if (savedProgress.organizationData) setOrganizationData(savedProgress.organizationData)
          if (savedProgress.professionals) setProfessionals(savedProgress.professionals)
          if (savedProgress.services) setServices(savedProgress.services)
          if (savedProgress.currentStep !== undefined) setCurrentStep(savedProgress.currentStep)
          if (savedProgress.completedSteps) setCompletedSteps(savedProgress.completedSteps)
        }
        
        // También cargar datos de la organización desde el registro si no están en el progreso
        const registrationData = localStorage.getItem('registration_form_data')
        if (registrationData && (!savedProgress?.organizationData?.name)) {
          try {
            const regData = JSON.parse(registrationData)
            console.log('📋 Cargando datos de organización del registro:', regData)
            
            if (regData.formData?.organizationName) {
              setOrganizationData({
                name: regData.formData.organizationName,
                industry_template: regData.industryTemplate || 'salon',
                email: regData.businessInfo?.email || regData.formData?.businessEmail || '',
                phone: regData.businessInfo?.phone || regData.formData?.businessPhone || '',
                address: regData.businessInfo?.address || regData.formData?.address || '',
                city: regData.businessInfo?.city || regData.formData?.city || '',
                country: regData.businessInfo?.country || regData.formData?.country || 'Chile'
              })
            }
          } catch (error) {
            console.error('Error cargando datos de registro:', error)
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
  }, [loadProgress])

  // Inicializar desde localStorage al cargar - SOLO UNA VEZ
  useEffect(() => {
    if (!initialized) {
      const token = OnboardingService.getStoredToken()
      if (token) {
        initializeFromToken(token)
      } else {
        // Si no hay token, intentar cargar progreso local de todas formas
        const savedProgress = loadProgress()
        if (savedProgress && savedProgress.registrationToken) {
          initializeFromToken(savedProgress.registrationToken)
        } else {
          // Cargar datos de organización desde el registro si están disponibles
          const registrationData = localStorage.getItem('registration_form_data')
          if (registrationData) {
            try {
              const regData = JSON.parse(registrationData)
              console.log('📋 Cargando datos de organización del registro (sin token):', regData)
              
              if (regData.formData?.organizationName) {
                setOrganizationData({
                  name: regData.formData.organizationName,
                  industry_template: regData.industryTemplate || 'salon',
                  email: regData.businessInfo?.email || regData.formData?.businessEmail || '',
                  phone: regData.businessInfo?.phone || regData.formData?.businessPhone || '',
                  address: regData.businessInfo?.address || regData.formData?.address || '',
                  city: regData.businessInfo?.city || regData.formData?.city || '',
                  country: regData.businessInfo?.country || regData.formData?.country || 'Chile'
                })
              }
            } catch (error) {
              console.error('Error cargando datos de registro (sin token):', error)
            }
          }
          setInitialized(true)
        }
      }
    }
  }, [initialized, initializeFromToken, loadProgress])

  // Auto-guardar cuando cambian los datos importantes
  useEffect(() => {
    if (initialized) {
      const timeoutId = setTimeout(() => {
        saveProgress()
      }, 500) // Debounce de 500ms
      
      return () => clearTimeout(timeoutId)
    }
  }, [initialized, currentStep, completedSteps, organizationData, professionals, services, saveProgress])

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
    }
  }, [currentStep, totalSteps, canProceedFromStep, completedSteps])

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }, [currentStep])

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
      // Cargar datos del equipo desde localStorage
      const teamSetupData = localStorage.getItem('team_setup_data')
      let teamMembers: TeamMemberData[] = []
      
      console.log('📂 Datos raw de localStorage team_setup_data:', teamSetupData)
      
      if (teamSetupData) {
        const parsedTeamData = JSON.parse(teamSetupData)
        console.log('📋 Datos parseados del equipo:', parsedTeamData)
        teamMembers = parsedTeamData.teamMembers || []
      } else {
        console.warn('⚠️ No se encontraron datos del equipo en localStorage')
      }

      console.log('👥 TeamMembers encontrados:', teamMembers)

      // Filtrar solo los miembros que NO son owner (ya que el owner se crea automáticamente en el backend)
      const professionalMembers = teamMembers.filter((member: TeamMemberData) => member.role !== 'owner')
      console.log('👨‍💼 Professional members (sin owner):', professionalMembers)

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
      if (services.length === 0) {
        throw new Error('Debe agregar al menos un servicio')
      }

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
        professionals: professionalMembers.map((member: TeamMemberData) => ({
          name: member.name,
          email: member.email,
          phone: member.phone || '',
          role: member.role, // Incluir el rol específico (professional, reception, staff)
          specialty: member.specialty || '',
          color_code: member.color_code || '#4CAF50',
          is_professional: member.is_professional || false,
          accepts_walk_ins: member.accepts_walk_ins || false
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

      console.log('🚀 Datos finales a enviar al backend:', JSON.stringify(onboardingData, null, 2))
      await OnboardingService.completeOnboarding(onboardingData)
      
      // Limpiar datos temporales y progreso guardado
      OnboardingService.clearOnboardingData()
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem('team_setup_data')
      localStorage.removeItem('registration_form_data')
      localStorage.removeItem('selected_plan_data')
      console.log('🗑️ Progreso limpiado después de completar onboarding')
      
      markStepCompleted(currentStep)
    } catch (error) {
      console.error('Error completando onboarding:', error)
      throw error
    } finally {
      setIsCompleting(false)
    }
  }, [registrationToken, organizationData, services, markStepCompleted, currentStep])

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