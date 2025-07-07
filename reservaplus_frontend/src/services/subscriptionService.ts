import api from './api'

// Tipos TypeScript para suscripción
export interface Plan {
  id: string
  name: string
  description: string
  price_monthly: number
  price_yearly: number
  original_price?: number
  max_users: number
  max_professionals: number
  max_receptionists: number
  max_staff: number
  max_services: number
  max_monthly_appointments: number
  max_clients: number
  features: string[]
  supports_integrations: boolean
  supports_advanced_reports: boolean
  supports_multi_location: boolean
  supports_custom_branding: boolean
  priority_support: boolean
  is_popular: boolean
  is_coming_soon: boolean
  color_scheme: string
  badge_text?: string
  discount_text?: string
  yearly_discount_percentage: number
}

export interface OrganizationSubscription {
  id: string
  organization: string
  organization_name: string
  plan: Plan
  billing_cycle: 'monthly' | 'yearly'
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  trial_start?: string
  trial_end?: string
  current_period_start: string
  current_period_end: string
  current_users_count: number
  current_professionals_count: number
  current_receptionists_count: number
  current_staff_count: number
  current_services_count: number
  current_clients_count: number
  current_month_appointments_count: number
  created_at: string
  updated_at: string
}

export interface SubscriptionUsage {
  current_users_count: number
  current_professionals_count: number
  current_receptionists_count: number
  current_staff_count: number
  current_services_count: number
  current_clients_count: number
  current_month_appointments_count: number
  plan_limits: {
    max_users: number
    max_professionals: number
    max_receptionists: number
    max_staff: number
    max_services: number
    max_clients: number
    max_monthly_appointments: number
  }
  usage_percentages: {
    users: number
    professionals: number
    receptionists: number
    staff: number
    services: number
    clients: number
    monthly_appointments: number
  }
  can_add: {
    user: boolean
    professional: boolean
    receptionist: boolean
    staff: boolean
    service: boolean
    client: boolean
    appointment: boolean
  }
}

export interface Invoice {
  id: string
  date: string
  amount: string
  status: 'paid' | 'pending' | 'failed'
  plan_name: string
  billing_cycle: 'monthly' | 'yearly'
  invoice_url?: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank_transfer'
  last_four: string
  brand: string
  expires: string
  is_default: boolean
}

