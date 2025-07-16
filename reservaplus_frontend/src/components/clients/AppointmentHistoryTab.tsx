import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  User,
  Star,
  Eye,
  XCircle,
  CheckCircle,
  AlertCircle,
  DollarSign,
  MessageSquare,
  MoreVertical,
  Loader2
} from 'lucide-react'
import appointmentService, { Appointment, CalendarFilters } from '../../services/appointmentService'

interface AppointmentHistoryTabProps {
  clientId: string
}

const AppointmentHistoryTab: React.FC<AppointmentHistoryTabProps> = ({ clientId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const loadAppointments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: CalendarFilters = {
        // Note: This would need backend support for client filtering
        // For now, we'll load all appointments and filter client-side
      }
      
      const allAppointments = await appointmentService.getAppointments(filters)
      // Filter appointments for this specific client
      const clientAppointments = allAppointments.filter(appointment => appointment.client === clientId)
      setAppointments(clientAppointments)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setError('Error al cargar el historial de citas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [clientId])

  // Sort appointments by date (most recent first)
  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      return new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()
    })
  }, [appointments])

  const handleDropdownClick = (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation()
    
    if (activeDropdown === appointmentId) {
      setActiveDropdown(null)
      return
    }

    const buttonRect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect()
    if (buttonRect) {
      const top = buttonRect.bottom + window.scrollY + 4
      const left = buttonRect.right - 192 // 192px = w-48 width

      setDropdownPosition({ top, left })
      setActiveDropdown(appointmentId)
    }
  }

  const handleAction = (action: string, appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId)
    
    switch (action) {
      case 'view':
        if (appointment) setSelectedAppointment(appointment)
        break
      // Add more actions as needed
    }
    setActiveDropdown(null)
  }

  // Effect to close dropdown on click outside or scroll
  React.useEffect(() => {
    const handleScroll = () => setActiveDropdown(null)
    const handleResize = () => setActiveDropdown(null)
    
    if (activeDropdown) {
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [activeDropdown])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'confirmed':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'no_show':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const AppointmentDetailModal: React.FC<{ appointment: Appointment, onClose: () => void }> = ({ appointment, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Detalles de la Cita</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Appointment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Fecha y Hora</span>
                </div>
                <div className="text-sm text-gray-700">
                  {appointmentService.formatDateTime(appointment.start_datetime)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Duración: {appointment.duration_minutes} minutos
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Servicio</span>
                </div>
                <div className="text-sm text-gray-700">{appointment.service_name}</div>
                <div className="flex items-center space-x-1 mt-1">
                  <DollarSign className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">
                    ${appointment.price}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Profesional</span>
                </div>
                <div className="text-sm text-gray-700">{appointment.professional_name}</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusIcon(appointment.status)}
                  <span className="font-medium text-gray-900">Estado</span>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  appointment.status === 'no_show' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {appointment.status_display}
                </span>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Notas del Cliente</span>
                </div>
                <div className="text-sm text-blue-800">{appointment.notes}</div>
              </div>
            )}

            {/* Internal Notes */}
            {appointment.internal_notes && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                  <span className="font-medium text-amber-900">Notas Internas</span>
                </div>
                <div className="text-sm text-amber-800">{appointment.internal_notes}</div>
              </div>
            )}

            {/* Cancellation Info */}
            {appointment.status === 'cancelled' && appointment.cancellation_reason && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-900">Razón de Cancelación</span>
                </div>
                <div className="text-sm text-red-800">{appointment.cancellation_reason}</div>
                {appointment.cancelled_at && (
                  <div className="text-xs text-red-600 mt-1">
                    Cancelada el {appointmentService.formatDateTime(appointment.cancelled_at)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Cargando historial de citas...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Clean Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha y Hora
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Servicio
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Profesional
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">
                      {appointmentService.formatDate(appointment.start_datetime)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointmentService.formatTime(appointment.start_datetime)} - {appointmentService.formatTime(appointment.end_datetime)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900">{appointment.service_name}</div>
                    <div className="text-sm text-gray-500">{appointment.duration_minutes} min</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm mr-3">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{appointment.professional_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(appointment.status)}
                      <span className={`ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-700 border border-red-200' :
                        appointment.status === 'no_show' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                        'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        {appointment.status_display}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm font-medium text-green-600">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>{appointment.price}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative">
                      <button
                        onClick={(e) => handleDropdownClick(e, appointment.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                      
                      {activeDropdown === appointment.id && (
                        <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}>
                          <div 
                            className="absolute w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40"
                            style={{
                              top: `${dropdownPosition.top}px`,
                              left: `${dropdownPosition.left}px`
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleAction('view', appointment.id)}
                              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <Eye className="h-4 w-4 mr-3 text-gray-500" />
                              Ver detalles
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-100">
            {sortedAppointments.map((appointment) => (
              <div key={appointment.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">
                          {appointment.service_name}
                        </h3>
                        <div className="flex items-center ml-2">
                          {getStatusIcon(appointment.status)}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">
                            {appointmentService.formatDate(appointment.start_datetime)} - {appointmentService.formatTime(appointment.start_datetime)}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{appointment.professional_name}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <DollarSign className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-green-600">{appointment.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative ml-2">
                    <button
                      onClick={(e) => handleDropdownClick(e, appointment.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {activeDropdown === appointment.id && (
                      <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}>
                        <div 
                          className="absolute w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAction('view', appointment.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <Eye className="h-4 w-4 mr-3 text-gray-500" />
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {sortedAppointments.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas</h3>
            <p className="mt-1 text-sm text-gray-500">
              Este cliente aún no tiene citas registradas.
            </p>
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  )
}

export default AppointmentHistoryTab