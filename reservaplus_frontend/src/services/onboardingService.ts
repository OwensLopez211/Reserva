// src/services/onboardingService.ts 
import { api } from './api'

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

// Mantener las interfaces existentes para compatibilidad
export interface OrganizationCreateData {
  name: string
  industry_template: string
  email: string
  phone: string
  website?: string
  address?: string
  city?: string
  country: string
  settings?: Record<string, unknown>
}

export interface ProfessionalCreateData {
  name: string
  email: string
  phone?: string
  specialty?: string
  license_number?: string
  bio?: string
  color_code: string
  is_active: boolean
  accepts_walk_ins: boolean
}

export interface ServiceCreateData {
  name: string
  description?: string
  category?: string
  duration_minutes: number
  price: number
  buffer_time_before?: number
  buffer_time_after?: number
  is_active: boolean
  requires_preparation: boolean
  professionals?: string[]
}

export class OnboardingService {
  /**
   * Completar el proceso de onboarding usando el endpoint correcto del backend
   */
  static async completeOnboarding(data: OnboardingCompleteData): Promise<OnboardingCompleteResponse> {
    try {
      console.log('Enviando datos de onboarding completo:', data)
      
      // Usar el endpoint correcto del backend
      const response = await api.post('/api/onboarding/complete/', data)
      
      console.log('Respuesta del onboarding:', response.data)
      return response.data
    } catch (error: unknown) {
      console.error('Error completing onboarding:', error)
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { 
          response?: { 
            data?: { 
              error?: string
              details?: unknown
            }
            status?: number
          } 
        }
        
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error)
        }
        
        if (errObj.response?.status === 400 && errObj.response?.data?.details) {
          throw new Error(`Datos inválidos: ${JSON.stringify(errObj.response.data.details)}`)
        }
      }
      
      throw new Error('Error al completar el onboarding')
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
      
      if (orgResponse.status === 200) {
        // Verificar si tiene profesionales y servicios
        const [profResponse, servResponse] = await Promise.all([
          api.get('/api/organizations/professionals/'),
          api.get('/api/organizations/services/')
        ])
        
        const hasProfessionals = profResponse.data.results?.length > 0
        const hasServices = servResponse.data.results?.length > 0
        
        return {
          needsOnboarding: !(hasProfessionals && hasServices),
          organizationData: orgResponse.data
        }
      }
    } catch (error) {
      console.log('Usuario necesita onboarding:', error)
    }
    
    return { needsOnboarding: true }
  }

  // Mantener métodos existentes para compatibilidad
  static getIndustryTemplate(industryType: string) {
    const templates: Record<string, unknown> = {
      salon: {
        business_rules: {
          allow_walk_ins: true,
          cancellation_window_hours: 2,
          requires_confirmation: false,
          advance_booking_days: 30,
          buffer_between_appointments: 15
        }
      },
      clinic: {
        business_rules: {
          allow_walk_ins: false,
          cancellation_window_hours: 24,
          requires_confirmation: true,
          advance_booking_days: 60,
          buffer_between_appointments: 10
        }
      },
      spa: {
        business_rules: {
          allow_walk_ins: false,
          cancellation_window_hours: 24,
          requires_confirmation: true,
          advance_booking_days: 45,
          buffer_between_appointments: 30
        }
      }
    }
    return templates[industryType] || templates.salon
  }

  static getSuggestedServices(industryType: string): Partial<ServiceCreateData>[] {
    const serviceTemplates: Record<string, Partial<ServiceCreateData>[]> = {
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
        }
      ],
      spa: [
        {
          name: 'Masaje Relajante',
          description: 'Masaje corporal completo',
          category: 'Masajes',
          duration_minutes: 60,
          price: 30000,
          buffer_time_before: 10,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Facial Hidratante',
          description: 'Tratamiento facial hidratante',
          category: 'Faciales',
          duration_minutes: 45,
          price: 25000,
          buffer_time_before: 5,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: true
        }
      ]
    }
    return serviceTemplates[industryType] || serviceTemplates.salon
  }

  static validateOnboardingData(data: {
    organization: OrganizationCreateData
    professionals: ProfessionalCreateData[]
    services: ServiceCreateData[]
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.organization.name?.trim()) {
      errors.push('El nombre de la organización es requerido')
    }
    if (!data.organization.email?.trim()) {
      errors.push('El email de la organización es requerido')
    }
    if (!data.organization.phone?.trim()) {
      errors.push('El teléfono de la organización es requerido')
    }

    if (data.professionals.length === 0) {
      errors.push('Debe agregar al menos un profesional')
    }

    if (data.services.length === 0) {
      errors.push('Debe agregar al menos un servicio')
    }

    return { isValid: errors.length === 0, errors }
  }
}