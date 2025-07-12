import api from './api'

// Tipos TypeScript que coinciden con el backend
export interface UserProfile {
  avatar?: string
  birth_date?: string
  address?: string
  timezone: string
  language: string
  email_notifications: boolean
  sms_notifications: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: string
  organization: string
  organization_name: string
  is_active_in_org: boolean
  date_joined: string
  last_login: string
  last_login_local: string
  created_at: string
  updated_at: string
  profile?: UserProfile
}

export interface UserUpdateData {
  first_name: string
  last_name: string
  phone: string
}

export interface ProfileUpdateData {
  birth_date?: string
  address?: string
  timezone: string
  language: string
  email_notifications: boolean
  sms_notifications: boolean
}

export interface PasswordChangeData {
  current_password: string
  new_password: string
}

export interface ProfileResponse {
  message: string
  user?: User
  profile?: UserProfile
}

class ProfileService {
  
  /**
   * Obtener información completa del usuario actual
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get('/api/auth/me/')
      return response.data
    } catch (error) {
      console.error('Error al obtener usuario actual:', error)
      throw new Error('Error al cargar la información del usuario')
    }
  }

  /**
   * Obtener perfil extendido del usuario actual
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await api.get('/api/auth/me/profile/')
      return response.data
    } catch (error) {
      console.error('Error al obtener perfil:', error)
      throw new Error('Error al cargar el perfil del usuario')
    }
  }

  /**
   * Obtener datos completos del usuario y perfil
   */
  async getCompleteProfile(): Promise<{ user: User; profile: UserProfile }> {
    try {
      const [userResponse, profileResponse] = await Promise.all([
        this.getCurrentUser(),
        this.getUserProfile()
      ])

      return {
        user: userResponse,
        profile: profileResponse
      }
    } catch (error) {
      console.error('Error al obtener perfil completo:', error)
      throw error
    }
  }

  /**
   * Actualizar información básica del usuario
   */
  async updateUserInfo(userData: UserUpdateData): Promise<ProfileResponse> {
    try {
      const response = await api.patch('/api/auth/me/update/', userData)
      return response.data
    } catch (error: any) {
      console.error('Error al actualizar información del usuario:', error)
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      
      // Manejar errores específicos del backend
      if (error.response?.data) {
        const errorMessages = []
        for (const [field, messages] of Object.entries(error.response.data)) {
          if (Array.isArray(messages)) {
            errorMessages.push(...messages)
          } else {
            errorMessages.push(messages)
          }
        }
        throw new Error(errorMessages.join(', '))
      }
      
      throw new Error('Error al actualizar la información del usuario')
    }
  }

