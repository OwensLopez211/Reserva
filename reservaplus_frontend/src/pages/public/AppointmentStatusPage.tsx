import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Copy,
  RefreshCw
} from 'lucide-react'
import publicBookingService, { AppointmentStatus } from '../../services/publicBookingService'

const AppointmentStatusPage: React.FC = () => {
  const { orgSlug, appointmentId } = useParams<{ orgSlug: string; appointmentId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [appointment, setAppointment] = useState<AppointmentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancelForm, setShowCancelForm] = useState(false)

  const guestToken = searchParams.get('token')

  useEffect(() => {
    if (orgSlug && appointmentId) {
      loadAppointmentStatus()
    }
  }, [orgSlug, appointmentId, guestToken])

  const loadAppointmentStatus = async () => {
    if (!orgSlug || !appointmentId) return

    try {
      setLoading(true)
      setError(null)
      
      const data = await publicBookingService.getAppointmentStatus(
        orgSlug,
        appointmentId,
        guestToken || undefined
      )
      
      setAppointment(data)
    } catch (error) {
      console.error('Error loading appointment status:', error)
      setError('Error al cargar el estado de la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!orgSlug || !appointmentId || !appointment) return

    try {
      setCancelling(true)
      
      await publicBookingService.cancelAppointment(
        orgSlug,
        appointmentId,
        cancelReason || 'Cancelada por el cliente',
        guestToken || undefined
      )
      
      // Recargar el estado de la cita
      await loadAppointmentStatus()
      setShowCancelForm(false)
      setCancelReason('')
    } catch (error) {
      console.error('Error cancelling appointment:', error)
      setError('Error al cancelar la cita')
    } finally {
      setCancelling(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Aquí podrías mostrar una notificación de "copiado"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'checked_in':
        return <CheckCircle className="h-5 w-5 text-purple-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-orange-600" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'no_show':
        return <XCircle className="h-5 w-5 text-gray-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDateTime = (dateTimeString: string): string => {
    return publicBookingService.formatDateTime(dateTimeString)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información de la cita...</p>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al cargar la cita
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'No se pudo cargar la información de la cita'}
          </p>
          <div className="space-y-2">
            <button
              onClick={loadAppointmentStatus}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al inicio
            </button>
            
            <button
              onClick={loadAppointmentStatus}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary-50 px-6 py-4 border-b border-primary-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-primary-900">
                  Estado de tu Cita
                </h1>
                <p className="text-sm text-primary-700 mt-1">
                  ID: {appointment.appointment.id}
                </p>
              </div>
              <button
                onClick={() => copyToClipboard(appointment.appointment.id)}
                className="p-2 hover:bg-primary-100 rounded-lg"
                title="Copiar ID de la cita"
              >
                <Copy className="h-4 w-4 text-primary-600" />
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {getStatusIcon(appointment.appointment.status)}
              <div>
                <h3 className="font-semibold text-gray-900">
                  {appointment.appointment.status_display}
                </h3>
                {appointment.appointment.time_until_appointment && (
                  <p className="text-sm text-gray-600">
                    {appointment.appointment.time_until_appointment}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="px-6 py-6">
            <h3 className="font-semibold text-gray-900 mb-4">Detalles de la Cita</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Fecha y Hora</p>
                    <p className="text-sm text-gray-600">
                      {formatDateTime(appointment.appointment.start_datetime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Duración</p>
                    <p className="text-sm text-gray-600">
                      {appointment.appointment.service_duration} minutos
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Profesional</p>
                    <p className="text-sm text-gray-600">
                      {appointment.appointment.professional_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {appointment.appointment.professional_specialty}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-900 mb-2">Servicio</p>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900">
                      {appointment.appointment.service_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {appointment.appointment.service_category}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {publicBookingService.formatPrice(appointment.appointment.service_price)}
                    </p>
                  </div>
                </div>

                {appointment.appointment.notes && (
                  <div>
                    <p className="font-medium text-gray-900 mb-2">Notas</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      {appointment.appointment.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Organization Info */}
          <div className="px-6 py-6 bg-gray-50 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Información del Establecimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {appointment.appointment.organization_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {appointment.appointment.organization_address}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {appointment.appointment.organization_phone}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="px-6 py-6 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Información del Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-600">{appointment.client.full_name}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-600">{appointment.client.email}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-600">{appointment.client.phone}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Cliente {appointment.client.type === 'guest' ? 'Invitado' : 'Registrado'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {appointment.appointment.can_be_cancelled && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              {!showCancelForm ? (
                <button
                  onClick={() => setShowCancelForm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Cancelar Cita
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de cancelación (opcional)
                    </label>
                    <textarea
                      id="cancelReason"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Describe el motivo de la cancelación..."
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelAppointment}
                      disabled={cancelling}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelForm(false)
                        setCancelReason('')
                      }}
                      className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Important Information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Llega 10 minutos antes de tu cita</li>
            <li>• Si necesitas hacer cambios, contacta directamente al establecimiento</li>
            <li>• Guarda esta página como referencia</li>
            {appointment.client.type === 'guest' && (
              <li>• Este enlace expirará en 24 horas desde la creación de la cita</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AppointmentStatusPage 