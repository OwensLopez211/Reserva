import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Calendar as CalendarIcon,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'

interface Appointment {
  id: string
  clientName: string
  service: string
  time: string
  duration: number
  professional: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
}

const CalendarPage: React.FC = () => {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState('Owens López')
  const [appointments, setAppointments] = useState<Appointment[]>([])
  
  // Generar las horas del día (9:00 - 19:00)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 19; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Obtener los días de la semana actual
  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Ajustar para que lunes sea el primer día
    startOfWeek.setDate(diff)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      weekDays.push(day)
    }
    return weekDays
  }

  const weekDays = getWeekDays(currentDate)

  // Formatear fecha para mostrar
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    })
  }

  // Formatear rango de semana
  const formatWeekRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
    const end = endDate.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
    return `${start} - ${end}`
  }

  // Navegar semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  // Ir a hoy
  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Datos de ejemplo para citas
  useEffect(() => {
    const sampleAppointments: Appointment[] = [
      {
        id: '1',
        clientName: 'María González',
        service: 'Corte y Peinado',
        time: '15:00',
        duration: 60,
        professional: 'Owens López',
        status: 'confirmed'
      },
      {
        id: '2',
        clientName: 'Juan Pérez',
        service: 'Barba',
        time: '10:30',
        duration: 30,
        professional: 'Owens López',
        status: 'pending'
      }
    ]
    setAppointments(sampleAppointments)
  }, [])

  // Verificar si hay cita en un slot específico
  const getAppointmentForSlot = (day: Date, time: string) => {
    const dayStr = day.toDateString()
    return appointments.find(apt => 
      apt.time === time && 
      apt.professional === selectedProfessional
    )
  }

  // Obtener color según estado de la cita
  const getAppointmentColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500'
      case 'pending': return 'bg-yellow-500'
      case 'completed': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const professionals = [
    'Owens López',
    'María Rodríguez',
    'Carlos Silva',
    'Ana Martínez'
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header de la agenda */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Navegación de fechas */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="text-lg font-semibold text-gray-900">
              {formatWeekRange(weekDays[0], weekDays[6])}
            </div>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Hoy
            </button>
          </div>

          {/* Controles de la derecha */}
          <div className="flex items-center space-x-4">
            {/* Selector de profesional */}
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {professionals.map(prof => (
                  <option key={prof} value={prof}>{prof}</option>
                ))}
              </select>
            </div>

            {/* Botones de acción */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Actualizar">
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
            
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Calendario principal */}
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header de días */}
          <div className="grid grid-cols-8 border-b border-gray-200">
            {/* Columna vacía para las horas */}
            <div className="p-4 bg-gray-50 border-r border-gray-200"></div>
            
            {/* Días de la semana */}
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString()
              return (
                <div
                  key={index}
                  className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                    isToday ? 'bg-primary-50' : 'bg-gray-50'
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    isToday ? 'text-primary-600' : 'text-gray-900'
                  }`}>
                    {day.toLocaleDateString('es-ES', { weekday: 'long' })}
                  </div>
                  <div className={`text-lg font-semibold mt-1 ${
                    isToday ? 'text-primary-600' : 'text-gray-700'
                  }`}>
                    {day.getDate().toString().padStart(2, '0')}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Grid de horarios */}
          <div className="max-h-[600px] overflow-y-auto">
            {timeSlots.map((time, timeIndex) => (
              <div key={time} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-25">
                {/* Columna de hora */}
                <div className="p-4 bg-gray-50 border-r border-gray-200 flex items-center justify-center">
                  <span className="text-sm text-gray-600 font-medium">{time}</span>
                </div>

                {/* Celdas de días */}
                {weekDays.map((day, dayIndex) => {
                  const appointment = getAppointmentForSlot(day, time)
                  const isToday = day.toDateString() === new Date().toDateString()
                  
                  return (
                    <div
                      key={`${time}-${dayIndex}`}
                      className={`p-2 border-r border-gray-200 last:border-r-0 min-h-[60px] relative cursor-pointer hover:bg-gray-50 ${
                        isToday ? 'bg-primary-25' : ''
                      }`}
                      onClick={() => {
                        // Aquí iría la lógica para crear una nueva cita
                        console.log('Crear cita para', day, time)
                      }}
                    >
                      {appointment && (
                        <div className={`${getAppointmentColor(appointment.status)} text-white p-2 rounded text-xs`}>
                          <div className="font-medium truncate">{appointment.clientName}</div>
                          <div className="opacity-90 truncate">{appointment.service}</div>
                          <div className="flex items-center mt-1 opacity-75">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{appointment.duration}min</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Leyenda de estados */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Confirmada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Completada</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Cancelada</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Actualizado hace 0 min
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarPage 