import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, Menu, X, User, ArrowLeft } from 'lucide-react'

const MarketplaceNavbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo y volver */}
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              title="Volver a ReservaPlus"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Volver</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <Link to="/marketplace" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">+</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Marketplace</span>
                <div className="text-xs text-gray-500">Encuentra profesionales</div>
              </div>
            </Link>
          </div>

          {/* Barra de búsqueda - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar servicios, profesionales o negocios..."
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Filtros"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Navegación - Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/marketplace/categories"
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              Categorías
            </Link>
            <Link
              to="/marketplace/featured"
              className="text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              Destacados
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <Link
              to="/login"
              className="flex items-center text-gray-700 hover:text-emerald-600 font-medium transition-colors"
            >
              <User className="h-4 w-4 mr-2" />
              Acceder
            </Link>
            <Link
              to="/onboarding/plan"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Crear mi perfil
            </Link>
          </div>

          {/* Botón menú móvil */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Barra de búsqueda móvil */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicios o profesionales..."
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Filter className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <Link
              to="/marketplace/categories"
              className="block py-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Categorías
            </Link>
            <Link
              to="/marketplace/featured"
              className="block py-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Destacados
            </Link>
            <div className="border-t border-gray-200 pt-3 space-y-3">
              <Link
                to="/login"
                className="flex items-center py-2 text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-4 w-4 mr-2" />
                Acceder
              </Link>
              <Link
                to="/onboarding/plan"
                className="block w-full text-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300"
                onClick={() => setIsMenuOpen(false)}
              >
                Crear mi perfil
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default MarketplaceNavbar 