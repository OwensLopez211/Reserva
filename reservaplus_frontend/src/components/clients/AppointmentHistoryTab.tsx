import React, { useState, useEffect, useMemo } from 'react'
import {
  Calendar,
  Clock,
  User,
  Star,
  Filter,
  Search,
  ChevronDown,
  Eye,
  Edit,
  XCircle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MapPin,
  DollarSign,
  MessageSquare,
  History
} from 'lucide-react'
import appointmentService, { Appointment, CalendarFilters } from '../../services/appointmentService'

interface AppointmentHistoryTabProps {
  clientId: string
}

type StatusFilter = 'all' | 'completed' | 'confirmed' | 'cancelled' | 'pending' | 'no_show'
type SortField = 'start_datetime' | 'service_name' | 'professional_name' | 'status' | 'price'
type SortOrder = 'asc' | 'desc'

const AppointmentHistoryTab: React.FC<AppointmentHistoryTabProps> = ({ clientId }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('start_datetime')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

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

  // Filtered and sorted appointments
  const filteredAndSortedAppointments = useMemo(() => {
    let filtered = [...appointments]

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(appointment =>
        appointment.service_name.toLowerCase().includes(search) ||
        appointment.professional_name.toLowerCase().includes(search) ||
        appointment.notes.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    // Sort appointments
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'start_datetime':
          aValue = new Date(a.start_datetime)
          bValue = new Date(b.start_datetime)
          break
        case 'service_name':
          aValue = a.service_name.toLowerCase()
          bValue = b.service_name.toLowerCase()
          break
        case 'professional_name':
          aValue = a.professional_name.toLowerCase()
          bValue = b.professional_name.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'price':
          aValue = parseFloat(a.price) || 0
          bValue = parseFloat(b.price) || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [appointments, searchTerm, statusFilter, sortField, sortOrder])

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Statistics
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      completed: appointments.filter(a => a.status === 'completed').length,
      confirmed: appointments.filter(a => a.status === 'confirmed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      no_show: appointments.filter(a => a.status === 'no_show').length,
      total_spent: appointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0)
    }
  }, [appointments])

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
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial de citas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-700">Total Citas</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-green-700">Completadas</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-yellow-600">{stats.confirmed}</div>
          <div className="text-sm text-yellow-700">Confirmadas</div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-red-700">Canceladas</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-purple-600">${stats.total_spent.toLocaleString()}</div>
          <div className="text-sm text-purple-700">Total Gastado</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por servicio, profesional o notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completadas</option>
              <option value="confirmed">Confirmadas</option>
              <option value="pending">Pendientes</option>
              <option value="cancelled">Canceladas</option>
              <option value="no_show">No asistió</option>
            </select>
          </div>

          <button
            onClick={loadAppointments}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  onClick={() => handleSort('start_datetime')}
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Fecha y Hora</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${
                      sortField === 'start_datetime' && sortOrder === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('service_name')}
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Servicio</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${
                      sortField === 'service_name' && sortOrder === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('professional_name')}
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Profesional</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${
                      sortField === 'professional_name' && sortOrder === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Estado</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${
                      sortField === 'status' && sortOrder === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('price')}
                  className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center space-x-1">
                    <span>Precio</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${
                      sortField === 'price' && sortOrder === 'desc' ? 'rotate-180' : ''
                    }`} />
                  </div>
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {appointmentService.formatDate(appointment.start_datetime)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {appointmentService.formatTime(appointment.start_datetime)} - {appointmentService.formatTime(appointment.end_datetime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{appointment.service_name}</div>
                    <div className="text-xs text-gray-500">{appointment.duration_minutes} min</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.professional_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(appointment.status)}
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      <span className="text-sm font-medium text-green-600">{appointment.price}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setSelectedAppointment(appointment)}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedAppointments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay citas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron citas con los filtros aplicados.'
                : 'Este cliente aún no tiene citas registradas.'}
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