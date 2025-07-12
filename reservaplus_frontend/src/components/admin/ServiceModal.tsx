import React, { useState, useEffect } from 'react'
import { X, Scissors, DollarSign, Clock, Users, AlertCircle } from 'lucide-react'
import servicesService from '../../services/servicesService'
import { 
  ServiceModalProps,
  ServiceData,
  Professional,
  SERVICE_CATEGORIES,
  DURATION_OPTIONS,
  BUFFER_TIME_OPTIONS
} from '../../types/services'

const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  service,
  onSaved
}) => {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])

  const [serviceData, setServiceData] = useState<ServiceData>({
    name: '',
    description: '',
    category: '',
    duration_minutes: 60,
    price: '0',
    buffer_time_before: 0,
    buffer_time_after: 0,
    is_active: true,
    requires_preparation: false,
    professionals: []
  })

  useEffect(() => {
    if (isOpen) {
      loadProfessionals()
      
      if (service) {
        // Editing existing service
        setServiceData({
          name: service.name,
          description: service.description,
          category: service.category,
          duration_minutes: service.duration_minutes,
          price: service.price,
          buffer_time_before: service.buffer_time_before,
          buffer_time_after: service.buffer_time_after,
          is_active: service.is_active,
          requires_preparation: service.requires_preparation,
          professionals: service.professionals
        })
      } else {
        // Creating new service
        setServiceData({
          name: '',
          description: '',
          category: '',
          duration_minutes: 60,
          price: '0',
          buffer_time_before: 0,
          buffer_time_after: 0,
          is_active: true,
          requires_preparation: false,
          professionals: []
        })
      }
    }
  }, [isOpen, service])

  const loadProfessionals = async () => {
    try {
      setLoading(true)
      const professionalsData = await servicesService.getProfessionals()
      setProfessionals(professionalsData.filter(p => p.is_active))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar profesionales')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validar datos
      const validationErrors = servicesService.validateServiceData(serviceData)
      if (validationErrors.length > 0) {
        setError(validationErrors[0])
        return
      }

      if (service) {
        await servicesService.updateService(service.id, serviceData)
      } else {
        await servicesService.createService(serviceData)
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const updateServiceData = (updates: Partial<ServiceData>) => {
    setServiceData(prev => ({ ...prev, ...updates }))
  }

  const handleProfessionalToggle = (professionalId: string) => {
    const isSelected = serviceData.professionals.includes(professionalId)
    if (isSelected) {
      updateServiceData({
        professionals: serviceData.professionals.filter(id => id !== professionalId)
      })
    } else {
      updateServiceData({
        professionals: [...serviceData.professionals, professionalId]
      })
    }
  }

  const formatPrice = (value: string) => {
    // Remover caracteres no numéricos excepto punto
    const numericValue = value.replace(/[^\d.]/g, '')
    return numericValue
  }

  const handlePriceChange = (value: string) => {
    const formatted = formatPrice(value)
    updateServiceData({ price: formatted })
  }

  const totalDuration = servicesService.calculateTotalDuration(
    serviceData.duration_minutes,
    serviceData.buffer_time_before,
    serviceData.buffer_time_after
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Scissors className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {service ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {service ? `Modificar "${service.name}"` : 'Crear un nuevo servicio para tu organización'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  value={serviceData.name}
                  onChange={(e) => updateServiceData({ name: e.target.value })}
                  placeholder="Ej: Corte y Peinado"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={serviceData.category}
                  onChange={(e) => updateServiceData({ category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecciona una categoría</option>
                  {SERVICE_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={serviceData.description}
                onChange={(e) => updateServiceData({ description: e.target.value })}
                placeholder="Describe brevemente en qué consiste este servicio..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Duration and Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración *
                </label>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <select
                    value={serviceData.duration_minutes}
                    onChange={(e) => updateServiceData({ duration_minutes: parseInt(e.target.value) })}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {DURATION_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={serviceData.price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="0"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Precio: {servicesService.formatPrice(serviceData.price)}
                </p>
              </div>
            </div>

            {/* Buffer Times */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de Preparación
                </label>
                <select
                  value={serviceData.buffer_time_before}
                  onChange={(e) => updateServiceData({ buffer_time_before: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BUFFER_TIME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Tiempo antes del servicio para preparación
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de Limpieza
                </label>
                <select
                  value={serviceData.buffer_time_after}
                  onChange={(e) => updateServiceData({ buffer_time_after: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {BUFFER_TIME_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Tiempo después del servicio para limpieza
                </p>
              </div>
            </div>

            {/* Total Duration Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Resumen de Duración</span>
              </div>
              <div className="text-sm text-blue-800">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="block text-blue-600">Preparación</span>
                    <span className="font-medium">{serviceData.buffer_time_before}m</span>
                  </div>
                  <div>
                    <span className="block text-blue-600">Servicio</span>
                    <span className="font-medium">{serviceData.duration_minutes}m</span>
                  </div>
                  <div>
                    <span className="block text-blue-600">Limpieza</span>
                    <span className="font-medium">{serviceData.buffer_time_after}m</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <span className="text-blue-600">Duración Total: </span>
                  <span className="font-bold text-blue-900">
                    {servicesService.formatDuration(totalDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Professionals Assignment */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                <label className="text-sm font-medium text-gray-700">
                  Profesionales que pueden realizar este servicio
                </label>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Cargando profesionales...</p>
                </div>
              ) : professionals.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay profesionales disponibles
                  </h3>
                  <p className="text-gray-600">
                    Primero debes agregar profesionales a tu organización.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {professionals.map((professional) => (
                    <label
                      key={professional.id}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        serviceData.professionals.includes(professional.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={serviceData.professionals.includes(professional.id)}
                        onChange={() => handleProfessionalToggle(professional.id)}
                        className="text-blue-600 focus:ring-blue-500 rounded"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{professional.name}</h4>
                            <p className="text-sm text-gray-600">{professional.email}</p>
                            {professional.specialty && (
                              <p className="text-sm text-gray-500">{professional.specialty}</p>
                            )}
                          </div>
                          {professional.color_code && (
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: professional.color_code }}
                            ></div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={serviceData.requires_preparation}
                  onChange={(e) => updateServiceData({ requires_preparation: e.target.checked })}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Requiere preparación especial
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={serviceData.is_active}
                  onChange={(e) => updateServiceData({ is_active: e.target.checked })}
                  className="text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Servicio activo
                </span>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !serviceData.name.trim() || !serviceData.category}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Scissors className="h-4 w-4" />
            <span>
              {saving ? 'Guardando...' : service ? 'Actualizar Servicio' : 'Crear Servicio'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ServiceModal 