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
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo section */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center text-gray-500 hover:text-gray-700 transition-all duration-200 group"
              title="Volver a ReservaPlus"
            >
              <div className="p-2 rounded-full bg-gray-50 group-hover:bg-gray-100 transition-colors">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium ml-2 hidden sm:block">Volver</span>
            </Link>
            
            <Link to="/marketplace" className="flex items-center group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full"></div>
              </div>
              <div className="ml-4 hidden md:block">
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Marketplace
                </span>
                <div className="text-sm text-gray-500 -mt-1">Encuentra profesionales</div>
              </div>
            </Link>
          </div>

          {/* Search bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar servicios, profesionales o negocios..."
                  className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50/50 hover:bg-white hover:border-gray-300 transition-all duration-300 text-gray-900 placeholder-gray-500"
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Filtros"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Navigation - Desktop */}
          <div className="hidden lg:flex items-center space-x-2">
            <Link
              to="/marketplace/categories"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
            >
              Categorías
            </Link>
            <Link
              to="/marketplace/featured"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
            >
              Destacados
            </Link>
            
            <div className="h-8 w-px bg-gray-200 mx-4" />
            
            <Link
              to="/login"
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
            >
              <User className="h-4 w-4 mr-2" />
              Acceder
            </Link>
            <Link
              to="/onboarding/plan"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Crear mi perfil
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile search bar */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar servicios o profesionales..."
              className="w-full pl-12 pr-14 py-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50/50 hover:bg-white transition-all duration-300"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              <Filter className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg">
          <div className="px-4 py-6 space-y-2">
            <Link
              to="/marketplace/categories"
              className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Categorías
            </Link>
            <Link
              to="/marketplace/featured"
              className="block px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Destacados
            </Link>
            
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2">
              <Link
                to="/login"
                className="flex items-center px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-4 w-4 mr-2" />
                Acceder
              </Link>
              <Link
                to="/onboarding/plan"
                className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg"
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