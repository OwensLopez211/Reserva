// src/components/transitions/RouteTransitionWrapper.tsx
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface RouteTransitionWrapperProps {
  children: React.ReactNode
}

export const RouteTransitionWrapper: React.FC<RouteTransitionWrapperProps> = ({ children }) => {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  return (
    <div className="relative min-h-screen">
      {/* Contenido principal */}
      <div
        className={`transition-all duration-500 ease-in-out ${getTransitionStyles(transitionStage)}`}
        onTransitionEnd={() => {
          if (transitionStage === 'fadeOut') {
            setDisplayLocation(location)
            setTransitionStage('fadeIn')
          }
        }}
      >
        {children}
      </div>

      {/* Indicador de carga superior */}
      <div className={`fixed top-0 left-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 z-50 transition-all duration-300 ${
        transitionStage === 'fadeOut' ? 'w-full' : 'w-0'
      }`} />
    </div>
  )
}

const getTransitionStyles = (stage: string) => {
  switch (stage) {
    case 'fadeOut':
      return 'opacity-0 transform translate-y-4 scale-98 filter blur-sm'
    case 'fadeIn':
    default:
      return 'opacity-100 transform translate-y-0 scale-100 filter blur-0'
  }
}

// Hook para manejar transiciones de scroll
export const useScrollTransition = () => {
  const [scrollY, setScrollY] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      setScrollY(window.scrollY)
      setIsScrolling(true)
      
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setIsScrolling(false)
      }, 150)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeoutId)
    }
  }, [])

  return { scrollY, isScrolling }
}

// Componente para animaciones de entrada en scroll
export const ScrollReveal: React.FC<{
  children: React.ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  className?: string
}> = ({ children, delay = 0, direction = 'up', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!elementRef) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay)
          observer.unobserve(elementRef)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    observer.observe(elementRef)
    return () => observer.disconnect()
  }, [elementRef, delay])

  const getDirectionStyles = () => {
    const base = 'transition-all duration-700 ease-out'
    
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `${base} opacity-0 transform translate-y-8 scale-95`
        case 'down':
          return `${base} opacity-0 transform -translate-y-8 scale-95`
        case 'left':
          return `${base} opacity-0 transform translate-x-8 scale-95`
        case 'right':
          return `${base} opacity-0 transform -translate-x-8 scale-95`
        default:
          return `${base} opacity-0 transform translate-y-8 scale-95`
      }
    }
    
    return `${base} opacity-100 transform translate-x-0 translate-y-0 scale-100`
  }

  return (
    <div ref={setElementRef} className={`${getDirectionStyles()} ${className}`}>
      {children}
    </div>
  )
}

// Componente para texto que se revela letra por letra
export const TypewriterText: React.FC<{
  text: string
  speed?: number
  className?: string
  delay?: number
}> = ({ text, speed = 50, className = '', delay = 0 }) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isStarted, setIsStarted] = useState(false)

  useEffect(() => {
    const startTimer = setTimeout(() => setIsStarted(true), delay)
    return () => clearTimeout(startTimer)
  }, [delay])

  useEffect(() => {
    if (!isStarted) return

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, speed, isStarted])

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}

// Componente para crear efectos de paralaje
export const ParallaxElement: React.FC<{
  children: React.ReactNode
  speed?: number
  className?: string
}> = ({ children, speed = 0.5, className = '' }) => {
  const { scrollY } = useScrollTransition()
  
  return (
    <div 
      className={className}
      style={{
        transform: `translateY(${scrollY * speed}px)`
      }}
    >
      {children}
    </div>
  )
}

export default RouteTransitionWrapper