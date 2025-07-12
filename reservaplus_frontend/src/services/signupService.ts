// src/services/signupService.ts - NUEVO ARCHIVO
import { api } from './api'

export interface SignupData {
  email: string
  plan_id: string
  user_data: {
    first_name: string
    last_name: string
    organization_name?: string
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

export interface RegistrationStatus {
  id: string
  email: string
  selected_plan: {
    id: string
    name: string
    price_monthly: number
  }
  onboarding_step: number
  completed_steps: number[]
  is_completed: boolean
  is_expired: boolean
  is_valid: boolean
  created_at: string
  expires_at: string
}

export class SignupService {
  /**
   * Iniciar el proceso de signup con selección de plan
   */
  static async startSignup(data: SignupData): Promise<SignupResponse> {
    try {
      const response = await api.post('/api/plans/signup/', data)
      return response.data
    } catch (error: unknown) {
      console.error('Error en signup:', error)
      
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
   * Verificar estado del registro temporal
   */
  static async getRegistrationStatus(token: string): Promise<RegistrationStatus> {
    try {
      const response = await api.get(`/api/plans/registration/${token}/`)
      return response.data
    } catch (error) {
      console.error('Error al verificar registro:', error)
      throw new Error('Error al verificar el estado del registro')
    }
  }

  /**
   * Actualizar progreso del onboarding
   */
  static async updateOnboardingProgress(
    token: string, 
    step: number, 
    completedSteps: number[]
  ): Promise<RegistrationStatus> {
    try {
      const response = await api.patch(`/api/plans/registration/${token}/`, {
        step,
        completed_steps: completedSteps
      })
      return response.data
    } catch (error) {
      console.error('Error al actualizar progreso:', error)
      throw new Error('Error al actualizar el progreso')
    }
  }

  /**
   * Obtener planes disponibles
   */
  static async getAvailablePlans() {
    try {
      const response = await api.get('/api/plans/plans/')
      return response.data
    } catch (error) {
      console.error('Error al obtener planes:', error)
      throw new Error('Error al cargar los planes')
    }
  }
}