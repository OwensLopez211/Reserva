import React, { useState, useEffect, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  RefreshCw,
  Filter,
  Calendar as CalendarIcon,
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
import AppointmentModal from '../appointments/AppointmentModal'

type ViewMode = 'week' | 'day' | 'list'

interface CalendarProps {
  className?: string
}

const Calendar: React.FC<CalendarProps> = ({ className = '' }) => {
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

  // Get appointments for specific slot
  const getAppointmentsForSlot = (day: Date, time: string) => {
    return filteredAppointments.filter(apt => {
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
    <div className="bg-white/95 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10 shadow-sm">
      {/* Desktop Header */}
      <div className="hidden lg:block px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {/* Navigation */}
            <div className="flex items-center space-x-1 bg-gray-50 rounded-xl p-1">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 hover:scale-105 text-gray-700 hover:text-indigo-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2.5 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 hover:scale-105 text-gray-700 hover:text-indigo-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Date Range */}
            <div className="flex items-center space-x-6">
              <div className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                {format(weekDays[0], 'd MMM', { locale: es })} - {format(weekDays[6], 'd MMM yyyy', { locale: es })}
              </div>
              {/* Current Time Display */}
              {getCurrentTimePosition() !== null && (
                <div className="flex items-center space-x-2 bg-gradient-to-r from-red-50 to-orange-50 px-3 py-2 rounded-full border border-red-200/60 shadow-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-red-700">
                    {format(currentTime, 'HH:mm')}
                  </span>
                </div>
              )}
            </div>
            
            <button
              onClick={goToToday}
              className="px-5 py-2.5 text-sm bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 hover:text-indigo-800 rounded-xl font-semibold transition-all duration-200 hover:scale-105 border border-indigo-200/60 shadow-sm hover:shadow-md"
            >
              Hoy
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar citas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-300 transition-all duration-200 w-64 bg-gray-50/50 hover:bg-white focus:bg-white shadow-sm"
              />
            </div>

            {/* Professional Filter */}
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <select
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-300 transition-all duration-200 bg-gray-50/50 hover:bg-white shadow-sm min-w-[180px]"
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
            <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode('week')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'week' 
                    ? 'bg-white text-indigo-600 shadow-md scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-md scale-105' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <button 
              onClick={loadAppointments}
              className="p-2.5 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md" 
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button 
              onClick={handleNewAppointment}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 flex items-center space-x-2 shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Cita</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Header */}
      <div className="lg:hidden px-4 py-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2.5 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/60"
            >
              <ChevronLeft className="h-5 w-5 text-gray-700" />
            </button>
            <div className="text-center">
              <div className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </div>
              <div className="text-xs text-gray-600 font-medium">
                {format(weekDays[0], 'd MMM', { locale: es })} - {format(weekDays[6], 'd MMM', { locale: es })}
              </div>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2.5 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200/60"
            >
              <ChevronRight className="h-5 w-5 text-gray-700" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-all duration-200 shadow-sm border ${
                showFilters 
                  ? 'bg-indigo-100 text-indigo-600 border-indigo-200' 
                  : 'bg-white/80 hover:bg-white text-gray-600 border-gray-200/60'
              }`}
            >
              <Filter className="h-5 w-5" />
            </button>
            <button 
              onClick={handleNewAppointment}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl flex items-center space-x-2 hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Nueva</span>
            </button>
          </div>
        </div>

        {/* Current Time for Mobile */}
        {getCurrentTimePosition() !== null && (
          <div className="mb-3">
            <div className="flex items-center justify-center space-x-3 bg-gradient-to-r from-red-50 to-orange-50 px-4 py-2.5 rounded-xl border border-red-200/60 shadow-sm">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-red-700">
                Hora actual: {format(currentTime, 'HH:mm')}
              </span>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                Ir a hoy
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Mobile Filters */}
        {showFilters && (
          <div className="space-y-3 p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200/60">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar citas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-300 bg-gray-50/50 focus:bg-white shadow-sm"
              />
            </div>
            
            <select
              value={selectedProfessional}
              onChange={(e) => setSelectedProfessional(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-300 bg-gray-50/50 focus:bg-white shadow-sm"
            >
              <option value="all">Todos los profesionales</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.full_name || `${prof.first_name || ''} ${prof.last_name || ''}`.trim() || prof.email || `Profesional ${prof.id.slice(0, 8)}`}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between">
              <div className="flex items-center bg-gray-100 rounded-xl p-1 shadow-sm">
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'week' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-600'
                  }`}
                >
                  Lista
                </button>
              </div>
              
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl font-medium border border-indigo-200/60 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Ir a Hoy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Week view component
  const WeekView = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden backdrop-blur-sm">
      {/* Desktop Week View */}
      <div className="hidden lg:block">
        {/* Enhanced Days Header */}
        <div className="grid grid-cols-8 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-gray-100/80">
          <div className="p-5 bg-gradient-to-br from-gray-100 to-gray-200/80 flex items-center justify-center">
            <CalendarIcon className="h-5 w-5 text-gray-500" />
          </div>
          {weekDays.map((day, index) => {
            const today = isToday(day)
            return (
              <div
                key={index}
                className={`p-5 text-center border-r border-gray-200/60 last:border-r-0 transition-all duration-300 relative ${
                  today 
                    ? 'bg-gradient-to-br from-indigo-100 via-purple-50 to-cyan-50 shadow-inner' 
                    : 'bg-gradient-to-br from-gray-50 to-gray-100/60 hover:from-gray-100 hover:to-gray-150'
                }`}
              >
                {/* Today indicator ring */}
                {today && (
                  <div className="absolute inset-0 border-2 border-indigo-300/60 rounded-none animate-pulse"></div>
                )}
                
                <div className={`text-sm font-semibold uppercase tracking-wide ${
                  today ? 'text-indigo-700' : 'text-gray-700'
                }`}>
                  {format(day, 'EEE', { locale: es })}
                </div>
                <div className={`text-xl font-bold mt-2 ${
                  today ? 'text-indigo-600' : 'text-gray-800'
                }`}>
                  {format(day, 'd')}
                </div>
                
                {/* Today badge */}
                {today && (
                  <div className="absolute top-2 right-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full shadow-lg animate-pulse"></div>
                  </div>
                )}
                
                {/* Day appointments count */}
                <div className={`text-xs mt-1 font-medium ${
                  today ? 'text-indigo-600' : 'text-gray-500'
                }`}>
                  {filteredAppointments.filter(apt => isSameDay(new Date(apt.start_datetime), day)).length} citas
                </div>
              </div>
            )
          })}
        </div>

        {/* Enhanced Time Grid */}
        <div className="relative bg-gradient-to-br from-gray-50/30 to-white">
          {/* Current Time Line - enhanced */}
          {getCurrentTimePosition() !== null && (
            <div 
              className="absolute left-0 right-0 z-30 pointer-events-none group"
              style={{ top: `${getCurrentTimePosition()}%` }}
              title={`Hora actual: ${format(currentTime, 'HH:mm:ss')} - ${format(currentTime, 'EEEE, d MMMM yyyy', { locale: es })}`}
            >
              <div className="flex items-center">
                {/* Enhanced time label */}
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-4 py-2 rounded-l-xl font-bold min-w-[80px] text-center shadow-xl animate-pulse group-hover:animate-none transition-all border border-red-400">
                  {format(currentTime, 'HH:mm')}
                </div>
                {/* Enhanced red line with better glow */}
                <div className="flex-1 h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-700 shadow-xl group-hover:h-2 transition-all" 
                     style={{ 
                       boxShadow: '0 0 15px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)' 
                     }}>
                </div>
                {/* Enhanced arrow indicator */}
                <div className="relative">
                  <div className="w-0 h-0 border-l-[10px] border-r-0 border-t-[10px] border-b-[10px] border-l-red-500 border-t-transparent border-b-transparent group-hover:border-l-[12px] group-hover:border-t-[12px] group-hover:border-b-[12px] transition-all shadow-lg"></div>
                  {/* Enhanced pulsing dot */}
                  <div className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-red-400 rounded-full animate-ping group-hover:w-4 group-hover:h-4 group-hover:-right-2 group-hover:-top-2 transition-all shadow-lg"></div>
                </div>
              </div>
              {/* Enhanced background highlight */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-orange-50 opacity-30 -z-10 group-hover:opacity-50 transition-opacity blur-sm" style={{ height: '8px', top: '50%', marginTop: '-4px' }}></div>
            </div>
          )}

          {/* Enhanced time slots grid */}
          <div className="grid" style={{ height: 'calc(100vh - 320px)', gridTemplateRows: `repeat(${timeSlots.length}, 1fr)` }}>
            {timeSlots.map((time) => (
              <div key={time} className="grid grid-cols-8 border-b border-gray-100/80 last:border-b-0 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-indigo-50/30 transition-all duration-200 relative group">
                {/* Enhanced time column */}
                <div className="p-4 bg-gradient-to-br from-gray-100/80 to-gray-150/60 border-r border-gray-200/60 flex items-center justify-center group-hover:from-gray-150 group-hover:to-gray-200/80 transition-all">
                  <span className="text-sm text-gray-700 font-semibold tracking-wide">{time}</span>
                </div>

                {weekDays.map((day, dayIndex) => {
                  const appointments = getAppointmentsForSlot(day, time)
                  const isCurrentDay = isToday(day)
                  
                  return (
                    <div
                      key={`${time}-${dayIndex}`}
                      className={`p-2.5 border-r border-gray-200/60 last:border-r-0 relative cursor-pointer transition-all duration-300 hover:bg-gradient-to-br hover:from-indigo-50/60 hover:to-purple-50/40 flex flex-col gap-1 min-h-[60px] ${
                        isCurrentDay ? 'bg-gradient-to-br from-indigo-50/40 to-purple-50/30 border-l-2 border-l-indigo-300/60' : ''
                      }`}
                      onClick={() => handleCreateAppointment(day, time)}
                    >
                      {/* Current day time column highlight */}
                      {isCurrentDay && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-500 rounded-r-full opacity-60"></div>
                      )}
                      
                      {appointments.length > 0 ? (
                        appointments.map((appointment, index) => (
                          <div 
                            key={appointment.id}
                            className={`${getAppointmentColor(appointment.status)} text-white p-2 rounded-lg cursor-pointer hover:scale-105 transition-all duration-300 shadow-md hover:shadow-lg w-full backdrop-blur-sm border border-white/20 ${
                              appointments.length > 1 ? 'mb-1 last:mb-0' : ''
                            } ${
                              appointments.length > 1 && index > 0 ? 'opacity-90' : ''
                            }`}
                            style={{
                              zIndex: appointments.length - index,
                              fontSize: appointments.length > 1 ? '0.75rem' : '0.875rem'
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditAppointment(appointment)
                            }}
                          >
                            <div className="font-semibold truncate text-xs">{appointment.client_name}</div>
                            <div className="opacity-90 truncate mt-1" style={{ fontSize: '0.65rem' }}>{appointment.service_name}</div>
                            <div className="flex items-center mt-1 opacity-90">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              <span style={{ fontSize: '0.6rem' }} className="font-medium">{appointment.duration_minutes}min</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Empty slot with subtle hover indication
                        <div className="w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                          <Plus className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Multiple appointments indicator */}
                      {appointments.length > 1 && (
                        <div className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                          {appointments.length}
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

      {/* Enhanced Mobile Week View */}
      <div className="lg:hidden bg-gradient-to-br from-gray-50/50 to-white">
        {/* Mobile Week Days Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/60 border-b border-gray-200/60">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const today = isToday(day)
              const dayAppointments = filteredAppointments.filter(apt => isSameDay(new Date(apt.start_datetime), day))
              
              return (
                <div
                  key={index}
                  className={`p-3 text-center rounded-xl border transition-all duration-300 ${
                    today 
                      ? 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-300/60 shadow-md' 
                      : 'bg-white/80 border-gray-200/60 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className={`text-xs font-semibold uppercase tracking-wide ${
                    today ? 'text-indigo-700' : 'text-gray-600'
                  }`}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={`text-lg font-bold mt-1 ${
                    today ? 'text-indigo-600' : 'text-gray-800'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {/* Appointment count indicator */}
                  {dayAppointments.length > 0 && (
                    <div className={`text-xs mt-1 px-1.5 py-0.5 rounded-full ${
                      today 
                        ? 'bg-indigo-200 text-indigo-700' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {dayAppointments.length}
                    </div>
                  )}
                  
                  {/* Today indicator */}
                  {today && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Mobile appointments list */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {weekDays.map((day, dayIndex) => {
            const dayAppointments = filteredAppointments.filter(apt => isSameDay(new Date(apt.start_datetime), day))
            const today = isToday(day)
            
            if (dayAppointments.length === 0) return null
            
            return (
              <div key={dayIndex} className="space-y-3">
                {/* Day header */}
                <div className={`flex items-center space-x-3 p-3 rounded-xl border ${
                  today 
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200/60' 
                    : 'bg-gray-50/80 border-gray-200/60'
                }`}>
                  <div className={`w-3 h-3 rounded-full ${
                    today ? 'bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse' : 'bg-gray-400'
                  }`}></div>
                  <div className={`font-semibold ${
                    today ? 'text-indigo-700' : 'text-gray-700'
                  }`}>
                    {format(day, 'EEEE, d MMMM', { locale: es })}
                  </div>
                  {today && (
                    <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
                      Hoy
                    </span>
                  )}
                </div>
                
                {/* Day appointments */}
                <div className="space-y-2">
                  {dayAppointments
                    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
                    .map(appointment => (
                      <div
                        key={appointment.id}
                        className={`${getAppointmentColor(appointment.status)} text-white p-4 rounded-xl cursor-pointer transform hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm border border-white/20`}
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-base">{appointment.client_name}</div>
                          <div className="text-sm opacity-90 font-medium">
                            {format(new Date(appointment.start_datetime), 'HH:mm')}
                          </div>
                        </div>
                        <div className="text-sm opacity-90 mb-2">{appointment.service_name}</div>
                        <div className="flex items-center justify-between text-xs opacity-90">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{appointment.duration_minutes} min</span>
                          </div>
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span>{appointment.professional_name}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )
          })}
          
          {/* No appointments message */}
          {weekDays.every(day => 
            filteredAppointments.filter(apt => isSameDay(new Date(apt.start_datetime), day)).length === 0
          ) && (
            <div className="text-center py-12">
              <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No hay citas esta semana</p>
              <p className="text-gray-400 text-sm mt-2">Toca el botón "Nueva" para crear una cita</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Enhanced List view component
  const ListView = () => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden backdrop-blur-sm">
      <div className="p-6 bg-gradient-to-r from-gray-50/80 to-gray-100/60 border-b border-gray-200/60">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Citas de la Semana
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {format(weekDays[0], 'd MMM', { locale: es })} - {format(weekDays[6], 'd MMM yyyy', { locale: es })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{filteredAppointments.length}</span> citas
            </div>
            {getCurrentTimePosition() !== null && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-red-50 to-orange-50 px-3 py-1.5 rounded-full border border-red-200/60 shadow-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-semibold text-red-700">
                  {format(currentTime, 'HH:mm')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16">
            <CalendarIcon className="h-20 w-20 text-gray-300 mx-auto mb-6" />
            <h4 className="text-xl font-semibold text-gray-900 mb-2">No hay citas programadas</h4>
            <p className="text-gray-500 mb-6">Esta semana está libre. ¡Perfecto para planificar nuevas citas!</p>
            <button 
              onClick={handleNewAppointment}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 hover:scale-105 flex items-center space-x-2 shadow-lg mx-auto font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Primera Cita</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group appointments by day */}
            {weekDays.map(day => {
              const dayAppointments = filteredAppointments
                .filter(apt => isSameDay(new Date(apt.start_datetime), day))
                .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
              
              if (dayAppointments.length === 0) return null
              
              const today = isToday(day)
              
              return (
                <div key={day.toISOString()} className="space-y-3">
                  {/* Day Header */}
                  <div className={`flex items-center space-x-3 p-4 rounded-xl border-l-4 ${
                    today 
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-indigo-500' 
                      : 'bg-gray-50/80 border-l-gray-300'
                  }`}>
                    <div className={`w-3 h-3 rounded-full ${
                      today ? 'bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <div>
                      <div className={`font-bold text-lg ${
                        today ? 'text-indigo-700' : 'text-gray-800'
                      }`}>
                        {format(day, 'EEEE, d MMMM', { locale: es })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {dayAppointments.length} cita{dayAppointments.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {today && (
                      <span className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full font-semibold">
                        Hoy
                      </span>
                    )}
                  </div>
                  
                  {/* Day Appointments */}
                  <div className="space-y-3 ml-6">
                    {dayAppointments.map(appointment => (
                      <div
                        key={appointment.id}
                        className="border border-gray-200/60 rounded-xl p-5 hover:border-indigo-300/60 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-gradient-to-r from-white to-gray-50/30 backdrop-blur-sm"
                        onClick={() => handleEditAppointment(appointment)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {/* Appointment Header */}
                            <div className="flex items-center space-x-4 mb-3">
                              <div className={`w-4 h-4 rounded-full shadow-lg ${getAppointmentColor(appointment.status)}`}></div>
                              <h4 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                                {appointment.client_name}
                              </h4>
                              <div className="flex items-center space-x-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm font-semibold">
                                  {format(new Date(appointment.start_datetime), 'HH:mm')} - {format(new Date(appointment.end_datetime), 'HH:mm')}
                                </span>
                              </div>
                            </div>
                            
                            {/* Appointment Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-lg">
                                <User className="h-5 w-5 text-indigo-500" />
                                <div>
                                  <div className="font-medium text-gray-900">{appointment.professional_name}</div>
                                  <div className="text-gray-500">Profesional</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-lg">
                                <Clock className="h-5 w-5 text-purple-500" />
                                <div>
                                  <div className="font-medium text-gray-900">{appointment.service_name}</div>
                                  <div className="text-gray-500">{appointment.duration_minutes} minutos</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3 p-3 bg-gray-50/80 rounded-lg">
                                <div className={`w-3 h-3 rounded-full ${getAppointmentColor(appointment.status)}`}></div>
                                <div>
                                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                    appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    appointment.status === 'checked_in' ? 'bg-purple-100 text-purple-800' :
                                    appointment.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {appointmentService.getStatusText(appointment.status)}
                                  </div>
                                  <div className="text-gray-500 text-xs mt-1">Estado</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button className="p-3 hover:bg-indigo-50 rounded-xl transition-all duration-200 group-hover:scale-110">
                            <MoreVertical className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // Loading state
  if (loading && appointments.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/60 relative overflow-hidden ${className}`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-100/30 to-blue-100/30 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <CalendarHeader />

        {/* Enhanced Error Alert */}
        {error && (
          <div className="mx-4 lg:mx-6 mt-4">
            <div className="bg-gradient-to-r from-red-50 to-red-100/60 border border-red-200/60 text-red-800 px-5 py-4 rounded-xl shadow-lg backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <X className="h-3 w-3 text-white" />
                </div>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Professional Selection Alert */}
        {showProfessionalAlert && (
          <div className="mx-4 lg:mx-6 mt-4">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/60 text-amber-800 px-5 py-4 rounded-xl flex items-center space-x-4 shadow-lg backdrop-blur-sm animate-slideIn">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Selecciona un profesional</p>
                <p className="text-sm text-amber-700">Para crear una nueva cita, primero selecciona un profesional específico en el filtro superior.</p>
              </div>
              <button
                onClick={() => setShowProfessionalAlert(false)}
                className="flex-shrink-0 p-2 hover:bg-amber-100 rounded-full transition-all duration-200"
              >
                <X className="h-4 w-4 text-amber-600" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="p-4 lg:p-6">
          {viewMode === 'week' ? <WeekView /> : <ListView />}
          
          {/* Enhanced Status Legend */}
          <div className="mt-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Estados de Citas</h4>
                <div className="flex flex-wrap items-center gap-4">
                  {[
                    { status: 'confirmed', label: 'Confirmada', color: 'bg-gradient-to-r from-blue-500 to-blue-600', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
                    { status: 'pending', label: 'Pendiente', color: 'bg-gradient-to-r from-amber-500 to-orange-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
                    { status: 'completed', label: 'Completada', color: 'bg-gradient-to-r from-green-500 to-emerald-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
                    { status: 'cancelled', label: 'Cancelada', color: 'bg-gradient-to-r from-red-500 to-red-600', textColor: 'text-red-700', bgColor: 'bg-red-50' },
                    { status: 'checked_in', label: 'Cliente Llegó', color: 'bg-gradient-to-r from-purple-500 to-purple-600', textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
                    { status: 'in_progress', label: 'En Proceso', color: 'bg-gradient-to-r from-orange-500 to-red-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' }
                  ].map(({ status, label, color, textColor, bgColor }) => (
                    <div key={status} className={`flex items-center space-x-3 px-3 py-2 ${bgColor} rounded-lg transition-all duration-200 hover:scale-105`}>
                      <div className={`w-3 h-3 ${color} rounded-full shadow-sm`}></div>
                      <span className={`text-sm font-medium ${textColor}`}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {loading ? (
                  <div className="flex items-center space-x-3 px-4 py-2 bg-indigo-50 rounded-lg">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-700">Actualizando...</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {filteredAppointments.length}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      cita{filteredAppointments.length !== 1 ? 's' : ''} encontrada{filteredAppointments.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                )}
                
                {/* Quick stats */}
                <div className="hidden lg:flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {filteredAppointments.filter(apt => apt.status === 'completed').length}
                    </div>
                    <div className="text-xs text-gray-600">Completadas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {filteredAppointments.filter(apt => apt.status === 'pending').length}
                    </div>
                    <div className="text-xs text-gray-600">Pendientes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {filteredAppointments.filter(apt => apt.status === 'confirmed').length}
                    </div>
                    <div className="text-xs text-gray-600">Confirmadas</div>
                  </div>
                </div>
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
    </div>
  )
}

export default Calendar