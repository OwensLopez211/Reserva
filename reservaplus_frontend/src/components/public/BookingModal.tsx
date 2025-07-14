import React, { useState, useEffect } from 'react'
import { X, User, Users, ChevronLeft, ChevronRight, Clock, Calendar, Star, Check } from 'lucide-react'
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden transform transition-all">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative flex items-center justify-between p-6 sm:p-8">
            <div className="flex items-center space-x-4">
              {step !== 'professional' && !preSelectedProfessional && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Reservar Cita
                </h2>
                <div className="flex items-center space-x-3 mt-2">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{service.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-sm font-bold">{publicBookingService.formatPrice(service.price)}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 sm:px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1 */}
            <div className={`flex items-center space-x-3 ${
              step === 'professional' ? 'text-emerald-600' : 
              ['datetime', 'client'].includes(step) ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === 'professional' ? 'bg-emerald-500 text-white shadow-lg scale-110' :
                ['datetime', 'client'].includes(step) ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {['datetime', 'client'].includes(step) ? <Check className="h-5 w-5" /> : '1'}
                {step === 'professional' && (
                  <div className="absolute -inset-1 bg-emerald-500 rounded-full animate-pulse opacity-30"></div>
                )}
              </div>
              <span className="font-semibold text-sm sm:text-base hidden sm:block">Profesional</span>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all duration-500 ${
              ['datetime', 'client'].includes(step) ? 'bg-emerald-400' : 'bg-gray-200'
            }`}>
              <div className={`h-full bg-emerald-500 rounded-full transition-all duration-1000 ${
                ['datetime', 'client'].includes(step) ? 'w-full' : 'w-0'
              }`}></div>
            </div>

            {/* Step 2 */}
            <div className={`flex items-center space-x-3 ${
              step === 'datetime' ? 'text-emerald-600' : 
              step === 'client' ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === 'datetime' ? 'bg-emerald-500 text-white shadow-lg scale-110' :
                step === 'client' ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'client' ? <Check className="h-5 w-5" /> : '2'}
                {step === 'datetime' && (
                  <div className="absolute -inset-1 bg-emerald-500 rounded-full animate-pulse opacity-30"></div>
                )}
              </div>
              <span className="font-semibold text-sm sm:text-base hidden sm:block">Fecha y Hora</span>
            </div>

            {/* Connector */}
            <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all duration-500 ${
              step === 'client' ? 'bg-emerald-400' : 'bg-gray-200'
            }`}>
              <div className={`h-full bg-emerald-500 rounded-full transition-all duration-1000 ${
                step === 'client' ? 'w-full' : 'w-0'
              }`}></div>
            </div>

            {/* Step 3 */}
            <div className={`flex items-center space-x-3 ${
              step === 'client' ? 'text-emerald-600' : 'text-gray-400'
            }`}>
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                step === 'client' ? 'bg-emerald-500 text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-500'
              }`}>
                3
                {step === 'client' && (
                  <div className="absolute -inset-1 bg-emerald-500 rounded-full animate-pulse opacity-30"></div>
                )}
              </div>
              <span className="font-semibold text-sm sm:text-base hidden sm:block">Datos</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(95vh-280px)]">
          {/* Step 1: Professional Selection */}
          {step === 'professional' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Elige tu profesional ideal
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Selecciona el profesional que prefieras o déjanos asignar el mejor disponible para tu cita
                </p>
              </div>
              
              {/* Opción "Cualquier profesional" */}
              <div className="relative group">
                <button
                  onClick={() => handleProfessionalSelect(null)}
                  className="w-full p-6 bg-gradient-to-r from-emerald-50 to-cyan-50 border-2 border-emerald-200 rounded-2xl hover:border-emerald-300 hover:from-emerald-100 hover:to-cyan-100 text-left transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">Cualquier profesional</h4>
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2 py-1 rounded-full">Recomendado</span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        Te asignamos automáticamente el mejor profesional disponible
                      </p>
                      <div className="flex items-center text-sm text-emerald-700">
                        <Star className="h-4 w-4 mr-1" />
                        <span>Más opciones de horario</span>
                      </div>
                    </div>
                    <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  </div>
                </button>
              </div>

              {/* Lista de profesionales */}
              <div className="space-y-4">
                {service.professionals.map((professional, index) => (
                  <div key={professional.id} className="relative group">
                    <button
                      onClick={() => handleProfessionalSelect(professional)}
                      className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/30 text-left transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="h-16 w-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-md">
                            <User className="h-8 w-8 text-gray-600" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">{professional.name}</h4>
                          <p className="text-emerald-600 font-medium text-sm mb-2">{professional.specialty}</p>
                          {professional.bio && (
                            <p className="text-gray-600 text-sm leading-relaxed">{professional.bio}</p>
                          )}
                        </div>
                        <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="h-6 w-6" />
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 'datetime' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Selecciona fecha y hora
                </h3>
                {selectedProfessional ? (
                  <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2">
                    <User className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-800 font-medium">{selectedProfessional.name}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800 font-medium">Cualquier profesional disponible</span>
                  </div>
                )}
              </div>

              {/* Week Navigation */}
              <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-3 hover:bg-emerald-50 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <ChevronLeft className="h-6 w-6 text-emerald-600" />
                </button>
                
                <div className="text-center">
                  <h4 className="font-bold text-gray-900 text-lg">
                    {formatWeekRange(getWeekStart(currentWeek))}
                  </h4>
                  <p className="text-sm text-gray-600">Elige tu horario preferido</p>
                </div>
                
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-3 hover:bg-emerald-50 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  <ChevronRight className="h-6 w-6 text-emerald-600" />
                </button>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <div className="relative mx-auto w-16 h-16 mb-6">
                    <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-500 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Cargando disponibilidad</h4>
                  <p className="text-gray-600">Buscando los mejores horarios para ti...</p>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X className="h-8 w-8 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar</h4>
                  <p className="text-red-600 mb-6">{error}</p>
                  <button
                    onClick={loadAvailability}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  >
                    Reintentar
                  </button>
                </div>
              ) : availability ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {getWeekDays(getWeekStart(currentWeek)).map((day, index) => {
                      const dateKey = day.toISOString().split('T')[0]
                      const dayAvailability = availability.availability[dateKey]
                      const isToday = day.toDateString() === new Date().toDateString()
                      
                      return (
                        <div key={index} className="text-center">
                          <div className={`text-sm font-bold mb-3 p-2 rounded-lg ${
                            isToday ? 'bg-emerald-100 text-emerald-800' : 'text-gray-900'
                          }`}>
                            {formatDate(day)}
                            {isToday && <div className="text-xs">Hoy</div>}
                          </div>
                          
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {dayAvailability && dayAvailability.slots.length > 0 ? (
                              dayAvailability.slots.map((slot, slotIndex) => (
                                <button
                                  key={slotIndex}
                                  onClick={() => handleSlotSelect(slot)}
                                  className="w-full text-sm py-3 px-2 bg-gradient-to-r from-emerald-50 to-cyan-50 hover:from-emerald-100 hover:to-cyan-100 border-2 border-emerald-200 hover:border-emerald-300 text-emerald-700 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-md font-medium"
                                >
                                  {publicBookingService.formatTime(slot.start_time)}
                                </button>
                              ))
                            ) : (
                              <div className="text-sm text-gray-400 py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                No disponible
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
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