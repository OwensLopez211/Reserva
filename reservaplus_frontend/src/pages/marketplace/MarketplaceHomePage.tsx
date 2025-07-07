import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Star, Filter, Grid, List, ChevronDown, Sparkles, TrendingUp, Users, Heart } from 'lucide-react'
import OrganizationCard from '../../components/marketplace/OrganizationCard'
import FilterSidebar from '../../components/marketplace/FilterSidebar'
import marketplaceService, { MarketplaceOrganization, MarketplaceFilters } from '../../services/marketplaceService'

const MarketplaceHomePage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [organizations, setOrganizations] = useState<MarketplaceOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('name')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filters, setFilters] = useState<MarketplaceFilters>({
    industry_template: '',
    city: '',
    search: '',
    ordering: 'name',
    page: 1,
    page_size: 12
  })

  // Cargar organizaciones desde el backend
  const loadOrganizations = async (newFilters?: MarketplaceFilters) => {
    try {
      setLoading(true)
      setError(null)
      
      const filtersToUse = newFilters || filters
      const response = await marketplaceService.getOrganizations(filtersToUse)
      
      setOrganizations(response.results)
      setTotalPages(response.pagination.total_pages)
      setTotalCount(response.pagination.count)
      setCurrentPage(response.pagination.current_page)
    } catch (err) {
      setError('Error al cargar las organizaciones')
      console.error('Error loading organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Obtener parámetros de búsqueda de la URL
    const searchQuery = searchParams.get('search')
    const categoryFilter = searchParams.get('category')
    const cityFilter = searchParams.get('city')
    
    const initialFilters: MarketplaceFilters = {
      ...filters,
      search: searchQuery || '',
      industry_template: categoryFilter || '',
      city: cityFilter || '',
      ordering: sortBy,
      page: 1
    }
    
    setFilters(initialFilters)
    loadOrganizations(initialFilters)
  }, [searchParams])

  useEffect(() => {
    const updatedFilters = {
      ...filters,
      ordering: sortBy,
      page: currentPage
    }
    setFilters(updatedFilters)
    loadOrganizations(updatedFilters)
  }, [sortBy, currentPage])

  const handleFilterChange = (newFilters: Partial<MarketplaceFilters>) => {
    const updatedFilters = {
      ...filters,
      ...newFilters,
      page: 1 // Reset page when filters change
    }
    setFilters(updatedFilters)
    setCurrentPage(1)
    loadOrganizations(updatedFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading && organizations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            {/* Hero skeleton */}
            <div className="bg-gradient-to-r from-emerald-200 to-cyan-200 rounded-3xl h-64"></div>
            
            {/* Grid skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-lg overflow-hidden">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-8 space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded-full flex-1"></div>
                      <div className="h-6 bg-gray-200 rounded-full flex-1"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex gap-4">
                      <div className="h-12 bg-gray-200 rounded-xl flex-1"></div>
                      <div className="h-12 bg-gray-200 rounded-xl flex-1"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Oops! Algo salió mal</h2>
          <p className="text-red-600 text-lg mb-8">{error}</p>
          <button 
            onClick={() => loadOrganizations()}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
      {/* Hero section mejorado */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-cyan-500 to-blue-600"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-emerald-900 bg-opacity-20" style={{backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
        </div>
        
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Encuentra profesionales
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                excepcionales
              </span>
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Conecta con los mejores profesionales de tu ciudad. Reserva fácil, rápido y seguro.
            </p>
            
            {/* Stats mejoradas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-yellow-800" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">{totalCount}+</div>
                <div className="text-lg opacity-90">Profesionales verificados</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-green-800" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">4.8</div>
                <div className="text-lg opacity-90">Calificación promedio</div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-blue-800" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2">95%</div>
                <div className="text-lg opacity-90">Clientes satisfechos</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Onda decorativa simplificada */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-emerald-50 to-transparent"></div>
      </div>

      {/* Controles principales mejorados */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Descubre organizaciones
              </h2>
              <p className="text-gray-600 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-emerald-500" />
                {totalCount} profesionales disponibles
                {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 ml-3"></div>}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Filtros móvil */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-5 py-3 font-medium text-gray-700 hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300 shadow-sm"
            >
              <Filter className="w-5 h-5" />
              Filtros
            </button>
            
            {/* Ordenamiento mejorado */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border-2 border-gray-200 rounded-xl px-5 py-3 pr-12 font-medium text-gray-700 hover:border-emerald-300 focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-300 shadow-sm"
              >
                {marketplaceService.getOrderingOptions().map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Vista mejorada */}
            <div className="hidden md:flex bg-white border-2 border-gray-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === 'grid' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex gap-8">
          {/* Sidebar de filtros mejorado */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
            <div className="sticky top-8">
              <FilterSidebar 
                onFiltersChange={handleFilterChange}
                initialFilters={filters}
                loading={loading}
              />
            </div>
          </div>
          
          {/* Grid/Lista de organizaciones */}
          <div className="flex-1 min-w-0">
            {organizations.length === 0 && !loading ? (
              <div className="text-center py-20">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No encontramos organizaciones</h3>
                <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                  Intenta ajustar tus filtros o términos de búsqueda para encontrar profesionales en tu área.
                </p>
                <button 
                  onClick={() => handleFilterChange({ industry_template: '', city: '', search: '' })}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  🔄 Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {organizations.map((org) => (
                    <OrganizationCard
                      key={org.id}
                      organization={org}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
                
                {/* Paginación mejorada */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-16">
                    <nav className="flex items-center gap-3">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-5 py-3 text-sm font-medium bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white transition-all duration-300 shadow-sm"
                      >
                        ← Anterior
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page;
                        if (totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          page = totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 shadow-sm ${
                              currentPage === page
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                                : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-5 py-3 text-sm font-medium bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white transition-all duration-300 shadow-sm"
                      >
                        Siguiente →
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MarketplaceHomePage 