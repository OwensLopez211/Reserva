import React, { useState } from 'react'
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

  Search,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Activity
} from 'lucide-react'

interface Appointment {
  id: string
  time: string
  client: {
    name: string
    avatar?: string
  }
  service: string
  professional: {
    name: string
    avatar?: string
  }
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  duration: string
  price: number
}

const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Datos de ejemplo - en una app real vendrían del backend
  const stats = {
    revenue: 2850000,
    monthlyGrowth: 12,
    clients: 156,
    newClients: 8,
    todayAppointments: 45,
    completedToday: 38,
    occupancy: 78
  }

  const teamStats = {
    totalProfessionals: 8,
    activeToday: 6,
    avgRating: 4.8
  }

  // Datos de ejemplo para las citas
  const appointments: Appointment[] = [
    {
      id: '1',
      time: '09:00',
      client: { name: 'María González' },
      service: 'Corte y Peinado',
      professional: { name: 'Ana Martínez' },
      status: 'confirmed',
      duration: '45 min',
      price: 35000
    },
    {
      id: '2',
      time: '09:30',
      client: { name: 'Carlos Pérez' },
      service: 'Masaje Relajante',
      professional: { name: 'Luis Rodríguez' },
      status: 'completed',
      duration: '60 min',
      price: 45000
    },
    {
      id: '3',
      time: '10:15',
      client: { name: 'Sofia Chen' },
      service: 'Manicure Francesa',
      professional: { name: 'Carla Torres' },
      status: 'pending',
      duration: '30 min',
      price: 25000
    },
    {
      id: '4',
      time: '11:00',
      client: { name: 'Roberto Silva' },
      service: 'Corte Masculino',
      professional: { name: 'Miguel Ángel' },
      status: 'confirmed',
      duration: '30 min',
      price: 20000
    },
    {
      id: '5',
      time: '11:30',
      client: { name: 'Elena Morales' },
      service: 'Tratamiento Facial',
      professional: { name: 'Patricia López' },
      status: 'cancelled',
      duration: '90 min',
      price: 65000
    },
    {
      id: '6',
      time: '14:00',
      client: { name: 'Diego Vargas' },
      service: 'Corte y Barba',
      professional: { name: 'Ana Martínez' },
      status: 'confirmed',
      duration: '45 min',
      price: 40000
    }
  ]

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

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.professional.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header minimalista */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/20 sticky top-16 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                ¡Hola, {user?.first_name || user?.username}! 👋
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
        {/* Métricas principales con glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Ingresos del mes</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                    ${stats.revenue.toLocaleString('es-CL')}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-emerald-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.monthlyGrowth}% vs mes anterior
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Clientes totales</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.clients}</p>
                  <div className="flex items-center mt-2 text-xs text-blue-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +{stats.newClients} nuevos esta semana
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Citas hoy</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.todayAppointments}</p>
                  <div className="flex items-center mt-2 text-xs text-purple-600">
                    <Clock className="h-3 w-3 mr-1" />
                    {stats.completedToday} completadas
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">Ocupación</p>
                  <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.occupancy}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.occupancy}%` }}
                    ></div>
                  </div>
                </div>
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid principal */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Tabla de citas - Ocupa más espacio */}
          <div className="xl:col-span-3">
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

              <div className="overflow-x-auto">
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
                          <div className="text-xs text-gray-500">${appointment.price.toLocaleString('es-CL')}</div>
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
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                            {getStatusIcon(appointment.status)}
                            {getStatusText(appointment.status)}
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

              {filteredAppointments.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron citas</h3>
                  <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="xl:col-span-1 space-y-6">
            {/* Estadísticas del equipo */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Tu Equipo
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profesionales</span>
                  <span className="font-bold text-gray-900">{teamStats.totalProfessionals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Activos hoy</span>
                  <span className="font-bold text-emerald-600">{teamStats.activeToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating promedio</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-bold text-gray-900">{teamStats.avgRating}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Nueva Cita</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-xl transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium text-gray-900">Agregar Cliente</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">Ver Reportes</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                </button>
                
                <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-xl transition-all duration-200 group">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-gray-900">Configurar</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
                </button>
              </div>
            </div>

            {/* Tip del día */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-2">💡 Tip del día</h3>
              <p className="text-indigo-100 text-sm">
                Revisa las citas pendientes y confirma con los clientes para reducir las cancelaciones de último minuto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboardPage