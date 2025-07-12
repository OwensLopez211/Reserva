import React from 'react'
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Mail, 
  Phone,
  Copy,
  ExternalLink,
  X
} from 'lucide-react'
import publicBookingService, { BookingResponse } from '../../services/publicBookingService'

interface BookingSuccessModalProps {
  bookingResponse: BookingResponse
  organizationSlug: string
  onClose: () => void
}

const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  bookingResponse,
  organizationSlug,
  onClose
}) => {
  const { appointment, client, guest_token, verification_token } = bookingResponse
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // Aquí podrías mostrar una notificación de "copiado"
  }

  const formatDateTime = (dateTimeString: string): string => {
    return publicBookingService.formatDateTime(dateTimeString)
  }

  const getBookingUrl = (): string => {
    const baseUrl = window.location.origin
    return `${baseUrl}/booking/${organizationSlug}/appointment/${appointment.id}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                ¡Reserva Confirmada!
              </h2>
              <p className="text-sm text-gray-600">
                Tu cita ha sido registrada exitosamente
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Detalles de la cita */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3">Detalles de tu cita</h3>
              <div className="space-y-3">
                <div className="flex items-center text-green-800">
                  <Calendar className="h-4 w-4 mr-3" />
                  <span className="font-medium">
                    {formatDateTime(appointment.start_datetime)}
                  </span>
                </div>
                
                <div className="flex items-center text-green-800">
                  <Clock className="h-4 w-4 mr-3" />
                  <span>
                    {appointment.service.duration_minutes} minutos - {appointment.service.name}
                  </span>
                </div>
                
                <div className="flex items-center text-green-800">
                  <User className="h-4 w-4 mr-3" />
                  <span>{appointment.professional.name}</span>
                </div>
                
                <div className="flex items-center text-green-800">
                  <MapPin className="h-4 w-4 mr-3" />
                  <span>{appointment.organization.address}</span>
                </div>
                
                <div className="flex items-center text-green-800">
                  <span className="font-semibold">
                    Precio: {publicBookingService.formatPrice(appointment.service.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Información del cliente</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{client.full_name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{client.phone}</span>
                </div>
              </div>
            </div>

            {/* ID de reserva */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">ID de Reserva</h3>
              <div className="flex items-center justify-between bg-white rounded border p-3">
                <code className="text-sm font-mono text-gray-900">
                  {appointment.id}
                </code>
                <button
                  onClick={() => copyToClipboard(appointment.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Copiar ID"
                >
                  <Copy className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Guarda este ID para futuras consultas
              </p>
            </div>

            {/* Información específica según tipo de reserva */}
            {client.type === 'guest' && guest_token && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-900 mb-2">Gestión de tu reserva</h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Como reservaste como invitado, puedes gestionar tu cita durante las próximas 24 horas usando el enlace a continuación:
                </p>
                <div className="flex items-center justify-between bg-white rounded border p-3">
                  <span className="text-sm text-gray-600 truncate flex-1">
                    {getBookingUrl()}
                  </span>
                  <div className="flex space-x-2 ml-2">
                    <button
                      onClick={() => copyToClipboard(getBookingUrl())}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copiar enlace"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                    </button>
                    <a
                      href={getBookingUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Abrir enlace"
                    >
                      <ExternalLink className="h-4 w-4 text-gray-600" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {client.type === 'registered' && verification_token && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">Verifica tu cuenta</h3>
                <p className="text-sm text-purple-800">
                  Hemos enviado un email de verificación a <strong>{client.email}</strong>. 
                  Haz clic en el enlace del email para activar tu cuenta y poder gestionar tus citas fácilmente.
                </p>
              </div>
            )}

            {/* Información de contacto de la organización */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Contacto del establecimiento</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="font-medium">{appointment.organization.name}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{appointment.organization.address}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{appointment.organization.phone}</span>
                </div>
              </div>
            </div>

            {/* Próximos pasos */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">Próximos pasos</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 bg-blue-200 text-blue-900 rounded-full text-xs font-medium flex items-center justify-center mr-2 mt-0.5">1</span>
                  <span>Recibirás un email de confirmación en los próximos minutos</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 bg-blue-200 text-blue-900 rounded-full text-xs font-medium flex items-center justify-center mr-2 mt-0.5">2</span>
                  <span>Llega 10 minutos antes de tu cita</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-5 h-5 bg-blue-200 text-blue-900 rounded-full text-xs font-medium flex items-center justify-center mr-2 mt-0.5">3</span>
                  <span>Si necesitas cancelar o modificar, contacta al establecimiento</span>
                </li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-md hover:bg-primary-700 font-medium"
              >
                Cerrar
              </button>
              
              {client.type === 'guest' && (
                <a
                  href={getBookingUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 font-medium text-center"
                >
                  Ver mi reserva
                </a>
              )}
              
              <button
                onClick={() => window.location.reload()}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 font-medium"
              >
                Nueva reserva
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingSuccessModal 