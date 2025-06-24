// src/components/layouts/PublicLayout.tsx - OPTIMIZADO
import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../common/Navbar'
import Footer from '../common/Footer'
import { useTransition } from '../../contexts/TransitionContext'

const PublicLayout: React.FC = () => {
  const { isTransitioning, transitionStage, currentPath } = useTransition()

  const getTransitionClasses = () => {
    const baseClasses = 'transition-all duration-500 ease-out'
    
    switch (transitionStage) {
      case 'fadeOut':
        return `${baseClasses} opacity-0 transform translate-y-8 scale-98 filter blur-sm`
      case 'fadeIn':
        return `${baseClasses} opacity-100 transform translate-y-0 scale-100 filter blur-0`
      case 'idle':
      default:
        return `${baseClasses} opacity-100 transform translate-y-0 scale-100 filter blur-0`
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      
      {/* Loading Overlay */}
      <div className={`fixed inset-0 z-50 pointer-events-none transition-all duration-300 ${
        isTransitioning 
          ? 'opacity-100 backdrop-blur-sm' 
          : 'opacity-0'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/90 to-gray-50/90"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`transition-all duration-300 ${
            isTransitioning ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}>
            <div className="relative">
              {/* Spinner principal */}
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
              {/* Spinner secundario */}
              <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-cyan-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 z-50 transition-all duration-500 ${
        transitionStage === 'fadeOut' ? 'w-full' : 'w-0'
      }`} />

      {/* Header/Navbar */}
      <div className="relative z-40">
        <Navbar />
      </div>

      {/* Contenido principal con transiciones */}
      <main className="flex-1 relative">
        
        {/* Efectos de fondo animados por página */}
        <PageBackground currentPath={currentPath} isTransitioning={isTransitioning} />
        
        {/* Container de transición */}
        <div className={getTransitionClasses()}>
          {/* Contenido de la página */}
          <div className="relative z-10">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Footer con animación */}
      <div className={`relative z-40 transition-all duration-700 delay-200 ${
        isTransitioning 
          ? 'opacity-0 transform translate-y-4' 
          : 'opacity-100 transform translate-y-0'
      }`}>
        <Footer variant="modern" />
      </div>

      {/* Efectos de partículas de transición */}
      <TransitionParticles isTransitioning={isTransitioning} currentPath={currentPath} />
    </div>
  )
}

// Componente para efectos de fondo específicos por página
const PageBackground: React.FC<{ 
  currentPath: string
  isTransitioning: boolean 
}> = ({ currentPath, isTransitioning }) => {
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
      case '/contact':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-64 h-64 bg-pink-400/5 rounded-full blur-3xl animate-pulse delay-800"></div>
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
      isTransitioning ? 'opacity-50' : 'opacity-100'
    }`}>
      {getBackgroundEffects()}
    </div>
  )
}

// Componente para partículas de transición
const TransitionParticles: React.FC<{ 
  isTransitioning: boolean
  currentPath: string 
}> = ({ isTransitioning, currentPath }) => {
  if (!isTransitioning) return null

  // Colores diferentes por página
  const getParticleColor = () => {
    switch (currentPath) {
      case '/':
        return 'bg-emerald-400'
      case '/features':
        return 'bg-blue-400'
      case '/pricing':
        return 'bg-yellow-400'
      case '/contact':
        return 'bg-purple-400'
      default:
        return 'bg-gray-400'
    }
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-30">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute w-2 h-2 ${getParticleColor()} rounded-full animate-ping opacity-60`}
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 200}ms`,
            animationDuration: `${1 + Math.random() * 0.5}s`
          }}
        />
      ))}
    </div>
  )
}

export default PublicLayout