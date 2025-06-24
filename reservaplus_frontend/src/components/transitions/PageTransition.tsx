// src/components/transitions/PageTransition.tsx
import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
  variant?: 'slide' | 'fade' | 'scale' | 'blur' | 'modern'
  duration?: number
}

const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  variant = 'modern',
  duration = 500 
}) => {
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(false)
  const [currentPath, setCurrentPath] = useState(location.pathname)

  useEffect(() => {
    // Cuando cambia la ruta
    if (location.pathname !== currentPath) {
      setIsVisible(false)
      
      setTimeout(() => {
        setCurrentPath(location.pathname)
        setIsVisible(true)
      }, duration / 2)
    } else {
      setIsVisible(true)
    }
  }, [location.pathname, currentPath, duration])

  const getTransitionClasses = () => {
    const baseClasses = `transition-all duration-${duration} ease-out`
    
    switch (variant) {
      case 'slide':
        return `${baseClasses} ${isVisible 
          ? 'transform translate-x-0 opacity-100' 
          : 'transform translate-x-8 opacity-0'}`
      
      case 'fade':
        return `${baseClasses} ${isVisible 
          ? 'opacity-100' 
          : 'opacity-0'}`
      
      case 'scale':
        return `${baseClasses} ${isVisible 
          ? 'transform scale-100 opacity-100' 
          : 'transform scale-95 opacity-0'}`
      
      case 'blur':
        return `${baseClasses} ${isVisible 
          ? 'filter blur-0 opacity-100 transform translate-y-0' 
          : 'filter blur-sm opacity-0 transform translate-y-4'}`
      
      case 'modern':
      default:
        return `${baseClasses} ${isVisible 
          ? 'opacity-100 transform translate-y-0 scale-100 filter blur-0' 
          : 'opacity-0 transform translate-y-6 scale-98 filter blur-sm'}`
    }
  }

  return (
    <div className={getTransitionClasses()}>
      {isVisible && children}
    </div>
  )
}

export default PageTransition