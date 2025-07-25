// src/services/onboardingStatusApi.ts - Specialized API for Onboarding Status
import axios from 'axios'
import { NativeCognitoService } from './nativeCognitoService'

const ONBOARDING_STATUS_API_URL = import.meta.env.VITE_ONBOARDING_STATUS_API_URL || 'https://4p1zq5nxa5.execute-api.sa-east-1.amazonaws.com/dev'

export const onboardingStatusApi = axios.create({
  baseURL: ONBOARDING_STATUS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout for faster fallback
})

// Cognito service instance
const cognitoService = new NativeCognitoService()

// Request interceptor to add authentication
onboardingStatusApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await cognitoService.getAccessToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      console.log('🔍 OnboardingStatusAPI Request:', {
        url: config.url,
        method: config.method,
        hasToken: !!token
      })
      
      return config
    } catch (error) {
      console.error('❌ OnboardingStatusAPI: Error in request interceptor:', error)
      return config
    }
  },
  (error) => {
    console.error('❌ OnboardingStatusAPI: Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
onboardingStatusApi.interceptors.response.use(
  (response) => {
    console.log('✅ OnboardingStatusAPI Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    })
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    console.error('❌ OnboardingStatusAPI Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      responseData: error.response?.data
    })
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        console.log('🔄 OnboardingStatusAPI: Attempting token refresh...')
        await cognitoService.refreshTokens()
        const newToken = await cognitoService.getAccessToken()
        
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return onboardingStatusApi(originalRequest)
        } else {
          throw new Error('Failed to refresh token')
        }
      } catch (refreshError) {
        console.error('💥 OnboardingStatusAPI: Token refresh failed:', refreshError)
        // Don't redirect here - let the calling component handle it
        throw error
      }
    }
    
    return Promise.reject(error)
  }
)

export default onboardingStatusApi