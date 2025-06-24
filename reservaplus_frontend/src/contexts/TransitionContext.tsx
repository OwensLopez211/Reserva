// src/contexts/TransitionContext.tsx - CORREGIDO
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface TransitionContextType {
  isTransitioning: boolean
  transitionStage: 'idle' | 'fadeOut' | 'fadeIn'
  currentPath: string
  startTransition: (callback: () => void) => void
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined)

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionStage, setTransitionStage] = useState<'idle' | 'fadeOut' | 'fadeIn'>('idle')
  const [currentPath, setCurrentPath] = useState(location.pathname)
  const isInitialMount = useRef(true)
  const transitionTimeoutRef = useRef<NodeJS.Timeout>()
  const manualTransitionRef = useRef(false)

  const executeTransition = useCallback((callback: () => void) => {
    // Clear any existing timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    console.log('🎬 Executing transition')
    
    // Start transition
    setIsTransitioning(true)
    setTransitionStage('fadeOut')

    // Execute callback and fade in
    transitionTimeoutRef.current = setTimeout(() => {
      callback()
      setTransitionStage('fadeIn')
      
      // End transition
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false)
        setTransitionStage('idle')
        manualTransitionRef.current = false // Reset manual flag
      }, 300)
    }, 300)
  }, [])

  // Manual transition (triggered by navbar clicks)
  const startTransition = useCallback((callback: () => void) => {
    // Prevent multiple simultaneous transitions
    if (isTransitioning) {
      console.log('⚠️ Transition already in progress, ignoring')
      return
    }

    console.log('🚀 Manual transition started')
    manualTransitionRef.current = true // Mark as manual transition
    executeTransition(callback)
  }, [isTransitioning, executeTransition])

  // Auto-detect route changes (only if NOT a manual transition)
  useEffect(() => {
    // Skip transition on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false
      setCurrentPath(location.pathname)
      return
    }

    // Skip if this was triggered by a manual transition
    if (manualTransitionRef.current) {
      console.log('🔄 Skipping auto-transition (manual in progress)')
      setCurrentPath(location.pathname)
      return
    }

    // Only transition if path actually changed and no transition is in progress
    if (location.pathname !== currentPath && !isTransitioning) {
      console.log('🔄 Auto transition:', currentPath, '→', location.pathname)
      executeTransition(() => {
        setCurrentPath(location.pathname)
      })
    } else if (location.pathname !== currentPath) {
      // Just update the path if transition is already happening
      setCurrentPath(location.pathname)
    }
  }, [location.pathname, currentPath, isTransitioning, executeTransition])

  // Cleanup
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  const value: TransitionContextType = {
    isTransitioning,
    transitionStage,
    currentPath,
    startTransition
  }

  return (
    <TransitionContext.Provider value={value}>
      {children}
    </TransitionContext.Provider>
  )
}

export const useTransition = () => {
  const context = useContext(TransitionContext)
  if (context === undefined) {
    throw new Error('useTransition must be used within a TransitionProvider')
  }
  return context
}