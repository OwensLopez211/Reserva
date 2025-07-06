import api from './api';
import { 
  Service, 
  ServiceData, 
  ServiceOverview,
  Professional,
  ApiResponse,
  ServiceLimits
} from '../types/services';

export interface ServiceFilters {
  category?: string;
  is_active?: boolean;
  requires_preparation?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ServiceListResponse extends ApiResponse<Service> {
  plan_info?: {
    plan_name: string;
    limits: {
      services: {
        current: number;
        max: number;
        can_add: boolean;
      };
    };
  };
}

class ServicesService {
  /**
   * Obtener lista de servicios con filtros y paginación
   */
  async getServices(filters: ServiceFilters = {}): Promise<ServiceListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.category) {
        params.append('category', filters.category);
      }
      if (filters.is_active !== undefined) {
        params.append('is_active', filters.is_active.toString());
      }
      if (filters.requires_preparation !== undefined) {
        params.append('requires_preparation', filters.requires_preparation.toString());
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

      const response = await api.get(`/api/organizations/services/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo servicios:', error);
      throw new Error('Error al cargar los servicios');
    }
  }

  /**
   * Obtener un servicio específico por ID
   */
  async getService(serviceId: string): Promise<Service> {
    try {
      const response = await api.get(`/api/organizations/services/${serviceId}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo servicio:', error);
      throw new Error('Error al cargar el servicio');
    }
  }

