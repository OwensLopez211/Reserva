import React, { useState, useEffect } from 'react'
import { X, Calendar, User, Scissors, AlertCircle, CheckCircle } from 'lucide-react'
import appointmentService, { CreateAppointmentData, Appointment } from '../../services/appointmentService'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointment: Appointment) => void
  appointment?: Appointment | null
  initialDate?: string
  initialTime?: string
  professionalId?: string
}

interface FormData {
  client: string
  professional: string
  service: string
  start_datetime: string
  notes: string
  is_walk_in: boolean
  requires_confirmation: boolean
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  appointment,
  initialDate,
  initialTime,
  professionalId
}) => {
  const [formData, setFormData] = useState<FormData>({
    client: '',
    professional: professionalId || '',
    service: '',
    start_datetime: '',
    notes: '',
    is_walk_in: false,
    requires_confirmation: false
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Datos de ejemplo para los selectores
  const [clients] = useState([
    { id: '1', name: 'María González' },
    { id: '2', name: 'Juan Pérez' },
    { id: '3', name: 'Ana Martínez' },
    { id: '4', name: 'Carlos López' }
  ])
  
  const [professionals] = useState([
    { id: '1', name: 'Owens López' },
    { id: '2', name: 'María Rodríguez' },
    { id: '3', name: 'Carlos Silva' },
    { id: '4', name: 'Ana Martínez' }
  ])
  
  const [services] = useState([
    { id: '1', name: 'Corte y Peinado', duration: 60, price: 25000 },
    { id: '2', name: 'Corte Básico', duration: 30, price: 15000 },
    { id: '3', name: 'Barba', duration: 30, price: 12000 },
    { id: '4', name: 'Coloración', duration: 120, price: 45000 }
  ])

  // Inicializar formulario
  useEffect(() => {
    if (appointment) {
      // Modo edición
      setFormData({
        client: appointment.client,
        professional: appointment.professional,
        service: appointment.service,
        start_datetime: appointment.start_datetime,
        notes: appointment.notes,
        is_walk_in: appointment.is_walk_in,
        requires_confirmation: appointment.requires_confirmation
      })
    } else if (initialDate && initialTime) {
      // Modo creación con fecha inicial
      const dateTime = new Date(`${initialDate}T${initialTime}:00`)
      setFormData(prev => ({
        ...prev,
        start_datetime: dateTime.toISOString().slice(0, 16),
        professional: professionalId || ''
      }))
    }
  }, [appointment, initialDate, initialTime, professionalId])

  // Limpiar mensajes cuando se cierre el modal
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSuccess(null)
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validar campos requeridos
      if (!formData.client || !formData.professional || !formData.service || !formData.start_datetime) {
        throw new Error('Por favor completa todos los campos requeridos')
      }

      if (appointment) {
        // Actualizar cita existente
        const updatedAppointment = await appointmentService.updateAppointment(appointment.id, {
          start_datetime: formData.start_datetime,
          notes: formData.notes
        })
        
        setSuccess('Cita actualizada exitosamente')
        onSave(updatedAppointment)
      } else {
        // Crear nueva cita
        const createData: CreateAppointmentData = {
          client: formData.client,
          professional: formData.professional,
          service: formData.service,
          start_datetime: formData.start_datetime,
          notes: formData.notes,
          is_walk_in: formData.is_walk_in,
          requires_confirmation: formData.requires_confirmation
        }
        
        const newAppointment = await appointmentService.createAppointment(createData)
        
        setSuccess('Cita creada exitosamente')
        onSave(newAppointment)
      }

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error saving appointment:', error)
      setError(error instanceof Error ? error.message : 'Error al guardar la cita')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return ''
    
    const date = new Date(dateTimeString)
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSelectedService = () => {
    return services.find(s => s.id === formData.service)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mensajes de estado */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-green-800 text-sm">{success}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cliente */}
            <div>
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Cliente *
              </label>
              <select
                id="client"
                name="client"
                value={formData.client}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccionar cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Profesional */}
            <div>
              <label htmlFor="professional" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-2" />
                Profesional *
              </label>
              <select
                id="professional"
                name="professional"
                value={formData.professional}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccionar profesional</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Servicio */}
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                <Scissors className="h-4 w-4 inline mr-2" />
                Servicio *
              </label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Seleccionar servicio</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} - {service.duration}min - ${service.price.toLocaleString()}
                  </option>
                ))}
              </select>
              {getSelectedService() && (
                <div className="mt-2 text-sm text-gray-600">
                  Duración: {getSelectedService()?.duration} minutos | Precio: ${getSelectedService()?.price.toLocaleString()}
                </div>
              )}
            </div>

            {/* Fecha y hora */}
            <div>
              <label htmlFor="start_datetime" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-2" />
                Fecha y Hora *
              </label>
              <input
                type="datetime-local"
                id="start_datetime"
                name="start_datetime"
                value={formData.start_datetime}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {formData.start_datetime && (
                <div className="mt-2 text-sm text-gray-600">
                  {formatDateTime(formData.start_datetime)}
                </div>
              )}
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Notas adicionales sobre la cita..."
              />
            </div>

            {/* Opciones adicionales */}
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_walk_in"
                  name="is_walk_in"
                  checked={formData.is_walk_in}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_walk_in" className="ml-2 block text-sm text-gray-900">
                  Cliente sin cita previa (Walk-in)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requires_confirmation"
                  name="requires_confirmation"
                  checked={formData.requires_confirmation}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="requires_confirmation" className="ml-2 block text-sm text-gray-900">
                  Requiere confirmación del cliente
                </label>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                <span>{appointment ? 'Actualizar' : 'Crear'} Cita</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AppointmentModal 