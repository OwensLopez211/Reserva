// src/services/api.ts - CON JWT
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Funciones para manejar tokens
export const tokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  },
  clearTokens: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}

// Interceptor para requests - agregar token de autorización
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken()
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
    
    // Si es 401 y no hemos intentado renovar el token ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = tokenManager.getRefreshToken()
      if (refreshToken) {
        try {
          console.log('Intentando renovar token...')
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
            refresh_token: refreshToken
          })
          
          const newAccessToken = response.data.access_token
          tokenManager.setTokens(newAccessToken, refreshToken)
          
          // Reintentar request original con nuevo token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return api(originalRequest)
        } catch (refreshError) {
          console.log('Error renovando token, redirigiendo a login')
          tokenManager.clearTokens()
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login'
          }
        }
      } else {
        console.log('No hay refresh token, redirigiendo a login')
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default api