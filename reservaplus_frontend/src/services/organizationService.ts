import api from './api';
import { 
  Organization, 
  OrganizationUpdateData,
  OrganizationOverview,
  BusinessHours,
  BusinessRules,
  Terminology,
  IndustryTemplate
} from '../types/organization';

class OrganizationService {
  /**
   * Obtener información completa de la organización del usuario actual
   */
  async getOrganization(): Promise<Organization> {
    try {
      const response = await api.get('/api/organizations/me/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo organización:', error);
      throw new Error('Error al cargar la información de la organización');
    }
  }

  /**
   * Actualizar información de la organización
   */
  async updateOrganization(organizationData: OrganizationUpdateData): Promise<Organization> {
    try {
      // Obtener la organización actual primero para obtener el ID
      const currentOrg = await this.getOrganization();
      
      const response = await api.put(`/api/organizations/organizations/${currentOrg.id}/`, organizationData);
      return response.data;
    } catch (error: unknown) {
      console.error('Error actualizando organización:', error);
      
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
      
      throw new Error('Error al actualizar la organización');
    }
  }

  /**
   * Obtener resumen/overview de la organización
   */
  async getOrganizationOverview(): Promise<OrganizationOverview> {
    try {
      const organization = await this.getOrganization();
      
      return {
        basic_info: {
          name: organization.name,
          industry: this.getIndustryName(organization.industry_template),
          created_date: organization.created_at,
          subscription_plan: organization.subscription_plan,
          is_trial: organization.is_trial
        },
        contact_info: {
          email: organization.email,
          phone: organization.phone,
          website: organization.website,
          address: this.formatAddress(organization.address, organization.city, organization.country)
        },
        business_config: {
          business_hours: organization.settings.business_hours || this.getDefaultBusinessHours(),
          business_rules: organization.business_rules || this.getDefaultBusinessRules(),
          terminology: organization.terminology || this.getDefaultTerminology()
        },
        subscription_info: organization.trial_ends_at ? {
          plan_name: organization.subscription_plan,
          status: organization.is_trial ? 'trial' : 'active',
          trial_end: organization.trial_ends_at
        } : undefined
      };
    } catch (error) {
      console.error('Error obteniendo overview:', error);
      throw new Error('Error al cargar el resumen de la organización');
    }
  }

  /**
   * Obtener plantillas de industria disponibles
   */
  async getIndustryTemplates(): Promise<IndustryTemplate[]> {
    // Por ahora retornamos las plantillas desde el frontend
    // En el futuro se puede hacer un endpoint en el backend
    const templates = [
      {
        key: 'salon',
        name: 'Peluquería/Salón de Belleza',
        description: 'Configuración optimizada para salones de belleza y peluquerías',
        terminology: {
          professional: { singular: 'Estilista', plural: 'Estilistas' },
          client: { singular: 'Cliente', plural: 'Clientes' },
          appointment: { singular: 'Cita', plural: 'Citas' },
          service: { singular: 'Servicio', plural: 'Servicios' }
        },
        business_rules: {
          allow_walk_ins: true,
          cancellation_window_hours: 2,
          requires_confirmation: false,
          advance_booking_days: 30,
          buffer_between_appointments: 15,
          send_reminders: true,
          reminder_hours_before: 24
        },
        business_hours: this.getDefaultBusinessHours()
      },
      {
        key: 'clinic',
        name: 'Clínica/Consultorio Médico',
        description: 'Configuración para clínicas y consultorios médicos',
        terminology: {
          professional: { singular: 'Doctor', plural: 'Doctores' },
          client: { singular: 'Paciente', plural: 'Pacientes' },
          appointment: { singular: 'Consulta', plural: 'Consultas' },
          service: { singular: 'Procedimiento', plural: 'Procedimientos' }
        },
        business_rules: {
          allow_walk_ins: false,
          cancellation_window_hours: 24,
          requires_confirmation: true,
          advance_booking_days: 60,
          buffer_between_appointments: 10,
          send_reminders: true,
          reminder_hours_before: 48
        },
        business_hours: this.getDefaultBusinessHours()
      },
      {
        key: 'spa',
        name: 'Spa/Centro de Bienestar',
        description: 'Configuración para spas y centros de bienestar',
        terminology: {
          professional: { singular: 'Terapeuta', plural: 'Terapeutas' },
          client: { singular: 'Cliente', plural: 'Clientes' },
          appointment: { singular: 'Sesión', plural: 'Sesiones' },
          service: { singular: 'Tratamiento', plural: 'Tratamientos' }
        },
        business_rules: {
          allow_walk_ins: false,
          cancellation_window_hours: 24,
          requires_confirmation: true,
          advance_booking_days: 45,
          buffer_between_appointments: 30,
          send_reminders: true,
          reminder_hours_before: 24
        },
        business_hours: this.getDefaultBusinessHours()
      }
    ];

    return templates;
  }

