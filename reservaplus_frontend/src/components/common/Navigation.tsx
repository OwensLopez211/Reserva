import React, { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useLogout } from '../../hooks/useLogout'
import {
  Calendar,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  BarChart3,
  Clock,
  User,
  CreditCard,
  Menu,
  X,
  Scissors
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
  const navigate = useNavigate()
  const { performLogout } = useLogout()
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Verificar si el click es fuera del menú de navegación
      if (navigationRef.current && !navigationRef.current.contains(target)) {
        setActiveDropdown(null)
      }
      
      // Verificar si el click es fuera del menú de usuario
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
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
          { name: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
          { name: 'Agenda', href: '/app/calendar', icon: Calendar },
          { name: 'Clientes', href: '/app/clients', icon: Users },
          {
            name: 'Servicios',
            icon: Scissors,
            dropdown: [
              { name: 'Gestionar Servicios', href: '/app/services', description: 'Crear y editar servicios' },
              { name: 'Horarios', href: '/app/schedules', description: 'Configurar horarios de atención' }
            ]
          },
          {
            name: 'Administración',
            icon: Settings,
            dropdown: [
              { name: 'Gestión de Equipo', href: '/app/team', description: 'Administrar profesionales' },
              { name: 'Configuración General', href: '/app/settings', description: 'Ajustes del sistema' }
            ]
          }
        ]

      case 'admin':
        return [
          { name: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
          { name: 'Agenda', href: '/app/calendar', icon: Calendar },
          { name: 'Clientes', href: '/app/clients', icon: Users },
          {
            name: 'Servicios',
            icon: Scissors,
            dropdown: [
              { name: 'Gestionar Servicios', href: '/app/services', description: 'Crear y editar servicios' },
              { name: 'Horarios', href: '/app/schedules', description: 'Configurar horarios de atención' }
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
          { name: 'Clientes', href: '/app/clients', icon: Users }
        ]

      default:
        return [
          { name: 'Dashboard', href: '/app/dashboard', icon: BarChart3 },
          { name: 'Agenda', href: '/app/calendar', icon: Calendar },
          { name: 'Clientes', href: '/app/clients', icon: Users }
        ]
    }
  }

  const navigation = getNavigationByRole(user?.role || '')

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      setUserMenuOpen(false)
      setActiveDropdown(null)
      setMobileMenuOpen(false)
      
      await performLogout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const handleUserMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setUserMenuOpen(!userMenuOpen)
    setActiveDropdown(null)
  }

  const handleDropdownToggle = (itemName: string) => {
    setActiveDropdown(activeDropdown === itemName ? null : itemName)
    setUserMenuOpen(false)
  }

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen)
    setActiveDropdown(null)
    setUserMenuOpen(false)
  }

  const handleNavigationClick = (href: string) => {
    setActiveDropdown(null)
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
    navigate(href)
  }

  const handleUserMenuItemClick = (href: string) => {
    setUserMenuOpen(false)
    setActiveDropdown(null)
    setMobileMenuOpen(false)
    navigate(href)
  }

  return (
    <>
      {/* Glassmorphism Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo con gradiente */}
            <div className="flex items-center">
              <Link to="/app/dashboard" className="flex items-center group">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200">
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full animate-pulse"></div>
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  ReservaPlus
                </span>
              </Link>
            </div>

            {/* Navegación principal - Desktop */}
            <div className="hidden lg:flex items-center space-x-1" ref={navigationRef}>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = item.href === location.pathname
                const hasDropdown = item.dropdown && item.dropdown.length > 0

                return (
                  <div key={item.name} className="relative">
                    {hasDropdown ? (
                      <button
                        onClick={() => handleDropdownToggle(item.name)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          activeDropdown === item.name || isActive
                            ? 'text-blue-600 bg-blue-50 shadow-sm'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${
                          activeDropdown === item.name ? 'rotate-180' : ''
                        }`} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleNavigationClick(item.href || '#')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'text-blue-600 bg-blue-50 shadow-sm'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </button>
                    )}

                    {/* Dropdown Menu con animación */}
                    {hasDropdown && activeDropdown === item.name && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        {item.dropdown?.map((dropdownItem) => (
                          <button
                            key={dropdownItem.name}
                            onClick={() => handleNavigationClick(dropdownItem.href)}
                            className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-150 mx-2 rounded-xl"
                          >
                            <div className="font-medium">{dropdownItem.name}</div>
                            {dropdownItem.description && (
                              <div className="text-xs text-gray-500 mt-1">{dropdownItem.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Elementos de la derecha */}
            <div className="flex items-center space-x-3">
              {/* Configuración */}
              <button
                onClick={() => handleNavigationClick('/app/settings')}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
                title="Configuración"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Menú de usuario */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={handleUserMenuClick}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                    <span className="text-sm font-medium text-white">
                      {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.full_name || user?.username}
                    </div>
                    <div className="text-xs text-gray-500">{user?.role}</div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown del usuario */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-gray-100/50">
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
                    
                    <button
                      onClick={() => handleUserMenuItemClick('/app/profile')}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-150 mx-2 rounded-xl text-left"
                    >
                      <User className="h-4 w-4" />
                      <span>Mi Perfil</span>
                    </button>
                    
                    <button
                      onClick={() => handleUserMenuItemClick('/app/profile?tab=subscription')}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-150 mx-2 rounded-xl text-left"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Suscripción</span>
                    </button>
                    
                    <div className="border-t border-gray-100/50 mt-2 pt-2">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-150 mx-2 rounded-xl text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón menú móvil */}
              <button
                onClick={handleMobileMenuToggle}
                className="lg:hidden p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay para móvil */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Menú móvil */}
      <div className={`fixed top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-xl z-40 lg:hidden transition-all duration-300 ${
        mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}>
        <div className="w-full px-4 py-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = item.href === location.pathname
              const hasDropdown = item.dropdown && item.dropdown.length > 0

              if (hasDropdown) {
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => handleDropdownToggle(item.name)}
                      className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        activeDropdown === item.name
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                        activeDropdown === item.name ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {activeDropdown === item.name && (
                      <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        {item.dropdown?.map((dropdownItem) => (
                          <button
                            key={dropdownItem.name}
                            onClick={() => handleNavigationClick(dropdownItem.href)}
                            className="block w-full text-left px-4 py-3 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-150"
                          >
                            <div className="font-medium">{dropdownItem.name}</div>
                            {dropdownItem.description && (
                              <div className="text-xs text-gray-500 mt-1">{dropdownItem.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigationClick(item.href || '#')}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                    isActive
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </button>
              )
            })}

            {/* Menú de usuario en móvil */}
            <div className="border-t border-gray-100/50 pt-4 mt-4">
              <div className="px-4 py-3 mb-2">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs text-gray-500">{user?.organization_name}</p>
              </div>

              <button
                onClick={() => handleUserMenuItemClick('/app/profile')}
                className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-150 text-left"
              >
                <User className="h-5 w-5" />
                <span>Mi Perfil</span>
              </button>
              
              <button
                onClick={() => handleUserMenuItemClick('/app/profile?tab=subscription')}
                className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-150 text-left"
              >
                <CreditCard className="h-5 w-5" />
                <span>Suscripción</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-150 text-left"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer para compensar el navbar fixed */}
      <div className="h-16" />
    </>
  )
}

export default Navigation