  /**
   * Actualizar perfil extendido del usuario
   */
  async updateUserProfile(profileData: ProfileUpdateData): Promise<ProfileResponse> {
    try {
      const response = await api.patch('/api/auth/me/profile/', profileData)
      return response.data
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error)
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      
      // Manejar errores específicos del backend
      if (error.response?.data) {
        const errorMessages = []
        for (const [field, messages] of Object.entries(error.response.data)) {
          if (Array.isArray(messages)) {
            errorMessages.push(...messages)
          } else {
            errorMessages.push(messages)
          }
        }
        throw new Error(errorMessages.join(', '))
      }
      
      throw new Error('Error al actualizar el perfil')
    }
  }

  /**
   * Actualizar información completa del usuario y perfil
   */
  async updateCompleteProfile(
    userData: UserUpdateData, 
    profileData: ProfileUpdateData
  ): Promise<{ user: ProfileResponse; profile: ProfileResponse }> {
    try {
      // Actualizar en paralelo para mejor rendimiento
      const [userResponse, profileResponse] = await Promise.all([
        this.updateUserInfo(userData),
        this.updateUserProfile(profileData)
      ])

      return {
        user: userResponse,
        profile: profileResponse
      }
    } catch (error) {
      console.error('Error al actualizar perfil completo:', error)
      throw error
    }
  }

  /**
   * Cambiar contraseña del usuario
   */
  async changePassword(passwordData: PasswordChangeData): Promise<{ message: string }> {
    try {
      const response = await api.post('/api/auth/change-password/', passwordData)
      return response.data
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error)
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message)
      }
      
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error)
      }
      
      // Manejar errores específicos del backend
      if (error.response?.data) {
        const errorMessages = []
        for (const [field, messages] of Object.entries(error.response.data)) {
          if (Array.isArray(messages)) {
            errorMessages.push(...messages)
          } else {
            errorMessages.push(messages)
          }
        }
        throw new Error(errorMessages.join(', '))
      }
      
      throw new Error('Error al cambiar la contraseña')
    }
  }

  /**
   * Validar datos del formulario antes de enviar
   */
  validateUserData(userData: UserUpdateData): string[] {
    const errors: string[] = []
    
    if (!userData.first_name?.trim()) {
      errors.push('El nombre es requerido')
    }
    
    if (!userData.last_name?.trim()) {
      errors.push('El apellido es requerido')
    }
    
    if (userData.phone && userData.phone.length < 8) {
      errors.push('El teléfono debe tener al menos 8 dígitos')
    }
    
    return errors
  }

  /**
   * Validar datos del perfil antes de enviar
   */
  validateProfileData(profileData: ProfileUpdateData): string[] {
    const errors: string[] = []
    
    if (!profileData.timezone) {
      errors.push('La zona horaria es requerida')
    }
    
    if (!profileData.language) {
      errors.push('El idioma es requerido')
    }
    
    if (profileData.birth_date) {
      const birthDate = new Date(profileData.birth_date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      
      if (age < 13) {
        errors.push('Debes tener al menos 13 años')
      }
      
      if (age > 120) {
        errors.push('Fecha de nacimiento no válida')
      }
    }
    
    return errors
  }

  /**
   * Validar datos de cambio de contraseña
   */
  validatePasswordData(passwordData: PasswordChangeData & { confirm_password: string }): string[] {
    const errors: string[] = []
    
    if (!passwordData.current_password) {
      errors.push('La contraseña actual es requerida')
    }
    
    if (!passwordData.new_password) {
      errors.push('La nueva contraseña es requerida')
    }
    
    if (passwordData.new_password.length < 8) {
      errors.push('La nueva contraseña debe tener al menos 8 caracteres')
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.push('Las contraseñas no coinciden')
    }
    
    if (passwordData.current_password === passwordData.new_password) {
      errors.push('La nueva contraseña debe ser diferente a la actual')
    }
    
    return errors
  }

  /**
   * Formatear datos para mostrar en la interfaz
   */
  formatUserData(user: User): {
    displayName: string
    initials: string
    memberSince: string
    lastLogin: string
  } {
    const displayName = user.full_name || user.username
    const initials = user.first_name?.charAt(0) || user.username?.charAt(0) || 'U'
    
    const memberSince = new Date(user.date_joined).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const lastLogin = user.last_login_local || 'Nunca'
    
    return {
      displayName,
      initials,
      memberSince,
      lastLogin
    }
  }

  /**
   * Obtener opciones de zona horaria
   */
  getTimezoneOptions(): { value: string; label: string }[] {
    return [
      { value: 'America/Santiago', label: 'Santiago (GMT-3)' },
      { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (GMT-3)' },
      { value: 'America/Lima', label: 'Lima (GMT-5)' },
      { value: 'America/Bogota', label: 'Bogotá (GMT-5)' },
      { value: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
      { value: 'America/New_York', label: 'Nueva York (GMT-5)' },
      { value: 'Europe/Madrid', label: 'Madrid (GMT+1)' },
      { value: 'Europe/London', label: 'Londres (GMT+0)' }
    ]
  }

  /**
   * Obtener opciones de idioma
   */
  getLanguageOptions(): { value: string; label: string }[] {
    return [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' },
      { value: 'pt', label: 'Português' },
      { value: 'fr', label: 'Français' }
    ]
  }
}

// Instancia singleton del servicio
const profileService = new ProfileService()
export default profileService 