import React from 'react'
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Calendar,
  Shield
} from 'lucide-react'
import userService, { User } from '../../services/userService'

interface UserTableProps {
  users: User[]
  loading: boolean
  currentPage: number
  setCurrentPage: (page: number) => void
  totalPages: number
  totalCount: number
  pageSize: number
  setPageSize: (size: number) => void
  activeDropdown: string | null
  setActiveDropdown: (id: string | null) => void
  onEditUser: (user: User) => void
  onDeleteUser: (userId: string) => void
  onToggleStatus: (userId: string) => void
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  currentPage,
  setCurrentPage,
  totalPages,
  totalCount,
  pageSize,
  setPageSize,
  activeDropdown,
  setActiveDropdown,
  onEditUser,
  onDeleteUser,
  onToggleStatus
}) => {
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 })

  const handleAction = (action: string, userId: string) => {
    const user = users.find(u => u.id === userId)
    
    switch (action) {
      case 'edit':
        if (user) onEditUser(user)
        break
      case 'delete':
        onDeleteUser(userId)
        break
      case 'toggle-status':
        onToggleStatus(userId)
        break
    }
    setActiveDropdown(null)
  }

  const handleDropdownClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    
    if (activeDropdown === userId) {
      setActiveDropdown(null)
      return
    }

    const buttonRect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect()
    if (buttonRect) {
      const top = buttonRect.bottom + window.scrollY + 4
      const left = buttonRect.right - 192 // 192px = w-48 width

      setDropdownPosition({ top, left })
      setActiveDropdown(userId)
    }
  }

  // Efecto para cerrar dropdown al hacer click fuera o scroll
  React.useEffect(() => {
    const handleScroll = () => setActiveDropdown(null)
    const handleResize = () => setActiveDropdown(null)
    
    if (activeDropdown) {
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [activeDropdown])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Cargando usuarios...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Último Login
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150" data-user-id={user.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {userService.getFullName(user).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {userService.getFullName(user)}
                      </div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${userService.getRoleColor(user.role)}-100 text-${userService.getRoleColor(user.role)}-700 border border-${userService.getRoleColor(user.role)}-200`}>
                    {userService.getRoleName(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {user.is_active_in_org ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm font-medium text-green-700">Activo</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm font-medium text-red-700">Inactivo</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {userService.formatLastLogin(user)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative">
                    <button
                      onClick={(e) => handleDropdownClick(e, user.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {activeDropdown === user.id && (
                      <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}>
                        <div 
                          className="absolute w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAction('edit', user.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <Edit className="h-4 w-4 mr-3 text-gray-500" />
                            Editar usuario
                          </button>
                          <button
                            onClick={() => handleAction('toggle-status', user.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={user.role === 'owner'}
                          >
                            {user.is_active_in_org ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-3 text-gray-500" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-3 text-gray-500" />
                                Activar
                              </>
                            )}
                          </button>
                          {user.role !== 'owner' && (
                            <button
                              onClick={() => handleAction('delete', user.id)}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden">
        <div className="divide-y divide-gray-100">
          {users.map((user) => (
            <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-base font-semibold text-white">
                      {userService.getFullName(user).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {userService.getFullName(user)}
                      </h3>
                      <div className="flex items-center ml-2">
                        {user.is_active_in_org ? (
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Shield className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-${userService.getRoleColor(user.role)}-100 text-${userService.getRoleColor(user.role)}-700 border border-${userService.getRoleColor(user.role)}-200`}>
                          {userService.getRoleName(user.role)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{userService.formatLastLogin(user)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                  <div className="relative ml-2">
                    <button
                      onClick={(e) => handleDropdownClick(e, user.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {activeDropdown === user.id && (
                      <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}>
                        <div 
                          className="absolute w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAction('edit', user.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <Edit className="h-4 w-4 mr-3 text-gray-500" />
                            Editar usuario
                          </button>
                          <button
                            onClick={() => handleAction('toggle-status', user.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={user.role === 'owner'}
                          >
                            {user.is_active_in_org ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-3 text-gray-500" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-3 text-gray-500" />
                                Activar
                              </>
                            )}
                          </button>
                          {user.role !== 'owner' && (
                            <button
                              onClick={() => handleAction('delete', user.id)}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Enhanced Pagination */}
      <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
        {/* Mobile Pagination */}
        <div className="flex items-center justify-between sm:hidden">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-700 font-medium">
            {currentPage} de {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Siguiente
          </button>
        </div>
        
        {/* Desktop Pagination */}
        <div className="hidden sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> a{' '}
              <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalCount)}</span> de{' '}
              <span className="font-semibold text-gray-900">{totalCount}</span> usuarios
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Anterior
              </button>
              <div className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                {currentPage}
              </div>
              <button 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              >
                Siguiente
              </button>
            </div>
            <select 
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
            >
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserTable