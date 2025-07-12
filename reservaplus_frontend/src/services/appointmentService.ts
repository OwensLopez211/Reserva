import api from './api'

export interface Appointment {
  id: string
  organization: string
  organization_name: string
  client: string
  client_name: string
  professional: string
  professional_name: string
  service: string
  service_name: string
  start_datetime: string
  end_datetime: string
  duration_minutes: number
  duration_hours: number
  status: 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  status_display: string
  price: string
  notes: string
  internal_notes: string
  is_walk_in: boolean
  requires_confirmation: boolean
  reminder_sent: boolean
  confirmation_sent: boolean
  is_today: boolean
  is_past: boolean
  is_upcoming: boolean
  can_be_cancelled: boolean
  time_until_appointment: string
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface AppointmentCalendar {
  id: string
  client_name: string
  professional_name: string
  service_name: string
  start_datetime: string
  end_datetime: string
  duration_minutes: number
  status: string
  professional_color: string
  is_walk_in: boolean
}

export interface CreateAppointmentData {
  client: string
  professional: string
  service: string
  start_datetime: string
  notes?: string
  is_walk_in?: boolean
  requires_confirmation?: boolean
}

export interface UpdateAppointmentData {
  start_datetime?: string
  notes?: string
  internal_notes?: string
  status?: string
  cancellation_reason?: string
}

export interface AppointmentHistory {
  id: string
  appointment: string
  appointment_info: string
  action: string
  old_values: Record<string, unknown>
  new_values: Record<string, unknown>
  changed_by: string
  changed_by_name: string
  changed_at: string
  notes: string
}

export interface AvailabilitySlot {
  start_time: string
  end_time: string
  duration_minutes: number
  is_available: boolean
  professional_id: string
  professional_name: string
  service_name?: string
}

export interface CalendarFilters {
  date?: string
  start_date?: string
  end_date?: string
  professional?: string
  status?: string
  service?: string
}

class AppointmentService {
  // Obtener todas las citas
  async getAppointments(filters: CalendarFilters = {}): Promise<Appointment[]> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value)
      }
    })
    
    const response = await api.get(`/api/appointments/?${params.toString()}`)
    return response.data.results || response.data
  }

  // Obtener citas para el calendario (optimizado)
  async getCalendarAppointments(filters: CalendarFilters = {}): Promise<AppointmentCalendar[]> {
    const params = new URLSearchParams()
    
    // Mapear los parámetros del frontend a los que espera el backend
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        switch (key) {
          case 'start_date':
            params.append('start', value)
            break
          case 'end_date':
            params.append('end', value)
            break
          case 'professional':
            params.append('professional_id', value)
            break
          case 'service':
            params.append('service_id', value)
            break
          default:
            params.append(key, value)
        }
      }
    })
    
    const response = await api.get(`/api/appointments/calendar/?${params.toString()}`)
    return response.data
  }

  // Obtener citas de hoy
  async getTodayAppointments(): Promise<Appointment[]> {
    const response = await api.get('/api/appointments/today/')
    return response.data.results || response.data
  }

  // Obtener próximas citas
  async getUpcomingAppointments(): Promise<Appointment[]> {
    const response = await api.get('/api/appointments/upcoming/')
    return response.data.results || response.data
  }

  // Obtener una cita específica
  async getAppointment(id: string): Promise<Appointment> {
    const response = await api.get(`/api/appointments/${id}/`)
    return response.data
  }

  // Crear nueva cita
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    const response = await api.post('/api/appointments/', data)
    return response.data
  }

  // Actualizar cita
  async updateAppointment(id: string, data: UpdateAppointmentData): Promise<Appointment> {
    const response = await api.patch(`/api/appointments/${id}/`, data)
    return response.data
  }

  // Eliminar cita
  async deleteAppointment(id: string): Promise<void> {
    await api.delete(`/api/appointments/${id}/`)
  }

  // Confirmar cita
  async confirmAppointment(id: string): Promise<Appointment> {
    const response = await api.post(`/api/appointments/${id}/confirm/`)
    return response.data.appointment
  }

  // Check-in del cliente
  async checkInAppointment(id: string): Promise<Appointment> {
    const response = await api.post(`/api/appointments/${id}/check_in/`)
    return response.data.appointment
  }

  // Iniciar servicio
  async startService(id: string): Promise<Appointment> {
    const response = await api.post(`/api/appointments/${id}/start_service/`)
    return response.data.appointment
  }

  // Completar cita
  async completeAppointment(id: string): Promise<Appointment> {
    const response = await api.post(`/api/appointments/${id}/complete/`)
    return response.data.appointment
  }

  // Cancelar cita
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const response = await api.post(`/api/appointments/${id}/cancel/`, { reason })
    return response.data.appointment
  }

  // Marcar como no show
  async markNoShow(id: string): Promise<Appointment> {
    const response = await api.post(`/api/appointments/${id}/no_show/`)
    return response.data.appointment
  }

  // Obtener historial de una cita
  async getAppointmentHistory(appointmentId: string): Promise<AppointmentHistory[]> {
    const response = await api.get(`/api/appointments/history/?appointment=${appointmentId}`)
    return response.data.results || response.data
  }

  // Obtener disponibilidad de profesionales
  async getAvailability(professionalId: string, date: string, serviceId?: string): Promise<AvailabilitySlot[]> {
    const params = new URLSearchParams({
      professional_id: professionalId,
      date: date
    })
    
    if (serviceId) {
      params.append('service_id', serviceId)
    }
    
    const response = await api.get(`/api/appointments/availability/?${params.toString()}`)
    return response.data.available_slots || []
  }

  // Obtener disponibilidad inteligente
  async getSmartAvailability(professionalId: string, serviceId: string, dateRange: { start: string, end: string }): Promise<AvailabilitySlot[]> {
    const params = new URLSearchParams({
      professional_id: professionalId,
      service_id: serviceId,
      start_date: dateRange.start,
      end_date: dateRange.end
    })
    
    const response = await api.get(`/api/appointments/smart-availability/?${params.toString()}`)
    return response.data.suggestions || []
  }

  // Detectar conflictos de horarios
  async detectConflicts(appointmentData: CreateAppointmentData): Promise<{ has_conflicts: boolean, conflicts: Record<string, unknown>[] }> {
    const response = await api.post('/api/appointments/conflict-detection/', appointmentData)
    return response.data
  }

  // Obtener estadísticas de citas
  async getAppointmentStats(filters: CalendarFilters = {}): Promise<Record<string, unknown>> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value)
      }
    })
    
    const response = await api.get(`/api/appointments/stats/?${params.toString()}`)
    return response.data
  }

  // Utilitarios
  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'checked_in':
        return 'bg-purple-500'
      case 'in_progress':
        return 'bg-orange-500'
      case 'no_show':
        return 'bg-gray-500'
      case 'rescheduled':
        return 'bg-indigo-500'
      default:
        return 'bg-gray-500'
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'pending':
        return 'Pendiente'
      case 'completed':
        return 'Completada'
      case 'cancelled':
        return 'Cancelada'
      case 'checked_in':
        return 'Cliente Llegó'
      case 'in_progress':
        return 'En Proceso'
      case 'no_show':
        return 'No Asistió'
      case 'rescheduled':
        return 'Reprogramada'
      default:
        return 'Desconocido'
    }
  }
}

export default new AppointmentService() 