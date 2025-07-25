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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando información...</p>
        </div>
      </div>
    )
  }

  if (error || !organizationData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar la información
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'No se pudo cargar la información de la organización'}
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Volver al marketplace
          </button>
        </div>
      </div>
    )
  }

  const { organization, professionals, services_by_category } = organizationData

  return (
    <div className="min-h-screen bg-white">
      {/* Clean Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-start space-x-8">
          {/* Company Logo */}
          <div className="flex-shrink-0">
            {organization.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-24 h-24 rounded-xl object-cover border border-gray-200"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                <span className="text-2xl font-bold text-gray-400">
                  {organization.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-semibold text-gray-900 mb-2">
                  {organization.name}
                </h1>
                <p className="text-gray-600 mb-4">{organization.industry}</p>
                
                {organization.rating > 0 && (
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-medium text-gray-900">
                        {organization.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {organization.total_reviews} reseñas
                    </span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  {organization.address && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-sm">{organization.address}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-6">
                    {organization.phone && (
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{organization.phone}</span>
                      </div>
                    )}
                    {organization.email && (
                      <div className="flex items-center text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm">{organization.email}</span>
                      </div>
                    )}
                    {organization.website && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-gray-400" />
                        <a
                          href={organization.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-900 hover:text-gray-700 underline"
                        >
                          Sitio web
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Simple Tabs */}
        <div className="border-b border-gray-200 mb-12">
          <nav className="flex space-x-8">
            {[
              { id: 'services', label: 'Servicios' },
              { id: 'professionals', label: 'Equipo' },
              { id: 'about', label: 'Información' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'services' | 'professionals' | 'about')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'services' && (
            <div className="space-y-8">
              {Object.entries(services_by_category).map(([category, services]) => (
                <div key={category} className="space-y-4">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex items-center justify-between w-full text-left group"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-gray-700">
                      {category}
                    </h3>
                    {expandedCategories.has(category) ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedCategories.has(category) && (
                    <div className="space-y-3">
                      {services.map((service) => (
                        <div key={service.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 mb-2">{service.name}</h4>
                              {service.description && (
                                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                              )}
                              <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {service.duration_minutes} min
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {publicBookingService.formatPrice(service.price)}
                                </div>
                              </div>

                              {/* Professionals available for this service */}
                              {service.professionals.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-600 mb-2">
                                    Profesionales disponibles:
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {service.professionals.map((professional) => (
                                      <button
                                        key={professional.id}
                                        onClick={() => handleBookService(service, professional)}
                                        className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm text-gray-700 flex items-center transition-colors"
                                      >
                                        <User className="h-3 w-3 mr-1" />
                                        {professional.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="ml-6">
                              <button
                                onClick={() => handleBookService(service)}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                              >
                                Reservar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'professionals' && (
            <div className="space-y-6">
              {professionals.map((professional) => (
                <div key={professional.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{professional.name}</h3>
                      {professional.specialty && (
                        <p className="text-sm text-gray-600 mb-3">{professional.specialty}</p>
                      )}
                      {professional.bio && (
                        <p className="text-sm text-gray-600 mb-3">{professional.bio}</p>
                      )}
                      {professional.accepts_walk_ins && (
                        <div className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                          Acepta citas sin cita previa
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="max-w-3xl space-y-8">
              {organization.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Descripción</h3>
                  <p className="text-gray-600 leading-relaxed">{organization.description}</p>
                </div>
              )}

              {/* Gallery */}
              {organization.gallery_images && organization.gallery_images.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Galería</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {organization.gallery_images.map((image, index) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={image}
                          alt={`${organization.name} - ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Company Stats */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información general</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">
                      {Object.values(services_by_category).reduce((acc, services) => acc + services.length, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Servicios</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-gray-900">{professionals.length}</div>
                    <div className="text-sm text-gray-600">Profesionales</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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