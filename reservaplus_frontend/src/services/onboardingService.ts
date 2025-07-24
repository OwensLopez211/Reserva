// src/services/onboardingService.ts - VERSIÓN ALINEADA CON AWS LAMBDA

import { NativeCognitoService } from './nativeCognitoService'

// Interfaces que coinciden exactamente con el backend refactorizado
export interface OnboardingCompleteData {
  registration_token: string
  organization: {
    name: string
    industry_template: string
    email: string
    phone: string
    address?: string
    city?: string
    country: string
  }
  professionals: Array<{
    name: string
    email: string
    phone?: string
    specialty?: string
    color_code: string
    accepts_walk_ins: boolean
  }>
  services: Array<{
    name: string
    description?: string
    category?: string
    duration_minutes: number
    price: number
    buffer_time_before?: number
    buffer_time_after?: number
    is_active: boolean
    requires_preparation: boolean
  }>
}

export interface OnboardingCompleteResponse {
  message: string
  data: {
    organization: {
      id: string
      name: string
      industry_template: string
    }
    user: {
      id: string
      email: string
      full_name: string
    }
    subscription: {
      plan: string
      status: string
      trial_end: string
    }
    team_members: Array<{
      id: string
      name: string
      email: string
      role: string
    }>
    professionals: Array<{
      id: string
      name: string
      email: string
    }>
    services: Array<{
      id: string
      name: string
      price: number
      duration_minutes: number
    }>
  }
}

// Interfaz para el signup inicial
export interface SignupData {
  email: string
  plan_id: string
  user_data: {
    first_name: string
    last_name: string
    organization_name?: string
    password: string
  }
}

export interface SignupResponse {
  message: string
  registration_token: string
  expires_at: string
  selected_plan: {
    id: string
    name: string
    price_monthly: number
  }
  next_step: string
}

export class OnboardingService {
  private static API_BASE = import.meta.env.VITE_API_GATEWAY_URL;
  private static cognitoService = new NativeCognitoService();
  
