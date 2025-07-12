import React from 'react'
import { Clock, MapPin, X } from 'lucide-react'
import marketplaceService, { MarketplaceFilters } from '../../services/marketplaceService'

interface FilterSidebarProps {
  onFiltersChange: (filters: Partial<MarketplaceFilters>) => void
  initialFilters: MarketplaceFilters
  loading?: boolean
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  onFiltersChange,
  initialFilters,
  loading = false
}) => {
  const handleFilterChange = (key: keyof MarketplaceFilters, value: string | number | boolean | undefined) => {
    onFiltersChange({
      [key]: value
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      industry_template: '',
      city: '',
      search: ''
    })
  }

  const hasActiveFilters = !!(
    initialFilters.industry_template || 
    initialFilters.city || 
    initialFilters.search
  )

  const industryOptions = marketplaceService.getIndustryOptions()

  // Obtener ciudades únicas (esto debería venir del backend idealmente)
  const cityOptions = [
    { value: '', label: 'Todas las ciudades' },
    { value: 'Santiago', label: 'Santiago' },
    { value: 'Valparaíso', label: 'Valparaíso' },
    { value: 'Concepción', label: 'Concepción' },
    { value: 'Viña del Mar', label: 'Viña del Mar' }
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Categoría
          </label>
          <div className="space-y-2">
            {industryOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name="industry_template"
                  value={option.value}
                  checked={initialFilters.industry_template === option.value}
                  onChange={(e) => handleFilterChange('industry_template', e.target.value)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  initialFilters.industry_template === option.value 
                    ? 'border-emerald-500 bg-emerald-500' 
                    : 'border-gray-300'
                }`}>
                  {initialFilters.industry_template === option.value && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Ciudad */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-3">
            <MapPin className="h-4 w-4 inline mr-1" />
            Ciudad
          </label>
          <select
            value={initialFilters.city || ''}
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {cityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Solo abiertos ahora */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={initialFilters.search?.includes('abierto') || false}
              onChange={(e) => {
                const currentSearch = initialFilters.search || ''
                const newSearch = e.target.checked 
                  ? currentSearch + ' abierto'
                  : currentSearch.replace('abierto', '').trim()
                handleFilterChange('search', newSearch)
              }}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
              initialFilters.search?.includes('abierto')
                ? 'border-emerald-500 bg-emerald-500' 
                : 'border-gray-300'
            }`}>
              {initialFilters.search?.includes('abierto') && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Solo abiertos ahora
              </span>
            </div>
          </label>
        </div>

        {/* Información adicional */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 Usa el buscador para encontrar servicios específicos</p>
            <p>⭐ Las organizaciones destacadas aparecen primero</p>
            <p>📍 Los resultados se ordenan por cercanía cuando seleccionas una ciudad</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FilterSidebar 