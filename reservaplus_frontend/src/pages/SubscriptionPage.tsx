import React, { useState, useEffect } from 'react'
import { 
  CreditCard, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star,
  TrendingUp,
  Shield,
  RefreshCw,
  ExternalLink
} from 'lucide-react'

import api from '../services/api'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  billing_cycle: 'monthly' | 'yearly'
  max_users: number
  max_professionals: number
  max_services: number
  max_clients: number
  max_receptionists: number
  max_staff: number
  features: string[]
  is_popular: boolean
  is_active: boolean
}

interface Subscription {
  id: string
  organization: string
  plan: Plan
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'unpaid'
  trial_start?: string
  trial_end?: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
  
  // Contadores actuales
  current_users_count: number
  current_professionals_count: number
  current_services_count: number
  current_clients_count: number
  current_receptionists_count: number
  current_staff_count: number
}

interface OrganizationInfo {
  id: string
  name: string
  is_trial: boolean
  trial_ends_at?: string
  subscription?: Subscription
}

const SubscriptionPage: React.FC = () => {
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptionInfo()
  }, [])

  const loadSubscriptionInfo = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener información de la organización
      const orgResponse = await api.get('/api/organizations/me/')
      const orgData = orgResponse.data
      setOrganization(orgData)
      
      if (orgData.subscription) {
        setSubscription(orgData.subscription)
      }

      // Obtener planes disponibles (mock por ahora)
      setAvailablePlans([
        {
          id: 'basic',
          name: 'Básico',
          description: 'Perfecto para emprendedores y pequeños negocios',
          price: 15000,
          billing_cycle: 'monthly',
          max_users: 3,
          max_professionals: 2,
          max_services: 10,
          max_clients: 100,
          max_receptionists: 1,
          max_staff: 2,
          features: [
            'Agenda básica',
            'Gestión de clientes',
            'Recordatorios automáticos',
            'Reportes básicos'
          ],
          is_popular: false,
          is_active: true
        },
        {
          id: 'professional',
          name: 'Profesional',
          description: 'Para equipos en crecimiento con más funcionalidades',
          price: 35000,
          billing_cycle: 'monthly',
          max_users: 10,
          max_professionals: 5,
          max_services: 50,
          max_clients: 500,
          max_receptionists: 2,
          max_staff: 5,
          features: [
            'Todo lo del plan Básico',
            'Múltiples profesionales',
            'Gestión de horarios avanzada',
            'Reportes detallados',
            'Integración con calendario',
            'Notificaciones SMS'
          ],
          is_popular: true,
          is_active: true
        },
        {
          id: 'enterprise',
          name: 'Empresarial',
          description: 'Para empresas grandes con necesidades avanzadas',
          price: 75000,
          billing_cycle: 'monthly',
          max_users: 50,
          max_professionals: 20,
          max_services: 200,
          max_clients: 2000,
          max_receptionists: 5,
          max_staff: 25,
          features: [
            'Todo lo del plan Profesional',
            'Usuarios ilimitados',
            'API personalizada',
            'Soporte prioritario',
            'Análisis avanzados',
            'Integración con sistemas externos',
            'Backup automático'
          ],
          is_popular: false,
          is_active: true
        }
      ])

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar información de suscripción')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      trial: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      canceled: 'bg-red-100 text-red-800',
      unpaid: 'bg-red-100 text-red-800'
    }

    const labels = {
      trial: 'Prueba',
      active: 'Activa',
      past_due: 'Vencida',
      canceled: 'Cancelada',
      unpaid: 'Sin Pagar'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateUsagePercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className="animate-fadeIn p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-lg border p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suscripción</h1>
          <p className="mt-2 text-gray-600">
            Gestiona tu plan y facturación
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Actual */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Plan Actual</h2>
              {subscription && getStatusBadge(subscription.status)}
            </div>

            {subscription ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{subscription.plan.name}</h3>
                    <p className="text-sm text-gray-600">{subscription.plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(subscription.plan.price)}
                    </div>
                    <div className="text-sm text-gray-600">por mes</div>
                  </div>
                </div>

                {organization?.is_trial && organization.trial_ends_at && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Período de Prueba</p>
                        <p className="text-sm text-blue-700">
                          Tu prueba termina el {formatDate(organization.trial_ends_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Información de Facturación</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Período actual:</span>
                      <span className="text-gray-900">
                        {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Próxima facturación:</span>
                      <span className="text-gray-900">{formatDate(subscription.current_period_end)}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Cambiar Plan
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Cancelar Suscripción
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sin suscripción activa</h3>
                <p className="text-gray-600 mb-4">Selecciona un plan para comenzar</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Ver Planes
                </button>
              </div>
            )}
          </div>

          {/* Uso Actual */}
          {subscription && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Uso del Plan</h2>
              
              <div className="space-y-6">
                {[
                  { 
                    label: 'Usuarios', 
                    current: subscription.current_users_count, 
                    max: subscription.plan.max_users,
                    icon: Users
                  },
                  { 
                    label: 'Profesionales', 
                    current: subscription.current_professionals_count, 
                    max: subscription.plan.max_professionals,
                    icon: Users
                  },
                  { 
                    label: 'Servicios', 
                    current: subscription.current_services_count, 
                    max: subscription.plan.max_services,
                    icon: Star
                  },
                  { 
                    label: 'Clientes', 
                    current: subscription.current_clients_count, 
                    max: subscription.plan.max_clients,
                    icon: Users
                  }
                ].map(({ label, current, max, icon: Icon }) => {
                  const percentage = calculateUsagePercentage(current, max)
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{label}</span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {current} / {max}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(percentage)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      {percentage >= 90 && (
                        <p className="text-xs text-red-600 mt-1">
                          Cerca del límite - considera actualizar tu plan
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Última actualización</span>
                  <button
                    onClick={loadSubscriptionInfo}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Planes Disponibles */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Planes Disponibles</h2>
            <p className="text-gray-600">Encuentra el plan perfecto para tu negocio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {availablePlans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-lg border-2 p-6 relative ${
                  plan.is_popular ? 'border-blue-500' : 'border-gray-200'
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 text-xs font-medium rounded-full">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {formatPrice(plan.price)}
                  </div>
                  <div className="text-sm text-gray-600">por mes</div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Usuarios:</span>
                    <span className="font-medium">{plan.max_users}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Profesionales:</span>
                    <span className="font-medium">{plan.max_professionals}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Servicios:</span>
                    <span className="font-medium">{plan.max_services}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Clientes:</span>
                    <span className="font-medium">{plan.max_clients}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Características:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    subscription?.plan.id === plan.id
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : plan.is_popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  disabled={subscription?.plan.id === plan.id}
                >
                  {subscription?.plan.id === plan.id ? 'Plan Actual' : 'Seleccionar Plan'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Seguro y Confiable</h3>
              <p className="text-sm text-gray-600">
                Tus datos están protegidos con encriptación de nivel empresarial
              </p>
            </div>
            
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Escalable</h3>
              <p className="text-sm text-gray-600">
                Cambia de plan en cualquier momento según tus necesidades
              </p>
            </div>
            
            <div className="text-center">
              <ExternalLink className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Soporte 24/7</h3>
              <p className="text-sm text-gray-600">
                Nuestro equipo está disponible para ayudarte cuando lo necesites
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPage 