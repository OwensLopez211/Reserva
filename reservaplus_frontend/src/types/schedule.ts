// types/schedule.ts - Tipos compartidos para funcionalidad de horarios

export interface Professional {
  id: string
  name: string
  email: string
  specialty: string
  is_active: boolean
  color_code?: string
}

export interface ScheduleBreak {
  id?: string
  start_time: string
  end_time: string
  name: string
  description?: string
  is_active: boolean
}

export interface WeeklySchedule {
  id?: string
  weekday: number
  start_time: string
  end_time: string
  is_active: boolean
  breaks: ScheduleBreak[]
  weekday_display?: string
}

export interface ScheduleException {
  id?: string
  date: string
  exception_type: 'unavailable' | 'vacation' | 'sick_leave' | 'special_hours' | 'holiday'
  start_time?: string
  end_time?: string
  reason: string
  notes?: string
  is_active: boolean
  exception_type_display?: string
}

export interface ProfessionalSchedule {
  id: string
  professional: string
  professional_name: string
  timezone: string
  min_booking_notice: number
  max_booking_advance: number
  slot_duration: number
  is_active: boolean
  accepts_bookings: boolean
  weekly_schedules: WeeklySchedule[]
  exceptions: ScheduleException[]
  created_at: string
  updated_at: string
}

export interface ScheduleSummary {
  id: string
  professional: string
  professional_name: string
  timezone: string
  slot_duration: number
  is_active: boolean
  accepts_bookings: boolean
  total_weekly_hours: number
  active_days_count: number
  updated_at: string
}

export interface AvailabilitySlot {
  id: string
  professional_schedule: string
  professional_name: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  is_blocked: boolean
  blocked_reason?: string
  created_at: string
  updated_at: string
}

export interface ScheduleOverview {
  summary: {
    total_professionals: number
    professionals_with_schedule: number
    active_schedules: number
    accepting_bookings: number
    completion_rate: number
  }
  recent_schedules: ScheduleSummary[]
}

export interface ScheduleData {
  professional: string
  timezone: string
  min_booking_notice: number
  max_booking_advance: number
  slot_duration: number
  is_active: boolean
  accepts_bookings: boolean
  weekly_schedules: WeeklySchedule[]
  exceptions: ScheduleException[]
}

// Constantes para uso en formularios
export const WEEKDAYS = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' }
] as const

export const EXCEPTION_TYPES = [
  { value: 'unavailable', label: 'No Disponible' },
  { value: 'vacation', label: 'Vacaciones' },
  { value: 'sick_leave', label: 'Licencia Médica' },
  { value: 'special_hours', label: 'Horario Especial' },
  { value: 'holiday', label: 'Día Festivo' }
] as const

export const TIMEZONES = [
  { value: 'America/Santiago', label: 'América/Santiago (Chile)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'América/Buenos Aires (Argentina)' },
  { value: 'America/Lima', label: 'América/Lima (Perú)' },
  { value: 'America/Bogota', label: 'América/Bogotá (Colombia)' },
  { value: 'America/Caracas', label: 'América/Caracas (Venezuela)' }
] as const

export const SLOT_DURATIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '60 minutos' },
  { value: 90, label: '90 minutos' },
  { value: 120, label: '120 minutos' }
] as const

// Tipos extendidos para uso en componentes
export interface ProfessionalWithSchedule extends Professional {
  schedule?: ScheduleSummary
  hasSchedule: boolean
  scheduleStatus: 'active' | 'inactive' | 'none'
}

// Utilidades de tipo
export type ScheduleStatus = 'active' | 'inactive' | 'none'
export type ExceptionType = ScheduleException['exception_type']
export type WeekdayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6

// Props comunes para modales
export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface ScheduleModalProps extends BaseModalProps {
  professional: Professional
  scheduleId?: string | null
  onSaved: () => void
}

export interface DuplicateScheduleModalProps extends BaseModalProps {
  sourceSchedule: ScheduleSummary
  professionals: Professional[]
  onDuplicated: () => void
}

// Props para componentes de formulario
export interface WeeklyScheduleFormProps {
  schedule: WeeklySchedule
  onUpdate: (updates: Partial<WeeklySchedule>) => void
  onRemove: () => void
  onAddBreak: () => void
  onUpdateBreak: (breakIndex: number, updates: Partial<ScheduleBreak>) => void
  onRemoveBreak: (breakIndex: number) => void
}

export interface ExceptionFormProps {
  exception: ScheduleException
  onUpdate: (updates: Partial<ScheduleException>) => void
  onRemove: () => void
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  results?: T[]
  count?: number
  next?: string | null
  previous?: string | null
  data?: T
}

// Tipos específicos para respuestas de API
export type ScheduleApiResponse = ApiResponse<ScheduleSummary>
export type ProfessionalApiResponse = ApiResponse<Professional>
export interface OverviewApiResponse {
  summary: ScheduleOverview['summary']
  recent_schedules: ScheduleSummary[]
} 