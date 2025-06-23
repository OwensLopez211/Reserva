import React, { useState, /* useEffect */ } from 'react'
import { ChevronRight, ChevronLeft, Check, Building2, Users, Briefcase, Calendar, Settings, /* User, Phone, Mail, MapPin, Clock, DollarSign, */ UserPlus, /* Palette, Save, */ Star, ArrowRight } from 'lucide-react'

// Tipos basados en tu backend
interface OrganizationData {
  name: string
  industry_template: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}

interface ProfessionalData {
  name: string
  email: string
  phone: string
  specialty: string
  color_code: string
  bio: string
  accepts_walk_ins: boolean
}

interface ServiceData {
  name: string
  description: string
  category: string
  duration_minutes: number
  price: number
  buffer_time_before: number
  buffer_time_after: number
  requires_preparation: boolean
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    name: '',
    industry_template: 'salon',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Chile'
  })
  const [professionals, setProfessionals] = useState<ProfessionalData[]>([])
  const [services, setServices] = useState<ServiceData[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  // Definir pasos del onboarding
  const steps = [
    { id: 0, title: 'Bienvenida', icon: Star, description: 'Te damos la bienvenida a ReservaPlus' },
    { id: 1, title: 'Tu Organización', icon: Building2, description: 'Información básica de tu negocio' },
    { id: 2, title: 'Profesionales', icon: Users, description: 'Agrega a tu equipo de trabajo' },
    { id: 3, title: 'Servicios', icon: Briefcase, description: 'Define los servicios que ofreces' },
    { id: 4, title: 'Configuración', icon: Settings, description: 'Ajustes finales de tu sistema' },
    { id: 5, title: 'Finalizar', icon: Check, description: 'Todo listo para empezar' }
  ]

  // Templates de industria basados en tu backend
  const industryTemplates = [
    { value: 'salon', label: 'Peluquería/Salón de Belleza', icon: '💇‍♀️' },
    { value: 'clinic', label: 'Clínica/Consultorio Médico', icon: '🏥' },
    { value: 'fitness', label: 'Entrenamiento Personal/Fitness', icon: '💪' },
    { value: 'spa', label: 'Spa/Centro de Bienestar', icon: '🧘‍♀️' },
    { value: 'dental', label: 'Clínica Dental', icon: '🦷' },
    { value: 'veterinary', label: 'Veterinaria', icon: '🐕' },
    { value: 'beauty', label: 'Centro de Estética', icon: '✨' },
    { value: 'massage', label: 'Centro de Masajes', icon: '💆‍♀️' },
    { value: 'other', label: 'Otro', icon: '🏢' }
  ]

  // Colores predefinidos para profesionales
  const professionalColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  // Servicios sugeridos por industria
  const suggestedServices = {
    salon: [
      { name: 'Corte de Cabello', duration_minutes: 45, price: 15000, category: 'Cabello' },
      { name: 'Peinado', duration_minutes: 30, price: 12000, category: 'Cabello' },
      { name: 'Tinte', duration_minutes: 90, price: 35000, category: 'Color' },
      { name: 'Manicure', duration_minutes: 30, price: 8000, category: 'Uñas' }
    ],
    clinic: [
      { name: 'Consulta General', duration_minutes: 30, price: 25000, category: 'Consultas' },
      { name: 'Control', duration_minutes: 20, price: 15000, category: 'Controles' },
      { name: 'Procedimiento Menor', duration_minutes: 45, price: 40000, category: 'Procedimientos' }
    ],
    spa: [
      { name: 'Masaje Relajante', duration_minutes: 60, price: 30000, category: 'Masajes' },
      { name: 'Facial Hidratante', duration_minutes: 45, price: 25000, category: 'Faciales' },
      { name: 'Tratamiento Corporal', duration_minutes: 90, price: 45000, category: 'Corporales' }
    ],
    dental: [
      { name: 'Consulta Dental', duration_minutes: 30, price: 20000, category: 'Consultas' },
      { name: 'Limpieza Dental', duration_minutes: 45, price: 35000, category: 'Prevención' },
      { name: 'Empaste', duration_minutes: 60, price: 50000, category: 'Restauración' }
    ]
  }

  // Función para agregar profesional
  const addProfessional = () => {
    const newProfessional: ProfessionalData = {
      name: '',
      email: '',
      phone: '',
      specialty: '',
      color_code: professionalColors[professionals.length % professionalColors.length],
      bio: '',
      accepts_walk_ins: true
    }
    setProfessionals([...professionals, newProfessional])
  }

  // Función para agregar servicio
  const addService = (suggested?: Partial<ServiceData>) => {
    const newService: ServiceData = {
      name: suggested?.name || '',
      description: '',
      category: suggested?.category || '',
      duration_minutes: suggested?.duration_minutes || 30,
      price: suggested?.price || 0,
      buffer_time_before: 0,
      buffer_time_after: 10,
      requires_preparation: false
    }
    setServices([...services, newService])
  }

  // Funciones de navegación
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return organizationData.name && organizationData.email && organizationData.phone
      case 2:
        return professionals.length > 0 && professionals.every(p => p.name && p.email)
      case 3:
        return services.length > 0 && services.every(s => s.name && s.price > 0)
      default:
        return true
    }
  }

  const finishOnboarding = async () => {
    setIsCompleting(true)
    // Aquí harías las llamadas a tu API
    setTimeout(() => {
      setIsCompleting(false)
      alert('¡Onboarding completado! Tu sistema está listo.')
    }, 2000)
  }

  // Componente de paso de bienvenida
  const WelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
        <Star className="w-10 h-10 text-primary-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Bienvenido a ReservaPlus!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Te ayudaremos a configurar tu sistema de reservas en solo unos minutos. 
          Vamos a personalizar ReservaPlus según las necesidades de tu negocio.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Building2 className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Configura tu negocio</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Agrega tu equipo</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Briefcase className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Define servicios</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600">¡Listo para usar!</p>
        </div>
      </div>
    </div>
  )

  // Componente de configuración de organización
  const OrganizationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building2 className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Información de tu Organización</h2>
        <p className="text-gray-600">Cuéntanos sobre tu negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de tu negocio *
          </label>
          <input
            type="text"
            value={organizationData.name}
            onChange={(e) => setOrganizationData({...organizationData, name: e.target.value})}
            className="input-field"
            placeholder="Ej: Salón María"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de negocio *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {industryTemplates.map((template) => (
              <button
                key={template.value}
                onClick={() => setOrganizationData({...organizationData, industry_template: template.value})}
                className={`p-3 rounded-lg border text-left transition-all ${
                  organizationData.industry_template === template.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{template.icon}</div>
                <div className="text-sm font-medium">{template.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email de contacto *
          </label>
          <input
            type="email"
            value={organizationData.email}
            onChange={(e) => setOrganizationData({...organizationData, email: e.target.value})}
            className="input-field"
            placeholder="contacto@tunegocio.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={organizationData.phone}
            onChange={(e) => setOrganizationData({...organizationData, phone: e.target.value})}
            className="input-field"
            placeholder="+56 9 1234 5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <input
            type="text"
            value={organizationData.address}
            onChange={(e) => setOrganizationData({...organizationData, address: e.target.value})}
            className="input-field"
            placeholder="Av. Principal 123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            value={organizationData.city}
            onChange={(e) => setOrganizationData({...organizationData, city: e.target.value})}
            className="input-field"
            placeholder="Santiago"
          />
        </div>
      </div>
    </div>
  )

  // Componente de configuración de profesionales
  const ProfessionalsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Tu Equipo de Trabajo</h2>
        <p className="text-gray-600">Agrega a los profesionales que trabajarán contigo</p>
      </div>

      <div className="space-y-4">
        {professionals.map((professional, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={professional.name}
                  onChange={(e) => {
                    const updated = [...professionals]
                    updated[index].name = e.target.value
                    setProfessionals(updated)
                  }}
                  className="input-field"
                  placeholder="Ana García"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={professional.email}
                  onChange={(e) => {
                    const updated = [...professionals]
                    updated[index].email = e.target.value
                    setProfessionals(updated)
                  }}
                  className="input-field"
                  placeholder="ana@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={professional.specialty}
                  onChange={(e) => {
                    const updated = [...professionals]
                    updated[index].specialty = e.target.value
                    setProfessionals(updated)
                  }}
                  className="input-field"
                  placeholder="Estilista, Doctor, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color en calendario
                </label>
                <div className="flex space-x-2">
                  {professionalColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        const updated = [...professionals]
                        updated[index].color_code = color
                        setProfessionals(updated)
                      }}
                      className={`w-6 h-6 rounded-full border-2 ${
                        professional.color_code === color ? 'border-gray-600' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={professional.accepts_walk_ins}
                    onChange={(e) => {
                      const updated = [...professionals]
                      updated[index].accepts_walk_ins = e.target.checked
                      setProfessionals(updated)
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Acepta clientes sin cita previa</span>
                </label>
              </div>
            </div>
            {professionals.length > 1 && (
              <button
                onClick={() => setProfessionals(professionals.filter((_, i) => i !== index))}
                className="mt-3 text-red-600 text-sm hover:text-red-800"
              >
                Eliminar profesional
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addProfessional}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
      >
        <UserPlus className="w-5 h-5 mx-auto mb-1" />
        Agregar otro profesional
      </button>
    </div>
  )

  // Componente de configuración de servicios
  const ServicesStep = () => {
    const suggested = suggestedServices[organizationData.industry_template as keyof typeof suggestedServices] || []

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Briefcase className="w-12 h-12 text-primary-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Servicios que Ofreces</h2>
          <p className="text-gray-600">Define los servicios de tu negocio</p>
        </div>

        {suggested.length > 0 && services.length === 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">Servicios sugeridos para tu industria:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggested.map((service, index) => (
                <button
                  key={index}
                  onClick={() => addService(service)}
                  className="p-3 bg-white border border-blue-200 rounded-lg text-left hover:border-blue-300 transition-colors"
                >
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-600">
                    {service.duration_minutes} min - ${service.price.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {services.map((service, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del servicio *
                  </label>
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) => {
                      const updated = [...services]
                      updated[index].name = e.target.value
                      setServices(updated)
                    }}
                    className="input-field"
                    placeholder="Corte de cabello"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={service.category}
                    onChange={(e) => {
                      const updated = [...services]
                      updated[index].category = e.target.value
                      setServices(updated)
                    }}
                    className="input-field"
                    placeholder="Cabello, Uñas, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    value={service.duration_minutes}
                    onChange={(e) => {
                      const updated = [...services]
                      updated[index].duration_minutes = parseInt(e.target.value) || 0
                      setServices(updated)
                    }}
                    className="input-field"
                    placeholder="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    value={service.price}
                    onChange={(e) => {
                      const updated = [...services]
                      updated[index].price = parseInt(e.target.value) || 0
                      setServices(updated)
                    }}
                    className="input-field"
                    placeholder="15000"
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={service.description}
                    onChange={(e) => {
                      const updated = [...services]
                      updated[index].description = e.target.value
                      setServices(updated)
                    }}
                    className="input-field"
                    rows={2}
                    placeholder="Descripción detallada del servicio..."
                  />
                </div>
              </div>
              {services.length > 1 && (
                <button
                  onClick={() => setServices(services.filter((_, i) => i !== index))}
                  className="mt-3 text-red-600 text-sm hover:text-red-800"
                >
                  Eliminar servicio
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => addService()}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
        >
          <Briefcase className="w-5 h-5 mx-auto mb-1" />
          Agregar otro servicio
        </button>
      </div>
    )
  }

  // Componente de configuración final
  const ConfigurationStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Settings className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Configuración Final</h2>
        <p className="text-gray-600">Ajustes adicionales para tu sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Horarios de Atención</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Lunes a Viernes:</span>
              <span className="text-sm font-medium">9:00 - 18:00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sábados:</span>
              <span className="text-sm font-medium">9:00 - 15:00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Domingos:</span>
              <span className="text-sm font-medium">Cerrado</span>
            </div>
          </div>
          <button className="mt-3 text-sm text-primary-600 hover:text-primary-700">
            Personalizar horarios
          </button>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Reglas de Negocio</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span className="text-sm text-gray-700">Permitir cancelaciones hasta 2 horas antes</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              <span className="text-sm text-gray-700">Enviar recordatorios automáticos</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Requiere confirmación para todas las citas</span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">¡Casi listos!</h3>
          <p className="text-sm text-green-700 mb-3">
            Tu sistema estará configurado con:
          </p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• {organizationData.name} ({industryTemplates.find(t => t.value === organizationData.industry_template)?.label})</li>
            <li>• {professionals.length} profesional(es)</li>
            <li>• {services.length} servicio(s)</li>
          </ul>
        </div>
      </div>
    </div>
  )

  // Componente de finalización
  const CompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          ¡Todo está listo!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tu sistema ReservaPlus ha sido configurado exitosamente. 
          Ya puedes empezar a recibir y gestionar reservas.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="p-4 bg-blue-50 rounded-lg">
          <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-medium text-blue-900">Gestiona Reservas</h3>
          <p className="text-sm text-blue-700">Calendario inteligente y fácil de usar</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-medium text-purple-900">Base de Clientes</h3>
          <p className="text-sm text-purple-700">Historial completo de cada cliente</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <Settings className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-medium text-green-900">Automatización</h3>
          <p className="text-sm text-green-700">Recordatorios y notificaciones</p>
        </div>
      </div>

      {isCompleting ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          <span className="text-gray-600">Finalizando configuración...</span>
        </div>
      ) : (
        <button
          onClick={finishOnboarding}
          className="btn-primary text-lg px-8 py-3"
        >
          <ArrowRight className="w-5 h-5 mr-2" />
          Ir a mi Dashboard
        </button>
      )}
    </div>
  )

  // Renderizar el paso actual
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return <WelcomeStep />
      case 1: return <OrganizationStep />
      case 2: return <ProfessionalsStep />
      case 3: return <ServicesStep />
      case 4: return <ConfigurationStep />
      case 5: return <CompleteStep />
      default: return <WelcomeStep />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con progreso */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary-600">ReservaPlus</h1>
                <p className="text-sm text-gray-600">Configuración inicial</p>
              </div>
              <div className="text-sm text-gray-500">
                Paso {currentStep + 1} de {steps.length}
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="flex items-center space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index === currentStep
                const isCompleted = completedSteps.includes(index)
                const isAccessible = index <= currentStep

                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => isAccessible && setCurrentStep(index)}
                        disabled={!isAccessible}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                            ? 'bg-primary-600 text-white'
                            : isAccessible
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </button>
                      <span className={`mt-2 text-xs text-center max-w-16 ${
                        isActive ? 'text-primary-600 font-medium' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 h-0.5 mx-2 ${
                        completedSteps.includes(index) ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
          {renderCurrentStep()}
        </div>

        {/* Botones de navegación */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Anterior
            </button>
            
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                canProceed()
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Siguiente
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>
        )}

        {currentStep === 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={nextStep}
              className="btn-primary text-lg px-8 py-3"
            >
              Comenzar configuración
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default OnboardingFlow