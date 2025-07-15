// src/components/common/Navbar.tsx - CON TRANSICIONES INTEGRADAS
import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Shield, ArrowUp, Store, DollarSign, Settings, LogOut } from 'lucide-react'
import { useTransition } from '../../contexts/TransitionContext'
import { useAuth } from '../../contexts/AuthContext'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const location = useLocation()
  const navigate = useNavigate()
  const { isTransitioning, startTransition } = useTransition()
  const { user, isAuthenticated, logout } = useAuth()

  const navigation = [
    { 
      name: 'Inicio', 
      href: '/', 
      icon: Calendar,
      description: 'Página principal'
    },
    { 
      name: 'Marketplace', 
      href: '/marketplace', 
      icon: Store,
      description: 'Encuentra servicios y profesionales'
    },
    { 
      name: 'Características', 
      href: '/features', 
      icon: Shield,
      description: 'Descubre nuestras funcionalidades'
    },
    { 
      name: 'Precios', 
      href: '/pricing', 
      icon: DollarSign,
      description: 'Planes y tarifas'
    },
  ]

  const isActive = useCallback((path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }, [location.pathname])

  // Scroll behavior effects
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.pageYOffset
      const scrolled = currentScrollPos > 20
      const visible = prevScrollPos > currentScrollPos || currentScrollPos < 10
      const showScroll = currentScrollPos > 400

      setIsScrolled(scrolled)
      setIsVisible(visible)
      setShowScrollTop(showScroll)
      setPrevScrollPos(currentScrollPos)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prevScrollPos])

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  // Función de navegación con transición
  const handleNavigation = useCallback((href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
    }

    // Si ya estamos en la misma página, no hacer nada
    if (location.pathname === href) {
      return
    }

    console.log('🚀 Navigation triggered:', { from: location.pathname, to: href })
    
    // Cerrar menú móvil inmediatamente
    setIsMenuOpen(false)
    
    // Scroll to top para mejor UX
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    // Iniciar transición y navegar
    startTransition(() => {
      navigate(href)
    })
  }, [location.pathname, navigate, startTransition])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Get dashboard route based on user role
  const getDashboardRoute = useCallback(() => {
    if (!user) return '/dashboard'
    
    switch (user.role) {
      case 'owner':
      case 'admin':
        return '/dashboard'
      case 'professional':
        return '/professional/agenda'
      case 'reception':
        return '/appointments'
      case 'staff':
        return '/appointments'
      default:
        return '/dashboard'
    }
  }, [user])

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await logout()
      handleNavigation('/')
    } catch (error) {
      console.error('Error during logout:', error)
      handleNavigation('/')
    }
  }, [logout, handleNavigation])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowUserMenu(false)
    }
    
    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <>
      {/* Main Navbar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-900/5' 
            : 'bg-transparent'
        } ${
          isTransitioning ? 'pointer-events-none opacity-75' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            
            {/* Logo with enhanced animation */}
            <div className="flex items-center">
              <button
                onClick={(e) => handleNavigation('/', e)}
                className={`flex items-center group relative transition-all duration-300 ${
                  isTransitioning ? 'opacity-50' : 'hover:scale-105'
                }`}
                disabled={isTransitioning}
              >
                {/* Logo background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Main logo */}
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:rotate-3">
                  <span className="text-white font-light text-lg transform group-hover:scale-110 transition-transform duration-300">+</span>
                </div>
                
                {/* Logo text */}
                <div className="flex items-baseline overflow-hidden">
                  <span className={`text-xl font-semibold tracking-tight transition-all duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                  } group-hover:text-emerald-600`}>
                    Reserva
                  </span>
                  <span className={`text-xl font-light ml-0.5 transition-all duration-300 delay-75 ${
                    isScrolled ? 'text-emerald-600' : 'text-emerald-300'
                  } group-hover:text-emerald-500 group-hover:scale-125`}>
                    +
                  </span>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <div key={item.name} className="relative group">
                    <button
                      onClick={(e) => handleNavigation(item.href, e)}
                      disabled={isTransitioning}
                      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                        active
                          ? `${isScrolled ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-300 bg-white/10'}`
                          : `${isScrolled ? 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50' : 'text-gray-200 hover:text-white hover:bg-white/10'}`
                      } ${
                        isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Icon className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                        active ? 'text-emerald-500' : ''
                      }`} />
                      <span className="relative">
                        {item.name}
                        {active && (
                          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
                        )}
                      </span>
                    </button>
                    
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap z-50">
                      {item.description}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* CTA Buttons Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              {isAuthenticated ? (
                /* User Menu for authenticated users */
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowUserMenu(!showUserMenu)
                    }}
                    disabled={isTransitioning}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-xl transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-gray-200 hover:bg-white/10'
                    } ${
                      isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium">{user?.first_name || user?.username}</p>
                        <p className="text-xs opacity-75 capitalize">{user?.role}</p>
                      </div>
                    </div>
                  </button>

                  {/* User dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.full_name || `${user?.first_name} ${user?.last_name}`}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-emerald-600 capitalize mt-1">{user?.role} - {user?.organization_name}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          handleNavigation(getDashboardRoute())
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Ir al Panel</span>
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Login/Register buttons for non-authenticated users */
                <>
                  <button
                    onClick={(e) => handleNavigation('/login', e)}
                    disabled={isTransitioning}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isScrolled 
                        ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' 
                        : 'text-gray-200 hover:text-white hover:bg-white/10'
                    } ${
                      isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={(e) => handleNavigation('/onboarding/plan', e)}
                    disabled={isTransitioning}
                    className={`relative group bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden ${
                      isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <span className="relative flex items-center">
                      {isTransitioning ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : null}
                      Empezar Gratis
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={isTransitioning}
                className={`relative w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-white hover:bg-white/10'
                } ${
                  isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className="relative w-6 h-6">
                  <span className={`absolute top-1 left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? 'rotate-45 translate-y-2' : ''
                  }`}></span>
                  <span className={`absolute top-3 left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? 'opacity-0' : ''
                  }`}></span>
                  <span className={`absolute top-5 left-0 w-6 h-0.5 bg-current transition-all duration-300 ${
                    isMenuOpen ? '-rotate-45 -translate-y-2' : ''
                  }`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-500 ease-in-out ${
          isMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}>
          <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-xl">
            <div className="px-4 py-6 space-y-1">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <button
                    key={item.name}
                    onClick={(e) => handleNavigation(item.href, e)}
                    disabled={isTransitioning}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      active
                        ? 'text-emerald-600 bg-emerald-50 shadow-lg'
                        : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                    } ${
                      isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      transform: isMenuOpen ? 'translateX(0)' : 'translateX(-20px)'
                    }}
                  >
                    <Icon className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                      active ? 'text-emerald-500' : 'text-gray-500'
                    }`} />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {active && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        )}
                        {isTransitioning && (
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </button>
                )
              })}
              
              {/* Mobile CTA Section */}
              <div className="pt-6 border-t border-gray-200/50 space-y-3">
                {isAuthenticated ? (
                  /* User info and actions for authenticated users */
                  <>
                    <div className="px-4 py-3 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{user?.first_name || user?.username}</p>
                          <p className="text-xs text-gray-600">{user?.email}</p>
                          <p className="text-xs text-emerald-600 capitalize">{user?.role}</p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsMenuOpen(false)
                        handleNavigation(getDashboardRoute())
                      }}
                      disabled={isTransitioning}
                      className={`flex items-center justify-center w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-3 rounded-xl text-base font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 text-center shadow-lg transform hover:scale-105 ${
                        isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Ir al Panel
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      disabled={isTransitioning}
                      className={`block w-full px-4 py-3 text-center text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-300 ${
                        isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center">
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                      </div>
                    </button>
                  </>
                ) : (
                  /* Login/Register buttons for non-authenticated users */
                  <>
                    <button
                      onClick={(e) => handleNavigation('/login', e)}
                      disabled={isTransitioning}
                      className={`block w-full px-4 py-3 text-center text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 ${
                        isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={(e) => handleNavigation('/onboarding/plan', e)}
                      disabled={isTransitioning}
                      className={`flex items-center justify-center w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-3 rounded-xl text-base font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 text-center shadow-lg transform hover:scale-105 ${
                        isTransitioning ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isTransitioning ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : null}
                      Empezar Gratis
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center hover:scale-110 ${
          showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      {/* Background overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Transition indicator */}
      {isTransitioning && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Navegando...
          </div>
        </div>
      )}
    </>
  )
}

export default Navbar