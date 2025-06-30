import React, { useState, useEffect } from 'react'
import userService, { User, UserRole, CreateUserData, UpdateUserData, UserFilters, PlanInfo } from '../../services/userService'
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Crown,
  Briefcase,
  AlertCircle,
  X,
  Loader2
} from 'lucide-react'

// Modal para crear/editar usuario
interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: User
  onSave: (userData: CreateUserData | UpdateUserData) => Promise<void>
  roles: UserRole[]
  isLoading: boolean
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, onSave, roles, isLoading }) => {
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff',
    is_professional: false,
    password: '',
    confirm_password: ''
  })
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        role: user.role === 'owner' ? 'admin' : user.role,
        is_professional: user.is_professional,
        password: '',
        confirm_password: ''
      })
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'staff',
        is_professional: false,
        password: '',
        confirm_password: ''
      })
    }
  }, [user])

  // Generar username automáticamente
  useEffect(() => {
    if (!user && formData.first_name && formData.last_name) {
      const generatedUsername = userService.generateUsername(formData.first_name, formData.last_name)
      setFormData(prev => ({ ...prev, username: generatedUsername }))
    }
  }, [formData.first_name, formData.last_name, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validar datos
    const validationErrors = userService.validateUserData(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (user) {
        // Actualizar usuario existente
        const updateData: UpdateUserData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          is_professional: formData.is_professional
        }
        await onSave(updateData)
      } else {
        // Crear nuevo usuario
        await onSave(formData)
      }
      onClose()
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.detail || (error as Error).message || 'Error al guardar usuario'
      setErrors([errorMessage])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Errores encontrados:</h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as CreateUserData['role'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {roles.filter(role => role.editable).map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_professional"
              checked={formData.is_professional}
              onChange={(e) => setFormData({ ...formData, is_professional: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_professional" className="ml-2 block text-sm text-gray-900">
              Es profesional
            </label>
          </div>

          {!user && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {user ? 'Actualizar' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const TeamPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<UserRole[]>([])
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>()
  const [modalLoading, setModalLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Cargar datos iniciales
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [currentPage, pageSize, selectedRole, searchQuery])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const filters: UserFilters = {
        page: currentPage,
        page_size: pageSize
      }
      
      if (selectedRole !== 'all') {
        filters.role = selectedRole
      }
      
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim()
      }

      const response = await userService.getUsers(filters)
      setUsers(response.results)
      setPlanInfo(response.plan_info)
      setTotalCount(response.count)
      setTotalPages(Math.ceil(response.count / pageSize))
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const rolesData = await userService.getRoles()
      setRoles(rolesData)
    } catch (error) {
      console.error('Error cargando roles:', error)
    }
  }

  // Buscar con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      loadUsers()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleCreateUser = async (userData: CreateUserData) => {
    setModalLoading(true)
    try {
      await userService.createUser(userData)
      await loadUsers()
      setShowUserModal(false)
      setEditingUser(undefined)
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateUser = async (userId: string, userData: UpdateUserData) => {
    setModalLoading(true)
    try {
      await userService.updateUser(userId, userData)
      await loadUsers()
      setShowUserModal(false)
      setEditingUser(undefined)
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return
    }

    try {
      await userService.deleteUser(userId)
      await loadUsers()
      setActiveDropdown(null)
    } catch (error: unknown) {
      alert((error as any).response?.data?.detail || 'Error al eliminar usuario')
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      await userService.toggleUserStatus(userId)
      await loadUsers()
      setActiveDropdown(null)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al cambiar estado del usuario')
    }
  }

  const handleAction = (action: string, userId: string) => {
    const user = users.find(u => u.id === userId)
    
    switch (action) {
      case 'edit':
        setEditingUser(user)
        setShowUserModal(true)
        break
      case 'delete':
        handleDeleteUser(userId)
        break
      case 'toggle-status':
        handleToggleStatus(userId)
        break
    }
    setActiveDropdown(null)
  }

  const getRoleInfo = (roleId: string) => {
    return roles.find(role => role.id === roleId)
  }

  const getRoleIcon = (roleId: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      owner: Crown,
      admin: Shield,
      professional: UserCheck,
      reception: Users,
      staff: Briefcase
    }
    return iconMap[roleId] || Briefcase
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Alerta informativa */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              En esta pantalla podrás crear y gestionar usuarios. Recuerda que un usuario no es lo mismo que un profesional, 
              los usuarios son limitados y sirven para asignar diferentes permisos a cada persona que trabaje en tu compañía.
            </p>
          </div>
        </div>
      </div>

      {/* Información del plan */}
      {planInfo && (
        <div className="mx-6 mt-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Plan {planInfo.plan_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {planInfo.limits.total_users.current} de {planInfo.limits.total_users.max} usuarios utilizados
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className={`h-2 rounded-full ${planInfo.limits.total_users.current >= planInfo.limits.total_users.max ? 'bg-red-500' : 'bg-primary-500'}`}
                    style={{ width: `${Math.min((planInfo.limits.total_users.current / planInfo.limits.total_users.max) * 100, 100)}%` }}
                  ></div>
                </div>
                <span className={`text-sm font-medium ${planInfo.limits.total_users.current >= planInfo.limits.total_users.max ? 'text-red-600' : 'text-gray-900'}`}>
                  {Math.round((planInfo.limits.total_users.current / planInfo.limits.total_users.max) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header con título y acciones */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Usuarios registrados ({totalCount})
          </h1>
          
          <div className="flex items-center space-x-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuario"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            {/* Botón nuevo usuario */}
            <button 
              onClick={() => {
                if (!planInfo?.limits.total_users.can_add) {
                  alert(`Has alcanzado el límite de usuarios para tu plan ${planInfo?.plan_name} (${planInfo?.limits.total_users.max} usuarios)`)
                  return
                }
                setEditingUser(undefined)
                setShowUserModal(true)
              }}
              disabled={!planInfo?.limits.total_users.can_add}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                planInfo?.limits.total_users.can_add 
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo usuario</span>
            </button>
          </div>
        </div>

        {/* Filtros por rol */}
        <div className="flex items-center space-x-2 mb-6">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedRole === 'all' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedRole === role.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {role.name}
            </button>
          ))}
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              <span className="ml-2 text-gray-600">Cargando usuarios...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol asignado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {userService.getFullName(user).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {userService.getFullName(user)}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${userService.getRoleColor(user.role)}-100 text-${userService.getRoleColor(user.role)}-800`}>
                            {userService.getRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.is_active_in_org ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <span className={`text-sm ${
                              user.is_active_in_org ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {user.is_active_in_org ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {userService.formatLastLogin(user)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                              className="p-1 rounded-full hover:bg-gray-100"
                            >
                              <MoreVertical className="h-4 w-4 text-gray-400" />
                            </button>
                            
                            {activeDropdown === user.id && (
                              <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                                <button
                                  onClick={() => handleAction('edit', user.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar usuario
                                </button>
                                <button
                                  onClick={() => handleAction('toggle-status', user.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  disabled={user.role === 'owner'}
                                >
                                  {user.is_active_in_org ? (
                                    <>
                                      <EyeOff className="h-4 w-4 mr-2" />
                                      Desactivar
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Activar
                                    </>
                                  )}
                                </button>
                                {user.role !== 'owner' && (
                                  <button
                                    onClick={() => handleAction('delete', user.id)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{' '}
                      <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> de{' '}
                      <span className="font-medium">{totalCount}</span> usuarios
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <span className="bg-primary-50 border-primary-500 text-primary-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                        {currentPage}
                      </span>
                      <button 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Siguiente
                      </button>
                    </nav>
                    <select 
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setCurrentPage(1)
                      }}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    >
                      <option value={10}>10 por página</option>
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Roles de usuarios */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Roles de usuarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => {
              const Icon = getRoleIcon(role.id)
              return (
                <div key={role.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className={`bg-gradient-to-br from-${role.color}-500 to-${role.color}-600 p-4 text-white`}>
                    <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-lg mb-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold">{role.name}</h3>
                    {!role.editable && (
                      <span className="inline-block mt-1 text-xs bg-white/20 px-2 py-1 rounded">
                        No editable
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Tiene acceso a:</h4>
                      <ul className="space-y-1">
                        {role.permissions.map((permission, index) => (
                          <li key={index} className="flex items-start text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modal de crear/editar usuario */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false)
          setEditingUser(undefined)
        }}
        user={editingUser}
        onSave={editingUser ? 
          (userData) => handleUpdateUser(editingUser.id, userData as UpdateUserData) : 
          handleCreateUser
        }
        roles={roles}
        isLoading={modalLoading}
      />
    </div>
  )
}

export default TeamPage 