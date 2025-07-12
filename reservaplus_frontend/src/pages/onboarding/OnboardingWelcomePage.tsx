// src/pages/onboarding/OnboardingWelcomePage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  Users, 
  Settings, 
  CreditCard, 
  ArrowRight, 
  Rocket,
  AlertCircle
} from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingProgressIndicator } from '../../components/onboarding/OnboardingProgressIndicator'

const OnboardingWelcomePage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    organizationData, 
    professionals, 
    services, 
    planInfo, 
    registrationToken, 
    completeOnboarding, 
    isCompleting,
    canProceedFromStep 
  } = useOnboarding()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Verificar que tengamos token de registro válido
    if (!registrationToken) {
      navigate('/onboarding/plan')
      return
    }

    // Verificar que todos los pasos anteriores estén completos
    if (!canProceedFromStep(4)) {
      navigate('/onboarding/organization')
      return
    }

    // Activar confetti al cargar
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }, [registrationToken, navigate, canProceedFromStep])

  const handleCompleteOnboarding = async () => {
    if (!registrationToken) {
      setError('No se encontró token de registro válido')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('🎉 Completando onboarding desde la página de bienvenida...')
      
      // Completar el onboarding usando el contexto
      await completeOnboarding()
      
      console.log('✅ Onboarding completado exitosamente')
      
      // Esperar un momento para que se procesen los datos
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Navegar al dashboard
      navigate('/app/dashboard')
      
    } catch (error) {
      console.error('❌ Error completando onboarding:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido al completar el onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const completedSteps = [
    {
      icon: CheckCircle,
      title: 'Plan Seleccionado',
      description: `${planInfo?.name || 'Plan Básico'} activado`,
      color: 'text-emerald-600 bg-emerald-100'
    },
    {
      icon: Users,
      title: 'Cuenta Creada',
      description: 'Administrador configurado',
      color: 'text-blue-600 bg-blue-100'
    },
    {
      icon: Users,
      title: 'Equipo Configurado',
      description: `${professionals.length} miembro${professionals.length > 1 ? 's' : ''} agregado${professionals.length > 1 ? 's' : ''}`,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      icon: Settings,
      title: 'Servicios Configurados',
      description: `${services.length} servicio${services.length > 1 ? 's' : ''} agregado${services.length > 1 ? 's' : ''}`,
      color: 'text-orange-600 bg-orange-100'
    },
    {
      icon: CreditCard,
      title: 'Organización Lista',
      description: '14 días gratis activados',
      color: 'text-green-600 bg-green-100'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50 relative overflow-hidden">
      
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(20)].map((_, i) => (
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
              <span className="text-sm font-medium">¡Configuración Completada!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <OnboardingProgressIndicator />

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
            {organizationData.name} está listo para comenzar
          </p>
          
          <div className="flex items-center justify-center space-x-8 text-lg text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
              {professionals.length} miembro{professionals.length > 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              {services.length} servicio{services.length > 1 ? 's' : ''}
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              {planInfo?.name || 'Plan Básico'}
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
              <h3 className="text-2xl font-bold">¡Oferta Especial de Bienvenida!</h3>
            </div>
            <p className="text-xl mb-4">
              Como nuevo usuario, tienes <strong>14 días completamente gratis</strong>
            </p>
            <div className="flex items-center justify-center space-x-8 text-lg">
              <div className="flex items-center">
                <span>Hasta {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <span>Todas las funciones incluidas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="font-semibold text-red-900">Error al completar el onboarding</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-3xl shadow-2xl border p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              ¿Listo para gestionar tu primer cliente?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Finaliza tu configuración y accede a tu panel de control para comenzar a usar todas las herramientas que hemos preparado para ti
            </p>
            
            <button
              onClick={handleCompleteOnboarding}
              disabled={isLoading || isCompleting}
              className="inline-flex items-center px-12 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xl font-bold rounded-2xl hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading || isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                  Finalizando configuración...
                </>
              ) : (
                <>
                  <Rocket className="w-6 h-6 mr-3" />
                  Finalizar y Acceder
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