import api from './api';
import { 
  Professional, 
  ScheduleSummary, 
  ProfessionalSchedule, 
  ScheduleData, 
  ScheduleOverview,
  WeeklySchedule,
  ScheduleException,
  ScheduleBreak,
  ApiResponse 
} from '../types/schedule';

export interface ScheduleFilters {
  professional?: string;
  is_active?: boolean;
  accepts_bookings?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ScheduleListResponse extends ApiResponse<ScheduleSummary> {
  plan_info?: {
    plan_name: string;
    limits: {
      schedules: {
        current: number;
        max: number;
        can_add: boolean;
      };
    };
  };
}

export interface DuplicateScheduleData {
  target_professional_id: string;
}

export interface DuplicateScheduleResponse {
  success: boolean;
  message: string;
  new_schedule_id: string;
  source_schedule_id: string;
  target_professional: {
    id: string;
    name: string;
  };
}

export interface AvailabilityQuery {
  professional_id?: string;
  start_date: string;
  end_date: string;
  include_breaks?: boolean;
}

class ScheduleService {
  /**
   * Obtener lista de horarios con filtros y paginación
   */
  async getSchedules(filters: ScheduleFilters = {}): Promise<ScheduleListResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.professional) {
        params.append('professional', filters.professional);
      }
      if (filters.is_active !== undefined) {
        params.append('is_active', filters.is_active.toString());
      }
      if (filters.accepts_bookings !== undefined) {
        params.append('accepts_bookings', filters.accepts_bookings.toString());
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

      const response = await api.get(`/api/schedule/schedules/?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo horarios:', error);
      throw new Error('Error al cargar los horarios');
    }
  }

  /**
   * Obtener un horario específico por ID
   */
  async getSchedule(scheduleId: string): Promise<ProfessionalSchedule> {
    try {
      const response = await api.get(`/api/schedule/schedules/${scheduleId}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo horario:', error);
      throw new Error('Error al cargar el horario');
    }
  }

