import api from './api'

// Interfaces para pagos con MercadoPago
export interface PaymentMethod {
  id: string
  card_brand: string
  card_last_four_digits: string
  card_holder_name: string
  expiration_month: number
  expiration_year: number
  is_default: boolean
  is_active: boolean
  created_at: string
}

export interface Payment {
  id: string
  organization_name: string
  transaction_amount: number
  currency_id: string
  description: string
  mp_status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back'
  mp_status_detail: string
  mp_date_created: string
  mp_date_approved: string
  is_processed: boolean
  created_at: string
}

export interface SubscriptionPayment {
  id: string
  organization_name: string
  plan_name: string
  frequency: number
  frequency_type: 'months' | 'days' | 'years'
  transaction_amount: number
  mp_status: 'pending' | 'authorized' | 'paused' | 'cancelled'
  start_date: string
  next_payment_date: string
  is_active: boolean
  created_at: string
}

export interface PaymentPreference {
  preference_id: string
  init_point: string
  sandbox_init_point?: string
  plan: {
    id: string
    name: string
    price: number
  }
}

export interface PaymentSummary {
  total_payments: number
  successful_payments: number
  failed_payments: number
  pending_payments: number
  total_amount_paid: number
  last_payment_date: string | null
  next_payment_date: string | null
  subscription_status: string
}

export interface SubscriptionStatus {
  has_subscription: boolean
  subscription_active: boolean
  plan_name: string
  next_payment_date: string | null
  payment_method_configured: boolean
  last_payment_status: string
  days_until_next_payment: number
}

export interface CreatePaymentPreferenceRequest {
  plan_id: string
  billing_cycle: 'monthly' | 'yearly'
}

export interface SavePaymentMethodRequest {
  card_token: string
}

export interface CreateSubscriptionRequest {
  plan_id: string
  billing_cycle: 'monthly' | 'yearly'
  payment_method_id?: string
}

class PaymentService {
  private static instance: PaymentService

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService()
    }
    return PaymentService.instance
  }

  // Métodos de pago
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await api.get('/api/payments/payment-methods/')
      return response.data.results || response.data
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      throw new Error('Error al obtener métodos de pago')
    }
  }

  async savePaymentMethod(data: SavePaymentMethodRequest): Promise<PaymentMethod> {
    try {
      const response = await api.post('/api/payments/save-payment-method/', data)
      return response.data
    } catch (error) {
      console.error('Error saving payment method:', error)
      throw new Error('Error al guardar método de pago')
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await api.post(`/api/payments/payment-methods/${paymentMethodId}/set_as_default/`)
    } catch (error) {
      console.error('Error setting default payment method:', error)
      throw new Error('Error al establecer método de pago por defecto')
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await api.delete(`/api/payments/payment-methods/${paymentMethodId}/`)
    } catch (error) {
      console.error('Error deleting payment method:', error)
      throw new Error('Error al eliminar método de pago')
    }
  }

  // Preferencias de pago
  async createPaymentPreference(data: CreatePaymentPreferenceRequest): Promise<PaymentPreference> {
    try {
      const response = await api.post('/api/payments/create-preference/', data)
      return response.data
    } catch (error) {
      console.error('Error creating payment preference:', error)
      throw new Error('Error al crear preferencia de pago')
    }
  }

  // Suscripciones
  async createSubscription(data: CreateSubscriptionRequest): Promise<SubscriptionPayment> {
    try {
      const response = await api.post('/api/payments/create-subscription/', data)
      return response.data.subscription
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw new Error('Error al crear suscripción')
    }
  }

  async cancelSubscription(): Promise<void> {
    try {
      await api.post('/api/payments/cancel-subscription/')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw new Error('Error al cancelar suscripción')
    }
  }

  async getSubscriptions(): Promise<SubscriptionPayment[]> {
    try {
      const response = await api.get('/api/payments/subscriptions/')
      return response.data.results || response.data
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      throw new Error('Error al obtener suscripciones')
    }
  }

  // Historial de pagos
  async getPayments(): Promise<Payment[]> {
    try {
      const response = await api.get('/api/payments/payments/')
      return response.data.results || response.data
    } catch (error) {
      console.error('Error fetching payments:', error)
      throw new Error('Error al obtener historial de pagos')
    }
  }

  // Resúmenes y estadísticas
  async getPaymentSummary(): Promise<PaymentSummary> {
    try {
      const response = await api.get('/api/payments/summary/')
      return response.data
    } catch (error) {
      console.error('Error fetching payment summary:', error)
      throw new Error('Error al obtener resumen de pagos')
    }
  }

  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const response = await api.get('/api/payments/subscription-status/')
      return response.data
    } catch (error) {
      console.error('Error fetching subscription status:', error)
      throw new Error('Error al obtener estado de suscripción')
    }
  }

  // Utilidades
  formatAmount(amount: number, currency: string = 'CLP'): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  getPaymentStatusColor(status: string): string {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'authorized': 'bg-green-100 text-green-800',
      'in_process': 'bg-blue-100 text-blue-800',
      'in_mediation': 'bg-orange-100 text-orange-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'refunded': 'bg-purple-100 text-purple-800',
      'charged_back': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  getPaymentStatusLabel(status: string): string {
    const labels = {
      'pending': 'Pendiente',
      'approved': 'Aprobado',
      'authorized': 'Autorizado',
      'in_process': 'En Proceso',
      'in_mediation': 'En Mediación',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado',
      'refunded': 'Reembolsado',
      'charged_back': 'Contracargo'
    }
    return labels[status as keyof typeof labels] || status
  }

  getSubscriptionStatusColor(status: string): string {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'authorized': 'bg-green-100 text-green-800',
      'paused': 'bg-orange-100 text-orange-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  getSubscriptionStatusLabel(status: string): string {
    const labels = {
      'pending': 'Pendiente',
      'authorized': 'Activa',
      'paused': 'Pausada',
      'cancelled': 'Cancelada'
    }
    return labels[status as keyof typeof labels] || status
  }

  getDaysUntilPayment(nextPaymentDate: string): number {
    const today = new Date()
    const paymentDate = new Date(nextPaymentDate)
    const diffTime = paymentDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  isPaymentNear(nextPaymentDate: string, days: number = 3): boolean {
    return this.getDaysUntilPayment(nextPaymentDate) <= days
  }

  // Integración con MercadoPago Checkout Pro
  redirectToCheckout(preferenceId: string, isSandbox: boolean = true): void {
    const baseUrl = isSandbox 
      ? 'https://sandbox.mercadopago.cl/checkout/v1/redirect'
      : 'https://www.mercadopago.cl/checkout/v1/redirect'
    
    const checkoutUrl = `${baseUrl}?pref_id=${preferenceId}`
    window.location.href = checkoutUrl
  }

  // Obtener información completa para el dashboard de pagos
  async getPaymentDashboardData(): Promise<{
    summary: PaymentSummary
    status: SubscriptionStatus
    paymentMethods: PaymentMethod[]
    recentPayments: Payment[]
  }> {
    try {
      const [summary, status, paymentMethods, payments] = await Promise.all([
        this.getPaymentSummary(),
        this.getSubscriptionStatus(),
        this.getPaymentMethods(),
        this.getPayments()
      ])

      return {
        summary,
        status,
        paymentMethods,
        recentPayments: payments.slice(0, 5) // Solo los 5 más recientes
      }
    } catch (error) {
      console.error('Error fetching payment dashboard data:', error)
      throw new Error('Error al obtener datos del dashboard de pagos')
    }
  }
}

export default PaymentService.getInstance()