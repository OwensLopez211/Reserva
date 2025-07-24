import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Plus,
  RefreshCw,
  X
} from 'lucide-react'
import paymentService, { 
  PaymentSummary, 
  SubscriptionStatus, 
  PaymentMethod,
  Payment
} from '../../services/paymentService'
import PaymentMethodCard from './PaymentMethodCard'

interface PaymentDashboardProps {
  className?: string
}

const PaymentDashboard: React.FC<PaymentDashboardProps> = ({ className = '' }) => {
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const dashboardData = await paymentService.getPaymentDashboardData()
      
      setSummary(dashboardData.summary)
      setStatus(dashboardData.status)
      setPaymentMethods(dashboardData.paymentMethods)
      setRecentPayments(dashboardData.recentPayments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos de pagos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'approved':
      case 'authorized':
        return 'text-green-600 bg-green-100'
      case 'pending':
      case 'in_process':
        return 'text-yellow-600 bg-yellow-100'
      case 'rejected':
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Pagos</h2>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error al cargar datos</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Successful Payments */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pagos Exitosos</h3>
                <p className="text-2xl font-bold text-green-600">{summary.successful_payments}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Total recaudado: {paymentService.formatAmount(summary.total_amount_paid)}
            </p>
          </div>

          {/* Next Payment */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Próximo Pago</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {status?.days_until_next_payment || 0} días
                </p>
              </div>
            </div>
            {status?.next_payment_date && (
              <p className="text-sm text-gray-600">
                {paymentService.formatDate(status.next_payment_date)}
              </p>
            )}
          </div>

          {/* Failed Payments */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Pagos Fallidos</h3>
                <p className="text-2xl font-bold text-orange-600">{summary.failed_payments}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Pendientes: {summary.pending_payments}
            </p>
          </div>
        </div>
      )}

      {/* Subscription Status Alert */}
      {status && !status.subscription_active && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Atención requerida</h3>
              <p className="text-yellow-700">
                Tu suscripción no está activa. Por favor, actualiza tu método de pago.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Near Warning */}
      {status && status.subscription_active && status.days_until_next_payment <= 3 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Próximo pago cercano</h3>
              <p className="text-blue-700">
                Tu próximo pago se procesará en {status.days_until_next_payment} días.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Métodos de Pago</h3>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              Agregar
            </button>
          </div>
          
          <div className="space-y-4">
            {paymentMethods.length > 0 ? (
              paymentMethods.map(method => (
                <PaymentMethodCard
                  key={method.id}
                  paymentMethod={method}
                  onUpdate={loadDashboardData}
                  onError={setError}
                />
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 mb-2">No hay métodos de pago configurados</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Agregar método de pago
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Pagos Recientes</h3>
          
          <div className="space-y-3">
            {recentPayments.length > 0 ? (
              recentPayments.map(payment => (
                <div
                  key={payment.id}
                  className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {paymentService.formatAmount(payment.transaction_amount, payment.currency_id)}
                      </p>
                      <p className="text-sm text-gray-500">{payment.description}</p>
                      <p className="text-xs text-gray-400">
                        {paymentService.formatDateTime(payment.mp_date_approved || payment.created_at)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.mp_status)}`}>
                      {paymentService.getPaymentStatusLabel(payment.mp_status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-2xl">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">No hay pagos recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentDashboard