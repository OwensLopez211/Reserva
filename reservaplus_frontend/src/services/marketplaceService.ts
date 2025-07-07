import { api } from './api'

// ===== TIPOS =====

export interface MarketplaceServiceItem {
  id: string
  name: string
  description: string
  category: string
  duration_minutes: number
  price: number
  is_active: boolean
}

export interface MarketplaceProfessional {
  id: string
  name: string
  specialty: string
  bio: string
  is_active: boolean
}

export interface MarketplaceOrganization {
  id: string
  name: string
  slug: string
  description: string
  industry_template: string
  phone: string
  website: string
  address: string
  city: string
  country: string
  logo: string
  cover_image: string
  gallery_images: string[]
  is_featured: boolean
  rating: number
  total_reviews: number
  services: MarketplaceServiceItem[]
  professionals: MarketplaceProfessional[]
  services_count: number
  professionals_count: number
  min_price: number | null
  max_price: number | null
  is_open_now: boolean
  created_at: string
}

export interface MarketplaceOrganizationDetail extends MarketplaceOrganization {
  business_hours: {
    [key: string]: {
      open: string
      close: string
      closed: boolean
    }
  }
  featured_services: MarketplaceServiceItem[]
}

export interface MarketplaceStats {
  total_organizations: number
  total_services: number
  total_professionals: number
  industry_stats: {
    [key: string]: {
      name: string
      count: number
    }
  }
  city_stats: Array<{
    city: string
    count: number
  }>
  latest_organizations: MarketplaceOrganization[]
}

export interface MarketplaceFilters {
  industry_template?: string
  city?: string
  country?: string
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

export interface PaginatedResponse<T> {
  pagination: {
    next: string | null
    previous: string | null
    count: number
    total_pages: number
    current_page: number
    page_size: number
    has_next: boolean
    has_previous: boolean
  }
  results: T[]
}

// ===== SERVICIO =====

class MarketplaceService {
  private static instance: MarketplaceService
  private readonly baseUrl = '/api/organizations/marketplace'

  static getInstance(): MarketplaceService {
    if (!MarketplaceService.instance) {
      MarketplaceService.instance = new MarketplaceService()
    }
    return MarketplaceService.instance
  }

  // ===== MÉTODOS PRINCIPALES =====

  async getOrganizations(filters: MarketplaceFilters = {}): Promise<PaginatedResponse<MarketplaceOrganization>> {
    try {
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await api.get(`${this.baseUrl}/?${params.toString()}`)
      
      if (!response.data) {
        throw new Error('No se recibieron datos del servidor')
      }

      return {
        pagination: response.data.pagination,
        results: response.data.results || []
      }
    } catch (error) {
      console.error('Error al obtener organizaciones del marketplace:', error)
      throw new Error('Error al cargar las organizaciones')
    }
  }

  async getOrganizationBySlug(slug: string): Promise<MarketplaceOrganizationDetail> {
    try {
      const response = await api.get(`${this.baseUrl}/${slug}/`)
      
      if (!response.data) {
        throw new Error('Organización no encontrada')
      }

      return response.data
    } catch (error) {
      console.error('Error al obtener detalles de organización:', error)
      throw new Error('Error al cargar los detalles de la organización')
    }
  }

  async getMarketplaceStats(): Promise<MarketplaceStats> {
    try {
      const response = await api.get(`${this.baseUrl}/stats/`)
      
      if (!response.data) {
        throw new Error('No se pudieron obtener las estadísticas')
      }

      return response.data
    } catch (error) {
      console.error('Error al obtener estadísticas del marketplace:', error)
      throw new Error('Error al cargar las estadísticas')
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price)
  }

  formatPriceRange(minPrice: number | null, maxPrice: number | null): string {
    if (!minPrice && !maxPrice) return 'Precio no disponible'
    if (minPrice === maxPrice) return this.formatPrice(minPrice!)
    if (!minPrice) return `Hasta ${this.formatPrice(maxPrice!)}`
    if (!maxPrice) return `Desde ${this.formatPrice(minPrice)}`
    return `${this.formatPrice(minPrice)} - ${this.formatPrice(maxPrice)}`
  }

  formatRating(rating: number): string {
    if (rating == null || isNaN(rating)) {
      return '0.0'
    }
    return Number(rating).toFixed(1)
  }

  formatReviewsCount(count: number): string {
    if (count === 0) return 'Sin reseñas'
    if (count === 1) return '1 reseña'
    return `${count} reseñas`
  }

  getIndustryName(industryTemplate: string): string {
    const industryMap: { [key: string]: string } = {
      'salon': 'Peluquería/Salón de Belleza',
      'clinic': 'Clínica/Consultorio Médico',
      'fitness': 'Entrenamiento Personal/Fitness',
      'spa': 'Spa/Centro de Bienestar',
      'dental': 'Clínica Dental',
      'veterinary': 'Veterinaria',
      'beauty': 'Centro de Estética',
      'massage': 'Centro de Masajes',
      'other': 'Otro'
    }
    return industryMap[industryTemplate] || industryTemplate
  }

  isOpenNow(businessHours: MarketplaceOrganizationDetail['business_hours']): boolean {
    const now = new Date()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[now.getDay()]
    
    const todayHours = businessHours[currentDay]
    if (!todayHours || todayHours.closed) {
      return false
    }

    const currentTime = now.getHours() * 60 + now.getMinutes()
    const [openHour, openMinute] = todayHours.open.split(':').map(Number)
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number)
    
    const openTime = openHour * 60 + openMinute
    const closeTime = closeHour * 60 + closeMinute
    
    return currentTime >= openTime && currentTime < closeTime
  }

  // ===== FILTROS Y BÚSQUEDA =====

  getIndustryOptions(): Array<{ value: string; label: string }> {
    return [
      { value: '', label: 'Todas las categorías' },
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
  }

  getOrderingOptions(): Array<{ value: string; label: string }> {
    return [
      { value: 'name', label: 'Nombre (A-Z)' },
      { value: '-name', label: 'Nombre (Z-A)' },
      { value: '-rating', label: 'Mejor calificados' },
      { value: '-total_reviews', label: 'Más reseñas' },
      { value: '-created_at', label: 'Más recientes' },
      { value: 'created_at', label: 'Más antiguos' }
    ]
  }

  // ===== VALIDACIONES =====

  validateFilters(filters: MarketplaceFilters): string[] {
    const errors: string[] = []
    
    if (filters.page && filters.page < 1) {
      errors.push('El número de página debe ser mayor a 0')
    }
    
    if (filters.page_size && (filters.page_size < 1 || filters.page_size > 48)) {
      errors.push('El tamaño de página debe estar entre 1 y 48')
    }
    
    return errors
  }
}

export default MarketplaceService.getInstance() 