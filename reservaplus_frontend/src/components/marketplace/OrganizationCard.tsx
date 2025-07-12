import React from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, Sparkles, ArrowRight } from 'lucide-react'
import marketplaceService, { MarketplaceOrganization } from '../../services/marketplaceService'

interface OrganizationCardProps {
  organization: MarketplaceOrganization
  viewMode: 'grid' | 'list'
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ organization, viewMode }) => {
  const getLocationDisplay = () => {
    return organization.address ? `${organization.city}, ${organization.country}` : organization.city
  }

  const getImageDisplay = () => {
    return organization.cover_image || organization.logo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400'
  }

  const getStatusColor = () => {
    return organization.is_open_now 
      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
      : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
  }

  const getIndustryColor = () => {
    const colors = {
      'salon': 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-200',
      'clinic': 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-200',
      'fitness': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200',
      'spa': 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200',
      'dental': 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border-teal-200',
      'veterinary': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200',
      'beauty': 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 border-violet-200',
      'massage': 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-200',
      'other': 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-200'
    }
    return colors[organization.industry_template as keyof typeof colors] || colors.other
  }

  if (viewMode === 'list') {
    return (
      <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-emerald-200 hover:-translate-y-1">
        <div className="flex">
          {/* Imagen mejorada */}
          <div className="relative w-64 h-56 flex-shrink-0 overflow-hidden">
            <img
              src={getImageDisplay()}
              alt={organization.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Badge destacado mejorado */}
            {organization.is_featured && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center animate-pulse">
                <Sparkles className="h-4 w-4 mr-1" />
                Destacado
              </div>
            )}
            
            {/* Estado mejorado */}
            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${getStatusColor()}`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${organization.is_open_now ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
                {organization.is_open_now ? 'Abierto' : 'Cerrado'}
              </div>
            </div>

            {/* Overlay de rating */}
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="ml-1 font-bold text-gray-900">{marketplaceService.formatRating(organization.rating)}</span>
              </div>
            </div>
          </div>

          {/* Contenido mejorado */}
          <div className="flex-1 p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {organization.name}
                </h3>
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="h-5 w-5 mr-2 text-emerald-500" />
                  <span className="font-medium">{getLocationDisplay()}</span>
                </div>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getIndustryColor()}`}>
                  {marketplaceService.getIndustryName(organization.industry_template)}
                </div>
              </div>
              
              <div className="text-right ml-6">
                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-4 border border-emerald-200">
                  <div className="text-sm text-emerald-600 font-medium mb-1">Precio</div>
                  <div className="text-lg font-bold text-emerald-700">
                    {marketplaceService.formatPriceRange(organization.min_price, organization.max_price)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {marketplaceService.formatReviewsCount(organization.total_reviews)}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-6 text-lg leading-relaxed line-clamp-2">{organization.description}</p>

            {/* Servicios mejorados */}
            <div className="flex flex-wrap gap-2 mb-6">
              {organization.services.slice(0, 4).map((service, index) => (
                <span key={index} className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium border border-emerald-200 hover:from-emerald-100 hover:to-teal-100 transition-colors">
                  {service.name}
                </span>
              ))}
              {organization.services.length > 4 && (
                <span className="text-sm text-gray-500 self-center font-medium">
                  +{organization.services.length - 4} servicios más
                </span>
              )}
            </div>

            {/* Información adicional */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{organization.services_count}</div>
                <div className="text-sm text-gray-500">Servicios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{organization.professionals_count}</div>
                <div className="text-sm text-gray-500">Profesionales</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{organization.total_reviews}</div>
                <div className="text-sm text-gray-500">Reseñas</div>
              </div>
            </div>

            {/* Botones mejorados */}
            <div className="flex gap-4">
              <Link
                to={`/book/${organization.slug}`}
                className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-center hover:shadow-md flex items-center justify-center group"
              >
                Ver perfil
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to={`/book/${organization.slug}?autobook=true`}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-center hover:shadow-lg hover:shadow-emerald-200 flex items-center justify-center group"
              >
                Reservar ahora
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista Grid mejorada con dimensiones más atractivas
  return (
    <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-emerald-200 hover:-translate-y-2 flex flex-col h-full">
      {/* Imagen mejorada con mejor proporción */}
      <div className="relative h-64 overflow-hidden flex-shrink-0">
        <img
          src={getImageDisplay()}
          alt={organization.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Badge destacado */}
        {organization.is_featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center animate-pulse">
            <Sparkles className="h-4 w-4 mr-1" />
            Destacado
          </div>
        )}
        
        {/* Estado */}
        <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${getStatusColor()}`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${organization.is_open_now ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
            {organization.is_open_now ? 'Abierto' : 'Cerrado'}
          </div>
        </div>

        {/* Rating overlay */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="ml-1 font-bold text-gray-900">{marketplaceService.formatRating(organization.rating)}</span>
          </div>
        </div>
      </div>

      {/* Contenido con flexbox para alineación perfecta */}
      <div className="p-8 flex flex-col flex-grow">
        {/* Header section con altura fija */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors leading-tight h-16 flex items-center">
            <span className="line-clamp-2">{organization.name}</span>
          </h3>
          <div className="flex items-center justify-between mb-4 min-h-[2rem]">
            <div className="flex items-center text-gray-600 flex-1 min-w-0 pr-3">
              <MapPin className="h-5 w-5 mr-2 text-emerald-500 flex-shrink-0" />
              <span className="font-medium text-sm">{getLocationDisplay()}</span>
            </div>
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border flex-shrink-0 ${getIndustryColor()}`}>
              {marketplaceService.getIndustryName(organization.industry_template)}
            </div>
          </div>
        </div>

        {/* Precio destacado con layout mejorado */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-6 border border-emerald-200 min-h-[5rem] flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm text-emerald-600 font-medium mb-2">Precio desde</div>
              <div className="text-2xl font-bold text-emerald-700">
                {marketplaceService.formatPriceRange(organization.min_price, organization.max_price)}
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="text-sm text-gray-500 font-medium">
                {marketplaceService.formatReviewsCount(organization.total_reviews)}
              </div>
            </div>
          </div>
        </div>

        {/* Descripción con altura fija */}
        <div className="mb-6">
          <p className="text-gray-600 text-base leading-relaxed h-20 flex items-start">
            <span className="line-clamp-3">{organization.description}</span>
          </p>
        </div>

        {/* Servicios con mejor layout para evitar cortes */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 min-h-[4rem]">
            {organization.services.slice(0, 3).map((service, index) => (
              <span key={index} className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium border border-emerald-200 whitespace-nowrap">
                {service.name}
              </span>
            ))}
            {organization.services.length > 3 && (
              <span className="text-sm text-gray-500 self-center font-medium whitespace-nowrap bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
                +{organization.services.length - 3} más
              </span>
            )}
          </div>
        </div>

        {/* Spacer para empujar los stats y botones hacia abajo */}
        <div className="flex-grow"></div>

        {/* Stats con altura fija */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 text-center border border-emerald-200 h-20 flex flex-col justify-center">
            <div className="text-xl font-bold text-emerald-600">{organization.services_count}</div>
            <div className="text-xs text-gray-500 font-medium">Servicios</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-200 h-20 flex flex-col justify-center">
            <div className="text-xl font-bold text-blue-600">{organization.professionals_count}</div>
            <div className="text-xs text-gray-500 font-medium">Profesionales</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 text-center border border-purple-200 h-20 flex flex-col justify-center">
            <div className="text-xl font-bold text-purple-600">{organization.total_reviews}</div>
            <div className="text-xs text-gray-500 font-medium">Reseñas</div>
          </div>
        </div>

        {/* Botones siempre en la parte inferior */}
        <div className="flex gap-4 mt-auto">
          <Link
            to={`/book/${organization.slug}`}
            className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-center hover:shadow-md flex items-center justify-center group h-12"
          >
            <span className="truncate">Ver perfil</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </Link>
          <Link
            to={`/book/${organization.slug}?autobook=true`}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 text-center hover:shadow-lg hover:shadow-emerald-200 flex items-center justify-center group h-12"
          >
            <span className="truncate">Reservar</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrganizationCard 