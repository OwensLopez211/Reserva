// Types for Organization Settings

export interface Organization {
  id: string
  name: string
  slug: string
  description: string
  industry_template: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  country: string
  subscription_plan: string
  settings: OrganizationSettings
  terminology: Terminology
  business_rules: BusinessRules
  is_active: boolean
  is_trial: boolean
  trial_ends_at: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  business_hours: BusinessHours
  business_rules: BusinessRules
  terminology: Terminology
  notifications?: NotificationSettings
  appearance?: AppearanceSettings
  booking?: BookingSettings
  [key: string]: unknown // Para configuraciones personalizadas
}

export interface BusinessHours {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

export interface DaySchedule {
  open: string // formato HH:MM
  close: string // formato HH:MM
  is_open: boolean
}

export interface BusinessRules {
  allow_walk_ins: boolean
  cancellation_window_hours: number
  requires_confirmation: boolean
  advance_booking_days: number
  buffer_between_appointments: number
  send_reminders: boolean
  reminder_hours_before: number
}

export interface Terminology {
  professional: {
    singular: string
    plural: string
  }
  client: {
    singular: string
    plural: string
  }
  appointment: {
    singular: string
    plural: string
  }
  service: {
    singular: string
    plural: string
  }
}

export interface NotificationSettings {
  email_notifications: boolean
  sms_notifications: boolean
  appointment_reminders: boolean
  marketing_emails: boolean
  system_notifications: boolean
}

export interface AppearanceSettings {
  theme_color: string
  logo_url?: string
  brand_colors: {
    primary: string
    secondary: string
    accent: string
  }
  custom_css?: string
}

export interface BookingSettings {
  enable_online_booking: boolean
  booking_page_url?: string
  require_client_registration: boolean
  auto_confirm_bookings: boolean
  payment_required: boolean
  deposit_percentage?: number
}

export interface OrganizationUpdateData {
  name: string
  description: string
  industry_template: string
  email: string
  phone: string
  website: string
  address: string
  city: string
  country: string
  settings: OrganizationSettings
}

export interface IndustryTemplate {
  key: string
  name: string
  description: string
  terminology: Terminology
  business_rules: BusinessRules
  business_hours: BusinessHours
}

export interface OrganizationOverview {
  basic_info: {
    name: string
    industry: string
    created_date: string
    subscription_plan: string
    is_trial: boolean
  }
  contact_info: {
    email: string
    phone: string
    website: string
    address: string
  }
  business_config: {
    business_hours: BusinessHours
    business_rules: BusinessRules
    terminology: Terminology
  }
  subscription_info?: {
    plan_name: string
    status: string
    trial_end?: string
    current_period_end?: string
  }
}

// Constants
export const INDUSTRY_TEMPLATES = [
  { value: 'salon', label: 'Peluquería/Salón de Belleza' },
  { value: 'clinic', label: 'Clínica/Consultorio Médico' },
  { value: 'fitness', label: 'Entrenamiento Personal/Fitness' },
  { value: 'spa', label: 'Spa/Centro de Bienestar' },
  { value: 'dental', label: 'Clínica Dental' },
  { value: 'veterinary', label: 'Veterinaria' },
  { value: 'beauty', label: 'Centro de Estética' },
  { value: 'massage', label: 'Centro de Masajes' },
  { value: 'other', label: 'Otro' }
]

export const COUNTRIES = [
  { value: 'Chile', label: 'Chile' },
  { value: 'Argentina', label: 'Argentina' },
  { value: 'Peru', label: 'Perú' },
  { value: 'Colombia', label: 'Colombia' },
  { value: 'Mexico', label: 'México' },
  { value: 'España', label: 'España' },
  { value: 'Estados Unidos', label: 'Estados Unidos' },
  { value: 'Otros', label: 'Otros' }
]

export const WEEKDAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = i % 2 === 0 ? '00' : '30'
  const formattedHour = hour.toString().padStart(2, '0')
  return {
    value: `${formattedHour}:${minute}`,
    label: `${formattedHour}:${minute}`
  }
})

export const THEME_COLORS = [
  { value: '#3B82F6', label: 'Azul', color: '#3B82F6' },
  { value: '#10B981', label: 'Verde', color: '#10B981' },
  { value: '#8B5CF6', label: 'Morado', color: '#8B5CF6' },
  { value: '#F59E0B', label: 'Naranja', color: '#F59E0B' },
  { value: '#EF4444', label: 'Rojo', color: '#EF4444' },
  { value: '#06B6D4', label: 'Cian', color: '#06B6D4' },
  { value: '#84CC16', label: 'Lima', color: '#84CC16' },
  { value: '#F97316', label: 'Naranja oscuro', color: '#F97316' }
] 