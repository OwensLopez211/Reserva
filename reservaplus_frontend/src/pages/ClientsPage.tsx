import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  Plus,
  Users,
  ChevronDown,
  RefreshCw,
  UserCheck
} from 'lucide-react'
import clientService, { Client, ClientFilters, ClientLimitsInfo } from '../services/clientService'
import ClientTable from '../components/clients/ClientTable'

type ViewMode = 'grid' | 'table' | 'list'
type SortField = 'name' | 'email' | 'created_at' | 'appointments_count' | 'client_type'
type SortOrder = 'asc' | 'desc'

const ClientsPage: React.FC = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // const [viewMode, setViewMode] = useState<ViewMode>('table') // TODO: implement other view modes
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [limitsInfo, setLimitsInfo] = useState<ClientLimitsInfo | null>(null)
  
  // Filters
  const [selectedClientType, setSelectedClientType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Dropdown state for table actions
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  // Load clients
  const loadClients = async () => {
    try {
      setLoading(true)
      
      const filters: ClientFilters = {}
      
      if (selectedClientType !== 'all') {
        filters.client_type = selectedClientType
      }
      
      if (selectedStatus !== 'all') {
        filters.is_active = selectedStatus === 'active'
      }
      
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim()
      }
      
      const clientsData = await clientService.getClients(filters)
      setClients(clientsData)
      setError(null)
    } catch (error) {
      console.error('Error loading clients:', error)
      setError('Error al cargar los clientes')
    } finally {
      setLoading(false)
    }
  }

  // Load limits info
  const loadLimitsInfo = async () => {
    try {
      const limits = await clientService.getClientsLimitsInfo()
      setLimitsInfo(limits)
    } catch (error) {
      console.error('Error loading limits:', error)
    }
  }

  // Filtered and sorted clients
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients]

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortField) {
        case 'name':
          aValue = a.full_name.toLowerCase()
          bValue = b.full_name.toLowerCase()
          break
        case 'email':
          aValue = a.email.toLowerCase()
          bValue = b.email.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'appointments_count':
          aValue = a.appointments_count
          bValue = b.appointments_count
          break
        case 'client_type':
          aValue = a.client_type
          bValue = b.client_type
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [clients, sortField, sortOrder])

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // Client action handlers
  const handleEditClient = (client: Client) => {
    // TODO: Implement edit client modal
    console.log('Edit client:', client)
  }

  const handleDeleteClient = (clientId: string) => {
    // TODO: Implement delete confirmation
    console.log('Delete client:', clientId)
  }

  const handleToggleClientStatus = (clientId: string) => {
    // TODO: Implement toggle client status
    console.log('Toggle client status:', clientId)
  }

  // Client type stats
  const clientTypeStats = useMemo(() => {
    const stats = {
      total: clients.length,
      internal: clients.filter(c => c.client_type === 'internal').length,
      registered: clients.filter(c => c.client_type === 'registered').length,
      guest: clients.filter(c => c.client_type === 'guest').length,
      active: clients.filter(c => c.is_active).length,
      inactive: clients.filter(c => !c.is_active).length
    }
    return stats
  }, [clients])

  // Effects
  useEffect(() => {
    loadClients()
    loadLimitsInfo()
  }, [selectedClientType, selectedStatus, searchTerm])

  // Header component
  const ClientsHeader = () => (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
                <p className="text-sm text-gray-500">
                  Gestiona los clientes de tu organización
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadClients}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>

            <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{clientTypeStats.total}</div>
            <div className="text-sm text-blue-700">Total</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
            <div className="text-2xl font-bold text-green-600">{clientTypeStats.registered}</div>
            <div className="text-sm text-green-700">Registrados</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">{clientTypeStats.internal}</div>
            <div className="text-sm text-purple-700">Internos</div>
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl">
            <div className="text-2xl font-bold text-amber-600">{clientTypeStats.guest}</div>
            <div className="text-sm text-amber-700">Invitados</div>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 rounded-xl">
            <div className="text-2xl font-bold text-emerald-600">{clientTypeStats.active}</div>
            <div className="text-sm text-emerald-700">Activos</div>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
            <div className="text-2xl font-bold text-red-600">{clientTypeStats.inactive}</div>
            <div className="text-sm text-red-700">Inactivos</div>
          </div>
        </div>

        {/* Limits Info */}
        {limitsInfo && (
          <div className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="text-sm font-medium text-indigo-900">
                    Plan {limitsInfo.plan_name}
                  </div>
                  <div className="text-xs text-indigo-700">
                    {limitsInfo.current_clients_count} de {limitsInfo.max_clients} clientes utilizados
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-indigo-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((limitsInfo.current_clients_count / limitsInfo.max_clients) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                {!limitsInfo.can_add_more && (
                  <span className="text-xs text-red-600 font-medium">Límite alcanzado</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cliente
                </label>
                <select
                  value={selectedClientType}
                  onChange={(e) => setSelectedClientType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="internal">Clientes Internos</option>
                  <option value="registered">Clientes Registrados</option>
                  <option value="guest">Clientes Invitados</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )


  // Loading state
  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <ClientsHeader />

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <ClientTable 
          clients={filteredAndSortedClients}
          loading={loading}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          onEditClient={handleEditClient}
          onDeleteClient={handleDeleteClient}
          onToggleStatus={handleToggleClientStatus}
          showPagination={false} // Disable pagination for now since we're not implementing it in this basic version
        />
      </div>
    </div>
  )
}

export default ClientsPage