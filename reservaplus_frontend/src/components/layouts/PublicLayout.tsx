// src/components/layouts/PublicLayout.tsx
import React, { useEffect, useState, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Footer from '../common/Footer'

const PublicLayout: React.FC = () => {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')
  const prevPathRef = useRef(location.pathname)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Evitar transición en el primer mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    // Solo ejecutar transición si la ruta realmente cambió
    if (location.pathname !== prevPathRef.current) {
      console.log('🔄 Route transition:', prevPathRef.current, '→', location.pathname)
      
      // Scroll to top al cambiar página
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // Fase 1: Fade out
      setTransitionStage('fadeOut')
      setIsLoading(true)
      
      // Fase 2: Cambiar contenido y fade in
      const timer = setTimeout(() => {
        setDisplayLocation(location)
        setTransitionStage('fadeIn')
        prevPathRef.current = location.pathname
        
        // Fase 3: Terminar loading
        setTimeout(() => {
          setIsLoading(false)
        }, 150)
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  const getTransitionClasses = () => {
    const baseClasses = 'transition-all duration-500 ease-out'
    
    switch (transitionStage) {
      case 'fadeOut':
        return `${baseClasses} opacity-0 transform translate-y-8 scale-98 filter blur-sm`
      case 'fadeIn':
      default:
        return `${baseClasses} opacity-100 transform translate-y-0 scale-100 filter blur-0`
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      
      {/* Loading Overlay */}
      <div className={`fixed inset-0 z-50 pointer-events-none transition-all duration-300 ${
        isLoading 
          ? 'opacity-100 backdrop-blur-sm' 
          : 'opacity-0'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-gray-50/80"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`transition-all duration-300 ${
            isLoading ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}>
            <div className="relative">
              {/* Spinner principal */}
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              {/* Spinner secundario */}
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-cyan-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 z-50 transition-all duration-300 ${
        isLoading ? 'w-full' : 'w-0'
      }`} />

      {/* Header/Navbar */}
      <div className="relative z-40">
        <Navbar />
      </div>

      {/* Contenido principal con transiciones */}
      <main className="flex-1 relative">
        
        {/* Efectos de fondo animados por página */}
        <PageBackground currentPath={displayLocation.pathname} />
        
        {/* Container de transición */}
        <div className={getTransitionClasses()}>
          {/* Contenido de la página */}
          <div className="relative z-10">
            <Outlet key={displayLocation.pathname} />
          </div>
        </div>
      </main>

      {/* Footer con animación */}
      <div className={`relative z-40 transition-all duration-700 delay-200 ${
        isLoading 
          ? 'opacity-0 transform translate-y-4' 
          : 'opacity-100 transform translate-y-0'
      }`}>
        <Footer variant="modern" />
      </div>

      {/* Efectos de partículas de transición */}
      <TransitionParticles isTransitioning={isLoading} />
    </div>
  )
}

// Componente para efectos de fondo específicos por página
const PageBackground: React.FC<{ currentPath: string }> = ({ currentPath }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Delay para que aparezca después del contenido
    setIsVisible(false)
    const timer = setTimeout(() => setIsVisible(true), 400)
    return () => {
      clearTimeout(timer)
    }
  }, [currentPath])

  const getBackgroundEffects = () => {
    switch (currentPath) {
      case '/':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        )
      case '/features':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-400/5 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
        )
      case '/pricing':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-32 right-20 w-88 h-88 bg-yellow-400/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-32 left-20 w-64 h-64 bg-green-400/5 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
        )
      default:
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-gray-400/3 rounded-full blur-3xl animate-pulse"></div>
          </div>
        )
    }
  }

  return (
    <div className={`absolute inset-0 transition-opacity duration-1000 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      {getBackgroundEffects()}
    </div>
  )
}

// Componente para partículas de transición
const TransitionParticles: React.FC<{ isTransitioning: boolean }> = ({ isTransitioning }) => {
  if (!isTransitioning) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-emerald-400 rounded-full animate-ping opacity-60"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 150}ms`,
            animationDuration: '1.5s'
          }}
        />
      ))}
    </div>
  )
}

// Hook personalizado para transiciones de página
export const usePageTransition = () => {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => setIsTransitioning(false), 500)
    return () => clearTimeout(timer)
  }, [location.pathname])

  return { isTransitioning }
}

export default PublicLayout