import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export const useLogout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const performLogout = async () => {
    try {
      console.log('🚪 Hook: Iniciando logout completo...')
      
      // 1. Ejecutar logout del contexto
      await logout()
      
      // 2. Verificar limpieza
      console.log('📍 Verificando limpieza post-logout:', {
        localStorage_access: localStorage.getItem('access_token'),
        localStorage_refresh: localStorage.getItem('refresh_token'),
        localStorage_registration: localStorage.getItem('registration_form_data')
      })
      
      // 3. Forzar redirección inmediata
      console.log('🔄 Forzando redirección a login...')
      
      // Usar múltiples métodos para asegurar la redirección
      navigate('/login', { replace: true })
      
      // Fallback con timeout
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          console.log('🔄 Fallback: Usando window.location.href')
          window.location.href = '/login'
        }
      }, 50)
      
      // Fallback adicional
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          console.log('🔄 Segundo fallback: Recargando página')
          window.location.reload()
        }
      }, 200)
      
      return true
      
    } catch (error) {
      console.error('❌ Error durante logout:', error)
      
      // En caso de error, limpieza manual y redirección forzada
      try {
        localStorage.clear()
        console.log('🧹 Limpieza manual del localStorage completada')
      } catch (clearError) {
        console.error('❌ Error en limpieza manual:', clearError)
      }
      
      // Redirección forzada en caso de error
      window.location.href = '/login'
      
      return false
    }
  }

  return { performLogout }
} 