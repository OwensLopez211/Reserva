import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import OwnerDashboardPage from '../../pages/dashboard/OwnerDashboardPage'
import DashboardPage from '../../pages/dashboard/DashboardPage'

const RoleDashboard: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600">Error: Usuario no encontrado</p>
        </div>
      </div>
    )
  }

  // Renderizar dashboard según rol
  switch (user.role) {
    case 'owner':
      return <OwnerDashboardPage />
    
    case 'admin':
      // TODO: Crear AdminDashboardPage
      return (
        <div className="p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-bold text-blue-900 mb-2">Dashboard de Administrador</h2>
          <p className="text-blue-700">Panel específico para administradores (próximamente)</p>
          <div className="mt-4">
            <DashboardPage />
          </div>
        </div>
      )
    
    case 'staff':
      // TODO: Crear StaffDashboardPage
      return (
        <div className="p-6 bg-green-50 rounded-lg">
          <h2 className="text-xl font-bold text-green-900 mb-2">Dashboard de Personal</h2>
          <p className="text-green-700">Panel específico para personal (próximamente)</p>
          <div className="mt-4">
            <DashboardPage />
          </div>
        </div>
      )
    
    case 'professional':
      // TODO: Crear ProfessionalDashboardPage
      return (
        <div className="p-6 bg-purple-50 rounded-lg">
          <h2 className="text-xl font-bold text-purple-900 mb-2">Dashboard de Profesional</h2>
          <p className="text-purple-700">Panel específico para profesionales (próximamente)</p>
          <div className="mt-4">
            <DashboardPage />
          </div>
        </div>
      )
    
    case 'reception':
      // TODO: Crear ReceptionDashboardPage
      return (
        <div className="p-6 bg-orange-50 rounded-lg">
          <h2 className="text-xl font-bold text-orange-900 mb-2">Dashboard de Recepción</h2>
          <p className="text-orange-700">Panel específico para recepción (próximamente)</p>
          <div className="mt-4">
            <DashboardPage />
          </div>
        </div>
      )
    
    default:
      // Fallback al dashboard genérico
      return <DashboardPage />
  }
}

export default RoleDashboard 