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
  Power,
  Settings,
  Grid3X3,
  List
} from 'lucide-react'

import ServiceModal from '../components/admin/ServiceModal'
import servicesService from '../services/servicesService'
import { 
  Service, 
  ServiceOverview,
  Professional,
  SERVICE_CATEGORIES
} from '../types/services'

type ViewMode = 'grid' | 'list'

const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [overview, setOverview] = useState<ServiceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal and UI states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  
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
    try {
      // First attempt to delete to check for warnings
      const response = await servicesService.deleteService(service.id)
      
      // If there's a warning, show detailed confirmation
      if (response?.warning) {
        const confirmMessage = `${response.warning}\n\n¿Continuar con la eliminación?`
        if (!confirm(confirmMessage)) {
          return
        }
        
        // Proceed with actual deletion
        await servicesService.forceDeleteService(service.id)
      }
      
      // Reload data after deletion (either direct or forced)
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

  // Filter services
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando servicios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="flex items-center mb-4">
            <XCircle className="h-8 w-8 text-red-600 mr-3" />
            <h3 className="text-xl font-bold text-red-900">Error al cargar</h3>
          </div>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
              <p className="text-gray-600">Gestiona los servicios de tu organización</p>
            </div>
          </div>
          <button
            onClick={handleCreateService}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Nuevo Servicio</span>
          </button>
        </div>

        {/* Quick Stats - Only 2 cards */}
        {overview && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-blue-600">
                    {overview.summary.total_services}
                  </h3>
                  <p className="text-blue-700 font-medium">Total Servicios</p>
                </div>
                <Scissors className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-green-600">
                    {overview.summary.active_services}
                  </h3>
                  <p className="text-green-700 font-medium">Servicios Activos</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and View Controls */}
        <div className="flex items-center justify-between space-x-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar servicios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              <option value="all">Todas las categorías</option>
              {SERVICE_CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {filteredServices.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scissors className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {services.length === 0 ? 'No hay servicios' : 'No se encontraron servicios'}
              </h3>
              <p className="text-gray-600 mb-6">
                {services.length === 0 
                  ? 'Comienza creando tu primer servicio'
                  : 'Ajusta los filtros para ver más resultados'
                }
              </p>
              {services.length === 0 && (
                <button
                  onClick={handleCreateService}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg font-medium"
                >
                  Crear Primer Servicio
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          } pt-6`}>
            {filteredServices.map((service) => (
              viewMode === 'grid' ? (
                <ServiceCard
                  key={service.id}
                  service={service}
                  professionals={professionals}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onToggleStatus={handleToggleServiceStatus}
                />
              ) : (
                <ServiceRow
                  key={service.id}
                  service={service}
                  professionals={professionals}
                  onEdit={handleEditService}
                  onDelete={handleDeleteService}
                  onToggleStatus={handleToggleServiceStatus}
                />
              )
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
  )
}

// Service Card Component (Grid View)
interface ServiceCardProps {
  service: Service
  professionals: Professional[]
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
  onToggleStatus: (service: Service) => void
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  professionals,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const getAssignedProfessionals = () => {
    return professionals.filter(prof => service.professionals.includes(prof.id))
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{service.name}</h3>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {servicesService.getCategoryName(service.category)}
            </span>
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
              <button
                onClick={() => { onEdit(service); setShowMenu(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Edit3 className="h-4 w-4" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => { onToggleStatus(service); setShowMenu(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Power className="h-4 w-4" />
                <span>{service.is_active ? 'Desactivar' : 'Activar'}</span>
              </button>
              <button
                onClick={() => { onDelete(service); setShowMenu(false) }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{service.description}</p>
      )}

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{servicesService.formatDuration(service.duration_minutes)}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm font-medium text-green-600">
            <DollarSign className="h-4 w-4" />
            <span>{servicesService.formatPrice(service.price)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{service.professionals_count} profesional(es)</span>
        </div>
      </div>

      {/* Status and Professionals */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          service.is_active 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${
            service.is_active ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          {service.is_active ? 'Activo' : 'Inactivo'}
        </span>
        
        {getAssignedProfessionals().length > 0 && (
          <div className="flex -space-x-2">
            {getAssignedProfessionals().slice(0, 3).map((prof, index) => (
              <div
                key={prof.id}
                className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white"
                title={prof.name}
              >
                {prof.name.charAt(0)}
              </div>
            ))}
            {getAssignedProfessionals().length > 3 && (
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white">
                +{getAssignedProfessionals().length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Service Row Component (List View) - Compact version
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

  const getAssignedProfessionals = () => {
    return professionals.filter(prof => service.professionals.includes(prof.id))
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-medium text-gray-900 truncate">{service.name}</h3>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {servicesService.getCategoryName(service.category)}
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{servicesService.formatDuration(service.duration_minutes)}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-green-600 font-medium">
                <DollarSign className="h-3 w-3" />
                <span>{servicesService.formatPrice(service.price)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Users className="h-3 w-3" />
                <span>{service.professionals_count} prof.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            service.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {service.is_active ? 'Activo' : 'Inactivo'}
          </span>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit(service)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Edit3 className="h-4 w-4" />
            </button>

            <button
              onClick={() => onToggleStatus(service)}
              className={`p-2 rounded-lg transition-colors ${
                service.is_active
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-green-600 hover:bg-green-50'
              }`}
            >
              <Power className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
                  <button
                    onClick={() => { onDelete(service); setShowMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
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