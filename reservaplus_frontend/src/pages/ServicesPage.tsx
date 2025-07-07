import React, { useState, useEffect } from 'react'
import { 
  Scissors, 
  Plus, 
  Edit3, 
  Trash2, 
  DollarSign, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Power
} from 'lucide-react'

import ServiceModal from '../components/admin/ServiceModal'
import servicesService from '../services/servicesService'
import { 
  Service, 
  ServiceOverview,
  Professional,
  SERVICE_CATEGORIES
} from '../types/services'

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [overview, setOverview] = useState<ServiceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar datos en paralelo usando el servicio
      const [servicesResponse, professionalsData, overviewData] = await Promise.all([
        servicesService.getServices(),
        servicesService.getProfessionals(),
        servicesService.getOverview()
      ])

      setServices(servicesResponse.results || [])
      setProfessionals(professionalsData)
      setOverview(overviewData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateService = () => {
    setSelectedService(null)
    setIsServiceModalOpen(true)
  }

  const handleEditService = (service: Service) => {
    setSelectedService(service)
    setIsServiceModalOpen(true)
  }

  const handleDeleteService = async (service: Service) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`)) {
      return
    }

    try {
      await servicesService.deleteService(service.id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el servicio')
    }
  }

  const handleToggleServiceStatus = async (service: Service) => {
    try {
      await servicesService.toggleServiceStatus(service.id)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar el estado del servicio')
    }
  }

  const handleServiceModalClose = () => {
    setIsServiceModalOpen(false)
    setSelectedService(null)
  }

  const handleServiceSaved = () => {
    loadData()
    handleServiceModalClose()
  }

  // Filtrar servicios
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter

    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && service.is_active) ||
                         (statusFilter === 'inactive' && !service.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="animate-fadeIn p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fadeIn p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-900">Error al cargar los datos</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
              <p className="mt-2 text-gray-600">
                Gestiona los servicios que ofrece tu organización
              </p>
            </div>
            <button
              onClick={handleCreateService}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Nuevo Servicio</span>
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Scissors className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {overview.summary.total_services}
                  </h3>
                  <p className="text-sm text-gray-600">Total Servicios</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {overview.summary.active_services}
                  </h3>
                  <p className="text-sm text-gray-600">Activos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {overview.summary.avg_duration}m
                  </h3>
                  <p className="text-sm text-gray-600">Duración Promedio</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {servicesService.formatPrice(overview.summary.avg_price)}
                  </h3>
                  <p className="text-sm text-gray-600">Precio Promedio</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, descripción o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {SERVICE_CATEGORIES.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Services List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Servicios ({filteredServices.length})
            </h2>
          </div>

          {filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron servicios
              </h3>
              <p className="text-gray-600 mb-4">
                {services.length === 0 
                  ? 'Comienza creando tu primer servicio'
                  : 'Ajusta los filtros para ver más resultados'
                }
              </p>
              {services.length === 0 && (
                <button
                  onClick={handleCreateService}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Crear Primer Servicio
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredServices.map((service) => (
                <ServiceRow
                  key={service.id}
                  service={service}
                  professionals={professionals}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onToggleStatus={handleToggleServiceStatus}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {isServiceModalOpen && (
          <ServiceModal
            isOpen={isServiceModalOpen}
            onClose={handleServiceModalClose}
            service={selectedService}
            onSaved={handleServiceSaved}
          />
        )}
      </div>
    </div>
  )
}

// Componente para cada fila de servicio
interface ServiceRowProps {
  service: Service
  professionals: Professional[]
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onToggleStatus: (service: Service) => void
}

const ServiceRow: React.FC<ServiceRowProps> = ({
  service,
  professionals,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusIcon = () => {
    if (service.is_active) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusText = () => {
    return service.is_active ? 'Activo' : 'Inactivo'
  }

  const getStatusColor = () => {
    return service.is_active 
      ? 'text-green-600 bg-green-50' 
      : 'text-red-600 bg-red-50'
  }

  const getCategoryName = () => {
    return servicesService.getCategoryName(service.category)
  }

  const getAssignedProfessionals = () => {
    return professionals.filter(prof => 
      service.professionals.includes(prof.id)
    )
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="h-12 w-12 rounded-lg bg-blue-500 flex items-center justify-center">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {service.name}
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {getCategoryName()}
              </span>
            </div>
            
            {service.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {service.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{servicesService.formatDuration(service.duration_minutes)}</span>
                {(service.buffer_time_before > 0 || service.buffer_time_after > 0) && (
                  <span className="text-xs">
                    (+{service.buffer_time_before + service.buffer_time_after}m buffer)
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4" />
                <span className="font-medium">
                  {servicesService.formatPrice(service.price)}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{service.professionals_count} profesional(es)</span>
              </div>
            </div>

            {/* Professionals assigned */}
            {getAssignedProfessionals().length > 0 && (
              <div className="mt-2 flex items-center space-x-2">
                <span className="text-xs text-gray-500">Asignado a:</span>
                <div className="flex space-x-1">
                  {getAssignedProfessionals().slice(0, 3).map((prof) => (
                    <span
                      key={prof.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {prof.name}
                    </span>
                  ))}
                  {getAssignedProfessionals().length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      +{getAssignedProfessionals().length - 3} más
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 ml-4">
          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(service)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Editar servicio"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onToggleStatus(service)}
              className={`p-2 rounded-md transition-colors ${
                service.is_active
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
              title={service.is_active ? 'Desactivar servicio' : 'Activar servicio'}
            >
              <Power className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        // TODO: Implementar ver detalles
                        setShowMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Ver detalles</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete(service)
                        setShowMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesPage 