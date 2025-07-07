import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  MapPin, Star, Clock, Phone, Globe, Calendar, 
  ArrowLeft, Share2, Heart, CheckCircle,
  ChevronLeft, ChevronRight
} from 'lucide-react'

interface Organization {
  id: string
  name: string
  slug: string
  description: string
  category: string
  location: string
  address: string
  phone: string
  website: string
  rating: number
  reviewCount: number
  images: string[]
  services: { name: string; price: string; duration: string }[]
  hours: { [key: string]: string }
  featured: boolean
  open_now: boolean
  next_available: string
  features: string[]
  team: { name: string; role: string; image: string }[]
}

interface Review {
  id: string
  user: string
  rating: number
  comment: string
  date: string
  service: string
}

const OrganizationProfilePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'reviews' | 'team'>('overview')

  // Datos de ejemplo
  const sampleOrganization: Organization = {
    id: '1',
    name: 'Salón Bella Vista',
    slug: 'salon-bella-vista',
    description: 'Especialistas en coloración y cortes modernos con más de 10 años de experiencia en el sector. Nuestro equipo de profesionales certificados te ofrece los últimos tratamientos y técnicas de peluquería.',
    category: 'Belleza',
    location: 'Providencia, Santiago',
    address: 'Av. Providencia 1234, Providencia, Santiago',
    phone: '+56 9 1234 5678',
    website: 'https://salonbellavista.cl',
    rating: 4.8,
    reviewCount: 127,
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
      'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800'
    ],
    services: [
      { name: 'Corte y Lavado', price: '$15.000', duration: '45 min' },
      { name: 'Coloración Completa', price: '$45.000', duration: '2h 30min' },
      { name: 'Mechas', price: '$35.000', duration: '2h' },
      { name: 'Tratamiento Capilar', price: '$25.000', duration: '1h' },
      { name: 'Peinado para Eventos', price: '$20.000', duration: '1h' }
    ],
    hours: {
      'Lunes': '9:00 - 19:00',
      'Martes': '9:00 - 19:00',
      'Miércoles': '9:00 - 19:00',
      'Jueves': '9:00 - 20:00',
      'Viernes': '9:00 - 20:00',
      'Sábado': '9:00 - 18:00',
      'Domingo': 'Cerrado'
    },
    featured: true,
    open_now: true,
    next_available: 'Hoy 14:30',
    features: [
      'Wi-Fi gratuito',
      'Estacionamiento',
      'Productos orgánicos',
      'Tarjetas de crédito',
      'Cita online',
      'Certificación ISO'
    ],
    team: [
      { name: 'María González', role: 'Directora y Colorista', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b2c5?w=150' },
      { name: 'Carlos Silva', role: 'Estilista Senior', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
      { name: 'Ana López', role: 'Especialista en Tratamientos', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }
    ]
  }

  const sampleReviews: Review[] = [
    {
      id: '1',
      user: 'Fernanda M.',
      rating: 5,
      comment: 'Excelente servicio, María es increíble con los colores. El resultado superó mis expectativas.',
      date: '2024-01-15',
      service: 'Coloración Completa'
    },
    {
      id: '2',
      user: 'Roberto P.',
      rating: 5,
      comment: 'Muy profesional, puntual y el corte quedó perfecto. Definitivamente volveré.',
      date: '2024-01-10',
      service: 'Corte y Lavado'
    },
    {
      id: '3',
      user: 'Laura T.',
      rating: 4,
      comment: 'Buen servicio en general, aunque tuve que esperar un poco más de lo esperado.',
      date: '2024-01-08',
      service: 'Mechas'
    }
  ]

  useEffect(() => {
    // Simular carga de datos
    const loadOrganization = async () => {
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setOrganization(sampleOrganization)
      setReviews(sampleReviews)
      setLoading(false)
    }

    loadOrganization()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200"></div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-40 bg-gray-200 rounded"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organización no encontrada</h2>
          <p className="text-gray-600 mb-4">La organización que buscas no existe o ha sido eliminada.</p>
          <Link
            to="/marketplace"
            className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            Volver al marketplace
          </Link>
        </div>
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % organization.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + organization.images.length) % organization.images.length)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Galería de imágenes */}
      <div className="relative h-80 bg-gray-900 overflow-hidden">
        <img
          src={organization.images[currentImageIndex]}
          alt={organization.name}
          className="w-full h-full object-cover"
        />
        
        {/* Navegación de imágenes */}
        {organization.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {organization.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Overlay con botones */}
        <div className="absolute inset-0 bg-black bg-opacity-20">
          <div className="absolute top-4 left-4">
            <Link
              to="/marketplace"
              className="flex items-center bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition-all">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-opacity-30 transition-all">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                    {organization.featured && (
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        Destacado
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {organization.location}
                    </div>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {organization.category}
                    </span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      organization.open_now 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {organization.open_now ? 'Abierto ahora' : 'Cerrado'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(organization.rating) 
                                ? 'text-yellow-400 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 font-semibold text-gray-900">{organization.rating}</span>
                      <span className="ml-1 text-gray-600">({organization.reviewCount} reseñas)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0">
                  <Link
                    to={`/marketplace/org/${organization.slug}/booking`}
                    className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition-colors inline-flex items-center"
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Reservar Cita
                  </Link>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{organization.description}</p>
            </div>

            {/* Navegación de tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', label: 'Información' },
                    { id: 'services', label: 'Servicios' },
                    { id: 'reviews', label: 'Reseñas' },
                    { id: 'team', label: 'Equipo' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'overview' | 'services' | 'reviews' | 'team')}
                      className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Tab: Información */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Características</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {organization.features.map(feature => (
                          <div key={feature} className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500 mr-2" />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Horarios de Atención</h3>
                      <div className="space-y-2">
                        {Object.entries(organization.hours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                            <span className="font-medium text-gray-900">{day}</span>
                            <span className="text-gray-600">{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab: Servicios */}
                {activeTab === 'services' && (
                  <div className="space-y-4">
                    {organization.services.map((service, index) => (
                      <div key={index} className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0">
                        <div>
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600">{service.duration}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">{service.price}</div>
                          <Link
                            to={`/marketplace/org/${organization.slug}/booking?service=${encodeURIComponent(service.name)}`}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            Reservar
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: Reseñas */}
                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900">{review.user}</span>
                              <span className="text-sm text-gray-500">• {review.service}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: Equipo */}
                {activeTab === 'team' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {organization.team.map((member, index) => (
                      <div key={index} className="flex items-center bg-gray-50 rounded-xl p-4">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-16 h-16 rounded-full object-cover mr-4"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar de contacto */}
          <div className="space-y-6">
            {/* Información de contacto */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dirección</p>
                    <p className="text-sm text-gray-600">{organization.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Teléfono</p>
                    <a href={`tel:${organization.phone}`} className="text-sm text-emerald-600 hover:text-emerald-700">
                      {organization.phone}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Sitio web</p>
                    <a 
                      href={organization.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 hover:text-emerald-700"
                    >
                      Visitar sitio web
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Disponibilidad rápida */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Disponibilidad</h3>
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-emerald-500 mr-2" />
                <span className="text-sm text-gray-700">Próxima cita disponible:</span>
              </div>
              <p className="font-semibold text-emerald-600 mb-4">{organization.next_available}</p>
              <Link
                to={`/marketplace/org/${organization.slug}/booking`}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 transition-colors text-center block"
              >
                Reservar Ahora
              </Link>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">En números</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Clientes atendidos</span>
                  <span className="font-semibold">1,200+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Años de experiencia</span>
                  <span className="font-semibold">10+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valoración promedio</span>
                  <span className="font-semibold">{organization.rating}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrganizationProfilePage 