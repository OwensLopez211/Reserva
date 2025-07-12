import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Users,
  Calendar,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  User,
  Scissors
} from 'lucide-react'
import publicBookingService, { 
  PublicOrganizationDetail, 
  PublicService, 
  PublicProfessional 
} from '../../services/publicBookingService'
import BookingModal from '../../components/public/BookingModal'

const OrganizationProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  
  const [organizationData, setOrganizationData] = useState<PublicOrganizationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [selectedService, setSelectedService] = useState<PublicService | null>(null)
  const [selectedProfessional, setSelectedProfessional] = useState<PublicProfessional | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'services' | 'professionals' | 'about'>('services')

  useEffect(() => {
    if (slug) {
      loadOrganizationData()
    }
  }, [slug])

  // Detectar si se debe abrir el modal automáticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const autoBook = urlParams.get('autobook')
    
    if (autoBook === 'true' && organizationData) {
      // Abrir el modal automáticamente con el primer servicio
      const firstService = Object.values(organizationData.services_by_category)[0]?.[0]
      if (firstService) {
        handleBookService(firstService)
      }
    }
  }, [organizationData])

  const loadOrganizationData = async () => {
    if (!slug) return
    
    try {
      setLoading(true)
      setError(null)
      const data = await publicBookingService.getOrganizationDetail(slug)
      setOrganizationData(data)
      
      // Expandir todas las categorías por defecto
      const categories = Object.keys(data.services_by_category)
      setExpandedCategories(new Set(categories))
    } catch (error) {
      console.error('Error loading organization data:', error)
      setError('Error al cargar los datos de la organización')
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const handleBookService = (service: PublicService, professional?: PublicProfessional) => {
    setSelectedService(service)
    setSelectedProfessional(professional || null)
    setIsBookingModalOpen(true)
  }

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false)
    setSelectedService(null)
    setSelectedProfessional(null)
    // Aquí podrías mostrar una notificación de éxito
  }

  const handleCloseModal = () => {
    setIsBookingModalOpen(false)
    setSelectedService(null)
    setSelectedProfessional(null)
  }

  const renderRating = (rating: number, totalReviews: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
          }`}
        />
      )
    }
    return (
      <div className="flex items-center space-x-1">
        <div className="flex space-x-1">{stars}</div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({totalReviews} reseñas)
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (error || !organizationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al cargar la información
          </h2>
          <p className="text-gray-600 mb-4">
            {error || 'No se pudo cargar la información de la organización'}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Volver al marketplace
          </button>
        </div>
      </div>
    )
  }

  const { organization, professionals, services_by_category } = organizationData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Volver al marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-64 bg-gradient-to-r from-primary-600 to-primary-800 relative">
          {organization.cover_image && (
            <img
              src={organization.cover_image}
              alt={organization.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* Organization Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-24 bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                {organization.logo && (
                  <img
                    src={organization.logo}
                    alt={organization.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {organization.name}
                  </h1>
                  <p className="text-gray-600 mt-1">{organization.industry}</p>
                  {organization.rating > 0 && (
                    <div className="mt-2">
                      {renderRating(organization.rating, organization.total_reviews)}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => setActiveTab('services')}
                  className="bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 flex items-center justify-center"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Reservar Cita
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
              {organization.address && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {organization.address}
                </div>
              )}
              {organization.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  {organization.phone}
                </div>
              )}
              {organization.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  {organization.email}
                </div>
              )}
              {organization.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-1" />
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                  >
                    Sitio web
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Scissors className="h-4 w-4 inline mr-2" />
              Servicios
            </button>
            <button
              onClick={() => setActiveTab('professionals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'professionals'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Profesionales
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'about'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Acerca de
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'services' && (
            <div className="space-y-6">
              {Object.entries(services_by_category).map(([category, services]) => (
                <div key={category} className="bg-white rounded-lg shadow-sm">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category}
                    </h3>
                    {expandedCategories.has(category) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>

                  {expandedCategories.has(category) && (
                    <div className="border-t border-gray-200">
                      {services.map((service) => (
                        <div key={service.id} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{service.name}</h4>
                              {service.description && (
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                              )}
                              <div className="flex items-center mt-2 text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {service.duration_minutes} minutos
                              </div>
                            </div>
                            <div className="ml-4 text-right">
                              <div className="text-lg font-semibold text-gray-900">
                                {publicBookingService.formatPrice(service.price)}
                              </div>
                              <button
                                onClick={() => handleBookService(service)}
                                className="mt-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 text-sm"
                              >
                                Reservar
                              </button>
                            </div>
                          </div>

                          {/* Profesionales que ofrecen este servicio */}
                          {service.professionals.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm text-gray-600 mb-2">
                                Profesionales disponibles:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {service.professionals.map((professional) => (
                                  <button
                                    key={professional.id}
                                    onClick={() => handleBookService(service, professional)}
                                    className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-sm text-gray-700 flex items-center"
                                  >
                                    <User className="h-3 w-3 mr-1" />
                                    {professional.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'professionals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professionals.map((professional) => (
                <div key={professional.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{professional.name}</h3>
                      <p className="text-sm text-gray-600">{professional.specialty}</p>
                    </div>
                  </div>
                  {professional.bio && (
                    <p className="mt-4 text-sm text-gray-600">{professional.bio}</p>
                  )}
                  {professional.accepts_walk_ins && (
                    <div className="mt-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Acepta citas sin cita previa
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Acerca de {organization.name}
              </h3>
              {organization.description ? (
                <p className="text-gray-600 leading-relaxed">{organization.description}</p>
              ) : (
                <p className="text-gray-500 italic">
                  No hay información adicional disponible.
                </p>
              )}

              {/* Gallery */}
              {organization.gallery_images && organization.gallery_images.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Galería</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {organization.gallery_images.map((image, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={image}
                          alt={`${organization.name} - ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer spacer */}
      <div className="h-16"></div>

      {/* Booking Modal */}
      {isBookingModalOpen && selectedService && (
        <BookingModal
          organizationSlug={organization.slug}
          service={selectedService}
          preSelectedProfessional={selectedProfessional}
          onSuccess={handleBookingSuccess}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default OrganizationProfilePage 