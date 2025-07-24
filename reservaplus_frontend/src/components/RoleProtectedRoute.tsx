import React from 'react'
import { useAuth } from '../contexts/AuthContext'

interface RoleProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles
}) => {
  const { user, loading } = useAuth()

  // Mientras carga, muestra loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Si no hay usuario o el rol no está permitido, mostrar mensaje de acceso restringido
  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta sección. Esta funcionalidad está disponible solo para {' '}
            {allowedRoles.length === 1 ? (
              <span className="font-semibold">
                {allowedRoles[0] === 'owner' ? 'propietarios' : allowedRoles[0]}
              </span>
            ) : (
              <>
                <span className="font-semibold">
                  {allowedRoles.slice(0, -1).join(', ')} y {allowedRoles[allowedRoles.length - 1]}
                </span>
              </>
            )}
            .
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tu rol actual: <span className="font-medium">{user?.role || 'No definido'}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default RoleProtectedRoute 