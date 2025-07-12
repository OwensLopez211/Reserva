import api from './api'

export interface Client {
  id: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  birth_date: string | null
  notes: string
  address: string
  emergency_contact: string
  marketing_consent: boolean
  email_notifications: boolean
  sms_notifications: boolean
  client_type: 'internal' | 'registered' | 'guest'
  is_active: boolean
  organization: string
  organization_name: string
  appointments_count: number
  created_at: string
  updated_at: string
}

export interface ClientFilters {
  client_type?: string
  is_active?: boolean
  search?: string
}

export interface ClientLimitsInfo {
  current_clients_count: number
  max_clients: number
  can_add_more: boolean
  plan_name: string
}

class ClientService {
  // Obtener todos los clientes de la organización
  async getClients(filters?: ClientFilters): Promise<Client[]> {
    const params = new URLSearchParams()
    
    if (filters?.client_type) {
      params.append('client_type', filters.client_type)
    }
    if (filters?.is_active !== undefined) {
      params.append('is_active', filters.is_active.toString())
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }

    const queryString = params.toString()
    const url = `/api/organizations/clients/${queryString ? `?${queryString}` : ''}`
    
    const response = await api.get(url)
    return response.data.results || response.data
  }

  // Obtener un cliente específico
  async getClient(id: string): Promise<Client> {
    const response = await api.get(`/api/organizations/clients/${id}/`)
    return response.data
  }

  // Crear nuevo cliente
  async createClient(clientData: Partial<Client>): Promise<Client> {
    const response = await api.post('/api/organizations/clients/', clientData)
    return response.data
  }

  // Actualizar cliente
  async updateClient(id: string, clientData: Partial<Client>): Promise<Client> {
    const response = await api.patch(`/api/organizations/clients/${id}/`, clientData)
    return response.data
  }

  // Eliminar cliente
  async deleteClient(id: string): Promise<void> {
    await api.delete(`/api/organizations/clients/${id}/`)
  }

  // Obtener información de límites de clientes
  async getClientsLimitsInfo(): Promise<ClientLimitsInfo> {
    const response = await api.get('/api/organizations/clients/limits_info/')
    return response.data
  }

  // Formatear tipo de cliente para mostrar
  getClientTypeDisplay(clientType: string): string {
    const typeMap: Record<string, string> = {
      'internal': 'Cliente Interno',
      'registered': 'Cliente Registrado', 
      'guest': 'Cliente Invitado'
    }
    return typeMap[clientType] || clientType
  }

  // Obtener color para el tipo de cliente
  getClientTypeColor(clientType: string): string {
    const colorMap: Record<string, string> = {
      'internal': 'bg-blue-100 text-blue-800',
      'registered': 'bg-green-100 text-green-800',
      'guest': 'bg-amber-100 text-amber-800'
    }
    return colorMap[clientType] || 'bg-gray-100 text-gray-800'
  }

  // Formatear fecha de nacimiento
  formatBirthDate(birthDate: string | null): string {
    if (!birthDate) return 'No especificada'
    return new Date(birthDate).toLocaleDateString('es-CL')
  }

  // Formatear fecha de creación
  formatCreatedAt(createdAt: string): string {
    return new Date(createdAt).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

export default new ClientService()