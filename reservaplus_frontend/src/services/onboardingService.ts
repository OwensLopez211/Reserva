// src/services/onboardingService.ts
import { api } from './api'

export interface OnboardingData {
  organization: OrganizationCreateData
  professionals: ProfessionalCreateData[]
  services: ServiceCreateData[]
  settings?: OrganizationSettings
}

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
  professionals?: string[] // IDs de profesionales
}

export interface OrganizationSettings {
  business_hours: {
    [key: string]: { open: string; close: string; is_open: boolean }
  }
  cancellation_policy: {
    hours_before: number
    allow_client_cancellation: boolean
  }
  notification_settings: {
    send_reminders: boolean
    reminder_hours_before: number
    send_confirmations: boolean
    require_confirmation: boolean
  }
  booking_rules: {
    advance_booking_days: number
    allow_walk_ins: boolean
    buffer_between_appointments: number
  }
}

export class OnboardingService {
  
  /**
   * Completar el proceso de onboarding
   */
  static async completeOnboarding(data: OnboardingData): Promise<{
    organization: unknown
    professionals: unknown[]
    services: unknown[]
    success: boolean
  }> {
    try {
      // 1. Crear la organización primero
      const organizationResponse = await this.createOrganization(data.organization)
      
      // 2. Crear profesionales
      const professionalsPromises = data.professionals.map(professional => 
        this.createProfessional(professional)
      )
      const professionalsResponse = await Promise.all(professionalsPromises)
      
      // 3. Crear servicios y asignar profesionales
      const servicesPromises = data.services.map(service => 
        this.createService({
          ...service,
          professionals: professionalsResponse.map(p => p.id)
        })
      )
      const servicesResponse = await Promise.all(servicesPromises)
      
      // 4. Actualizar configuraciones de la organización si es necesario
      if (data.settings) {
        await this.updateOrganizationSettings(data.settings)
      }
      
      return {
        organization: organizationResponse,
        professionals: professionalsResponse,
        services: servicesResponse,
        success: true
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      throw error
    }
  }

  /**
   * Crear organización
   */
  static async createOrganization(data: OrganizationCreateData) {
    const response = await api.post('/api/organizations/organizations/', data)
    return response.data
  }

  /**
   * Crear profesional
   */
  static async createProfessional(data: ProfessionalCreateData) {
    const response = await api.post('/api/organizations/professionals/', data)
    return response.data
  }

  /**
   * Crear servicio
   */
  static async createService(data: ServiceCreateData) {
    const response = await api.post('/api/organizations/services/', data)
    return response.data
  }

  /**
   * Actualizar configuraciones de organización
   */
  static async updateOrganizationSettings(settings: OrganizationSettings) {
    // Obtener la organización actual primero
    const orgResponse = await api.get('/api/organizations/me/')
    const orgId = orgResponse.data.id
    
    // Actualizar con las nuevas configuraciones
    const response = await api.patch(`/api/organizations/organizations/${orgId}/`, {
      settings: settings
    })
    return response.data
  }

  /**
   * Obtener plantillas de configuración por industria
   */
  static getIndustryTemplate(industryType: string): Partial<OrganizationSettings> {
    const templates: Record<string, Partial<OrganizationSettings>> = {
      salon: {
        business_hours: {
          monday: { open: '09:00', close: '18:00', is_open: true },
          tuesday: { open: '09:00', close: '18:00', is_open: true },
          wednesday: { open: '09:00', close: '18:00', is_open: true },
          thursday: { open: '09:00', close: '18:00', is_open: true },
          friday: { open: '09:00', close: '18:00', is_open: true },
          saturday: { open: '09:00', close: '15:00', is_open: true },
          sunday: { open: '10:00', close: '14:00', is_open: false }
        },
        cancellation_policy: {
          hours_before: 2,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 24,
          send_confirmations: true,
          require_confirmation: false
        },
        booking_rules: {
          advance_booking_days: 30,
          allow_walk_ins: true,
          buffer_between_appointments: 15
        }
      },
      clinic: {
        business_hours: {
          monday: { open: '08:00', close: '17:00', is_open: true },
          tuesday: { open: '08:00', close: '17:00', is_open: true },
          wednesday: { open: '08:00', close: '17:00', is_open: true },
          thursday: { open: '08:00', close: '17:00', is_open: true },
          friday: { open: '08:00', close: '17:00', is_open: true },
          saturday: { open: '08:00', close: '12:00', is_open: true },
          sunday: { open: '09:00', close: '12:00', is_open: false }
        },
        cancellation_policy: {
          hours_before: 24,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 48,
          send_confirmations: true,
          require_confirmation: true
        },
        booking_rules: {
          advance_booking_days: 60,
          allow_walk_ins: false,
          buffer_between_appointments: 10
        }
      },
      spa: {
        business_hours: {
          monday: { open: '10:00', close: '20:00', is_open: true },
          tuesday: { open: '10:00', close: '20:00', is_open: true },
          wednesday: { open: '10:00', close: '20:00', is_open: true },
          thursday: { open: '10:00', close: '20:00', is_open: true },
          friday: { open: '10:00', close: '20:00', is_open: true },
          saturday: { open: '09:00', close: '18:00', is_open: true },
          sunday: { open: '10:00', close: '16:00', is_open: true }
        },
        cancellation_policy: {
          hours_before: 24,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 24,
          send_confirmations: true,
          require_confirmation: true
        },
        booking_rules: {
          advance_booking_days: 45,
          allow_walk_ins: false,
          buffer_between_appointments: 30
        }
      },
      dental: {
        business_hours: {
          monday: { open: '08:00', close: '18:00', is_open: true },
          tuesday: { open: '08:00', close: '18:00', is_open: true },
          wednesday: { open: '08:00', close: '18:00', is_open: true },
          thursday: { open: '08:00', close: '18:00', is_open: true },
          friday: { open: '08:00', close: '18:00', is_open: true },
          saturday: { open: '08:00', close: '13:00', is_open: true },
          sunday: { open: '09:00', close: '12:00', is_open: false }
        },
        cancellation_policy: {
          hours_before: 48,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 48,
          send_confirmations: true,
          require_confirmation: true
        },
        booking_rules: {
          advance_booking_days: 90,
          allow_walk_ins: false,
          buffer_between_appointments: 15
        }
      },
      fitness: {
        business_hours: {
          monday: { open: '06:00', close: '22:00', is_open: true },
          tuesday: { open: '06:00', close: '22:00', is_open: true },
          wednesday: { open: '06:00', close: '22:00', is_open: true },
          thursday: { open: '06:00', close: '22:00', is_open: true },
          friday: { open: '06:00', close: '22:00', is_open: true },
          saturday: { open: '07:00', close: '20:00', is_open: true },
          sunday: { open: '08:00', close: '18:00', is_open: true }
        },
        cancellation_policy: {
          hours_before: 4,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 12,
          send_confirmations: false,
          require_confirmation: false
        },
        booking_rules: {
          advance_booking_days: 14,
          allow_walk_ins: true,
          buffer_between_appointments: 0
        }
      }
    }

    return templates[industryType] || templates.salon
  }

  /**
   * Obtener servicios sugeridos por industria
   */
  static getSuggestedServices(industryType: string): Partial<ServiceCreateData>[] {
    const serviceTemplates: Record<string, Partial<ServiceCreateData>[]> = {
      salon: [
        {
          name: 'Corte de Cabello',
          description: 'Corte de cabello personalizado según tu estilo',
          category: 'Cabello',
          duration_minutes: 45,
          price: 15000,
          buffer_time_before: 5,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Peinado',
          description: 'Peinado profesional para eventos especiales',
          category: 'Cabello',
          duration_minutes: 30,
          price: 12000,
          buffer_time_before: 5,
          buffer_time_after: 5,
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
          name: 'Manicure',
          description: 'Cuidado completo de uñas de manos',
          category: 'Uñas',
          duration_minutes: 30,
          price: 8000,
          buffer_time_before: 0,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Pedicure',
          description: 'Cuidado completo de uñas de pies',
          category: 'Uñas',
          duration_minutes: 45,
          price: 12000,
          buffer_time_before: 5,
          buffer_time_after: 10,
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
          buffer_time_before: 5,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Control',
          description: 'Control médico de seguimiento',
          category: 'Controles',
          duration_minutes: 20,
          price: 15000,
          buffer_time_before: 5,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Procedimiento Menor',
          description: 'Procedimientos médicos menores',
          category: 'Procedimientos',
          duration_minutes: 45,
          price: 40000,
          buffer_time_before: 10,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Examen de Laboratorio',
          description: 'Toma de muestras para análisis',
          category: 'Laboratorio',
          duration_minutes: 15,
          price: 12000,
          buffer_time_before: 0,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        }
      ],
      spa: [
        {
          name: 'Masaje Relajante',
          description: 'Masaje corporal completo relajante',
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
          description: 'Tratamiento facial hidratante profundo',
          category: 'Faciales',
          duration_minutes: 45,
          price: 25000,
          buffer_time_before: 5,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Masaje Deportivo',
          description: 'Masaje terapéutico para deportistas',
          category: 'Masajes',
          duration_minutes: 75,
          price: 40000,
          buffer_time_before: 10,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Tratamiento Corporal',
          description: 'Exfoliación e hidratación corporal',
          category: 'Corporales',
          duration_minutes: 90,
          price: 45000,
          buffer_time_before: 15,
          buffer_time_after: 20,
          is_active: true,
          requires_preparation: true
        }
      ],
      dental: [
        {
          name: 'Consulta Dental',
          description: 'Examen dental completo',
          category: 'Consultas',
          duration_minutes: 30,
          price: 20000,
          buffer_time_before: 5,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Limpieza Dental',
          description: 'Profilaxis dental profesional',
          category: 'Prevención',
          duration_minutes: 45,
          price: 35000,
          buffer_time_before: 5,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Empaste',
          description: 'Restauración dental con composite',
          category: 'Restauración',
          duration_minutes: 60,
          price: 50000,
          buffer_time_before: 10,
          buffer_time_after: 15,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Extracción',
          description: 'Extracción dental simple',
          category: 'Cirugía',
          duration_minutes: 45,
          price: 40000,
          buffer_time_before: 15,
          buffer_time_after: 20,
          is_active: true,
          requires_preparation: true
        }
      ],
      fitness: [
        {
          name: 'Entrenamiento Personal',
          description: 'Sesión de entrenamiento personalizado',
          category: 'Entrenamiento',
          duration_minutes: 60,
          price: 25000,
          buffer_time_before: 5,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        },
        {
          name: 'Evaluación Física',
          description: 'Evaluación completa de condición física',
          category: 'Evaluación',
          duration_minutes: 45,
          price: 20000,
          buffer_time_before: 10,
          buffer_time_after: 10,
          is_active: true,
          requires_preparation: true
        },
        {
          name: 'Consulta Nutricional',
          description: 'Asesoramiento nutricional personalizado',
          category: 'Nutrición',
          duration_minutes: 30,
          price: 18000,
          buffer_time_before: 0,
          buffer_time_after: 5,
          is_active: true,
          requires_preparation: false
        }
      ]
    }

    return serviceTemplates[industryType] || serviceTemplates.salon
  }

  /**
   * Validar datos de onboarding
   */
  static validateOnboardingData(data: OnboardingData): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Validar organización
    if (!data.organization.name?.trim()) {
      errors.push('El nombre de la organización es requerido')
    }
    if (!data.organization.email?.trim()) {
      errors.push('El email de la organización es requerido')
    }
    if (!data.organization.phone?.trim()) {
      errors.push('El teléfono de la organización es requerido')
    }

    // Validar profesionales
    if (data.professionals.length === 0) {
      errors.push('Debe agregar al menos un profesional')
    }
    data.professionals.forEach((professional, index) => {
      if (!professional.name?.trim()) {
        errors.push(`El nombre del profesional ${index + 1} es requerido`)
      }
      if (!professional.email?.trim()) {
        errors.push(`El email del profesional ${index + 1} es requerido`)
      }
    })

    // Validar servicios
    if (data.services.length === 0) {
      errors.push('Debe agregar al menos un servicio')
    }
    data.services.forEach((service, index) => {
      if (!service.name?.trim()) {
        errors.push(`El nombre del servicio ${index + 1} es requerido`)
      }
      if (!service.price || service.price <= 0) {
        errors.push(`El precio del servicio ${index + 1} debe ser mayor a 0`)
      }
      if (!service.duration_minutes || service.duration_minutes <= 0) {
        errors.push(`La duración del servicio ${index + 1} debe ser mayor a 0`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}