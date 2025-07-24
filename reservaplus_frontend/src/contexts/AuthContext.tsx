// src/contexts/AuthContext.tsx - Native AWS Cognito Integration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { NativeCognitoService } from '../services/nativeCognitoService'

export interface User {
  id: string
  email: string
  name: string
  organization_id?: string
  role?: string
  onboarding_completed?: boolean
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const cognitoService = new NativeCognitoService()

  // Check for existing session on mount
  useEffect(() => {
    checkAuth()
  }, [])

  // Check authentication status
  const checkAuth = async () => {
    try {
      setLoading(true)
      
      if (cognitoService.isAuthenticated()) {
        const userInfo = await cognitoService.getCurrentUser()
        if (userInfo) {
          console.log('Usuario autenticado:', userInfo)
          setUser({
            id: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name
          })
        }
      }
    } catch (error) {
      console.log('No hay sesión activa:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      console.log('Iniciando login con Native Cognito...')
      
      const tokens = await cognitoService.login({ email, password })
      const userInfo = await cognitoService.getCurrentUser()
      
      if (userInfo) {
        console.log('Login exitoso:', userInfo)
        setUser({
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name
        })
      }
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    console.log('🚪 AuthContext: Iniciando logout...')
    
    try {
      // Logout from Cognito
      await cognitoService.logout()
      
      // Clear local data
      const keysToRemove = [
        'registration_form_data',
        'selected_plan_data', 
        'team_setup_data',
        'services_setup_data',
        'organization_config_data',
        'onboarding_step',
        'completed_steps',
        'onboarding_progress',
        'registration_token'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Removido: ${key}`)
      })
      
      // Clear user state
      setUser(null)
      
      console.log('✅ Logout completado - todos los datos eliminados')
      
    } catch (error) {
      console.error('❌ Error durante logout:', error)
      // Fallback cleanup
      localStorage.clear()
      setUser(null)
      console.log('🧹 Fallback: localStorage completamente limpiado')
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider')
  }
  return context
}