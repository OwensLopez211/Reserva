import api from './api'

export interface Professional {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: string
  is_professional: boolean
  is_active_in_org: boolean
  organization: string
  organization_name: string
  created_at: string
  updated_at: string
}

class ProfessionalService {
  // Obtener todos los profesionales de la organización
  async getProfessionals(): Promise<Professional[]> {
    const response = await api.get('/api/organizations/professionals/')
    return response.data.results || response.data
  }

  // Obtener un profesional específico
  async getProfessional(id: string): Promise<Professional> {
    const response = await api.get(`/api/organizations/professionals/${id}/`)
    return response.data
  }

  // Formatear nombre completo
  formatFullName(professional: Professional): string {
    return professional.full_name || `${professional.first_name} ${professional.last_name}`.trim()
  }
}

export default new ProfessionalService() 