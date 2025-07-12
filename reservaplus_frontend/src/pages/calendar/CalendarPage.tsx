import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  RefreshCw,
  Filter,
  Calendar,
  Grid3X3,
  List,
  Search,
  MoreVertical,
  X
} from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, isToday, addWeeks, subWeeks, getHours, getMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import appointmentService, { AppointmentCalendar, CalendarFilters, Appointment } from '../../services/appointmentService'
import professionalService, { Professional } from '../../services/professionalService'
import AppointmentModal from '../../components/appointments/AppointmentModal'

type ViewMode = 'week' | 'day' | 'list'

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all')
  const [appointments, setAppointments] = useState<AppointmentCalendar[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showProfessionalAlert, setShowProfessionalAlert] = useState(false)
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [modalInitialDate, setModalInitialDate] = useState<string>('')
  const [modalInitialTime, setModalInitialTime] = useState<string>('')

  // Time slots configuration - optimized to fit screen without scroll
  const timeSlots = useMemo(() => {
    const slots = []
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`)
    }
    return slots
  }, [])

  // Current time line calculation
  const getCurrentTimePosition = () => {
    const now = currentTime
    const hours = getHours(now)
    const minutes = getMinutes(now)
    
    // If current time is outside business hours, don't show the line
    if (hours < 8 || hours > 20) return null
    
    // Calculate position as percentage
    const totalMinutesInDay = (20 - 8) * 60 // 12 hours in minutes
    const currentMinutesFromStart = (hours - 8) * 60 + minutes
    const percentage = (currentMinutesFromStart / totalMinutesInDay) * 100
    
    return Math.min(Math.max(percentage, 0), 100)
  }

  // Week days calculation
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [currentDate])

  // Filtered appointments based on search
  const filteredAppointments = useMemo(() => {
    if (!searchTerm) return appointments
    return appointments.filter(apt =>
      apt.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.professional_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [appointments, searchTerm])

  // Load professionals
  const loadProfessionals = async () => {
    try {
      const professionalsData = await professionalService.getProfessionals()
      setProfessionals(professionalsData)
    } catch (error) {
      console.error('Error loading professionals:', error)
      setError('Error al cargar los profesionales')
    }
  }

  // Load appointments
  const loadAppointments = async () => {
    try {
      setLoading(true)
      
      const filters: CalendarFilters = {
        start_date: weekDays[0].toISOString().split('T')[0],
        end_date: weekDays[6].toISOString().split('T')[0]
      }
      
      if (selectedProfessional && selectedProfessional !== 'all') {
        filters.professional = selectedProfessional
      }
      
      const appointmentsData = await appointmentService.getCalendarAppointments(filters)
      setAppointments(appointmentsData)
      setError(null)
    } catch (error) {
      console.error('Error loading appointments:', error)
      setError('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  // Navigation functions
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get appointment for specific slot
  const getAppointmentForSlot = (day: Date, time: string) => {
    return filteredAppointments.find(apt => {
      const aptDate = new Date(apt.start_datetime)
      const aptTime = format(aptDate, 'HH:mm')
      return aptTime === time && isSameDay(aptDate, day)
    })
  }

  // Get appointment color
  const getAppointmentColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'pending': 'bg-gradient-to-r from-amber-400 to-orange-500',
      'confirmed': 'bg-gradient-to-r from-blue-500 to-indigo-600',
      'checked_in': 'bg-gradient-to-r from-purple-500 to-pink-500',
      'in_progress': 'bg-gradient-to-r from-orange-500 to-red-500',
      'completed': 'bg-gradient-to-r from-green-500 to-emerald-600',
      'cancelled': 'bg-gradient-to-r from-gray-400 to-gray-500',
      'no_show': 'bg-gradient-to-r from-red-400 to-red-600'
    }
    return colorMap[status] || 'bg-gradient-to-r from-gray-400 to-gray-500'
  }

  // Handle appointment actions
  const handleCreateAppointment = (day: Date, time: string) => {
    if (!selectedProfessional || selectedProfessional === 'all') {
      alert('Para crear una cita, selecciona un profesional específico')
      return
    }
    
    setSelectedAppointment(null)
    setModalInitialDate(day.toISOString().split('T')[0])
    setModalInitialTime(time)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointment: AppointmentCalendar) => {
    const fullAppointment: Appointment = {
      id: appointment.id,
      organization: '',
      organization_name: '',
      client: appointment.client_name,
      client_name: appointment.client_name,
      professional: selectedProfessional,
      professional_name: appointment.professional_name,
      service: appointment.service_name,
      service_name: appointment.service_name,
      start_datetime: appointment.start_datetime,
      end_datetime: appointment.end_datetime,
      duration_minutes: appointment.duration_minutes,
      duration_hours: appointment.duration_minutes / 60,
      status: appointment.status as 'pending' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled',
      status_display: appointmentService.getStatusText(appointment.status),
      price: '0',
      notes: '',
      internal_notes: '',
      is_walk_in: appointment.is_walk_in,
      requires_confirmation: false,
      reminder_sent: false,
      confirmation_sent: false,
      is_today: false,
      is_past: false,
      is_upcoming: false,
      can_be_cancelled: true,
      time_until_appointment: '',
      cancelled_at: null,
      cancelled_by: null,
      cancellation_reason: '',
      created_by: '',
      created_at: '',
      updated_at: ''
    }
    
    setSelectedAppointment(fullAppointment)
    setIsModalOpen(true)
  }

  const handleSaveAppointment = () => {
    loadAppointments()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedAppointment(null)
    setModalInitialDate('')
    setModalInitialTime('')
  }

  // Handle new appointment button click
  const handleNewAppointment = () => {
    if (!selectedProfessional || selectedProfessional === 'all') {
      setShowProfessionalAlert(true)
      // Auto-hide alert after 3 seconds
      setTimeout(() => setShowProfessionalAlert(false), 3000)
      return
    }
    
    // Set default time to current time or next available hour
    const now = new Date()
    const currentHour = now.getHours()
    let defaultTime = '09:00'
    
    // If it's business hours, set to next hour
    if (currentHour >= 8 && currentHour < 20) {
      const nextHour = Math.min(currentHour + 1, 20)
      defaultTime = `${nextHour.toString().padStart(2, '0')}:00`
    }
    
    setSelectedAppointment(null)
    setModalInitialDate(new Date().toISOString().split('T')[0])
    setModalInitialTime(defaultTime)
    setIsModalOpen(true)
  }

  // Effects
  useEffect(() => {
    loadProfessionals()
  }, [])

  useEffect(() => {
    loadAppointments()
  }, [currentDate, selectedProfessional])

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Responsive header component
  const CalendarHeader = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      {/* Desktop Header */}
      <div className="hidden lg:block px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* Date Range */}
            <div className="flex items-center space-x-4">
              <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {format(weekDays[0], 'd MMM', { locale: es })} - {format(weekDays[6], 'd MMM yyyy', { locale: es })}
              </div>
              {/* Current Time Display */}
              {getCurrentTimePosition() !== null && (
                <div className="flex items-center space-x-2 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-700">
                    {format(currentTime, 'HH:mm')}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            >
              Hoy
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar citas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 w-64"
              />
            </div>

            {/* Professional Filter */}
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="all">Todos los profesionales</option>
                {professionals.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.full_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || prof.email || `Profesional ${prof.id.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'week' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button 
              onClick={loadAppointments}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105" 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
              onClick={handleNewAppointment}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 flex items-center space-x-2 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-lg font-bold text-gray-900">
              {format(currentDate, 'MMM yyyy', { locale: es })}
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
            <button 
              onClick={handleNewAppointment}
              className="px-3 py-2 bg-indigo-600 text-white rounded-lg flex items-center space-x-1 hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Nueva</span>
            </button>
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="space-y-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar citas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los profesionales</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.full_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || prof.email || `Profesional ${prof.id.slice(0, 8)}`}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm transition-all ${
                    viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Lista
                </button>
              </div>
              
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-indigo-50 text-indigo-700 rounded-lg"
              >
                Hoy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Week view component
  const WeekView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Week View */}
      <div className="hidden lg:block">
        {/* Days Header */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100"></div>
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`p-4 text-center border-r border-gray-200 last:border-r-0 transition-all duration-200 ${
                isToday(day) 
                  ? 'bg-gradient-to-r from-indigo-50 to-purple-50' 
                  : 'bg-gradient-to-r from-gray-50 to-gray-100'
              }`}
            >
              <div className={`text-sm font-medium ${
                isToday(day) ? 'text-indigo-600' : 'text-gray-900'
              }`}>
                {format(day, 'EEE', { locale: es })}
              </div>
              <div className={`text-lg font-bold mt-1 ${
                isToday(day) ? 'text-indigo-600' : 'text-gray-700'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="relative">
          {/* Current Time Line - spans across all columns */}
          {getCurrentTimePosition() !== null && (
            <div 
              className="absolute left-0 right-0 z-20 pointer-events-none group"
              style={{ top: `${getCurrentTimePosition()}%` }}
              title={`Hora actual: ${format(currentTime, 'HH:mm:ss')} - ${format(currentTime, 'EEEE, d MMMM yyyy', { locale: es })}`}
            >
              <div className="flex items-center">
                {/* Time label with pulse animation */}
                <div className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-l-lg font-bold min-w-[70px] text-center shadow-lg animate-pulse group-hover:animate-none transition-all">
                  {format(currentTime, 'HH:mm')}
                </div>
                {/* Red line with glow effect */}
                <div className="flex-1 h-1 bg-gradient-to-r from-red-500 to-red-600 shadow-lg group-hover:h-1.5 transition-all" 
                     style={{ 
                       boxShadow: '0 0 10px rgba(239, 68, 68, 0.5), 0 0 20px rgba(239, 68, 68, 0.3)' 
                     }}>
                </div>
                {/* Animated arrow indicator */}
                <div className="relative">
                  <div className="w-0 h-0 border-l-[8px] border-r-0 border-t-[8px] border-b-[8px] border-l-red-500 border-t-transparent border-b-transparent group-hover:border-l-[10px] group-hover:border-t-[10px] group-hover:border-b-[10px] transition-all"></div>
                  {/* Pulsing dot */}
                  <div className="absolute -right-1 -top-1 w-2 h-2 bg-red-400 rounded-full animate-ping group-hover:w-3 group-hover:h-3 group-hover:-right-1.5 group-hover:-top-1.5 transition-all"></div>
                </div>
              </div>
              {/* Subtle background highlight */}
              <div className="absolute inset-0 bg-red-50 opacity-20 -z-10 group-hover:opacity-30 transition-opacity" style={{ height: '4px', top: '50%', marginTop: '-2px' }}></div>
            </div>
          )}

          {/* Time slots grid - optimized height to fit screen */}
          <div className="grid" style={{ height: 'calc(100vh - 300px)', gridTemplateRows: `repeat(${timeSlots.length}, 1fr)` }}>
            {timeSlots.map((time, index) => (
              <div key={time} className="grid grid-cols-8 border-b border-gray-100 last:border-b-0 hover:bg-gray-25 transition-colors relative">
                <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 border-r border-gray-200 flex items-center justify-center">
                  <span className="text-sm text-gray-600 font-medium">{time}</span>
                </div>

                {weekDays.map((day, dayIndex) => {
                  const appointment = getAppointmentForSlot(day, time)
                  const isCurrentDay = isToday(day)
                  
                  return (
                    <div
                      key={`${time}-${dayIndex}`}
                      className={`p-2 border-r border-gray-200 last:border-r-0 relative cursor-pointer transition-all duration-200 hover:bg-gray-50 flex items-center ${
                        isCurrentDay ? 'bg-indigo-25' : ''
                      }`}
                      onClick={() => handleCreateAppointment(day, time)}
                    >
                      {appointment && (
                        <div 
                          className={`${getAppointmentColor(appointment.status)} text-white p-2 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl w-full`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditAppointment(appointment)
                          }}
                        >
                          <div className="font-semibold text-xs truncate">{appointment.client_name}</div>
                          <div className="opacity-90 text-xs truncate mt-1">{appointment.service_name}</div>
                          <div className="flex items-center mt-1 opacity-90">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="text-xs">{appointment.duration_minutes}min</span>
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
      </div>

      {/* Mobile Week View */}
      <div className="lg:hidden">
        {/* Current Time Indicator for Mobile */}
        {getCurrentTimePosition() !== null && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mx-4 mb-4 rounded-r-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-700">
                Hora actual: {format(currentTime, 'HH:mm')}
              </span>
            </div>
          </div>
        )}

        <div className="flex overflow-x-auto pb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="flex-shrink-0 w-24">
              <div className={`p-3 text-center border-r border-gray-200 relative ${
                isToday(day) ? 'bg-indigo-50' : 'bg-gray-50'
              }`}>
                <div className={`text-xs font-medium ${
                  isToday(day) ? 'text-indigo-600' : 'text-gray-700'
                }`}>
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className={`text-lg font-bold ${
                  isToday(day) ? 'text-indigo-600' : 'text-gray-900'
                }`}>
                  {format(day, 'd')}
                </div>
                {/* Today indicator */}
                {isToday(day) && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              <div className="space-y-1 p-2 max-h-96 overflow-y-auto">
                {filteredAppointments
                  .filter(apt => isSameDay(new Date(apt.start_datetime), day))
                  .map(appointment => (
                    <div
                      key={appointment.id}
                      className={`${getAppointmentColor(appointment.status)} text-white p-2 rounded-lg text-xs cursor-pointer transform hover:scale-105 transition-transform`}
                      onClick={() => handleEditAppointment(appointment)}
                    >
                      <div className="font-medium truncate">{appointment.client_name}</div>
                      <div className="opacity-90 truncate">{format(new Date(appointment.start_datetime), 'HH:mm')}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // List view component
  const ListView = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Citas de la Semana</h3>
        
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay citas programadas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map(appointment => (
              <div
                key={appointment.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => handleEditAppointment(appointment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getAppointmentColor(appointment.status).replace('bg-gradient-to-r', 'bg-gradient-to-r').split(' ')[3]}`}></div>
                      <h4 className="font-semibold text-gray-900">{appointment.client_name}</h4>
                      <span className="text-sm text-gray-500">
                        {format(new Date(appointment.start_datetime), 'EEE d MMM, HH:mm', { locale: es })}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{appointment.professional_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.service_name} ({appointment.duration_minutes}min)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointmentService.getStatusText(appointment.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // Loading state
  if (loading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <CalendarHeader />

      {/* Error Alert */}
      {error && (
        <div className="mx-4 lg:mx-6 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Professional Selection Alert */}
      {showProfessionalAlert && (
        <div className="mx-4 lg:mx-6 mt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center space-x-3 animate-slideIn">
            <div className="flex-shrink-0">
              <User className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium">Selecciona un profesional</p>
              <p className="text-sm">Para crear una nueva cita, primero selecciona un profesional específico en el filtro superior.</p>
            </div>
            <button
              onClick={() => setShowProfessionalAlert(false)}
              className="flex-shrink-0 p-1 hover:bg-amber-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 lg:p-6">
        {viewMode === 'week' ? <WeekView /> : <ListView />}
        
        {/* Status Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              {[
                { status: 'confirmed', label: 'Confirmada', color: 'bg-blue-500' },
                { status: 'pending', label: 'Pendiente', color: 'bg-amber-500' },
                { status: 'completed', label: 'Completada', color: 'bg-green-500' },
                { status: 'cancelled', label: 'Cancelada', color: 'bg-red-500' },
                { status: 'checked_in', label: 'Cliente Llegó', color: 'bg-purple-500' },
                { status: 'in_progress', label: 'En Proceso', color: 'bg-orange-500' }
              ].map(({ status, label, color }) => (
                <div key={status} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 ${color} rounded-full`}></div>
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
              ))}
            </div>
            
            <div className="text-sm text-gray-500">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Actualizando...</span>
                </div>
              ) : (
                `${filteredAppointments.length} citas encontradas`
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAppointment}
        appointment={selectedAppointment}
        initialDate={modalInitialDate}
        initialTime={modalInitialTime}
        professionalId={selectedProfessional}
      />
    </div>
  )
}

export default CalendarPage