  /**
   * Crear un nuevo servicio
   */
  async createService(serviceData: ServiceData): Promise<Service> {
    try {
      const response = await api.post('/api/organizations/services/', serviceData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error creando servicio:', error);
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { detail?: string; error?: string; non_field_errors?: string[] } } };
        if (errObj.response?.data?.detail) {
          throw new Error(errObj.response.data.detail);
        }
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error);
        }
        if (errObj.response?.data?.non_field_errors) {
          throw new Error(errObj.response.data.non_field_errors[0]);
        }
      }
      
      throw new Error('Error al crear el servicio');
    }
  }

  /**
   * Actualizar un servicio existente
   */
  async updateService(serviceId: string, serviceData: ServiceData): Promise<Service> {
    try {
      const response = await api.put(`/api/organizations/services/${serviceId}/`, serviceData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error actualizando servicio:', error);
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { detail?: string; error?: string; non_field_errors?: string[] } } };
        if (errObj.response?.data?.detail) {
          throw new Error(errObj.response.data.detail);
        }
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error);
        }
        if (errObj.response?.data?.non_field_errors) {
          throw new Error(errObj.response.data.non_field_errors[0]);
        }
      }
      
      throw new Error('Error al actualizar el servicio');
    }
  }

  /**
   * Eliminar un servicio
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      await api.delete(`/api/organizations/services/${serviceId}/`);
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      throw new Error('Error al eliminar el servicio');
    }
  }

  /**
   * Obtener información de límites de servicios
   */
  async getLimitsInfo(): Promise<ServiceLimits> {
    try {
      const response = await api.get('/api/organizations/services/limits_info/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo límites:', error);
      throw new Error('Error al cargar información de límites');
    }
  }

  /**
   * Obtener profesionales de la organización
   */
  async getProfessionals(): Promise<Professional[]> {
    try {
      const response = await api.get('/api/organizations/professionals/');
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error obteniendo profesionales:', error);
      throw new Error('Error al cargar los profesionales');
    }
  }

  /**
   * Obtener resumen/estadísticas de servicios
   */
  async getOverview(): Promise<ServiceOverview> {
    try {
      // Como no hay endpoint específico, construimos el overview desde los servicios
      const servicesResponse = await this.getServices();
      const services = servicesResponse.results;
      
      // Calcular estadísticas
      const activeServices = services.filter(s => s.is_active).length;
      const categories = [...new Set(services.map(s => s.category))];
      const avgDuration = services.length > 0 
        ? Math.round(services.reduce((sum, s) => sum + s.duration_minutes, 0) / services.length)
        : 0;
      const avgPrice = services.length > 0
        ? services.reduce((sum, s) => sum + parseFloat(s.price), 0) / services.length
        : 0;

      // Categorías con estadísticas
      const categoriesStats = categories.map(category => {
        const categoryServices = services.filter(s => s.category === category);
        const categoryAvgPrice = categoryServices.length > 0
          ? categoryServices.reduce((sum, s) => sum + parseFloat(s.price), 0) / categoryServices.length
          : 0;
        
        return {
          name: category,
          count: categoryServices.length,
          avg_price: categoryAvgPrice.toFixed(0)
        };
      });

      return {
        summary: {
          total_services: services.length,
          active_services: activeServices,
          categories_count: categories.length,
          avg_duration: avgDuration,
          avg_price: avgPrice
        },
        recent_services: services.slice(0, 5), // Últimos 5 servicios
        categories: categoriesStats
      };
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      throw new Error('Error al cargar el resumen de servicios');
    }
  }

  /**
   * Activar/desactivar un servicio
   */
  async toggleServiceStatus(serviceId: string): Promise<{
    success: boolean;
    service_id: string;
    new_status: 'active' | 'inactive';
    message: string;
  }> {
    try {
      // Como no hay endpoint específico, obtenemos el servicio y lo actualizamos
      const service = await this.getService(serviceId);
      const updatedService = await this.updateService(serviceId, {
        ...service,
        is_active: !service.is_active
      });

      return {
        success: true,
        service_id: serviceId,
        new_status: updatedService.is_active ? 'active' : 'inactive',
        message: `Servicio ${updatedService.is_active ? 'activado' : 'desactivado'} correctamente`
      };
    } catch (error) {
      console.error('Error cambiando estado del servicio:', error);
      throw new Error('Error al cambiar el estado del servicio');
    }
  }

  /**
   * Validar datos de servicio antes de crear/actualizar
   */
  validateServiceData(serviceData: ServiceData): string[] {
    const errors: string[] = [];

    // Validar campos obligatorios
    if (!serviceData.name?.trim()) {
      errors.push('El nombre del servicio es requerido');
    }

    if (!serviceData.category?.trim()) {
      errors.push('La categoría es requerida');
    }

    if (serviceData.duration_minutes <= 0) {
      errors.push('La duración debe ser mayor a 0 minutos');
    }

    if (serviceData.duration_minutes > 480) {
      errors.push('La duración no puede ser mayor a 8 horas (480 minutos)');
    }

    const price = parseFloat(serviceData.price);
    if (isNaN(price) || price < 0) {
      errors.push('El precio debe ser un número válido mayor o igual a 0');
    }

    if (price > 1000000) {
      errors.push('El precio no puede ser mayor a $1,000,000');
    }

    if (serviceData.buffer_time_before < 0) {
      errors.push('El tiempo de preparación no puede ser negativo');
    }

    if (serviceData.buffer_time_after < 0) {
      errors.push('El tiempo de limpieza no puede ser negativo');
    }

    if (serviceData.buffer_time_before > 60) {
      errors.push('El tiempo de preparación no puede ser mayor a 60 minutos');
    }

    if (serviceData.buffer_time_after > 60) {
      errors.push('El tiempo de limpieza no puede ser mayor a 60 minutos');
    }

    return errors;
  }

  /**
   * Formatear duración en formato legible
   */
  formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Formatear precio en formato de moneda chilena
   */
  formatPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice);
  }

  /**
   * Obtener nombre de categoría legible
   */
  getCategoryName(categoryKey: string): string {
    const categories = {
      'cortes': 'Cortes',
      'coloracion': 'Coloración',
      'tratamientos': 'Tratamientos',
      'peinados': 'Peinados',
      'manicure': 'Manicure',
      'pedicure': 'Pedicure',
      'facial': 'Facial',
      'masajes': 'Masajes',
      'depilacion': 'Depilación',
      'cejas': 'Cejas y Pestañas',
      'estetica': 'Estética',
      'otros': 'Otros'
    };
    return categories[categoryKey as keyof typeof categories] || categoryKey;
  }

  /**
   * Verificar si se puede crear un nuevo servicio
   */
  async canCreateService(): Promise<boolean> {
    try {
      const limits = await this.getLimitsInfo();
      return limits.can_add_more;
    } catch (error) {
      console.error('Error verificando límites:', error);
      return false;
    }
  }

  /**
   * Obtener mensaje de límite alcanzado
   */
  async getLimitMessage(): Promise<string> {
    try {
      const limits = await this.getLimitsInfo();
      return `Has alcanzado el límite de servicios para tu plan ${limits.plan_name} (${limits.current_count}/${limits.max_allowed})`;
    } catch {
      return 'Error al verificar límites del plan';
    }
  }

  /**
   * Calcular duración total con buffers
   */
  calculateTotalDuration(duration: number, bufferBefore: number, bufferAfter: number): number {
    return duration + bufferBefore + bufferAfter;
  }

  /**
   * Filtrar servicios por profesional
   */
  filterServicesByProfessional(services: Service[], professionalId: string): Service[] {
    return services.filter(service => 
      service.professionals.includes(professionalId)
    );
  }

  /**
   * Agrupar servicios por categoría
   */
  groupServicesByCategory(services: Service[]): Record<string, Service[]> {
    return services.reduce((groups, service) => {
      const category = service.category || 'sin_categoria';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(service);
      return groups;
    }, {} as Record<string, Service[]>);
  }
}

export default new ServicesService(); 