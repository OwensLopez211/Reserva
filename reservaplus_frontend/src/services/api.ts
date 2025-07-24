// src/services/api.ts - CON AWS COGNITO OIDC
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Funciones para manejar tokens con Cognito
export const tokenManager = {
  getAccessToken: async () => {
    try {
      return await cognitoService.getAccessToken()
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  },
  getIdToken: async () => {
    try {
      return await cognitoService.getIdToken()
    } catch (error) {
      console.error('Error getting ID token:', error)
      return null
    }
  },
  clearTokens: async () => {
    try {
      await cognitoService.logout()
      console.log('✅ Tokens de Cognito eliminados correctamente')
    } catch (error) {
      console.error('❌ Error al eliminar tokens de Cognito:', error)
    }
  }
}

// Interceptor para requests - agregar token de autorización
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await tokenManager.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      console.log('API Request:', {
        url: config.url,
        method: config.method,
        headers: config.headers,
        hasToken: !!token
      })
      
      return config
    } catch (error) {
      console.error('Error in request interceptor:', error)
      return config
    }
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para responses - manejar renovación de token
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      url: response.config.url
    })
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    })
    
    // Si es 401, intentar renovar la sesión de Cognito
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        console.log('Intentando renovar sesión de Cognito...')
        const newTokens = await cognitoService.refreshSession()
        
        if (newTokens) {
          // Reintentar request original con nuevo token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`
          return api(originalRequest)
        } else {
          throw new Error('No se pudo renovar la sesión')
        }
      } catch (refreshError) {
        console.log('Error renovando sesión, limpiando y redirigiendo a login')
        console.error('Refresh session error:', refreshError)
        
        // Limpiar sesión de Cognito
        await tokenManager.clearTokens()
        
        // Limpiar datos de onboarding también
        localStorage.removeItem('registration_form_data')
        localStorage.removeItem('selected_plan_data')
        localStorage.removeItem('team_setup_data')
        localStorage.removeItem('services_setup_data')
        localStorage.removeItem('organization_config_data')
        
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/onboarding')) {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api