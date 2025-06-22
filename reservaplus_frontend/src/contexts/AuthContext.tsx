// src/contexts/AuthContext.tsx - JWT CORREGIDO PARA LOADING INFINITO
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, tokenManager } from '../services/api'

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: 'owner' | 'admin' | 'staff' | 'professional' | 'reception'
  is_professional: boolean
  organization: string
  organization_name: string
  is_active_in_org: boolean
  date_joined: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasRole: (roles: string | string[]) => boolean
  canAccess: (permission: string) => boolean
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false) // Prevenir múltiples calls

  // Verificar si hay un token válido al cargar la aplicación
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    // Prevenir múltiples llamadas simultáneas
    if (isCheckingAuth) {
      console.log('Ya se está verificando autenticación, ignorando...')
      return
    }

    setIsCheckingAuth(true)
    
    try {
      const token = tokenManager.getAccessToken()
      if (!token) {
        console.log('No hay token de acceso')
        setUser(null)
        return
      }

      console.log('Verificando token de acceso...')
      const response = await api.get('/api/auth/me/')
      console.log('Usuario autenticado:', response.data)
      setUser(response.data)
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errObj = error as { response?: { status?: number } };
        console.log('Token inválido o expirado:', errObj.response?.status);
      }
      tokenManager.clearTokens();
      setUser(null);
    } finally {
      setLoading(false)
      setIsCheckingAuth(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      console.log('Intentando login con JWT...')
      const response = await api.post('/api/auth/login/', {
        username,
        password
      })
      
      const { user: userData, access_token, refresh_token } = response.data
      
      console.log('Login exitoso:', userData)
      console.log('Tokens recibidos - Access:', access_token ? 'Sí' : 'No', 'Refresh:', refresh_token ? 'Sí' : 'No')
      
      // Guardar tokens en localStorage
      tokenManager.setTokens(access_token, refresh_token)
      
      setUser(userData)
      setLoading(false) // Importante: parar loading después del login
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error
      ) {
        const errObj = error as { response?: { data?: { error?: string } } };
        console.error('Error en login:', errObj.response?.data);
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error);
        }
      } else {
        console.error('Error en login:', error);
      }
      throw new Error('Error al iniciar sesión');
    }
  }

  const logout = async () => {
    try {
      // Notificar al servidor (opcional para JWT)
      await api.post('/api/auth/logout/')
    } catch (error) {
      console.log('Error al notificar logout al servidor:', error)
    } finally {
      // Limpiar tokens del localStorage
      tokenManager.clearTokens()
      setUser(null)
      console.log('Logout completado, tokens eliminados')
    }
  }

  // Función expuesta para verificar auth manualmente - CON PROTECCIÓN
  const checkAuth = async () => {
    if (!isCheckingAuth) {
      await checkAuthStatus()
    }
  }

  // Función para verificar roles
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  // Función para verificar permisos específicos
  const canAccess = (permission: string): boolean => {
    if (!user) return false
    
    const permissions: Record<string, string[]> = {
      'owner': ['view_all', 'edit_all', 'delete_all', 'manage_organization', 'view_reports', 'manage_users'],
      'admin': ['view_all', 'edit_all', 'delete_own', 'view_reports', 'manage_users'],
      'staff': ['view_own', 'edit_own', 'view_clients', 'create_appointments'],
      'professional': ['view_own', 'edit_own', 'view_appointments', 'view_clients'],
      'reception': ['view_all', 'edit_appointments', 'create_appointments', 'view_clients', 'manage_schedule'],
    }
    
    return permissions[user.role]?.includes(permission) || false
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    canAccess,
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