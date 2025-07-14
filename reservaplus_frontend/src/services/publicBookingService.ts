import api from './api'

// ===== TIPOS =====

export interface PublicOrganization {
  id: string
  name: string
  slug: string
  description: string
  industry: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  country: string
  logo: string
  cover_image: string
  gallery_images: string[]
  rating: number
  total_reviews: number
  is_featured: boolean
}

export interface PublicProfessional {
  id: string
  name: string
  specialty: string
  bio: string
  accepts_walk_ins: boolean
  color_code: string
}

export interface PublicService {
  id: string
  name: string
  description: string
  duration_minutes: number
  price: number
  category: string
  professionals: PublicProfessional[]
}

export interface BookingSettings {
  terminology: Record<string, string>
  business_rules: Record<string, unknown>
}

export interface PublicOrganizationDetail {
  organization: PublicOrganization
  professionals: PublicProfessional[]
  services_by_category: { [category: string]: PublicService[] }
  booking_settings: BookingSettings
}

export interface AvailabilitySlot {
  start_datetime: string
  end_datetime: string
  start_time: string
  end_time: string
  professional_id: string
  professional_name: string
  duration_minutes: number
}

export interface DayAvailability {
  date: string
  weekday: string
  total_slots: number
  slots: AvailabilitySlot[]
}

export interface AvailabilityResponse {
  organization_slug: string
  service: {
    id: string
    name: string
    duration_minutes: number
    price: number
  }
  professional_filter: string | null
  date_range: {
    start_date: string
    end_date: string
    days_ahead: number
  }
  availability: { [date: string]: DayAvailability }
}

export interface ClientData {
  first_name: string
  last_name: string
  email: string
  phone: string
  notes?: string
}

export interface BookingRequest {
  booking_type: 'guest' | 'registered'
  service_id: string
  professional_id: string
  start_datetime: string
  client_data: ClientData
  password?: string
  emergency_contact?: string
  marketing_consent?: boolean
}

export interface BookingResponse {
  success: boolean
  appointment: {
    id: string
    start_datetime: string
    end_datetime: string
    status: string
    service: {
      name: string
      duration_minutes: number
      price: number
    }
    professional: {
      name: string
      specialty: string
    }
    organization: {
      name: string
      address: string
      phone: string
    }
  }
  client: {
    id: string
    type: string
    full_name: string
    email: string
    phone: string
  }
  guest_token?: string
  guest_expires_at?: string
  verification_token?: string
  email_verified?: boolean
}

export interface AppointmentStatus {
  appointment: {
    id: string
    start_datetime: string
    end_datetime: string
    status: string
    status_display: string
    notes: string
    can_be_cancelled: boolean
    time_until_appointment: string
    service_name: string
    service_duration: number
    service_price: number
    service_category: string
    professional_name: string
    professional_specialty: string
    organization_name: string
    organization_address: string
    organization_phone: string
    client_name: string
    client_phone: string
    client_type: string
  }
  client: {
    full_name: string
    email: string
    phone: string
    type: string
  }
}

export interface ClientLoginRequest {
  email: string
  password: string
}

export interface ClientLoginResponse {
  success: boolean
  token: string
  client: {
    id: string
    full_name: string
    email: string
    phone: string
    email_verified: boolean
    created_at: string
  }
  organization: {
    name: string
    slug: string
  }
}

// ===== SERVICIO =====

class PublicBookingService {
  private static instance: PublicBookingService
  private readonly baseUrl = '/public/booking'

  static getInstance(): PublicBookingService {
    if (!PublicBookingService.instance) {
      PublicBookingService.instance = new PublicBookingService()
    }
    return PublicBookingService.instance
  }

  // ===== MÉTODOS PRINCIPALES =====

  async getOrganizationDetail(slug: string): Promise<PublicOrganizationDetail> {
    try {
      const response = await api.get(`${this.baseUrl}/org/${slug}/`)
      return response.data
    } catch (error) {
      console.error('Error al obtener detalles de organización:', error)
      throw new Error('Error al cargar los detalles de la organización')
    }
  }

  async getAvailability(
    orgSlug: string,
    serviceId: string,
    professionalId?: string,
    date?: string,
    daysAhead: number = 7
  ): Promise<AvailabilityResponse> {
    try {
      const params = new URLSearchParams({
        service_id: serviceId,
        days_ahead: daysAhead.toString()
      })

      if (professionalId) {
        params.append('professional_id', professionalId)
      }

      if (date) {
        params.append('date', date)
      }

      const response = await api.get(`${this.baseUrl}/org/${orgSlug}/availability/?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error al obtener disponibilidad:', error)
      throw new Error('Error al cargar la disponibilidad')
    }
  }

  async bookAppointment(orgSlug: string, bookingData: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/org/${orgSlug}/book/`, bookingData)
      return response.data
    } catch (error: any) {
      console.error('Error al reservar cita:', error)
      
      // Extract detailed error message from response
      let errorMessage = 'Error al procesar la reserva'
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.message) {
        errorMessage = error.message
      }
      
      throw new Error(errorMessage)
    }
  }

  async getAppointmentStatus(
    orgSlug: string,
    appointmentId: string,
    guestToken?: string
  ): Promise<AppointmentStatus> {
    try {
      const params = new URLSearchParams()
      if (guestToken) {
        params.append('guest_token', guestToken)
      }

      const response = await api.get(
        `${this.baseUrl}/org/${orgSlug}/appointments/${appointmentId}/?${params.toString()}`
      )
      return response.data
    } catch (error) {
      console.error('Error al obtener estado de cita:', error)
      throw new Error('Error al consultar el estado de la cita')
    }
  }

  async cancelAppointment(
    orgSlug: string,
    appointmentId: string,
    reason?: string,
    guestToken?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const data: { reason: string; guest_token?: string } = {
        reason: reason || 'Cancelada por el cliente'
      }

      if (guestToken) {
        data.guest_token = guestToken
      }

      const response = await api.post(
        `${this.baseUrl}/org/${orgSlug}/appointments/${appointmentId}/cancel/`,
        data
      )
      return response.data
    } catch (error) {
      console.error('Error al cancelar cita:', error)
      throw new Error('Error al cancelar la cita')
    }
  }

  async loginClient(orgSlug: string, credentials: ClientLoginRequest): Promise<ClientLoginResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/org/${orgSlug}/auth/login/`, credentials)
      return response.data
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      throw new Error('Error al iniciar sesión')
    }
  }

  async verifyEmail(
    orgSlug: string,
    email: string,
    verificationToken: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`${this.baseUrl}/org/${orgSlug}/auth/verify-email/`, {
        email,
        verification_token: verificationToken
      })
      return response.data
    } catch (error) {
      console.error('Error al verificar email:', error)
      throw new Error('Error al verificar el email')
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  formatDateTime(dateTimeString: string): string {
    const date = new Date(dateTimeString)
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  formatTime(timeString: string): string {
    const [hours, minutes] = timeString.split(':')
    return `${hours}:${minutes}`
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  getDayName(dateString: string): string {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long'
    }).format(date)
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmada',
      'checked_in': 'Cliente Llegó',
      'in_progress': 'En Proceso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'no_show': 'No Asistió',
      'rescheduled': 'Reprogramada'
    }
    return statusMap[status] || status
  }

  getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'checked_in': 'bg-purple-100 text-purple-800',
      'in_progress': 'bg-orange-100 text-orange-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no_show': 'bg-gray-100 text-gray-800',
      'rescheduled': 'bg-indigo-100 text-indigo-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  isBookingExpired(expirationString: string): boolean {
    const expiration = new Date(expirationString)
    return new Date() > expiration
  }

  // ===== STORAGE HELPERS =====

  saveGuestToken(appointmentId: string, token: string, expiresAt: string): void {
    localStorage.setItem(`guest_token_${appointmentId}`, JSON.stringify({
      token,
      expiresAt
    }))
  }

  getGuestToken(appointmentId: string): string | null {
    const stored = localStorage.getItem(`guest_token_${appointmentId}`)
    if (!stored) return null

    const { token, expiresAt } = JSON.parse(stored)
    if (this.isBookingExpired(expiresAt)) {
      localStorage.removeItem(`guest_token_${appointmentId}`)
      return null
    }

    return token
  }

  saveClientToken(token: string): void {
    localStorage.setItem('client_token', token)
  }

  getClientToken(): string | null {
    return localStorage.getItem('client_token')
  }

  removeClientToken(): void {
    localStorage.removeItem('client_token')
  }

  isClientLoggedIn(): boolean {
    return !!this.getClientToken()
  }
}

export default PublicBookingService.getInstance() 