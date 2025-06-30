import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: 'owner' | 'admin' | 'professional' | 'reception' | 'staff';
  is_professional: boolean;
  organization: string;
  organization_name: string;
  is_active_in_org: boolean;
  date_joined: string;
  last_login: string | null;
  last_login_local: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'admin' | 'professional' | 'reception' | 'staff';
  is_professional?: boolean;
  password: string;
  confirm_password: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: 'admin' | 'professional' | 'reception' | 'staff';
  is_professional?: boolean;
}

export interface RoleLimits {
  current: number;
  max: number;
  can_add: boolean;
}

export interface PlanInfo {
  plan_name: string;
  limits: {
    total_users: RoleLimits;
    professionals: RoleLimits;
    receptionists: RoleLimits;
    staff: RoleLimits;
  };
  real_counts: {
    professionals: number;
    receptionists: number;
    staff: number;
    total_active: number;
  };
}

export interface UserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
  plan_info: PlanInfo;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: string[];
  editable: boolean;
}

export interface UserFilters {
  role?: string;
  status?: 'active' | 'inactive';
  search?: string;
  page?: number;
  page_size?: number;
}

class UserService {
  /**
   * Obtener lista de usuarios de la organización con filtros y paginación
   */
  async getUsers(filters: UserFilters = {}): Promise<UserListResponse> {
    const params = new URLSearchParams();
    
    if (filters.role && filters.role !== 'all') {
      params.append('role', filters.role);
    }
    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    if (filters.page_size) {
      params.append('page_size', filters.page_size.toString());
    }

    const response = await api.get(`/api/auth/organization/?${params.toString()}`);
    return response.data;
  }

  /**
   * Crear un nuevo usuario
   */
  async createUser(userData: CreateUserData): Promise<User> {
    const response = await api.post('/api/auth/organization/create/', userData);
    return response.data;
  }

  /**
   * Obtener un usuario específico
   */
  async getUser(userId: string): Promise<User> {
    const response = await api.get(`/api/auth/organization/${userId}/`);
    return response.data;
  }

  /**
   * Actualizar un usuario existente
   */
  async updateUser(userId: string, userData: UpdateUserData): Promise<User> {
    const response = await api.patch(`/api/auth/organization/${userId}/`, userData);
    return response.data;
  }

  /**
   * Eliminar un usuario
   */
  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/api/auth/organization/${userId}/`);
  }

  /**
   * Activar/desactivar un usuario
   */
  async toggleUserStatus(userId: string): Promise<{
    success: boolean;
    user_id: string;
    new_status: 'active' | 'inactive';
    message: string;
  }> {
    const response = await api.post(`/api/auth/organization/${userId}/toggle-status/`);
    return response.data;
  }

  /**
   * Obtener información sobre los roles disponibles
   */
  async getRoles(): Promise<UserRole[]> {
    const response = await api.get('/api/auth/roles/');
    return response.data;
  }

  /**
   * Validar si se puede crear un nuevo usuario (verificar límites del plan)
   */
  async canCreateUser(role?: string): Promise<boolean> {
    try {
      const response = await this.getUsers({ page_size: 1 });
      const limits = response.plan_info.limits;
      
      // Verificar límite general de usuarios
      if (!limits.total_users.can_add) {
        return false;
      }
      
      // Verificar límite específico por rol si se proporciona
      if (role) {
        switch (role) {
          case 'professional':
            return limits.professionals.can_add;
          case 'reception':
            return limits.receptionists.can_add;
          case 'staff':
            return limits.staff.can_add;
          default:
            return true; // admin no tiene límite específico más allá del total
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando límites del plan:', error);
      return false;
    }
  }

  /**
   * Obtener información del plan actual
   */
  async getPlanInfo(): Promise<PlanInfo | null> {
    try {
      const response = await this.getUsers({ page_size: 1 });
      return response.plan_info;
    } catch (error) {
      console.error('Error obteniendo información del plan:', error);
      return null;
    }
  }

  /**
   * Obtener mensaje de error para límites de roles específicos
   */
  getRoleLimitMessage(role: string, planInfo: PlanInfo): string {
    const limits = planInfo.limits;
    
    switch (role) {
      case 'professional':
        return `Has alcanzado el límite de profesionales para tu plan ${planInfo.plan_name} (${limits.professionals.current}/${limits.professionals.max})`;
      case 'reception':
        return `Has alcanzado el límite de recepcionistas para tu plan ${planInfo.plan_name} (${limits.receptionists.current}/${limits.receptionists.max})`;
      case 'staff':
        return `Has alcanzado el límite de staff para tu plan ${planInfo.plan_name} (${limits.staff.current}/${limits.staff.max})`;
      default:
        return `Has alcanzado el límite de usuarios para tu plan ${planInfo.plan_name} (${limits.total_users.current}/${limits.total_users.max})`;
    }
  }

  /**
   * Validar datos de usuario antes de crear/actualizar
   */
  validateUserData(userData: CreateUserData | UpdateUserData): string[] {
    const errors: string[] = [];

    if ('first_name' in userData && !userData.first_name?.trim()) {
      errors.push('El nombre es requerido');
    }

    if ('last_name' in userData && !userData.last_name?.trim()) {
      errors.push('El apellido es requerido');
    }

    if ('email' in userData && userData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.push('El email no tiene un formato válido');
      }
    }

    if ('password' in userData) {
      const createData = userData as CreateUserData;
      if (!createData.password || createData.password.length < 6) {
        errors.push('La contraseña debe tener al menos 6 caracteres');
      }
      if (createData.password !== createData.confirm_password) {
        errors.push('Las contraseñas no coinciden');
      }
    }

    return errors;
  }

  /**
   * Generar username automáticamente basado en nombre y apellido
   */
  generateUsername(firstName: string, lastName: string): string {
    const cleanFirst = firstName.toLowerCase().trim().replace(/\s+/g, '');
    const cleanLast = lastName.toLowerCase().trim().replace(/\s+/g, '');
    return `${cleanFirst}.${cleanLast}`;
  }

  /**
   * Formatear nombre completo del usuario
   */
  getFullName(user: User): string {
    return user.full_name || `${user.first_name} ${user.last_name}`.trim() || user.username;
  }

  /**
   * Obtener color del rol
   */
  getRoleColor(role: string): string {
    const colors = {
      owner: 'purple',
      admin: 'indigo',
      professional: 'emerald',
      reception: 'orange',
      staff: 'blue'
    };
    return colors[role as keyof typeof colors] || 'gray';
  }

  /**
   * Obtener nombre legible del rol
   */
  getRoleName(role: string): string {
    const names = {
      owner: 'Propietario',
      admin: 'Administrador',
      professional: 'Profesional',
      reception: 'Recepcionista',
      staff: 'Staff'
    };
    return names[role as keyof typeof names] || role;
  }

  /**
   * Formatear fecha de último login
   */
  formatLastLogin(user: User): string {
    if (user.last_login_local) {
      return user.last_login_local;
    }
    if (user.last_login) {
      return new Date(user.last_login).toLocaleDateString('es-CL');
    }
    return 'Nunca';
  }
}

export default new UserService(); 