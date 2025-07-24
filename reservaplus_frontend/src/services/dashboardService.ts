// dashboardService.ts
import api from './api'

export interface DashboardAppointment {
  id: string
  time: string
  client: {
    name: string
    id: string
  }
  service: string
  professional: {
    name: string
    id: string
  }
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  duration: string
  price: number
}

export interface TodayStats {
  total_appointments: number
  completed_appointments: number
  confirmed_appointments: number
  pending_appointments: number
  cancelled_appointments: number
  no_show_appointments: number
  total_revenue: number
  avg_duration: number
}

export interface MonthStats {
  total_appointments: number
  completed_appointments: number
  total_revenue: number
  revenue_growth: number
  avg_duration: number
}

export interface ClientsStats {
  total_clients: number
  active_clients: number
  new_clients_this_week: number
}

export interface ProfessionalsStats {
  total_professionals: number
  active_professionals: number
}

export interface PopularService {
  service__name: string
  appointment_count: number
  total_revenue: number
}

export interface ActiveProfessional {
  professional__name: string
  appointment_count: number
  total_revenue: number
}

export interface DailyTrend {
  date: string
  appointments: number
  completed: number
  revenue: number
}

export interface DashboardData {
  organization: {
    id: string
    name: string
    industry: string
  }
  today_stats: TodayStats
  month_stats: MonthStats
  clients_stats: ClientsStats
  professionals_stats: ProfessionalsStats
  occupancy_percentage: number
  popular_services: PopularService[]
  active_professionals: ActiveProfessional[]
  daily_trends: DailyTrend[]
  upcoming_appointments: DashboardAppointment[]
  generated_at: string
}

export interface DashboardCache {
  data: DashboardData
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class DashboardService {
  private cache: DashboardCache | null = null
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Get dashboard statistics with caching
   */
  async getDashboardStats(forceRefresh: boolean = false): Promise<DashboardData> {
    // Check cache first
    if (!forceRefresh && this.cache && this.isCacheValid()) {
      console.log('DashboardService: Using cached data')
      return this.cache.data
    }

    try {
      console.log('DashboardService: Fetching fresh data from API')
      const response = await api.get('/api/appointments/dashboard_stats/')
      const data: DashboardData = response.data

      // Update cache
      this.cache = {
        data,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      }

      return data
    } catch (error) {
      console.error('DashboardService: Error fetching dashboard stats', error)
      
      // Return cached data if available on error
      if (this.cache) {
        console.log('DashboardService: Returning stale cached data due to error')
        return this.cache.data
      }
      
      throw error
    }
  }

  /**
   * Get today's appointments only
   */
  async getTodayAppointments(): Promise<DashboardAppointment[]> {
    try {
      const response = await api.get('/appointments/today/')
      return response.data.map(this.mapAppointmentToDashboard)
    } catch (error) {
      console.error('DashboardService: Error fetching today appointments', error)
      throw error
    }
  }

  /**
   * Get filtered dashboard appointments
   */
  async getFilteredAppointments(
    date: string,
    status?: string,
    search?: string
  ): Promise<DashboardAppointment[]> {
    try {
      const params = new URLSearchParams({
        start: date,
        end: date
      })
      
      if (status && status !== 'all') {
        params.append('status', status)
      }

      const response = await api.get(`/appointments/calendar/?${params}`)
      let appointments = response.data.map(this.mapAppointmentToDashboard)

      // Apply search filter client-side
      if (search) {
        const searchLower = search.toLowerCase()
        appointments = appointments.filter(apt => 
          apt.client.name.toLowerCase().includes(searchLower) ||
          apt.service.toLowerCase().includes(searchLower) ||
          apt.professional.name.toLowerCase().includes(searchLower)
        )
      }

      return appointments
    } catch (error) {
      console.error('DashboardService: Error fetching filtered appointments', error)
      throw error
    }
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache = null
    console.log('DashboardService: Cache cleared')
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false
    
    const now = Date.now()
    const isValid = (now - this.cache.timestamp) < this.cache.ttl
    
    if (!isValid) {
      console.log('DashboardService: Cache expired')
    }
    
    return isValid
  }

  /**
   * Map appointment API response to dashboard format
   */
  private mapAppointmentToDashboard(appointment: any): DashboardAppointment {
    return {
      id: appointment.id,
      time: appointment.start_datetime ? 
        new Date(appointment.start_datetime).toLocaleTimeString('es-CL', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : 
        appointment.time,
      client: {
        name: appointment.client_name || appointment.client?.name || 'Cliente',
        id: appointment.client || appointment.client?.id || ''
      },
      service: appointment.service_name || appointment.service || 'Servicio',
      professional: {
        name: appointment.professional_name || appointment.professional?.name || 'Profesional',
        id: appointment.professional || appointment.professional?.id || ''
      },
      status: appointment.status,
      duration: appointment.duration_minutes ? 
        `${appointment.duration_minutes} min` : 
        appointment.duration || '0 min',
      price: appointment.price || 0
    }
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): { hasCache: boolean; isValid: boolean; age: number } {
    if (!this.cache) {
      return { hasCache: false, isValid: false, age: 0 }
    }

    const age = Date.now() - this.cache.timestamp
    const isValid = this.isCacheValid()

    return { hasCache: true, isValid, age }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Format percentage for display
   */
  formatPercentage(value: number): string {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  /**
   * Get status color classes
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  /**
   * Get status text in Spanish
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'completed':
        return 'Completada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      case 'no_show':
        return 'No asistió'
      default:
        return status
    }
  }

  /**
   * Refresh dashboard data in background
   */
  async refreshInBackground(): Promise<void> {
    try {
      await this.getDashboardStats(true)
      console.log('DashboardService: Background refresh completed')
    } catch (error) {
      console.error('DashboardService: Background refresh failed', error)
    }
  }
}

// Export singleton instance
const dashboardService = new DashboardService()
export default dashboardService