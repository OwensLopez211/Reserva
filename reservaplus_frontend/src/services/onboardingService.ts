// src/services/onboardingService.ts - VERSIÓN ALINEADA CON BACKEND REFACTORIZADO

import { api } from './api'

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

      console.log('🚀 Iniciando signup:', signupData)
      const response = await api.post('/api/plans/signup/', signupData)
      
      console.log('✅ Signup exitoso:', response.data)
      
      // Guardar token temporal en localStorage
      localStorage.setItem('registration_token', response.data.registration_token)
      localStorage.setItem('signup_data', JSON.stringify(response.data))
      
      return response.data
    } catch (error: unknown) {
      console.error('❌ Error en signup:', error)
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { error?: string } } }
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error)
        }
      }
      throw new Error('Error al iniciar el registro')
    }
  }

  /**
   * PASO 2: Completar todo el onboarding usando el endpoint refactorizado
   */
  static async completeOnboarding(data: OnboardingCompleteData): Promise<OnboardingCompleteResponse> {
    try {
      console.log('🔄 Completando onboarding con endpoint refactorizado:', JSON.stringify(data, null, 2))
      
      // Usar el endpoint refactorizado
      const response = await api.post('/api/onboarding/complete/', data)
      
      console.log('✅ Onboarding completado exitosamente:', response.data)
      
      // Limpiar datos temporales
      localStorage.removeItem('registration_token')
      localStorage.removeItem('signup_data')
      localStorage.removeItem('onboarding_progress')
      localStorage.removeItem('plan_selection')
      
      return response.data
    } catch (error: unknown) {
      console.error('❌ Error completando onboarding:', error)
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { 
          response?: { 
            data?: { 
              error?: string
              details?: unknown
              message?: string
            }
            status?: number
            statusText?: string
          } 
        }
        
        // Log completo del error para debugging
        if (errObj.response) {
          console.error('💥 Error response completo:', {
            status: errObj.response.status,
            statusText: errObj.response.statusText,
            data: errObj.response.data
          })
        }
        
        // Manejo específico de errores del backend refactorizado
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error)
        }
        
        if (errObj.response?.data?.message) {
          throw new Error(errObj.response.data.message)
        }
        
        if (errObj.response?.status === 400) {
          const details = errObj.response.data?.details
          if (details) {
            throw new Error(`Error de validación: ${JSON.stringify(details, null, 2)}`)
          } else {
            throw new Error(`Datos inválidos: ${JSON.stringify(errObj.response.data, null, 2)}`)
          }
        }
        
        if (errObj.response?.status === 401) {
          throw new Error('Token de registro inválido o expirado')
        }
        
        if (errObj.response?.status === 403) {
          throw new Error('No tienes permisos para realizar esta acción')
        }
        
        if (errObj.response?.status === 429) {
          throw new Error('Demasiados intentos. Por favor, espera un momento antes de intentar nuevamente.')
        }
        
        if (errObj.response?.status === 500) {
          throw new Error('Error interno del servidor. Por favor, intenta más tarde.')
        }
        
        throw new Error(`Error ${errObj.response?.status}: ${errObj.response?.statusText || 'Error desconocido'}`)
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
      const response = await api.get(`/api/plans/registration/${token}/`)
      return response.data
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
      // Verificar si ya tiene organización configurada
      const orgResponse = await api.get('/api/organizations/me/')
      
      if (orgResponse.status === 200 && orgResponse.data.onboarding_completed) {
        return { needsOnboarding: false, organizationData: orgResponse.data }
      }
    } catch (error) {
      console.log('Usuario necesita onboarding:', error)
    }
    
    return { needsOnboarding: true }
  }

  /**
   * Obtener planes disponibles
   */
  static async getAvailablePlans() {
    try {
      const response = await api.get('/api/plans/plans/')
      return response.data
    } catch (error) {
      console.error('Error obteniendo planes:', error)
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