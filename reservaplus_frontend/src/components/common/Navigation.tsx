import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLogout } from '../../hooks/useLogout'
import {
  Calendar,
  Users,
  Settings,
  LogOut,
  Bell,
  ChevronDown,
  BarChart3,
  Clock,
  User,
  DollarSign,
  BookOpen,
  CreditCard
} from 'lucide-react'

interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  dropdown?: {
    name: string
    href: string
    description?: string
  }[]
}

const Navigation: React.FC = () => {
  const { user } = useAuth()
  const location = useLocation()
  const { performLogout } = useLogout()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navegación específica por rol
  const getNavigationByRole = (role: string): NavigationItem[] => {
    switch (role) {
      case 'owner':
        return [
          { name: 'Agenda', href: '/app/calendar', icon: Calendar },
          {
            name: 'Ventas',
            icon: DollarSign,
            dropdown: [
              { name: 'Historial de Ventas', href: '/app/sales', description: 'Ver todas las ventas' },
              { name: 'Productos/Servicios', href: '/app/services', description: 'Gestionar servicios' },
              { name: 'Promociones', href: '/app/promotions', description: 'Crear promociones' }
            ]
          },
          { name: 'Recordatorios', href: '/app/reminders', icon: Bell },
          { name: 'Pacientes', href: '/app/clients', icon: Users },
          {
            name: 'Reportes',
            icon: BarChart3,
            dropdown: [
              { name: 'Dashboard', href: '/app/dashboard', description: 'Vista general' },
              { name: 'Ventas', href: '/app/reports/sales', description: 'Reportes de ventas' },
              { name: 'Clientes', href: '/app/reports/clients', description: 'Análisis de clientes' },
              { name: 'Profesionales', href: '/app/reports/staff', description: 'Rendimiento del equipo' }
            ]
          },
          {
            name: 'Administración',
            icon: Settings,
            dropdown: [
              { name: 'Equipo', href: '/app/team', description: 'Gestionar profesionales' },
              { name: 'Servicios', href: '/app/admin/services', description: 'Configurar servicios' },
              { name: 'Horarios', href: '/app/admin/schedules', description: 'Configurar horarios' },
              { name: 'Configuración', href: '/app/settings', description: 'Configuración general' }
            ]
          }
        ]

      case 'admin':
        return [
          { name: 'Agenda', href: '/app/calendar', icon: Calendar },
          {
            name: 'Ventas',
            icon: DollarSign,
            dropdown: [
              { name: 'Historial de Ventas', href: '/app/sales', description: 'Ver todas las ventas' },
              { name: 'Productos/Servicios', href: '/app/services', description: 'Gestionar servicios' }
            ]
          },
          { name: 'Recordatorios', href: '/app/reminders', icon: Bell },
          { name: 'Pacientes', href: '/app/clients', icon: Users },
          {
            name: 'Reportes',
            icon: BarChart3,
            dropdown: [
              { name: 'Dashboard', href: '/app/dashboard', description: 'Vista general' },
              { name: 'Ventas', href: '/app/reports/sales', description: 'Reportes de ventas' },
              { name: 'Clientes', href: '/app/reports/clients', description: 'Análisis de clientes' }
            ]
          },
          {
            name: 'Administración',
            icon: Settings,
            dropdown: [
              { name: 'Servicios', href: '/app/admin/services', description: 'Configurar servicios' },
              { name: 'Horarios', href: '/app/admin/schedules', description: 'Configurar horarios' }
            ]
          }
        ]

      case 'professional':
        return [
          { name: 'Mi Agenda', href: '/app/my-calendar', icon: Calendar },
          { name: 'Mis Clientes', href: '/app/my-clients', icon: Users },
          { name: 'Mi Horario', href: '/app/my-schedule', icon: Clock }
        ]

      case 'reception':
        return [
          { name: 'Agenda', href: '/app/calendar', icon: Calendar },
          { name: 'Pacientes', href: '/app/clients', icon: Users },
          { name: 'Recordatorios', href: '/app/reminders', icon: Bell }
        ]

      default:
        return [
          { name: 'Agenda', href: '/app/calendar', icon: Calendar },
          { name: 'Pacientes', href: '/app/clients', icon: Users }
        ]
    }
  }

  const navigation = getNavigationByRole(user?.role || '')

  const handleLogout = async () => {
    setUserMenuOpen(false)
    setActiveDropdown(null)
    
    // Usar el hook personalizado para logout
    await performLogout()
  }

  const toggleDropdown = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName)
    setUserMenuOpen(false)
  }

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen)
    setActiveDropdown(null)
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/app/dashboard" className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-primary-600">ReservaPlus</span>
              </div>
            </Link>
          </div>

          {/* Navegación principal */}
          <div className="hidden md:flex items-center space-x-8" ref={dropdownRef}>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href === location.pathname
              const hasDropdown = item.dropdown && item.dropdown.length > 0

              return (
                <div key={item.name} className="relative">
                  {hasDropdown ? (
                    <button
                      onClick={() => toggleDropdown(item.name)}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeDropdown === item.name || isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                      <ChevronDown className={`h-3 w-3 transition-transform ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    </button>
                  ) : (
                    <Link
                      to={item.href || '#'}
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )}

                  {/* Dropdown Menu */}
                  {hasDropdown && activeDropdown === item.name && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      {item.dropdown?.map((dropdownItem) => (
                        <Link
                          key={dropdownItem.name}
                          to={dropdownItem.href}
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <div className="font-medium">{dropdownItem.name}</div>
                          {dropdownItem.description && (
                            <div className="text-xs text-gray-500 mt-1">{dropdownItem.description}</div>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Elementos de la derecha */}
          <div className="flex items-center space-x-4">
            {/* Búsqueda */}
            {/* <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form> */}

            {/* Primeros pasos */}
            <Link
              to="/app/getting-started"
              className="hidden md:flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              <span>Primeros pasos</span>
            </Link>

            {/* Sitio web */}
            {/* <Link
              to="/app/website"
              className="hidden md:flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-md transition-colors"
            >
              <Globe className="h-4 w-4" />
              <span>Sitio web</span>
            </Link> */}

            {/* Configuración */}
            <Link
              to="/app/settings"
              className="p-2 text-gray-400 hover:text-gray-500 rounded-md transition-colors"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </Link>

            {/* Botón de Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Cerrar Sesión</span>
            </button>

            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </span>
                </div>
                <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {/* Dropdown del usuario */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.full_name || user?.username}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-500">{user?.organization_name}</p>
                    {user?.last_login_local && (
                      <p className="text-xs text-gray-400 mt-1">
                        Último acceso: {user.last_login_local}
                      </p>
                    )}
                  </div>
                  
                  <Link
                    to="/app/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                  
                  <Link
                    to="/app/subscription"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Suscripción</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100 mt-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navegación móvil */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = item.href === location.pathname

            return (
              <Link
                key={item.name}
                to={item.href || '#'}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navigation 