// src/components/navigation/Navbar.tsx
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {  Calendar, Shield, Users, Phone, ArrowUp } from 'lucide-react'

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const location = useLocation()

  const navigation = [
    { 
      name: 'Inicio', 
      href: '/', 
      icon: Calendar,
      description: 'Página principal'
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
      icon: Users,
      description: 'Planes y tarifas'
    },
    { 
      name: 'Contacto', 
      href: '/contact', 
      icon: Phone,
      description: 'Ponte en contacto'
    },
  ]

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Main Navbar */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-lg shadow-gray-900/5' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            
            {/* Logo with enhanced animation */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group relative">
                {/* Logo background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Main logo */}
                <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3 shadow-lg transition-all duration-300 group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-3">
                  <span className="text-white font-light text-lg transform group-hover:scale-110 transition-transform duration-300">+</span>
                </div>
                
                {/* Logo text with stagger animation */}
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
              </Link>
            </div>

            {/* Desktop Navigation with enhanced hover effects */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                return (
                  <div key={item.name} className="relative group">
                    <Link
                      to={item.href}
                      className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                        active
                          ? `${isScrolled ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-300 bg-white/10'}`
                          : `${isScrolled ? 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50' : 'text-gray-200 hover:text-white hover:bg-white/10'}`
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
                    </Link>
                    
                    {/* Tooltip */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap">
                      {item.description}
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )
              })}
            </nav>

            {/* CTA Buttons Desktop */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                to="/login"
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  isScrolled 
                    ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' 
                    : 'text-gray-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/login"
                className="relative group bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative">Empezar Gratis</span>
              </Link>
            </div>

            {/* Mobile menu button with morphing animation */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`relative w-10 h-10 rounded-xl transition-all duration-300 flex items-center justify-center ${
                  isScrolled 
                    ? 'text-gray-700 hover:bg-gray-100' 
                    : 'text-white hover:bg-white/10'
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

        {/* Mobile Navigation with slide animation */}
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
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                      active
                        ? 'text-emerald-600 bg-emerald-50 shadow-lg'
                        : 'text-gray-700 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      transform: isMenuOpen ? 'translateX(0)' : 'translateX(-20px)'
                    }}
                  >
                    <Icon className={`w-5 h-5 mr-3 transition-colors duration-300 ${
                      active ? 'text-emerald-500' : 'text-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{item.name}</span>
                        {active && (
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                )
              })}
              
              {/* Mobile CTA Section */}
              <div className="pt-6 border-t border-gray-200/50 space-y-3">
                <Link
                  to="/login"
                  className="block w-full px-4 py-3 text-center text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/login"
                  className="block w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-3 rounded-xl text-base font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 text-center shadow-lg transform hover:scale-105"
                >
                  Empezar Gratis
                </Link>
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
    </>
  )
}

export default Navbar