  /**
   * Validar datos de configuración antes de guardar
   */
  validateOrganizationData(organizationData: OrganizationUpdateData): string[] {
    const errors: string[] = [];

    // Validar campos obligatorios
    if (!organizationData.name?.trim()) {
      errors.push('El nombre de la organización es requerido');
    }

    if (!organizationData.email?.trim()) {
      errors.push('El email es requerido');
    } else if (!this.isValidEmail(organizationData.email)) {
      errors.push('El email no tiene un formato válido');
    }

    if (!organizationData.industry_template) {
      errors.push('Debe seleccionar una plantilla de industria');
    }

    // Validar horarios de negocio
    if (organizationData.settings.business_hours) {
      const hoursErrors = this.validateBusinessHours(organizationData.settings.business_hours);
      errors.push(...hoursErrors);
    }

    // Validar reglas de negocio
    if (organizationData.settings.business_rules) {
      const rulesErrors = this.validateBusinessRules(organizationData.settings.business_rules);
      errors.push(...rulesErrors);
    }

    return errors;
  }

  /**
   * Validar horarios de negocio
   */
  validateBusinessHours(businessHours: BusinessHours): string[] {
    const errors: string[] = [];
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    for (const day of weekdays) {
      const schedule = businessHours[day as keyof BusinessHours];
      
      if (schedule.is_open) {
        if (!schedule.open || !schedule.close) {
          errors.push(`Debe especificar horarios de apertura y cierre para ${this.getDayName(day)}`);
          continue;
        }

        const openTime = this.timeToMinutes(schedule.open);
        const closeTime = this.timeToMinutes(schedule.close);

        if (openTime >= closeTime) {
          errors.push(`La hora de cierre debe ser posterior a la de apertura para ${this.getDayName(day)}`);
        }

        if (openTime < 0 || closeTime > 1440) { // 1440 minutos = 24 horas
          errors.push(`Horarios inválidos para ${this.getDayName(day)}`);
        }
      }
    }

    return errors;
  }

  /**
   * Validar reglas de negocio
   */
  validateBusinessRules(businessRules: BusinessRules): string[] {
    const errors: string[] = [];

    if (businessRules.cancellation_window_hours < 0 || businessRules.cancellation_window_hours > 168) {
      errors.push('La ventana de cancelación debe estar entre 0 y 168 horas (7 días)');
    }

    if (businessRules.advance_booking_days < 1 || businessRules.advance_booking_days > 365) {
      errors.push('Los días de reserva anticipada deben estar entre 1 y 365 días');
    }

    if (businessRules.buffer_between_appointments < 0 || businessRules.buffer_between_appointments > 120) {
      errors.push('El buffer entre citas debe estar entre 0 y 120 minutos');
    }

    if (businessRules.reminder_hours_before < 1 || businessRules.reminder_hours_before > 168) {
      errors.push('Las horas de recordatorio deben estar entre 1 y 168 horas');
    }

    return errors;
  }

