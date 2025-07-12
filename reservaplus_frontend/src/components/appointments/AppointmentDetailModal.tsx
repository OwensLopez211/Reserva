import React, { useState, useEffect } from 'react'
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  FileText,
  Edit,
  History,
  AlertCircle
} from 'lucide-react'
import { Appointment, AppointmentHistory } from '../../services/appointmentService'
import appointmentService from '../../services/appointmentService'
import AppointmentActions from './AppointmentActions'
import AppointmentModal from './AppointmentModal'

interface AppointmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onUpdate: (appointment: Appointment) => void
}

const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<AppointmentHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar historial de la cita
  useEffect(() => {
    if (appointment && isOpen) {
      loadHistory()
    }
  }, [appointment, isOpen])

  const loadHistory = async () => {
    if (!appointment) return
    
    try {
      setLoading(true)
      const historyData = await appointmentService.getAppointmentHistory(appointment.id)
      setHistory(historyData)
      setError(null)
    } catch (error) {
      console.error('Error loading appointment history:', error)
      setError('Error al cargar el historial')
    } finally {
      setLoading(false)
    }
  }

  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    onUpdate(updatedAppointment)
    loadHistory() // Recargar historial después de actualizar
  }

  const handleEdit = () => {
    setShowEditModal(true)
  }

  const handleEditSave = (updatedAppointment: Appointment) => {
    handleAppointmentUpdate(updatedAppointment)
    setShowEditModal(false)
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const color = appointmentService.getStatusColor(status)
    const text = appointmentService.getStatusText(status)
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${color}`}>
        {text}
      </span>
    )
  }

  if (!isOpen || !appointment) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalles de la Cita
              </h2>
              {getStatusBadge(appointment.status)}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Error message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Información principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Información del cliente */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-900">Cliente</h3>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{appointment.client_name}</p>
                </div>

                {/* Información del servicio */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-900">Servicio</h3>
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{appointment.service_name}</p>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{appointment.duration_minutes} minutos</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-4 w-4" />
                      <span>${parseFloat(appointment.price).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Información de fecha y hora */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-medium text-gray-900">Fecha y Hora</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Fecha:</span> {formatDate(appointment.start_datetime)}
                    </div>
                    <div>
                      <span className="font-medium">Hora:</span> {formatTime(appointment.start_datetime)} - {formatTime(appointment.end_datetime)}
                    </div>
                    <div>
                      <span className="font-medium">Duración:</span> {appointment.duration_minutes} minutos
                    </div>
                  </div>
                </div>

                {/* Notas */}
                {(appointment.notes || appointment.internal_notes) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-medium text-gray-900">Notas</h3>
                    </div>
                    {appointment.notes && (
                      <div className="mb-3">
                        <p className="font-medium text-gray-700">Notas del cliente:</p>
                        <p className="text-gray-600">{appointment.notes}</p>
                      </div>
                    )}
                    {appointment.internal_notes && (
                      <div>
                        <p className="font-medium text-gray-700">Notas internas:</p>
                        <p className="text-gray-600">{appointment.internal_notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Historial */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <History className="h-5 w-5 text-gray-500" />
                      <h3 className="text-lg font-medium text-gray-900">Historial</h3>
                    </div>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      {showHistory ? 'Ocultar' : 'Ver historial'}
                    </button>
                  </div>
                  
                  {showHistory && (
                    <div className="space-y-3">
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span className="text-sm text-gray-500">Cargando historial...</span>
                        </div>
                      ) : history.length === 0 ? (
                        <p className="text-sm text-gray-500">No hay historial disponible</p>
                      ) : (
                        history.map((record) => (
                          <div key={record.id} className="border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{record.action}</span>
                              <span className="text-sm text-gray-500">
                                por {record.changed_by_name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatDateTime(record.changed_at)}
                            </p>
                            {record.notes && (
                              <p className="text-sm text-gray-500 mt-1">{record.notes}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de acciones */}
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Acciones</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleEdit}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar Cita</span>
                    </button>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <AppointmentActions
                        appointment={appointment}
                        onUpdate={handleAppointmentUpdate}
                      />
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Información</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Profesional:</span>
                      <p className="text-gray-600">{appointment.professional_name}</p>
                    </div>
                    <div>
                      <span className="font-medium">Creado:</span>
                      <p className="text-gray-600">{formatDateTime(appointment.created_at)}</p>
                    </div>
                    {appointment.updated_at !== appointment.created_at && (
                      <div>
                        <span className="font-medium">Actualizado:</span>
                        <p className="text-gray-600">{formatDateTime(appointment.updated_at)}</p>
                      </div>
                    )}
                    {appointment.cancelled_at && (
                      <div>
                        <span className="font-medium">Cancelado:</span>
                        <p className="text-gray-600">{formatDateTime(appointment.cancelled_at)}</p>
                        {appointment.cancellation_reason && (
                          <p className="text-gray-500 text-xs mt-1">
                            Razón: {appointment.cancellation_reason}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Walk-in:</span>
                      <span className={`text-xs px-2 py-1 rounded ${appointment.is_walk_in ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {appointment.is_walk_in ? 'Sí' : 'No'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Requiere confirmación:</span>
                      <span className={`text-xs px-2 py-1 rounded ${appointment.requires_confirmation ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {appointment.requires_confirmation ? 'Sí' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición */}
      <AppointmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleEditSave}
        appointment={appointment}
      />
    </>
  )
}

export default AppointmentDetailModal 