  /**
   * PASO 1: Iniciar el proceso de signup con plan seleccionado
   */
  static async startSignup(planId: string, userData: {
    email: string
    first_name: string
    last_name: string
    organization_name: string
    password: string
  }): Promise<SignupResponse> {
    try {
      const signupData = {
        email: userData.email,
        plan_id: planId,
        user_data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          organization_name: userData.organization_name,
          password: userData.password
        }
      }

      console.log('🚀 Iniciando signup con AWS Lambda:', signupData)
      
      const response = await fetch(`${this.API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(signupData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Signup failed')
      }
      
      const data = await response.json()
      console.log('✅ Signup exitoso:', data)
      
      // Guardar token temporal en localStorage
      localStorage.setItem('registration_token', data.registration_token)
      localStorage.setItem('signup_data', JSON.stringify(data))
      
      return data
    } catch (error: unknown) {
      console.error('❌ Error en signup:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error al iniciar el registro')
    }
  }

  /**
   * PASO 2: Completar todo el onboarding usando el endpoint refactorizado
   */
  static async completeOnboarding(data: OnboardingCompleteData): Promise<OnboardingCompleteResponse> {
    try {
      console.log('🔄 Completando onboarding con AWS Lambda:', JSON.stringify(data, null, 2))
      
      const response = await fetch(`${this.API_BASE}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Onboarding completion failed')
      }
      
      const responseData = await response.json()
      console.log('✅ Onboarding completado exitosamente:', responseData)
      
      // Limpiar datos temporales
      localStorage.removeItem('registration_token')
      localStorage.removeItem('signup_data')
      localStorage.removeItem('onboarding_progress')
      localStorage.removeItem('plan_selection')
      
      return responseData
    } catch (error: unknown) {
      console.error('❌ Error completando onboarding:', error)
      
      if (error instanceof Error) {
        throw error
      }
      
      throw new Error('Error de conexión al completar el onboarding')
    }
  }

  /**
   * Validar datos antes de enviar al backend
   */
  static async validateOnboarding(data: OnboardingCompleteData): Promise<{
    is_valid: boolean
    errors?: string[]
  }> {
    try {
      console.log('🔍 Validando datos de onboarding...')
      
      // Usar el endpoint de validación del backend refactorizado
      const response = await api.post('/api/onboarding/validate/', data)
      
      console.log('✅ Validación exitosa:', response.data)
      return response.data
    } catch (error: unknown) {
      console.error('❌ Error en validación:', error)
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { 
          response?: { 
            data?: { 
              is_valid?: boolean
              errors?: string[]
              error?: string
            }
            status?: number
          } 
        }
        
        if (errObj.response?.data?.is_valid !== undefined) {
          return {
            is_valid: errObj.response.data.is_valid,
            errors: errObj.response.data.errors || []
          }
        }
        
        if (errObj.response?.data?.error) {
          return {
            is_valid: false,
            errors: [errObj.response.data.error]
          }
        }
      }
      
      return {
        is_valid: false,
        errors: ['Error al validar los datos']
      }
    }
  }

  /**
   * Verificar estado del token de registro
   */
  static async checkRegistrationStatus(token: string): Promise<{
    is_valid: boolean
    selected_plan?: {
      id: string
      name: string
      price_monthly: number
    }
    expires_at?: string
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/registration/${token}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to check registration status')
      }
      
      return response.json()
    } catch (error) {
      console.error('Error verificando estado de registro:', error)
      throw new Error('Error al verificar el estado del registro')
    }
  }

  /**
   * Verificar si el usuario necesita onboarding
   */
  static async checkOnboardingStatus(): Promise<{
    needsOnboarding: boolean
    organizationData?: unknown
  }> {
    try {
      // Check if user is authenticated
      if (!this.cognitoService.isAuthenticated()) {
        return { needsOnboarding: true }
      }

      // Get current user's ID token
      const idToken = this.cognitoService.getIdToken()
      if (!idToken) {
        return { needsOnboarding: true }
      }
      
      const response = await fetch(`${this.API_BASE}/auth/user-status`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        // If can't check status, assume needs onboarding
        return { needsOnboarding: true }
      }
      
      const data = await response.json()
      
      return {
        needsOnboarding: data.needsOnboarding,
        organizationData: data.organizationData
      }
    } catch (error) {
      console.log('Usuario necesita onboarding:', error)
      return { needsOnboarding: true }
    }
  }

  /**
   * Obtener planes disponibles desde AWS Lambda
   */
  static async getAvailablePlans() {
    try {
      console.log('🔍 Obteniendo planes desde AWS Lambda...')
      console.log('🔗 API_BASE:', this.API_BASE)
      console.log('🔗 Full URL:', `${this.API_BASE}/plans`)
      
      // TEMPORAL: Usar planes hardcodeados mientras se soluciona CORS
      console.log('⚠️ Usando planes hardcodeados temporalmente')
      
      const hardcodedPlans = {
        results: [
          {
            id: 'basico',
            name: 'Plan Básico',
            price_monthly: 0,
            price_yearly: 0,
            description: 'Ideal para empezar tu negocio',
            features: [
              'Hasta 50 citas por mes',
              '1 profesional',
              '3 servicios',
              'Agenda básica',
              'Recordatorios por email',
              'Soporte básico'
            ],
            is_popular: false,
            is_coming_soon: false,
            badge_text: 'Gratis',
            color_scheme: 'emerald'
          },
          {
            id: 'profesional',
            name: 'Plan Profesional',
            price_monthly: 29900,
            price_yearly: 299000,
            original_price: 359000,
            discount_text: '17% OFF',
            description: 'Para negocios en crecimiento',
            features: [
              'Citas ilimitadas',
              'Hasta 5 profesionales',
              'Servicios ilimitados',
              'Agenda avanzada',
              'Recordatorios por SMS',
              'Reportes básicos',
              'Integración con pagos',
              'Soporte prioritario'
            ],
            is_popular: true,
            is_coming_soon: false,
            badge_text: 'Más Popular',
            color_scheme: 'blue'
          },
          {
            id: 'empresarial',
            name: 'Plan Empresarial',
            price_monthly: 59900,
            price_yearly: 599000,
            original_price: 719000,
            discount_text: '17% OFF',
            description: 'Para equipos grandes y múltiples ubicaciones',
            features: [
              'Todo en Plan Profesional',
              'Profesionales ilimitados',
              'Múltiples ubicaciones',
              'Agenda compartida',
              'Reportes avanzados',
              'API personalizada',
              'Integración completa',
              'Soporte dedicado 24/7'
            ],
            is_popular: false,
            is_coming_soon: false,
            badge_text: 'Enterprise',
            color_scheme: 'purple'
          }
        ],
        count: 3
      }
      
      console.log('✅ Planes hardcodeados cargados:', hardcodedPlans)
      return hardcodedPlans
      
      /* TODO: Descomentar cuando CORS esté funcionando
      const response = await fetch(`${this.API_BASE}/plans`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get plans')
      }
      
      const data = await response.json()
      console.log('✅ Planes obtenidos:', data)
      
      return data
      */
    } catch (error) {
      console.error('❌ Error obteniendo planes:', error)
      throw new Error('Error al cargar los planes')
    }
  }

  /**
   * Obtener servicios sugeridos por industria
   */
  static getSuggestedServices(industryType: string) {
    const serviceTemplates: Record<string, Array<{
      name: string
      description: string
      category: string
      duration_minutes: number
      price: number
      buffer_time_before?: number
      buffer_time_after?: number
      is_active: boolean
      requires_preparation: boolean
    }>> = {
      salon: [
        {
          name: 'Corte de Cabello',
          description: 'Corte de cabello personalizado',
          category: 'Cabello',
          duration_minutes: 45,
          price: 15000,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Tinte y Color',
          description: 'Coloración completa del cabello',
          category: 'Color',
          duration_minutes: 90,
          price: 35000,
          buffer_time_before: 10,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Peinado',
          description: 'Peinado profesional',
          category: 'Cabello',
          duration_minutes: 30,
          price: 12000,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Tratamiento Capilar',
          description: 'Tratamiento nutritivo para el cabello',
          category: 'Tratamientos',
          duration_minutes: 60,
          price: 25000,
          buffer_time_before: 5,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: true
        }
      ],
      clinic: [
        {
          name: 'Consulta General',
          description: 'Consulta médica general',
          category: 'Consultas',
          duration_minutes: 30,
          price: 25000,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Control Médico',
          description: 'Control médico de seguimiento',
          category: 'Controles',
          duration_minutes: 20,
          price: 15000,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Examen Físico',
          description: 'Examen físico completo',
          category: 'Exámenes',
          duration_minutes: 45,
          price: 30000,
          buffer_time_before: 10,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: true
        }
      ],
      spa: [
        {
          name: 'Masaje Relajante',
          description: 'Masaje corporal completo',
          category: 'Masajes',
          duration_minutes: 60,
          price: 35000,
          buffer_time_before: 10,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Limpieza Facial',
          description: 'Limpieza facial profunda',
          category: 'Faciales',
          duration_minutes: 75,
          price: 28000,
          buffer_time_before: 10,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Manicure',
          description: 'Cuidado completo de manos',
          category: 'Manos',
          duration_minutes: 45,
          price: 15000,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        }
      ],
      gym: [
        {
          name: 'Entrenamiento Personal',
          description: 'Sesión de entrenamiento personalizado',
          category: 'Entrenamiento',
          duration_minutes: 60,
          price: 20000,
          buffer_time_before: 5,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Clase Grupal',
          description: 'Clase de entrenamiento grupal',
          category: 'Clases',
          duration_minutes: 45,
          price: 8000,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        }
      ]
    }
    
    return serviceTemplates[industryType] || serviceTemplates.salon
  }

  /**
   * Validar datos del onboarding localmente (validación rápida)
   */
  static validateOnboardingData(data: {
    organization: {
      name?: string
      email?: string
      phone?: string
    }
    professionals: Array<{
      name?: string
      email?: string
    }>
    services: Array<{
      name?: string
      price?: number
      duration_minutes?: number
    }>
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validar organización
    if (!data.organization?.name?.trim()) {
      errors.push('El nombre de la organización es requerido')
    }
    if (!data.organization?.email?.trim()) {
      errors.push('El email de la organización es requerido')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.organization.email)) {
      errors.push('El email de la organización no es válido')
    }
    if (!data.organization?.phone?.trim()) {
      errors.push('El teléfono de la organización es requerido')
    }

    // Validar profesionales
    if (data.professionals.length === 0) {
      errors.push('Debe agregar al menos un profesional')
    }
    
    data.professionals.forEach((prof, index) => {
      if (!prof.name?.trim()) {
        errors.push(`Nombre del profesional ${index + 1} es requerido`)
      }
      if (!prof.email?.trim()) {
        errors.push(`Email del profesional ${index + 1} es requerido`)
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(prof.email)) {
        errors.push(`Email del profesional ${index + 1} no es válido`)
      }
    })

    // Validar servicios
    if (data.services.length === 0) {
      errors.push('Debe agregar al menos un servicio')
    }
    
    data.services.forEach((serv, index) => {
      if (!serv.name?.trim()) {
        errors.push(`Nombre del servicio ${index + 1} es requerido`)
      }
      if (!serv.price || serv.price <= 0) {
        errors.push(`Precio del servicio ${index + 1} debe ser mayor a 0`)
      }
      if (!serv.duration_minutes || serv.duration_minutes <= 0) {
        errors.push(`Duración del servicio ${index + 1} debe ser mayor a 0`)
      }
    })

    return { isValid: errors.length === 0, errors }
  }

  /**
   * Obtener información del token almacenado
   */
  static getStoredToken(): string | null {
    return localStorage.getItem('registration_token')
  }

  /**
   * Limpiar datos temporales del onboarding
   */
  static clearOnboardingData(): void {
    localStorage.removeItem('registration_token')
    localStorage.removeItem('signup_data')
    localStorage.removeItem('onboarding_progress')
    localStorage.removeItem('plan_selection')
  }

  /**
   * Obtener estado de salud del servicio de onboarding
   */
  static async getHealthStatus(): Promise<{
    status: string
    message: string
    timestamp: string
  }> {
    try {
      const response = await api.get('/api/onboarding/health/')
      return response.data
    } catch (error) {
      console.error('Error obteniendo estado de salud:', error)
      throw new Error('Error al verificar el estado del servicio')
    }
  }
}