class SubscriptionService {
  private static instance: SubscriptionService
  
  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService()
    }
    return SubscriptionService.instance
  }

  // Obtener información completa de la suscripción
  async getMySubscription(): Promise<OrganizationSubscription> {
    try {
      const response = await api.get('/api/plans/subscription/me/')
      return response.data
    } catch (error) {
      console.error('Error fetching subscription:', error)
      throw new Error('Error al obtener información de la suscripción')
    }
  }

  // Obtener información de uso y límites
  async getSubscriptionUsage(): Promise<SubscriptionUsage> {
    try {
      const response = await api.get('/api/plans/subscription/me/usage/')
      return response.data
    } catch (error) {
      console.error('Error fetching subscription usage:', error)
      throw new Error('Error al obtener uso de la suscripción')
    }
  }

  // Obtener información de la organización con suscripción
  async getOrganizationWithSubscription(): Promise<any> {
    try {
      const response = await api.get('/api/organizations/me/')
      return response.data
    } catch (error) {
      console.error('Error fetching organization with subscription:', error)
      throw new Error('Error al obtener información de la organización')
    }
  }

  // Obtener planes disponibles
  async getAvailablePlans(): Promise<Plan[]> {
    try {
      const response = await api.get('/api/plans/plans/')
      return response.data.results || response.data
    } catch (error) {
      console.error('Error fetching available plans:', error)
      throw new Error('Error al obtener planes disponibles')
    }
  }

  // Obtener historial de facturas (simulado por ahora)
  async getInvoiceHistory(): Promise<Invoice[]> {
    try {
      // Por ahora devolvemos datos simulados
      // En el futuro esto se conectará con el sistema de facturación
      return [
        {
          id: '1',
          date: '15 Ene 2025',
          amount: '$49.990',
          status: 'paid',
          plan_name: 'Plan Profesional',
          billing_cycle: 'monthly'
        },
        {
          id: '2',
          date: '15 Dic 2024',
          amount: '$49.990',
          status: 'paid',
          plan_name: 'Plan Profesional',
          billing_cycle: 'monthly'
        },
        {
          id: '3',
          date: '15 Nov 2024',
          amount: '$49.990',
          status: 'paid',
          plan_name: 'Plan Profesional',
          billing_cycle: 'monthly'
        }
      ]
    } catch (error) {
      console.error('Error fetching invoice history:', error)
      throw new Error('Error al obtener historial de facturas')
    }
  }

  // Obtener métodos de pago (simulado por ahora)
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      // Por ahora devolvemos datos simulados
      return [
        {
          id: '1',
          type: 'card',
          last_four: '4242',
          brand: 'Visa',
          expires: '12/26',
          is_default: true
        }
      ]
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      throw new Error('Error al obtener métodos de pago')
    }
  }

  // Formatear datos de suscripción
  formatSubscriptionData(subscription: OrganizationSubscription) {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
      }).format(amount)
    }

    const getStatusLabel = (status: string) => {
      const labels = {
        'trial': 'Periodo de Prueba',
        'active': 'Activa',
        'past_due': 'Pago Pendiente',
        'cancelled': 'Cancelada',
        'expired': 'Expirada'
      }
      return labels[status as keyof typeof labels] || status
    }

    const getStatusColor = (status: string) => {
      const colors = {
        'trial': 'bg-blue-100 text-blue-800',
        'active': 'bg-green-100 text-green-800',
        'past_due': 'bg-orange-100 text-orange-800',
        'cancelled': 'bg-red-100 text-red-800',
        'expired': 'bg-gray-100 text-gray-800'
      }
      return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    }

    return {
      ...subscription,
      formatted_current_period_start: formatDate(subscription.current_period_start),
      formatted_current_period_end: formatDate(subscription.current_period_end),
      formatted_trial_start: subscription.trial_start ? formatDate(subscription.trial_start) : null,
      formatted_trial_end: subscription.trial_end ? formatDate(subscription.trial_end) : null,
      formatted_price_monthly: formatPrice(subscription.plan.price_monthly),
      formatted_price_yearly: subscription.plan.price_yearly ? formatPrice(subscription.plan.price_yearly) : null,
      status_label: getStatusLabel(subscription.status),
      status_color: getStatusColor(subscription.status),
      is_trial: subscription.status === 'trial',
      is_active: ['trial', 'active'].includes(subscription.status),
      days_until_renewal: this.getDaysUntilRenewal(subscription.current_period_end)
    }
  }

  // Calcular días hasta la renovación
  private getDaysUntilRenewal(renewalDate: string): number {
    const today = new Date()
    const renewal = new Date(renewalDate)
    const diffTime = renewal.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Calcular porcentaje de uso
  calculateUsagePercentage(current: number, max: number): number {
    if (max === 0) return 0
    return Math.round((current / max) * 100)
  }

  // Obtener color de la barra de progreso según el porcentaje
  getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-orange-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Validar si el usuario puede ver información de suscripción
  canViewSubscription(userRole: string): boolean {
    return userRole === 'owner'
  }

  // Obtener información resumida de la suscripción
  async getSubscriptionSummary(): Promise<any> {
    try {
      const [subscription, usage] = await Promise.all([
        this.getMySubscription(),
        this.getSubscriptionUsage()
      ])

      const formatted = this.formatSubscriptionData(subscription)

      return {
        subscription: formatted,
        usage,
        summary: {
          plan_name: subscription.plan.name,
          status: subscription.status,
          next_billing_date: formatted.formatted_current_period_end,
          next_billing_amount: formatted.formatted_price_monthly,
          users_usage: `${usage.current_users_count}/${usage.plan_limits.max_users}`,
          professionals_usage: `${usage.current_professionals_count}/${usage.plan_limits.max_professionals}`,
          services_usage: `${usage.current_services_count}/${usage.plan_limits.max_services}`
        }
      }
    } catch (error) {
      console.error('Error getting subscription summary:', error)
      throw error
    }
  }
}

export default SubscriptionService.getInstance() 