  /**
   * Crear un nuevo horario
   */
  async createSchedule(scheduleData: ScheduleData): Promise<ProfessionalSchedule> {
    try {
      const response = await api.post('/api/schedule/schedules/', scheduleData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error creando horario:', error);
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { detail?: string; error?: string } } };
        if (errObj.response?.data?.detail) {
          throw new Error(errObj.response.data.detail);
        }
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error);
        }
      }
      
      throw new Error('Error al crear el horario');
    }
  }

  /**
   * Actualizar un horario existente
   */
  async updateSchedule(scheduleId: string, scheduleData: ScheduleData): Promise<ProfessionalSchedule> {
    try {
      const response = await api.put(`/api/schedule/schedules/${scheduleId}/`, scheduleData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error actualizando horario:', error);
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { detail?: string; error?: string } } };
        if (errObj.response?.data?.detail) {
          throw new Error(errObj.response.data.detail);
        }
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error);
        }
      }
      
      throw new Error('Error al actualizar el horario');
    }
  }

  /**
   * Eliminar un horario
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      await api.delete(`/api/schedule/schedules/${scheduleId}/`);
    } catch (error) {
      console.error('Error eliminando horario:', error);
      throw new Error('Error al eliminar el horario');
    }
  }

  /**
   * Duplicar un horario a otro profesional
   */
  async duplicateSchedule(scheduleId: string, data: DuplicateScheduleData): Promise<DuplicateScheduleResponse> {
    try {
      const response = await api.post(`/api/schedule/schedules/${scheduleId}/duplicate/`, data);
      return response.data;
    } catch (error: unknown) {
      console.error('Error duplicando horario:', error);
      
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { error?: string; detail?: string } } };
        if (errObj.response?.data?.error) {
          throw new Error(errObj.response.data.error);
        }
        if (errObj.response?.data?.detail) {
          throw new Error(errObj.response.data.detail);
        }
      }
      
      throw new Error('Error al duplicar el horario');
    }
  }

  /**
   * Obtener resumen general de horarios
   */
  async getOverview(): Promise<ScheduleOverview> {
    try {
      const response = await api.get('/api/schedule/overview/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      throw new Error('Error al cargar el resumen de horarios');
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
   * Obtener un profesional específico
   */
  async getProfessional(professionalId: string): Promise<Professional> {
    try {
      const response = await api.get(`/api/organizations/professionals/${professionalId}/`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo profesional:', error);
      throw new Error('Error al cargar el profesional');
    }
  }

  /**
   * Activar/desactivar un horario
   */
  async toggleScheduleStatus(scheduleId: string): Promise<{
    success: boolean;
    schedule_id: string;
    new_status: 'active' | 'inactive';
    message: string;
  }> {
    try {
      const response = await api.post(`/api/schedule/schedules/${scheduleId}/toggle-status/`);
      return response.data;
    } catch (error) {
      console.error('Error cambiando estado del horario:', error);
      throw new Error('Error al cambiar el estado del horario');
    }
  }

  /**
   * Obtener disponibilidad calculada para un rango de fechas
   */
  async getAvailability(query: AvailabilityQuery): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      
      if (query.professional_id) {
        params.append('professional_id', query.professional_id);
      }
      params.append('start_date', query.start_date);
      params.append('end_date', query.end_date);
      if (query.include_breaks !== undefined) {
        params.append('include_breaks', query.include_breaks.toString());
      }

      const response = await api.get(`/api/schedule/availability/?${params.toString()}`);
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error obteniendo disponibilidad:', error);
      throw new Error('Error al cargar la disponibilidad');
    }
  }

  /**
   * Validar datos de horario antes de crear/actualizar
   */
  validateScheduleData(scheduleData: ScheduleData): string[] {
    const errors: string[] = [];

    // Validar configuración general
    if (!scheduleData.professional) {
      errors.push('El profesional es requerido');
    }

    if (!scheduleData.timezone) {
      errors.push('La zona horaria es requerida');
    }

    if (scheduleData.slot_duration <= 0) {
      errors.push('La duración de slots debe ser mayor a 0');
    }

    if (scheduleData.min_booking_notice < 0) {
      errors.push('El tiempo mínimo de anticipación no puede ser negativo');
    }

    if (scheduleData.max_booking_advance < scheduleData.min_booking_notice) {
      errors.push('El tiempo máximo de anticipación debe ser mayor al mínimo');
    }

    // Validar horarios semanales
    scheduleData.weekly_schedules.forEach((schedule, index) => {
      if (schedule.start_time >= schedule.end_time) {
        errors.push(`Horario ${index + 1}: La hora de inicio debe ser menor a la hora de fin`);
      }

      // Validar breaks
      schedule.breaks.forEach((breakItem, breakIndex) => {
        if (breakItem.start_time >= breakItem.end_time) {
          errors.push(`Horario ${index + 1}, Break ${breakIndex + 1}: La hora de inicio del break debe ser menor a la hora de fin`);
        }

        if (breakItem.start_time < schedule.start_time || breakItem.end_time > schedule.end_time) {
          errors.push(`Horario ${index + 1}, Break ${breakIndex + 1}: El break debe estar dentro del horario de trabajo`);
        }

        if (!breakItem.name?.trim()) {
          errors.push(`Horario ${index + 1}, Break ${breakIndex + 1}: El nombre del break es requerido`);
        }
      });
    });

    // Validar excepciones
    scheduleData.exceptions.forEach((exception, index) => {
      if (!exception.date) {
        errors.push(`Excepción ${index + 1}: La fecha es requerida`);
      }

      if (!exception.reason?.trim()) {
        errors.push(`Excepción ${index + 1}: El motivo es requerido`);
      }

      if (exception.exception_type === 'special_hours') {
        if (!exception.start_time || !exception.end_time) {
          errors.push(`Excepción ${index + 1}: Horarios especiales requieren hora de inicio y fin`);
        } else if (exception.start_time >= exception.end_time) {
          errors.push(`Excepción ${index + 1}: La hora de inicio debe ser menor a la hora de fin`);
        }
      }
    });

    return errors;
  }

  /**
   * Combinar datos de profesionales con sus horarios
   */
  combineWithSchedules(professionals: Professional[], schedules: ScheduleSummary[]) {
    return professionals.map(professional => {
      const schedule = schedules.find(s => s.professional === professional.id);
      return {
        ...professional,
        schedule,
        hasSchedule: !!schedule,
        scheduleStatus: schedule?.is_active ? 'active' as const : schedule ? 'inactive' as const : 'none' as const
      };
    });
  }

  /**
   * Formatear duración de slot para mostrar
   */
  formatSlotDuration(minutes: number): string {
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
   * Formatear tiempo de anticipación para mostrar
   */
  formatBookingNotice(minutes: number): string {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `${days} día${days !== 1 ? 's' : ''}`;
    }
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    }
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }

  /**
   * Obtener nombre del día de la semana
   */
  getWeekdayName(weekday: number): string {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return days[weekday] || 'Día desconocido';
  }

  /**
   * Obtener nombre del tipo de excepción
   */
  getExceptionTypeName(type: string): string {
    const types = {
      'unavailable': 'No Disponible',
      'vacation': 'Vacaciones',
      'sick_leave': 'Licencia Médica',
      'special_hours': 'Horario Especial',
      'holiday': 'Día Festivo'
    };
    return types[type as keyof typeof types] || type;
  }

  /**
   * Calcular estadísticas de horario
   */
  calculateScheduleStats(schedule: ProfessionalSchedule): {
    totalWeeklyHours: number;
    activeDaysCount: number;
    totalBreakTime: number;
    workingDaysPerWeek: number;
  } {
    let totalWeeklyHours = 0;
    let activeDaysCount = 0;
    let totalBreakTime = 0;

    schedule.weekly_schedules.forEach(daySchedule => {
      if (daySchedule.is_active) {
        activeDaysCount++;
        
        const start = new Date(`1970-01-01T${daySchedule.start_time}`);
        const end = new Date(`1970-01-01T${daySchedule.end_time}`);
        const dailyHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        // Restar tiempo de breaks
        let dailyBreakTime = 0;
        daySchedule.breaks.forEach(breakItem => {
          if (breakItem.is_active) {
            const breakStart = new Date(`1970-01-01T${breakItem.start_time}`);
            const breakEnd = new Date(`1970-01-01T${breakItem.end_time}`);
            const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
            dailyBreakTime += breakHours;
          }
        });
        
        totalWeeklyHours += (dailyHours - dailyBreakTime);
        totalBreakTime += dailyBreakTime;
      }
    });

    return {
      totalWeeklyHours: Math.round(totalWeeklyHours * 100) / 100,
      activeDaysCount,
      totalBreakTime: Math.round(totalBreakTime * 100) / 100,
      workingDaysPerWeek: activeDaysCount
    };
  }
}

export default new ScheduleService(); 