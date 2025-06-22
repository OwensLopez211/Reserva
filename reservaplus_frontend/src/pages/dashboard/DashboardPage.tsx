// src/pages/dashboard/DashboardPage.tsx - VERSIÓN ORIGINAL SIMPLE
import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  const stats = [
    {
      name: 'Reservas Hoy',
      value: '12',
      icon: Calendar,
      color: 'bg-blue-500',
      change: '+2',
      changeType: 'increase'
    },
    {
      name: 'Clientes Activos',
      value: '248',
      icon: Users,
      color: 'bg-green-500',
      change: '+12',
      changeType: 'increase'
    },
    {
      name: 'Próxima Cita',
      value: '14:30',
      icon: Clock,
      color: 'bg-yellow-500',
      change: 'En 2 horas',
      changeType: 'neutral'
    },
    {
      name: 'Ingresos Mes',
      value: '$1,250,000',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'increase'
    }
  ]

  const upcomingAppointments = [
    {
      id: 1,
      time: '14:30',
      client: 'María González',
      service: 'Corte y Peinado',
      professional: 'Ana Estilista'
    },
    {
      id: 2,
      time: '15:00',
      client: 'Carlos López',
      service: 'Consulta General',
      professional: 'Dr. Roberto'
    },
    {
      id: 3,
      time: '16:15',
      client: 'Laura Martínez',
      service: 'Manicure',
      professional: 'Ana Estilista'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Bienvenido, {user?.full_name || user?.username}
        </p>
        <p className="text-sm text-gray-500">
          {user?.organization_name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="card">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 
                        stat.changeType === 'decrease' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Citas */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Próximas Citas
            </h3>
            <button className="text-sm text-primary-600 hover:text-primary-700">
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {appointment.time}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {appointment.client}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointment.service}
                    </p>
                    <p className="text-xs text-gray-400">
                      con {appointment.professional}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen Rápido */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Resumen del Día
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Citas completadas</span>
              <span className="text-sm font-medium text-gray-900">8 de 12</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary-600 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Ingresos del día</span>
              <span className="text-sm font-medium text-gray-900">$125,000</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Tiempo promedio por cita</span>
              <span className="text-sm font-medium text-gray-900">45 min</span>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <button className="w-full bg-primary-50 text-primary-600 py-2 px-4 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors">
                Ver reporte completo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Nueva Reserva</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Users className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Nuevo Cliente</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Clock className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Ver Calendario</span>
          </button>
          <button className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <TrendingUp className="h-8 w-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">Reportes</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage