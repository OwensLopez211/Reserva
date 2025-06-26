// src/pages/onboarding/OnboardingCompletePage.tsx - PÁGINA FINAL ACTUALIZADA

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
  PlayCircle,
  Sparkles
} from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { useAuth } from '../../contexts/AuthContext'

const OnboardingCompletePage: React.FC = () => {
  const navigate = useNavigate()
  const { completeOnboarding, isCompleting, organizationData, professionals, services, planInfo } = useOnboarding()
  const { checkAuth } = useAuth()
  
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [completionStep, setCompletionStep] = useState<'summary' | 'processing' | 'success' | 'error'>('summary')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Activar confetti al cargar la página
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 3000)
  }, [])

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

  const handleCompleteOnboarding = async () => {
    setIsLoading(true)
    setCompletionStep('processing')
    setError(null)

    try {
      console.log('🚀 Iniciando finalización del onboarding...')
      
      // Completar onboarding usando el contexto
      const result = await completeOnboarding()
      
      console.log('✅ Onboarding completado exitosamente:', result)
      
      setCompletionStep('success')
      
      // Verificar autenticación después del onboarding
      setTimeout(async () => {
        try {
          await checkAuth()
          navigate('/app/dashboard')
        } catch (authError) {
          console.error('Error verificando autenticación:', authError)
          // Si falla la autenticación, redirigir a login
          navigate('/login')
        }
      }, 2000)
      
    } catch (error: any) {
      console.error('❌ Error completando onboarding:', error)
      setCompletionStep('error')
      setError(error.message || 'Error al completar el onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const renderSummaryStep = () => (
    <>
      {/* Header */}
      <div className="text-center mb-16">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-bounce">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          ¡Todo está{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
            Listo!
          </span>
        </h1>
        
        <p className="text-2xl text-gray-600 mb-4">
          {organizationData.name} está configurado para comenzar
        </p>
        
        <div className="flex items-center justify-center space-x-8 text-lg text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            {professionals.length} miembro{professionals.length > 1 ? 's' : ''} del equipo
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            {services.length} servicio{services.length > 1 ? 's' : ''}
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            Plan {planInfo?.name || 'Básico'}
          </div>
        </div>
      </div>

      {/* Completed Steps */}
      <div className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Configuración Completada</h2>
          <p className="text-xl text-gray-600">Tu plataforma está lista para funcionar</p>
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

      {/* Summary Data */}
      <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Team Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            Tu Equipo
          </h3>
          <div className="space-y-3">
            {professionals.slice(0, 3).map((prof, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: prof.color_code }}
                  >
                    <span className="text-white text-sm font-medium">
                      {prof.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{prof.name}</div>
                    <div className="text-sm text-gray-500">{prof.specialty}</div>
                  </div>
                </div>
              </div>
            ))}
            {professionals.length > 3 && (
              <div className="text-sm text-gray-500 text-center">
                +{professionals.length - 3} más
              </div>
            )}
          </div>
        </div>

        {/* Services Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Settings className="w-6 h-6 text-orange-600 mr-2" />
            Tus Servicios
          </h3>
          <div className="space-y-3">
            {services.slice(0, 3).map((service, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{service.name}</div>
                  <div className="text-sm text-gray-500">{service.category}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-emerald-600">${service.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{service.duration_minutes} min</div>
                </div>
              </div>
            ))}
            {services.length > 3 && (
              <div className="text-sm text-gray-500 text-center">
                +{services.length - 3} más
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <div className="bg-white rounded-3xl shadow-2xl border p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            ¿Listo para recibir tu primera reserva?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Todo está configurado. Es hora de activar tu sistema y comenzar a gestionar reservas profesionalmente.
          </p>
          
          <button
            onClick={handleCompleteOnboarding}
            disabled={isLoading}
            className="inline-flex items-center px-12 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xl font-bold rounded-2xl hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Rocket className="w-6 h-6 mr-3" />
            Activar Mi Sistema
            <ArrowRight className="w-6 h-6 ml-3" />
          </button>

          <div className="mt-6 text-sm text-gray-500">
            Se creará tu organización y tendrás acceso completo al sistema
          </div>
        </div>
      </div>
    </>
  )

  const renderProcessingStep = () => (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Creando tu organización...</h2>
      <p className="text-xl text-gray-600 mb-8">
        Estamos configurando todo para que puedas comenzar inmediatamente
      </p>
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Configurando sistema</span>
          <span>90%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full w-5/6 transition-all duration-1000"></div>
        </div>
      </div>
    </div>
  )

  const renderSuccessStep = () => (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">¡Sistema Activado!</h2>
      <p className="text-xl text-gray-600 mb-8">
        Tu organización está lista. Redirigiendo al dashboard...
      </p>
      <div className="animate-pulse text-emerald-600">
        Accediendo a tu panel de control...
      </div>
    </div>
  )

  const renderErrorStep = () => (
    <div className="text-center py-16">
      <div className="w-24 h-24 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
        <AlertCircle className="w-12 h-12 text-red-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Error en la Activación</h2>
      <p className="text-xl text-gray-600 mb-8">
        {error || 'Hubo un problema al activar tu sistema'}
      </p>
      <div className="space-y-4">
        <button
          onClick={handleCompleteOnboarding}
          className="inline-flex items-center px-8 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
        >
          Reintentar Activación
        </button>
        <div>
          <button
            onClick={() => navigate('/onboarding/team')}
            className="text-gray-600 hover:text-gray-800 underline"
          >
            Volver a revisar configuración
          </button>
        </div>
      </div>
    </div>
  )

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
              <span className="text-sm font-medium">¡Configuración Lista!</span>
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
        {completionStep === 'summary' && renderSummaryStep()}
        {completionStep === 'processing' && renderProcessingStep()}
        {completionStep === 'success' && renderSuccessStep()}
        {completionStep === 'error' && renderErrorStep()}
      </div>
    </div>
  )
}

export default OnboardingCompletePage