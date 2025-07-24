import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  Star,
  Settings,
  BarChart3,
  Plus,
  User,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react'
import dashboardService, { DashboardData, DashboardAppointment } from '../../services/dashboardService'

interface LoadingState {
  dashboard: boolean
  appointments: boolean
}

interface ErrorState {
  dashboard: string | null
  appointments: string | null
}

const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([])
  const [loading, setLoading] = useState<LoadingState>({
    dashboard: true,
    appointments: true
  })
  const [error, setError] = useState<ErrorState>({
    dashboard: null,
    appointments: null
  })
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Load dashboard data
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(prev => ({ ...prev, dashboard: true }))
      setError(prev => ({ ...prev, dashboard: null }))
      
      const data = await dashboardService.getDashboardStats(forceRefresh)
      setDashboardData(data)
      setAppointments(data.upcoming_appointments)
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(prev => ({ ...prev, dashboard: 'Error al cargar datos del dashboard' }))
    } finally {
      setLoading(prev => ({ ...prev, dashboard: false, appointments: false }))
    }
  }, [])

  // Load filtered appointments
  const loadFilteredAppointments = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, appointments: true }))
      setError(prev => ({ ...prev, appointments: null }))
      
      const today = new Date().toISOString().split('T')[0]
      const filtered = await dashboardService.getFilteredAppointments(
        today,
        statusFilter,
        searchTerm
      )
      setAppointments(filtered)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setError(prev => ({ ...prev, appointments: 'Error al cargar citas' }))
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }))
    }
  }, [statusFilter, searchTerm])

  // Initial load
  useEffect(() => {
    loadDashboardData()
  }, [])

  // Reload appointments when filters change
  useEffect(() => {
    if (dashboardData) {
      loadFilteredAppointments()
    }
  }, [searchTerm, statusFilter, dashboardData])

  // Auto refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      dashboardService.refreshInBackground()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    loadDashboardData(true)
  }, [loadDashboardData])

  // Memoized stats calculation
  const stats = useMemo(() => {
    return dashboardData ? {
      revenue: dashboardData.month_stats.total_revenue,
      monthlyGrowth: dashboardData.month_stats.revenue_growth,
      clients: dashboardData.clients_stats.total_clients,
      newClients: dashboardData.clients_stats.new_clients_this_week,
      todayAppointments: dashboardData.today_stats.total_appointments,
      completedToday: dashboardData.today_stats.completed_appointments,
      occupancy: dashboardData.occupancy_percentage
    } : {
      revenue: 0,
      monthlyGrowth: 0,
      clients: 0,
      newClients: 0,
      todayAppointments: 0,
      completedToday: 0,
      occupancy: 0
    }
  }, [dashboardData])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3" />
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      case 'pending':
        return <AlertCircle className="h-3 w-3" />
      case 'cancelled':
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'completed':
        return 'Completada'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelada'
      default:
        return status
    }
  }

  // Memoized filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      const matchesSearch = appointment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           appointment.professional.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [appointments, searchTerm, statusFilter])

  // Show loading state
  if (loading.dashboard && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error.dashboard && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg mb-4">
            {error.dashboard}
          </div>
          <button
            onClick={() => loadDashboardData(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header minimalista */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-16 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                ¡Hola, {user?.first_name || user?.username}!
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tu negocio desde aquí
              </p>
              {user?.last_login_local && (
                <p className="text-xs text-gray-500 mt-1">
                  Último acceso: {user.last_login_local}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loading.dashboard}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-sm border border-gray-200/50 disabled:opacity-50"
                title="Actualizar datos"
              >
                <RefreshCw className={`h-4 w-4 text-gray-600 ${loading.dashboard ? 'animate-spin' : ''}`} />
                <span className="text-sm text-gray-600">Actualizar</span>
              </button>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <Plus className="h-4 w-4" />
                Nueva Cita
              </button>
              <button className="p-2 bg-white/80 hover:bg-white rounded-xl transition-colors shadow-sm border border-gray-200/50">
                <Settings className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Revenue Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                  stats.monthlyGrowth >= 0 
                    ? 'text-emerald-600 bg-emerald-50' 
                    : 'text-red-600 bg-red-50'
                }`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {dashboardService.formatPercentage(stats.monthlyGrowth)}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Ingresos del mes</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                  {dashboardService.formatCurrency(stats.revenue)}
                </p>
                <p className="text-xs text-gray-500">vs mes anterior</p>
              </div>
            </div>
          </div>

          {/* Clients Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-200">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  <Plus className="h-3 w-3 mr-1" />
                  +{stats.newClients}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Clientes totales</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.clients}</p>
                <p className="text-xs text-gray-500">nuevos esta semana</p>
              </div>
            </div>
          </div>

          {/* Appointments Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-200">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats.completedToday}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Citas hoy</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stats.todayAppointments}</p>
                <p className="text-xs text-gray-500">completadas</p>
              </div>
            </div>
          </div>

          {/* Occupancy Card */}
          <div className="group relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-orange-200">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-full"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div className="flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stats.occupancy}%
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Ocupación</p>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{stats.occupancy}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${stats.occupancy}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table - Full Width */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Citas de Hoy</h3>
                <p className="text-sm text-gray-600 mt-1">Gestiona las citas programadas</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar citas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                >
                  <option value="all">Todos los estados</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesional</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{appointment.time}</div>
                      <div className="text-xs text-gray-500">{appointment.duration}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {appointment.client.name.charAt(0)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{appointment.client.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.service}</div>
                      <div className="text-xs text-gray-500">{dashboardService.formatCurrency(appointment.price)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-6 w-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {appointment.professional.name.charAt(0)}
                        </div>
                        <div className="ml-2 text-sm text-gray-900">{appointment.professional.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${dashboardService.getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {dashboardService.getStatusText(appointment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 transition-colors duration-150">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-100">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.id} className="p-4 hover:bg-gray-50/50 transition-colors duration-150">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-sm font-bold text-white">
                          {appointment.client.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {appointment.client.name}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${dashboardService.getStatusColor(appointment.status)} ml-2 flex-shrink-0`}>
                            {getStatusIcon(appointment.status)}
                            {dashboardService.getStatusText(appointment.status)}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {appointment.time} - {appointment.duration}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{appointment.service}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <div className="h-3 w-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mr-2 flex-shrink-0"></div>
                              <span className="truncate">{appointment.professional.name}</span>
                            </div>
                            <div className="flex items-center text-sm font-medium text-green-600 ml-2">
                              <DollarSign className="h-3 w-3 mr-1" />
                              <span>{dashboardService.formatCurrency(appointment.price)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-2">
                      <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150">
                        <Eye className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron citas</h3>
              <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboardPage