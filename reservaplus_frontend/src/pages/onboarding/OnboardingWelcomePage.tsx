// src/pages/onboarding/OnboardingWelcomePage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  Calendar, 
  Users, 
  Settings, 
  CreditCard, 
  ArrowRight, 
  Star,
  Rocket,
  Gift,
  Clock,
  Mail,
  PlayCircle
} from 'lucide-react'

interface WelcomeData {
  organizationName: string
  adminName: string
  email: string
  industry: string
  teamSize: number
  planName: string
}

const OnboardingWelcomePage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [welcomeData, setWelcomeData] = useState<WelcomeData>({
    organizationName: '',
    adminName: '',
    email: '',
    industry: '',
    teamSize: 1,
    planName: 'Plan Básico'
  })

  useEffect(() => {
    // Activar confetti al cargar
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)

    // Cargar datos del onboarding
    const loadWelcomeData = () => {
      try {
        const registrationData = localStorage.getItem('registrationData')
        const onboardingData = localStorage.getItem('onboardingData')
        const planData = localStorage.getItem('selectedPlan')

        if (registrationData) {
          const regData = JSON.parse(registrationData)
          setWelcomeData(prev => ({
            ...prev,
            organizationName: regData.organizationName,
            adminName: `${regData.firstName} ${regData.lastName}`,
            email: regData.email,
            industry: getIndustryName(regData.industryTemplate)
          }))
        }

        if (onboardingData) {
          const data = JSON.parse(onboardingData)
          if (data.teamData?.professionals) {
            setWelcomeData(prev => ({
              ...prev,
              teamSize: data.teamData.professionals.length
            }))
          }
        }

        if (planData) {
          const plan = JSON.parse(planData)
          setWelcomeData(prev => ({
            ...prev,
            planName: 'Plan Básico'
          }))
        }
      } catch (error) {
        console.error('Error loading welcome data:', error)
      }
    }

    loadWelcomeData()
  }, [])

  const getIndustryName = (template: string): string => {
    const industries: {[key: string]: string} = {
      salon: 'Peluquería/Salón de Belleza',
      clinic: 'Clínica/Consultorio Médico',
      dental: 'Clínica Dental',
      spa: 'Spa/Centro de Bienestar',
      fitness: 'Entrenamiento Personal',
      veterinary: 'Veterinaria',
      beauty: 'Centro de Estética',
      other: 'Otro'
    }
    return industries[template] || 'Negocio de Servicios'
  }

  const handleGetStarted = async () => {
    setIsLoading(true)
    try {
      // Completar onboarding y limpiar datos temporales
      const onboardingData = {
        registrationData: JSON.parse(localStorage.getItem('registrationData') || '{}'),
        teamData: JSON.parse(localStorage.getItem('onboardingData') || '{}').teamData,
        organizationConfig: JSON.parse(localStorage.getItem('onboardingData') || '{}').organizationConfig,
        paymentData: JSON.parse(localStorage.getItem('onboardingData') || '{}').paymentData,
        planData: JSON.parse(localStorage.getItem('selectedPlan') || '{}')
      }

      // Simular llamada al backend para completar onboarding
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Limpiar localStorage del onboarding
      localStorage.removeItem('selectedPlan')
      localStorage.removeItem('registrationData')
      localStorage.removeItem('onboardingData')

      // Redirigir al dashboard
      navigate('/app/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const completedSteps = [
    {
      icon: CheckCircle,
      title: 'Plan Seleccionado',
      description: `${welcomeData.planName} activado`,
      color: 'text-emerald-600 bg-emerald-100'
    },
    {
      icon: Users,
      title: 'Cuenta Creada',
      description: `${welcomeData.adminName} - Administrador`,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Users,
      title: 'Equipo Configurado',
      description: `${welcomeData.teamSize} miembro${welcomeData.teamSize > 1 ? 's' : ''} agregado${welcomeData.teamSize > 1 ? 's' : ''}`,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: Settings,
      title: 'Organización Lista',
      description: 'Configuración completada',
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: CreditCard,
      title: 'Pago Configurado',
      description: '14 días gratis activados',
      color: 'text-green-600 bg-green-100'
    }
  ]

  const nextSteps = [
    {
      icon: Calendar,
      title: 'Explora tu Calendario',
      description: 'Revisa la vista principal donde gestionarás todas las citas',
      action: 'Ver calendario',
      color: 'emerald'
    },
    {
      icon: Users,
      title: 'Invita a tu Equipo',
      description: 'Envía invitaciones por email a tu equipo para que accedan',
      action: 'Invitar equipo',
      color: 'blue'
    },
    {
      icon: PlayCircle,
      title: 'Tutorial Interactivo',
      description: 'Aprende lo básico con una guía paso a paso (5 min)',
      action: 'Comenzar tutorial',
      color: 'purple'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              ✨
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3">
                <span className="text-white font-light text-lg">+</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reserva+</h1>
            </div>
            <div className="flex items-center text-emerald-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">¡Registro Completado!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar - Completo */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 h-2">
            <div className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 transition-all duration-1000"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Main Welcome Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
            <Rocket className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            ¡Bienvenido a{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Reserva+
            </span>
            !
          </h1>
          
          <p className="text-2xl text-gray-600 mb-4">
            {welcomeData.organizationName} está listo para comenzar
          </p>
          
          <div className="flex items-center justify-center space-x-8 text-lg text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              {welcomeData.industry}
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              {welcomeData.teamSize} miembro{welcomeData.teamSize > 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              Plan Básico
            </div>
          </div>
        </div>

        {/* Completed Steps */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Todo Configurado!</h2>
            <p className="text-xl text-gray-600">Tu plataforma está lista y funcionando</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {completedSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-6 shadow-lg border text-center transform hover:scale-105 transition-all duration-300"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Special Offer */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 text-center text-white shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <Gift className="w-8 h-8 mr-3" />
              <h3 className="text-2xl font-bold">¡Oferta Especial de Bienvenida!</h3>
            </div>
            <p className="text-xl mb-4">
              Como nuevo usuario, tienes <strong>14 días completamente gratis</strong>
            </p>
            <div className="flex items-center justify-center space-x-8 text-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>Hasta {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-5 h-5 mr-2" />
                <span>Todas las funciones incluidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Próximos Pasos</h2>
            <p className="text-xl text-gray-600">Te ayudamos a sacar el máximo provecho</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {nextSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div 
                  key={index}
                  className="bg-white rounded-2xl p-8 shadow-lg border hover:shadow-xl transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 bg-${step.color}-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-8 h-8 text-${step.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 mb-6">{step.description}</p>
                  <button className={`w-full py-3 px-4 bg-${step.color}-500 text-white rounded-xl font-medium hover:bg-${step.color}-600 transition-colors`}>
                    {step.action}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-3xl shadow-2xl border p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              ¿Listo para gestionar tu primer cliente?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Accede a tu panel de control y comienza a usar todas las herramientas que hemos preparado para ti
            </p>
            
            <button
              onClick={handleGetStarted}
              disabled={isLoading}
              className="inline-flex items-center px-12 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xl font-bold rounded-2xl hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Finalizando configuración...
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6 mr-3" />
                  Ir a mi Dashboard
                  <ArrowRight className="w-6 h-6 ml-3" />
                </>
              )}
            </button>

            <div className="mt-6 text-sm text-gray-500">
              También recibirás un email con tips y recursos adicionales
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-6 py-3 bg-blue-50 rounded-xl border border-blue-200">
            <Mail className="w-5 h-5 text-blue-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-blue-900">¿Necesitas ayuda?</div>
              <div className="text-sm text-blue-700">Nuestro equipo está aquí para apoyarte: <a href="mailto:soporte@reservaplus.com" className="font-medium underline">soporte@reservaplus.com</a></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OnboardingWelcomePage