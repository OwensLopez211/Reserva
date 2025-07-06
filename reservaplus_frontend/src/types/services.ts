// Types for Services management

export interface Service {
  id: string
  name: string
  description: string
  category: string
  duration_minutes: number
  price: string // Decimal as string from backend
  buffer_time_before: number
  buffer_time_after: number
  total_duration_minutes: number
  is_active: boolean
  requires_preparation: boolean
  organization: string
  organization_name: string
  professionals: string[] // Array of professional IDs
  professionals_count: number
  created_at: string
  updated_at: string
}

export interface ServiceData {
  name: string
  description: string
  category: string
  duration_minutes: number
  price: string
  buffer_time_before: number
  buffer_time_after: number
  is_active: boolean
  requires_preparation: boolean
  professionals: string[]
}

export interface Professional {
  id: string
  name: string
  email: string
  specialty: string
  is_active: boolean
  color_code?: string
}

export interface ServiceOverview {
  summary: {
    total_services: number
    active_services: number
    categories_count: number
    avg_duration: number
    avg_price: number
  }
  recent_services: Service[]
  categories: {
    name: string
    count: number
    avg_price: string
  }[]
}

export interface ApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  service?: Service | null
  onSaved: () => void
}

export interface ServiceLimits {
  current_count: number
  max_allowed: number
  can_add_more: boolean
  plan_name: string
}

// Constants
export const SERVICE_CATEGORIES = [
  { value: 'cortes', label: 'Cortes' },
  { value: 'coloracion', label: 'Coloración' },
  { value: 'tratamientos', label: 'Tratamientos' },
  { value: 'peinados', label: 'Peinados' },
  { value: 'manicure', label: 'Manicure' },
  { value: 'pedicure', label: 'Pedicure' },
  { value: 'facial', label: 'Facial' },
  { value: 'masajes', label: 'Masajes' },
  { value: 'depilacion', label: 'Depilación' },
  { value: 'cejas', label: 'Cejas y Pestañas' },
  { value: 'estetica', label: 'Estética' },
  { value: 'otros', label: 'Otros' }
]

export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1 hora 30 min' },
  { value: 120, label: '2 horas' },
  { value: 150, label: '2 horas 30 min' },
  { value: 180, label: '3 horas' },
  { value: 240, label: '4 horas' }
]

export const BUFFER_TIME_OPTIONS = [
  { value: 0, label: 'Sin buffer' },
  { value: 5, label: '5 minutos' },
  { value: 10, label: '10 minutos' },
  { value: 15, label: '15 minutos' },
  { value: 20, label: '20 minutos' },
  { value: 30, label: '30 minutos' }
] 