import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  DollarSign, 
  Users, 
  Calendar, 
  TrendingUp,
  Clock,
  Star,
  Phone,
  Mail,
  Settings,
  BarChart3
} from 'lucide-react'

const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth()

  // Datos de ejemplo - en una app real vendrían del backend
  const stats = {
    revenue: 2850000,
    clients: 156,
    reservations: 45,
    occupancy: 78
  }

  const teamStats = {
    totalProfessionals: 8,
    activeToday: 6,
    avgRating: 4.8
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                ¡Hola, {user?.first_name || user?.username}!
              </h1>
              <p className="text-primary-100 mt-2">
                Bienvenido a tu panel de control
              </p>
              {user?.last_login_local && (
                <p className="text-primary-200 text-sm mt-1">
                  Último acceso: {user.last_login_local}
                </p>
              )}
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </button>
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Reportes</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-6 py-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos del mes</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${stats.revenue.toLocaleString('es-CL')}
                </p>
                <p className="text-xs text-green-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% vs mes anterior
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.clients}</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8 nuevos esta semana
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Citas hoy</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.reservations}</p>
                <p className="text-xs text-purple-600 mt-1 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  38 completadas
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ocupación</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.occupancy}%</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${stats.occupancy}%` }}
                  ></div>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Grid de contenido secundario */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estadísticas del equipo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tu Equipo</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profesionales</span>
                  <span className="font-semibold text-gray-900">{teamStats.totalProfessionals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Activos hoy</span>
                  <span className="font-semibold text-green-600">{teamStats.activeToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating promedio</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-900 ml-1">{teamStats.avgRating}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Calendar className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Nueva Cita</span>
                </button>
                <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Users className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Agregar Cliente</span>
                </button>
                <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Phone className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Llamar Cliente</span>
                </button>
                <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Mail className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Enviar Email</span>
                </button>
                <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <Settings className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Configurar</span>
                </button>
                <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <BarChart3 className="h-8 w-8 text-primary-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Ver Reportes</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de próximas funcionalidades */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              ¿Sabías que...?
            </h3>
            <p className="text-primary-700 mb-4">
              Próximamente podrás ver gráficos detallados de tus métricas, análisis de tendencias y reportes automáticos.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-primary-200 text-primary-800 text-xs rounded-full">
                📊 Gráficos avanzados
              </span>
              <span className="px-3 py-1 bg-primary-200 text-primary-800 text-xs rounded-full">
                📈 Análisis predictivo
              </span>
              <span className="px-3 py-1 bg-primary-200 text-primary-800 text-xs rounded-full">
                📋 Reportes automáticos
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboardPage 