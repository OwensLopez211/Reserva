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

export interface ClientNote {
  id: string
  title: string
  content: string
  category: 'general' | 'medical' | 'preferences' | 'important' | 'follow_up'
  is_private: boolean
  organization: string
  client: string
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

export interface ClientFile {
  id: string
  name: string
  file_path: string
  file_type: string
  file_size: number
  description: string
  category: 'document' | 'image' | 'medical' | 'other'
  file_url: string
  organization: string
  client: string
  uploaded_by: string
  uploaded_by_name: string
  uploaded_at: string
}

export interface CreateClientNoteData {
  title: string
  content: string
  category: ClientNote['category']
  is_private: boolean
  client: string
}

export interface UpdateClientNoteData {
  title?: string
  content?: string
  category?: ClientNote['category']
  is_private?: boolean
}

export interface CreateClientFileData {
  name: string
  file_path: string
  file_type: string
  file_size: number
  description?: string
  category: ClientFile['category']
  client: string
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

  // ===== CLIENT NOTES API =====

  // Obtener notas de un cliente
  async getClientNotes(clientId: string): Promise<ClientNote[]> {
    const response = await api.get(`/api/organizations/client-notes/?client=${clientId}`)
    return response.data.results || response.data
  }

  // Crear nueva nota
  async createClientNote(noteData: CreateClientNoteData): Promise<ClientNote> {
    const response = await api.post('/api/organizations/client-notes/', noteData)
    return response.data
  }

  // Actualizar nota
  async updateClientNote(noteId: string, noteData: UpdateClientNoteData): Promise<ClientNote> {
    const response = await api.patch(`/api/organizations/client-notes/${noteId}/`, noteData)
    return response.data
  }

  // Eliminar nota
  async deleteClientNote(noteId: string): Promise<void> {
    await api.delete(`/api/organizations/client-notes/${noteId}/`)
  }

  // ===== CLIENT FILES API =====

  // Obtener archivos de un cliente
  async getClientFiles(clientId: string): Promise<ClientFile[]> {
    const response = await api.get(`/api/organizations/client-files/?client=${clientId}`)
    return response.data.results || response.data
  }

  // Crear nuevo archivo
  async createClientFile(fileData: CreateClientFileData): Promise<ClientFile> {
    const response = await api.post('/api/organizations/client-files/', fileData)
    return response.data
  }

  // Eliminar archivo
  async deleteClientFile(fileId: string): Promise<void> {
    await api.delete(`/api/organizations/client-files/${fileId}/`)
  }

  // Subir archivo (con FormData)
  async uploadClientFile(clientId: string, file: File, description?: string, category?: ClientFile['category']): Promise<ClientFile> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('client', clientId)
    formData.append('name', file.name)
    formData.append('file_type', file.type)
    formData.append('file_size', file.size.toString())
    
    if (description) {
      formData.append('description', description)
    }
    
    if (category) {
      formData.append('category', category)
    }

    const response = await api.post('/api/organizations/client-files/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }

  // ===== UTILITY METHODS FOR NOTES AND FILES =====

  // Obtener color para categoría de nota
  getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'important': 'bg-red-100 text-red-800',
      'medical': 'bg-blue-100 text-blue-800',
      'preferences': 'bg-green-100 text-green-800',
      'follow_up': 'bg-yellow-100 text-yellow-800',
      'general': 'bg-gray-100 text-gray-800'
    }
    return colorMap[category] || 'bg-gray-100 text-gray-800'
  }

  // Obtener nombre de categoría
  getCategoryName(category: string): string {
    const nameMap: Record<string, string> = {
      'important': 'Importante',
      'medical': 'Médico',
      'preferences': 'Preferencias',
      'follow_up': 'Seguimiento',
      'general': 'General'
    }
    return nameMap[category] || category
  }

  // Formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Obtener icono para tipo de archivo
  getFileIcon(fileType: string): string {
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('doc')) return '📝'
    return '📎'
  }
}

export default new ClientService()