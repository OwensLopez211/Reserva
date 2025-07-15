import React, { useState, useEffect } from 'react'
import userService, { User, UserRole, CreateUserData, UpdateUserData, UserFilters, PlanInfo } from '../../services/userService'
import UserModal from '../../components/team/UserModal'
import UserRolesSection from '../../components/team/UserRolesSection'
import UserTable from '../../components/team/UserTable'
import PlanInfoCard from '../../components/team/PlanInfoCard'
import {
  Search,
  Plus,
  Users
} from 'lucide-react'

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
      const result = await userService.createUser(userData)
      await loadUsers()
      // El modal se cierra automáticamente después de mostrar la contraseña
      setEditingUser(undefined)
      return result
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
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Error al eliminar usuario'
        : 'Error al eliminar usuario'
      alert(errorMessage)
    }
  }

  const handleToggleStatus = async (userId: string) => {
    try {
      await userService.toggleUserStatus(userId)
      await loadUsers()
      setActiveDropdown(null)
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Error al cambiar estado del usuario'
        : 'Error al cambiar estado del usuario'
      alert(errorMessage)
    }
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
      <PlanInfoCard planInfo={planInfo} className="mx-6 mt-4" />

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
        <UserTable
          users={users}
          loading={loading}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={pageSize}
          setPageSize={setPageSize}
          activeDropdown={activeDropdown}
          setActiveDropdown={setActiveDropdown}
          onEditUser={(user) => {
            setEditingUser(user)
            setShowUserModal(true)
          }}
          onDeleteUser={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
        />

        {/* Roles de usuarios */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Roles de usuarios</h2>
          <UserRolesSection roles={roles} loading={loading} />
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
        onSave={async (userData) => {
          if (editingUser) {
            return handleUpdateUser(editingUser.id, userData as UpdateUserData)
          } else {
            return handleCreateUser(userData as CreateUserData)
        }
        }}
        roles={roles}
        isLoading={modalLoading}
      />
    </div>
  )
}

export default TeamPage 
