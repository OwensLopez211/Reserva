// src/pages/onboarding/OrganizationConfigPage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, Calendar, Bell, Settings, CheckCircle, AlertCircle } from 'lucide-react'
import { useOnboarding } from '../../contexts/OnboardingContext'
import { OnboardingProgressIndicator } from '../../components/onboarding/OnboardingProgressIndicator'

interface BusinessHours {
  [key: string]: { open: string; close: string; is_open: boolean }
}

interface OrganizationConfig {
  // Horarios de atención
  business_hours: BusinessHours
  
  // Configuración de reservas
  booking_settings: {
    advance_booking_days: number
    allow_walk_ins: boolean
    buffer_between_appointments: number
    cancellation_hours_before: number
    allow_client_cancellation: boolean
  }
  
  // Configuración de notificaciones
  notification_settings: {
    send_reminders: boolean
    reminder_hours_before: number
    send_confirmations: boolean
    require_confirmation: boolean
    send_cancellation_notifications: boolean
  }
  
  // Configuración adicional
  additional_settings: {
    timezone: string
    currency: string
    default_appointment_duration: number
    enable_online_booking: boolean
  }
}

const OrganizationConfigPage: React.FC = () => {
  const navigate = useNavigate()
  const { registrationToken, organizationData, setCurrentStep: setOnboardingStep, markStepCompleted } = useOnboarding()
  const [isLoading, setIsLoading] = useState(false)
  const [, setSelectedIndustry] = useState<string>('')
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [currentStep, setCurrentStep] = useState<'hours' | 'booking' | 'notifications' | 'additional'>('hours')

  // Cargar datos guardados del onboarding
  useEffect(() => {
    if (!registrationToken) {
      navigate('/onboarding/plan')
      return
    }

    // Usar datos del contexto de onboarding
    if (organizationData.industry_template) {
      setSelectedIndustry(organizationData.industry_template)
      setConfig(getIndustryTemplate(organizationData.industry_template))
    } else {
      // Fallback a localStorage si no hay datos en contexto
    const registrationData = localStorage.getItem('registrationData')
    if (registrationData) {
      const data = JSON.parse(registrationData)
      setSelectedIndustry(data.industryTemplate)
      setConfig(getIndustryTemplate(data.industryTemplate))
    } else {
      navigate('/onboarding/register')
    }
    }
  }, [navigate, registrationToken, organizationData])

  const [config, setConfig] = useState<OrganizationConfig>({
    business_hours: {
      monday: { open: '09:00', close: '18:00', is_open: true },
      tuesday: { open: '09:00', close: '18:00', is_open: true },
      wednesday: { open: '09:00', close: '18:00', is_open: true },
      thursday: { open: '09:00', close: '18:00', is_open: true },
      friday: { open: '09:00', close: '18:00', is_open: true },
      saturday: { open: '09:00', close: '15:00', is_open: true },
      sunday: { open: '10:00', close: '14:00', is_open: false }
    },
    booking_settings: {
      advance_booking_days: 30,
      allow_walk_ins: true,
      buffer_between_appointments: 15,
      cancellation_hours_before: 24,
      allow_client_cancellation: true
    },
    notification_settings: {
      send_reminders: true,
      reminder_hours_before: 24,
      send_confirmations: true,
      require_confirmation: false,
      send_cancellation_notifications: true
    },
    additional_settings: {
      timezone: 'America/Santiago',
      currency: 'CLP',
      default_appointment_duration: 60,
      enable_online_booking: true
    }
  })

  // Plantillas por industria
  const getIndustryTemplate = (industry: string): OrganizationConfig => {
    const templates: { [key: string]: Partial<OrganizationConfig> } = {
      salon: {
        booking_settings: {
          advance_booking_days: 30,
          allow_walk_ins: true,
          buffer_between_appointments: 15,
          cancellation_hours_before: 2,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 24,
          send_confirmations: true,
          require_confirmation: false,
          send_cancellation_notifications: true
        }
      },
      clinic: {
        booking_settings: {
          advance_booking_days: 60,
          allow_walk_ins: false,
          buffer_between_appointments: 10,
          cancellation_hours_before: 24,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 48,
          send_confirmations: true,
          require_confirmation: true,
          send_cancellation_notifications: true
        }
      },
      spa: {
        booking_settings: {
          advance_booking_days: 45,
          allow_walk_ins: false,
          buffer_between_appointments: 30,
          cancellation_hours_before: 24,
          allow_client_cancellation: true
        },
        notification_settings: {
          send_reminders: true,
          reminder_hours_before: 24,
          send_confirmations: true,
          require_confirmation: true,
          send_cancellation_notifications: true
        }
      }
    }

    return { ...config, ...templates[industry] }
  }

  const updateBusinessHours = (day: string, field: 'open' | 'close' | 'is_open', value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value
        }
      }
    }))
  }

  const updateBookingSettings = (field: keyof OrganizationConfig['booking_settings'], value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      booking_settings: {
        ...prev.booking_settings,
        [field]: value
      }
    }))
  }

  const updateNotificationSettings = (field: keyof OrganizationConfig['notification_settings'], value: number | boolean) => {
    setConfig(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [field]: value
      }
    }))
  }

  const updateAdditionalSettings = (field: keyof OrganizationConfig['additional_settings'], value: string | number | boolean) => {
    setConfig(prev => ({
      ...prev,
      additional_settings: {
        ...prev.additional_settings,
        [field]: value
      }
    }))
  }

  const validateStep = (step: string): boolean => {
    const stepErrors: {[key: string]: string} = {}

    if (step === 'hours') {
      const hasOpenDay = Object.values(config.business_hours).some(day => day.is_open)
      if (!hasOpenDay) {
        stepErrors.business_hours = 'Debe tener al menos un día abierto'
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const nextStep = () => {
    if (!validateStep(currentStep)) return

    const steps = ['hours', 'booking', 'notifications', 'additional']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1] as typeof currentStep)
    }
  }

  const prevStep = () => {
    const steps = ['hours', 'booking', 'notifications', 'additional']
    const currentIndex = steps.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1] as typeof currentStep)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep('additional')) return

    setIsLoading(true)
    try {
      // Guardar configuración para el siguiente paso
      const existingData = JSON.parse(localStorage.getItem('onboardingData') || '{}')
      localStorage.setItem('onboardingData', JSON.stringify({
        ...existingData,
        organizationConfig: config
      }))

      // Actualizar el contexto de onboarding
      markStepCompleted(4) // Marcar paso 4 (organización) como completado
      setOnboardingStep(5) // Avanzar al paso 5 (complete/welcome)

      navigate('/onboarding/complete')
    } catch (error) {
      console.error('Error al guardar configuración:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/onboarding/team')
  }

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 'hours':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Horarios de Atención</h3>
              <p className="text-gray-600">Configure los días y horarios en que atenderá a sus clientes</p>
            </div>

            <div className="space-y-4">
              {days.map(day => (
                <div key={day.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.business_hours[day.key]?.is_open || false}
                      onChange={(e) => updateBusinessHours(day.key, 'is_open', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded mr-3"
                    />
                    <span className="font-medium text-gray-900 w-24">{day.label}</span>
                  </div>
                  
                  {config.business_hours[day.key]?.is_open && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="time"
                        value={config.business_hours[day.key]?.open || '09:00'}
                        onChange={(e) => updateBusinessHours(day.key, 'open', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-gray-500">a</span>
                      <input
                        type="time"
                        value={config.business_hours[day.key]?.close || '18:00'}
                        onChange={(e) => updateBusinessHours(day.key, 'close', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}
                  
                  {!config.business_hours[day.key]?.is_open && (
                    <span className="text-gray-400 font-medium">Cerrado</span>
                  )}
                </div>
              ))}
            </div>

            {errors.business_hours && (
              <p className="text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.business_hours}
              </p>
            )}
          </div>
        )

      case 'booking':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuración de Reservas</h3>
              <p className="text-gray-600">Defina las reglas para las citas y reservas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de anticipación máxima
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={config.booking_settings.advance_booking_days}
                  onChange={(e) => updateBookingSettings('advance_booking_days', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">Máximo de días que pueden reservar con anticipación</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo entre citas (minutos)
                </label>
                <select
                  value={config.booking_settings.buffer_between_appointments}
                  onChange={(e) => updateBookingSettings('buffer_between_appointments', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={0}>Sin buffer</option>
                  <option value={5}>5 minutos</option>
                  <option value={10}>10 minutos</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Tiempo libre entre una cita y otra</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horas para cancelar
                </label>
                <select
                  value={config.booking_settings.cancellation_hours_before}
                  onChange={(e) => updateBookingSettings('cancellation_hours_before', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={1}>1 hora antes</option>
                  <option value={2}>2 horas antes</option>
                  <option value={4}>4 horas antes</option>
                  <option value={12}>12 horas antes</option>
                  <option value={24}>24 horas antes</option>
                  <option value={48}>48 horas antes</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Tiempo mínimo para cancelar una cita</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración predeterminada (minutos)
                </label>
                <select
                  value={config.additional_settings.default_appointment_duration}
                  onChange={(e) => updateAdditionalSettings('default_appointment_duration', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                  <option value={120}>120 minutos</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Duración por defecto para nuevas citas</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Permitir citas sin reserva (Walk-ins)</h4>
                  <p className="text-sm text-gray-500">Los clientes pueden llegar sin cita previa</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.booking_settings.allow_walk_ins}
                  onChange={(e) => updateBookingSettings('allow_walk_ins', e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Permitir cancelación por clientes</h4>
                  <p className="text-sm text-gray-500">Los clientes pueden cancelar sus propias citas</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.booking_settings.allow_client_cancellation}
                  onChange={(e) => updateBookingSettings('allow_client_cancellation', e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded"
                />
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Notificaciones</h3>
              <p className="text-gray-600">Configure cómo y cuándo notificar a sus clientes</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Enviar recordatorios</h4>
                  <p className="text-sm text-gray-500">Recordar a los clientes sobre sus próximas citas</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.notification_settings.send_reminders}
                  onChange={(e) => updateNotificationSettings('send_reminders', e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded"
                />
              </div>

              {config.notification_settings.send_reminders && (
                <div className="ml-6 bg-white p-4 rounded-xl border">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enviar recordatorio con anticipación de:
                  </label>
                  <select
                    value={config.notification_settings.reminder_hours_before}
                    onChange={(e) => updateNotificationSettings('reminder_hours_before', parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1 hora</option>
                    <option value={2}>2 horas</option>
                    <option value={4}>4 horas</option>
                    <option value={12}>12 horas</option>
                    <option value={24}>24 horas</option>
                    <option value={48}>48 horas</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Enviar confirmaciones</h4>
                  <p className="text-sm text-gray-500">Confirmar automáticamente las nuevas citas</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.notification_settings.send_confirmations}
                  onChange={(e) => updateNotificationSettings('send_confirmations', e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Requerir confirmación del cliente</h4>
                  <p className="text-sm text-gray-500">Los clientes deben confirmar sus citas para que sean válidas</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.notification_settings.require_confirmation}
                  onChange={(e) => updateNotificationSettings('require_confirmation', e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Notificar cancelaciones</h4>
                  <p className="text-sm text-gray-500">Enviar email cuando se cancele una cita</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.notification_settings.send_cancellation_notifications}
                  onChange={(e) => updateNotificationSettings('send_cancellation_notifications', e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded"
                />
              </div>
            </div>
          </div>
        )

      case 'additional':
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Configuración Adicional</h3>
              <p className="text-gray-600">Últimos ajustes para personalizar su experiencia</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zona horaria
                </label>
                <select
                  value={config.additional_settings.timezone}
                  onChange={(e) => updateAdditionalSettings('timezone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="America/Santiago">Santiago (GMT-3)</option>
                  <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                  <option value="America/Lima">Lima (GMT-5)</option>
                  <option value="America/Bogota">Bogotá (GMT-5)</option>
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                </select>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda
                </label>
                <select
                  value={config.additional_settings.currency}
                  onChange={(e) => updateAdditionalSettings('currency', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CLP">Peso Chileno (CLP)</option>
                  <option value="ARS">Peso Argentino (ARS)</option>
                  <option value="PEN">Sol Peruano (PEN)</option>
                  <option value="COP">Peso Colombiano (COP)</option>
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Habilitar reservas online</h4>
                  <p className="text-sm text-gray-500">Los clientes pueden hacer reservas desde su página web</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.additional_settings.enable_online_booking}
                  onChange={(e) => updateAdditionalSettings('enable_online_booking', e.target.checked)}
                  className="w-6 h-6 text-emerald-600 rounded"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const steps = [
    { key: 'hours', label: 'Horarios', icon: Clock },
    { key: 'booking', label: 'Reservas', icon: Calendar },
    { key: 'notifications', label: 'Notificaciones', icon: Bell },
    { key: 'additional', label: 'Adicional', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
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
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <OnboardingProgressIndicator />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Configuración de{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Organización
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Personalice cómo funciona su negocio en la plataforma
          </p>
        </div>

        {/* Step Navigation */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = step.key === currentStep
                const isCompleted = steps.findIndex(s => s.key === currentStep) > index
                
                return (
                  <div
                    key={step.key}
                    className={`flex items-center px-4 py-2 rounded-xl transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <Icon className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-medium">{step.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-2xl border p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={currentStep === 'hours' ? handleBack : prevStep}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {currentStep === 'hours' ? 'Volver al Equipo' : 'Anterior'}
          </button>

          <button
            onClick={currentStep === 'additional' ? handleSubmit : nextStep}
            disabled={isLoading}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : currentStep === 'additional' ? (
              <>
                Continuar al Pago
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default OrganizationConfigPage