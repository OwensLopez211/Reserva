import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, ArrowUp } from 'lucide-react'

const MarketplaceFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Cómo funciona', href: '/marketplace/how-it-works' },
    { name: 'Para negocios', href: '/marketplace/for-business' },
    { name: 'Ayuda', href: '/marketplace/help' },
    { name: 'Términos', href: '/terms' }
  ]

  const categories = [
    { name: 'Belleza', href: '/marketplace/category/belleza' },
    { name: 'Salud', href: '/marketplace/category/salud' },
    { name: 'Fitness', href: '/marketplace/category/fitness' },
    { name: 'Bienestar', href: '/marketplace/category/bienestar' }
  ]

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Links principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Marketplace Info */}
          <div className="md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">+</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">Marketplace</span>
                <div className="text-sm text-gray-500">by ReservaPlus</div>
              </div>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              Encuentra y agenda con los mejores profesionales de servicios cerca de ti. 
              Cientos de negocios locales esperan por ti.
            </p>
            <Link
              to="/onboarding/plan"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              ¿Tienes un negocio? Únete al marketplace →
            </Link>
          </div>

          {/* Enlaces rápidos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Enlaces
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-600 hover:text-emerald-600 transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categorías */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Categorías
            </h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link
                    to={category.href}
                    className="text-gray-600 hover:text-emerald-600 transition-colors text-sm"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-4 md:mb-0">
              <span>&copy; {currentYear} ReservaPlus Marketplace. Todos los derechos reservados.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                Hecho con <Heart className="w-4 h-4 text-red-400" /> en Chile
              </span>
            </div>
            
            <button
              onClick={scrollToTop}
              className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors text-sm"
              aria-label="Volver arriba"
            >
              <span>Subir</span>
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default MarketplaceFooter 