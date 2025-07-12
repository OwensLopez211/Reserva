import React, { useState, useEffect } from 'react'
import { X, User, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import publicBookingService, {
  PublicService,
  PublicProfessional,
  AvailabilityResponse,
  AvailabilitySlot,
  ClientData,
  BookingRequest,
  BookingResponse
} from '../../services/publicBookingService'
import ClientFormModal from './ClientFormModal'
import BookingSuccessModal from './BookingSuccessModal'

interface BookingModalProps {
  organizationSlug: string
  service: PublicService
  preSelectedProfessional?: PublicProfessional | null
  onSuccess: () => void
  onClose: () => void
}

const BookingModal: React.FC<BookingModalProps> = ({
  organizationSlug,
  service,
  preSelectedProfessional,
  onSuccess,
  onClose
}) => {
  const [step, setStep] = useState<'professional' | 'datetime' | 'client'>('professional')
  const [selectedProfessional, setSelectedProfessional] = useState<PublicProfessional | null>(
    preSelectedProfessional || null
  )
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // Si hay un profesional preseleccionado, saltarse la selección de profesional
  useEffect(() => {
    if (preSelectedProfessional) {
      setSelectedProfessional(preSelectedProfessional)
      setStep('datetime')
    }
  }, [preSelectedProfessional])

  // Cargar disponibilidad cuando se selecciona un profesional o cambia la semana
  useEffect(() => {
    if (step === 'datetime') {
      loadAvailability()
    }
  }, [step, selectedProfessional, currentWeek])

  const loadAvailability = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const startDate = getWeekStart(currentWeek)
      const data = await publicBookingService.getAvailability(
        organizationSlug,
        service.id,
        selectedProfessional?.id,
        startDate.toISOString().split('T')[0],
        7
      )
      
      setAvailability(data)
    } catch (error) {
      console.error('Error loading availability:', error)
      setError('Error al cargar la disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lunes como primer día
    return new Date(d.setDate(diff))
  }

  const getWeekDays = (startDate: Date): Date[] => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const handleProfessionalSelect = (professional: PublicProfessional | null) => {
    setSelectedProfessional(professional)
    setStep('datetime')
  }

  const handleSlotSelect = (slot: AvailabilitySlot) => {
    setSelectedSlot(slot)
    setStep('client')
  }

  const handleBookingSubmit = async (clientData: ClientData, bookingType: 'guest' | 'registered', password?: string) => {
    if (!selectedSlot) return

    try {
      const bookingRequest: BookingRequest = {
        booking_type: bookingType,
        service_id: service.id,
        professional_id: selectedSlot.professional_id,
        start_datetime: selectedSlot.start_datetime,
        client_data: clientData,
        password,
        marketing_consent: false
      }

      const response = await publicBookingService.bookAppointment(organizationSlug, bookingRequest)
      
      if (response.success) {
        // Guardar token para clientes guest
        if (bookingType === 'guest' && response.guest_token && response.guest_expires_at) {
          publicBookingService.saveGuestToken(
            response.appointment.id,
            response.guest_token,
            response.guest_expires_at
          )
        }
        
        // Mostrar modal de éxito
        setBookingResponse(response)
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      throw error
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    setBookingResponse(null)
    onSuccess()
  }

  const handleBack = () => {
    switch (step) {
      case 'datetime':
        if (!preSelectedProfessional) {
          setStep('professional')
        } else {
          onClose()
        }
        break
      case 'client':
        setStep('datetime')
        break
      default:
        onClose()
    }
  }

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('es-CL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date)
  }

  const formatWeekRange = (startDate: Date): string => {
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    
    return `${startDate.getDate()} - ${endDate.getDate()} de ${new Intl.DateTimeFormat('es-CL', {
      month: 'long',
      year: 'numeric'
    }).format(startDate)}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {step !== 'professional' && !preSelectedProfessional && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Reservar Cita
              </h2>
              <p className="text-sm text-gray-600">
                {service.name} - {publicBookingService.formatPrice(service.price)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              step === 'professional' ? 'text-primary-600' : 
              ['datetime', 'client'].includes(step) ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'professional' ? 'bg-primary-100 text-primary-600' :
                ['datetime', 'client'].includes(step) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className="font-medium">Profesional</span>
            </div>

            <div className={`flex-1 h-px ${
              ['datetime', 'client'].includes(step) ? 'bg-green-200' : 'bg-gray-200'
            }`}></div>

            <div className={`flex items-center space-x-2 ${
              step === 'datetime' ? 'text-primary-600' : 
              step === 'client' ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'datetime' ? 'bg-primary-100 text-primary-600' :
                step === 'client' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className="font-medium">Fecha y Hora</span>
            </div>

            <div className={`flex-1 h-px ${
              step === 'client' ? 'bg-green-200' : 'bg-gray-200'
            }`}></div>

            <div className={`flex items-center space-x-2 ${
              step === 'client' ? 'text-primary-600' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'client' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
              }`}>
                3
              </div>
              <span className="font-medium">Datos del Cliente</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Professional Selection */}
          {step === 'professional' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Selecciona un profesional
              </h3>
              
              {/* Opción "Cualquier profesional" */}
              <button
                onClick={() => handleProfessionalSelect(null)}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 text-left transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Cualquier profesional</h4>
                    <p className="text-sm text-gray-600">
                      Ver todos los horarios disponibles
                    </p>
                  </div>
                </div>
              </button>

              {/* Lista de profesionales */}
              {service.professionals.map((professional) => (
                <button
                  key={professional.id}
                  onClick={() => handleProfessionalSelect(professional)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{professional.name}</h4>
                      <p className="text-sm text-gray-600">{professional.specialty}</p>
                      {professional.bio && (
                        <p className="text-xs text-gray-500 mt-1">{professional.bio}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 'datetime' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Selecciona fecha y hora
                </h3>
                {selectedProfessional && (
                  <div className="text-sm text-gray-600">
                    Profesional: <span className="font-medium">{selectedProfessional.name}</span>
                  </div>
                )}
              </div>

              {/* Week Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <h4 className="font-medium text-gray-900">
                  {formatWeekRange(getWeekStart(currentWeek))}
                </h4>
                
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">Cargando disponibilidad...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={loadAvailability}
                    className="mt-2 text-primary-600 hover:text-primary-700"
                  >
                    Reintentar
                  </button>
                </div>
              ) : availability ? (
                <div className="grid grid-cols-7 gap-2">
                  {getWeekDays(getWeekStart(currentWeek)).map((day, index) => {
                    const dateKey = day.toISOString().split('T')[0]
                    const dayAvailability = availability.availability[dateKey]
                    
                    return (
                      <div key={index} className="text-center">
                        <div className="text-sm font-medium text-gray-900 mb-2">
                          {formatDate(day)}
                        </div>
                        
                        <div className="space-y-1">
                          {dayAvailability && dayAvailability.slots.length > 0 ? (
                            dayAvailability.slots.map((slot, slotIndex) => (
                              <button
                                key={slotIndex}
                                onClick={() => handleSlotSelect(slot)}
                                className="w-full text-xs py-2 px-1 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded transition-colors"
                              >
                                {publicBookingService.formatTime(slot.start_time)}
                              </button>
                            ))
                          ) : (
                            <div className="text-xs text-gray-400 py-2">
                              No disponible
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* Step 3: Client Form */}
          {step === 'client' && selectedSlot && (
            <ClientFormModal
              organizationSlug={organizationSlug}
              service={service}
              selectedSlot={selectedSlot}
              onSubmit={handleBookingSubmit}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && bookingResponse && (
        <BookingSuccessModal
          bookingResponse={bookingResponse}
          organizationSlug={organizationSlug}
          onClose={handleSuccessModalClose}
        />
      )}
    </div>
  )
}

export default BookingModal 