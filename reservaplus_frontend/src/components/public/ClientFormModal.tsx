import React, { useState } from 'react'
import { User, Mail, Phone, MessageSquare, Lock, Calendar, Clock, MapPin } from 'lucide-react'
import publicBookingService, {
  PublicService,
  AvailabilitySlot,
  ClientData
} from '../../services/publicBookingService'

interface ClientFormModalProps {
  organizationSlug: string
  service: PublicService
  selectedSlot: AvailabilitySlot
  onSubmit: (clientData: ClientData, bookingType: 'guest' | 'registered', password?: string) => Promise<void>
  onBack: () => void
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({
  organizationSlug,
  service,
  selectedSlot,
  onSubmit,
  onBack
}) => {
  const [bookingType, setBookingType] = useState<'guest' | 'registered'>('guest')
  const [clientData, setClientData] = useState<ClientData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emergencyContact, setEmergencyContact] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof ClientData, value: string) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = (): string | null => {
    if (!clientData.first_name.trim()) {
      return 'El nombre es requerido'
    }
    if (!clientData.last_name.trim()) {
      return 'El apellido es requerido'
    }
    if (!clientData.email.trim()) {
      return 'El email es requerido'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      return 'El formato del email no es válido'
    }
    if (!clientData.phone.trim()) {
      return 'El teléfono es requerido'
    }
    if (bookingType === 'registered') {
      if (!password) {
        return 'La contraseña es requerida para crear una cuenta'
      }
      if (password.length < 6) {
        return 'La contraseña debe tener al menos 6 caracteres'
      }
      if (password !== confirmPassword) {
        return 'Las contraseñas no coinciden'
      }
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await onSubmit(
        clientData,
        bookingType,
        bookingType === 'registered' ? password : undefined
      )
    } catch (error) {
      console.error('Error submitting booking:', error)
      setError('Error al procesar la reserva. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const formatSlotDateTime = (): string => {
    const date = new Date(selectedSlot.start_datetime)
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="space-y-6">
      {/* Resumen de la cita */}
      <div className="bg-primary-50 p-4 rounded-lg">
        <h4 className="font-medium text-primary-900 mb-3">Resumen de tu cita</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center text-primary-800">
            <Calendar className="h-4 w-4 mr-2" />
            {formatSlotDateTime()}
          </div>
          <div className="flex items-center text-primary-800">
            <Clock className="h-4 w-4 mr-2" />
            {service.duration_minutes} minutos
          </div>
          <div className="flex items-center text-primary-800">
            <User className="h-4 w-4 mr-2" />
            {selectedSlot.professional_name}
          </div>
          <div className="flex items-center text-primary-800">
            <MapPin className="h-4 w-4 mr-2" />
            {publicBookingService.formatPrice(service.price)}
          </div>
        </div>
      </div>

      {/* Tipo de reserva */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">¿Cómo quieres reservar?</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setBookingType('guest')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              bookingType === 'guest'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h5 className="font-medium text-gray-900">Como invitado</h5>
            <p className="text-sm text-gray-600 mt-1">
              Reserva rápida sin crear cuenta
            </p>
          </button>

          <button
            type="button"
            onClick={() => setBookingType('registered')}
            className={`p-4 border-2 rounded-lg text-left transition-colors ${
              bookingType === 'registered'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h5 className="font-medium text-gray-900">Crear cuenta</h5>
            <p className="text-sm text-gray-600 mt-1">
              Reservas más fáciles en el futuro
            </p>
          </button>
        </div>
      </div>

      {/* Formulario de datos del cliente */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h4 className="font-medium text-gray-900">Tus datos</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="firstName"
                value={clientData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Tu nombre"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="lastName"
                value={clientData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Tu apellido"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              id="email"
              value={clientData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="tu@email.com"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="tel"
              id="phone"
              value={clientData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="+56 9 1234 5678"
              required
            />
          </div>
        </div>

        {/* Campos adicionales para cuentas registradas */}
        {bookingType === 'registered' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Repetir contraseña"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
                Contacto de emergencia (opcional)
              </label>
              <input
                type="text"
                id="emergencyContact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Nombre y teléfono de contacto"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notas adicionales (opcional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <textarea
              id="notes"
              value={clientData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Cualquier información adicional..."
            />
          </div>
        </div>

        {/* Consentimiento de marketing */}
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="marketingConsent"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="marketingConsent" className="text-sm text-gray-600">
            Acepto recibir comunicaciones promocionales y ofertas especiales por email o SMS.
          </label>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Información importante */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <h5 className="font-medium text-blue-900 mb-1">Información importante:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Recibirás una confirmación por email</li>
            {bookingType === 'guest' && (
              <li>• Podrás gestionar tu cita durante las próximas 24 horas</li>
            )}
            {bookingType === 'registered' && (
              <li>• Recibirás un email para verificar tu cuenta</li>
            )}
            <li>• Recuerda llegar 10 minutos antes de tu cita</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Procesando...
              </div>
            ) : (
              'Confirmar Reserva'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ClientFormModal 