  /**
   * Verificar si un email es válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Convertir tiempo en formato HH:MM a minutos
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(num => parseInt(num, 10));
    return hours * 60 + minutes;
  }

  /**
   * Obtener nombre del día en español
   */
  private getDayName(day: string): string {
    const dayNames: Record<string, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo'
    };
    return dayNames[day] || day;
  }

  /**
   * Obtener nombre de la industria
   */
  getIndustryName(industryKey: string): string {
    const industries: Record<string, string> = {
      salon: 'Peluquería/Salón de Belleza',
      clinic: 'Clínica/Consultorio Médico',
      fitness: 'Entrenamiento Personal/Fitness',
      spa: 'Spa/Centro de Bienestar',
      dental: 'Clínica Dental',
      veterinary: 'Veterinaria',
      beauty: 'Centro de Estética',
      massage: 'Centro de Masajes',
      other: 'Otro'
    };
    return industries[industryKey] || industryKey;
  }

  /**
   * Formatear dirección completa
   */
  formatAddress(address: string, city: string, country: string): string {
    const parts = [address, city, country].filter(part => part && part.trim());
    return parts.join(', ');
  }

  /**
   * Obtener horarios de negocio por defecto
   */
  getDefaultBusinessHours(): BusinessHours {
    return {
      monday: { open: '09:00', close: '18:00', is_open: true },
      tuesday: { open: '09:00', close: '18:00', is_open: true },
      wednesday: { open: '09:00', close: '18:00', is_open: true },
      thursday: { open: '09:00', close: '18:00', is_open: true },
      friday: { open: '09:00', close: '18:00', is_open: true },
      saturday: { open: '09:00', close: '15:00', is_open: true },
      sunday: { open: '10:00', close: '14:00', is_open: false }
    };
  }

  /**
   * Obtener reglas de negocio por defecto
   */
  getDefaultBusinessRules(): BusinessRules {
    return {
      allow_walk_ins: true,
      cancellation_window_hours: 2,
      requires_confirmation: false,
      advance_booking_days: 30,
      buffer_between_appointments: 15,
      send_reminders: true,
      reminder_hours_before: 24
    };
  }

  /**
   * Obtener terminología por defecto
   */
  getDefaultTerminology(): Terminology {
    return {
      professional: { singular: 'Profesional', plural: 'Profesionales' },
      client: { singular: 'Cliente', plural: 'Clientes' },
      appointment: { singular: 'Cita', plural: 'Citas' },
      service: { singular: 'Servicio', plural: 'Servicios' }
    };
  }

  /**
   * Formatear tiempo en formato legible
   */
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Verificar si la organización está en horario de funcionamiento
   */
  isBusinessOpen(businessHours: BusinessHours): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, ...
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayKeys[dayOfWeek];
    const schedule = businessHours[currentDay as keyof BusinessHours];

    if (!schedule.is_open) {
      return false;
    }

    const openMinutes = this.timeToMinutes(schedule.open);
    const closeMinutes = this.timeToMinutes(schedule.close);

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  /**
   * Obtener próximo día de funcionamiento
   */
  getNextBusinessDay(businessHours: BusinessHours): string | null {
    const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const today = new Date().getDay();
    
    for (let i = 1; i <= 7; i++) {
      const checkDay = (today + i) % 7;
      const dayKey = dayKeys[checkDay];
      const schedule = businessHours[dayKey as keyof BusinessHours];
      
      if (schedule.is_open) {
        return dayNames[checkDay];
      }
    }
    
    return null;
  }

  /**
   * Generar configuración por defecto basada en plantilla de industria
   */
  async generateDefaultConfig(industryTemplate: string): Promise<Partial<OrganizationUpdateData>> {
    const templates = await this.getIndustryTemplates();
    const template = templates.find(t => t.key === industryTemplate);
    
    if (!template) {
      throw new Error('Plantilla de industria no encontrada');
    }

    return {
      industry_template: industryTemplate,
      settings: {
        business_hours: template.business_hours,
        business_rules: template.business_rules,
        terminology: template.terminology
      }
    };
  }

  /**
   * Exportar configuración actual
   */
  async exportConfiguration(): Promise<string> {
    try {
      const organization = await this.getOrganization();
      const config = {
        name: organization.name,
        industry_template: organization.industry_template,
        settings: organization.settings,
        exported_at: new Date().toISOString()
      };
      
      return JSON.stringify(config, null, 2);
    } catch (error) {
      console.error('Error exportando configuración:', error);
      throw new Error('Error al exportar la configuración');
    }
  }

  /**
   * Importar configuración desde JSON
   */
  validateImportedConfig(configJson: string): OrganizationUpdateData | null {
    try {
      const config = JSON.parse(configJson);
      
      // Validar estructura básica
      if (!config.name || !config.industry_template || !config.settings) {
        throw new Error('Formato de configuración inválido');
      }

      return {
        name: config.name,
        description: config.description || '',
        industry_template: config.industry_template,
        email: config.email || '',
        phone: config.phone || '',
        website: config.website || '',
        address: config.address || '',
        city: config.city || '',
        country: config.country || 'Chile',
        settings: config.settings
      };
    } catch (error) {
      console.error('Error validando configuración importada:', error);
      return null;
    }
  }
}

export default new OrganizationService(); 