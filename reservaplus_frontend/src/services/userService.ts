// src/services/userService.ts

// Legacy types for backward compatibility
export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone: string
  role: 'owner' | 'admin' | 'staff' | 'professional' | 'reception'
  organization_id?: string
  organization_name?: string
  is_professional: boolean
  is_active_in_org: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface UserProfile extends User {}

export interface UserRole {
  id: string
  name: string
  display_name: string
  description: string
  permissions: string[]
  user_count: number
}

export interface CreateUserData {
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: 'owner' | 'admin' | 'staff' | 'professional' | 'reception'
  is_professional?: boolean
}

export interface UpdateUserData extends Partial<CreateUserData> {
  id: string
}

export interface CreateUserResponse {
  user: User
  message: string
}

export interface UserFilters {
  role?: string
  is_active?: boolean
  search?: string
}

export interface PlanInfo {
  name: string
  max_users: number
  current_users: number
}

const userService = {
  // Parse Cognito user to our UserProfile format
  parseUserFromCognito: (cognitoUser: any): UserProfile => {
    const profile = cognitoUser.profile
    
    return {
      id: profile.sub || '',
      username: profile.preferred_username || profile.email || '',
      email: profile.email || '',
      first_name: profile.given_name || '',
      last_name: profile.family_name || '',
      full_name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
      phone: profile.phone_number || '',
      role: profile['custom:role'] || 'professional',
      organization_id: profile['custom:organization_id'] || null,
      organization_name: profile['custom:organization_name'] || '',
      is_professional: profile['custom:is_professional'] === 'true',
      is_active_in_org: profile['custom:is_active_in_org'] === 'true',
    }
  },

  // Get current user profile
  getCurrentUserProfile: (auth: any): UserProfile | null => {
    if (!auth.isAuthenticated || !auth.user) {
      return null
    }
    
    return userService.parseUserFromCognito(auth.user)
  },

  // Check if user has specific role(s)
  hasRole: (user: UserProfile | null, roles: string | string[]): boolean => {
    if (!user || !user.role) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  },

  // Check if user can access specific permission
  canAccess: (user: UserProfile | null, permission: string): boolean => {
    if (!user || !user.role) return false
    
    const permissions: Record<string, string[]> = {
      'owner': ['view_all', 'edit_all', 'delete_all', 'manage_organization', 'view_reports', 'manage_users'],
      'admin': ['view_all', 'edit_all', 'delete_own', 'view_reports', 'manage_users'],
      'staff': ['view_own', 'edit_own', 'view_clients', 'create_appointments'],
      'professional': ['view_own', 'edit_own', 'view_appointments', 'view_clients'],
      'reception': ['view_all', 'edit_appointments', 'create_appointments', 'view_clients', 'manage_schedule'],
    }
    
    return permissions[user.role]?.includes(permission) || false
  },

  // Get user's organization info
  getOrganizationInfo: (user: UserProfile | null) => {
    if (!user) return null
    
    return {
      id: user.organization_id,
      name: user.organization_name,
      is_active: user.is_active_in_org
    }
  },

  // Legacy methods for backward compatibility (these would normally call APIs)
  async getUsers(filters?: UserFilters): Promise<User[]> {
    // For now, return empty array since we're using Cognito-only
    console.warn('getUsers called - implement Cognito user listing if needed')
    return []
  },

  async createUser(userData: CreateUserData): Promise<CreateUserResponse> {
    // For now, throw error since we need to implement Cognito user creation
    throw new Error('User creation via Cognito not implemented yet. Use Cognito Console.')
  },

  async updateUser(userData: UpdateUserData): Promise<User> {
    // For now, throw error since we need to implement Cognito user updates
    throw new Error('User updates via Cognito not implemented yet. Use Cognito Console.')
  },

  async deleteUser(userId: string): Promise<void> {
    // For now, throw error since we need to implement Cognito user deletion
    throw new Error('User deletion via Cognito not implemented yet. Use Cognito Console.')
  },

  async getRoles(): Promise<UserRole[]> {
    // Return predefined roles since they're not stored in Cognito
    return [
      {
        id: 'owner',
        name: 'owner',
        display_name: 'Propietario',
        description: 'Acceso completo al sistema',
        permissions: ['view_all', 'edit_all', 'delete_all', 'manage_organization', 'view_reports', 'manage_users'],
        user_count: 0
      },
      {
        id: 'admin',
        name: 'admin',
        display_name: 'Administrador',
        description: 'Administración general del sistema',
        permissions: ['view_all', 'edit_all', 'delete_own', 'view_reports', 'manage_users'],
        user_count: 0
      },
      {
        id: 'staff',
        name: 'staff',
        display_name: 'Personal',
        description: 'Personal general del establecimiento',
        permissions: ['view_own', 'edit_own', 'view_clients', 'create_appointments'],
        user_count: 0
      },
      {
        id: 'professional',
        name: 'professional',
        display_name: 'Profesional',
        description: 'Profesional que brinda servicios',
        permissions: ['view_own', 'edit_own', 'view_appointments', 'view_clients'],
        user_count: 0
      },
      {
        id: 'reception',
        name: 'reception',
        display_name: 'Recepción',
        description: 'Personal de recepción y atención',
        permissions: ['view_all', 'edit_appointments', 'create_appointments', 'view_clients', 'manage_schedule'],
        user_count: 0
      }
    ]
  },

  async getPlanInfo(): Promise<PlanInfo> {
    // Return mock plan info for now
    return {
      name: 'Plan Básico',
      max_users: 10,
      current_users: 1
    }
  }
}

// Export as both named and default for compatibility
export { userService }
export default userService