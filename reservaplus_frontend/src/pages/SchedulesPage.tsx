import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Plus, 
  Edit3, 
  Copy, 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Grid3X3,
  List,
  Power,
  Eye
} from 'lucide-react'

import ScheduleModal from '../components/admin/ScheduleModal'
import DuplicateScheduleModal from '../components/admin/DuplicateScheduleModal'
import scheduleService from '../services/scheduleService'
import { 
  Professional, 
  ScheduleSummary, 
  ScheduleOverview,
  ProfessionalWithSchedule 
} from '../types/schedule'

type ViewMode = 'grid' | 'list'

const SchedulesPage: React.FC = () => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [schedules, setSchedules] = useState<ScheduleSummary[]>([])
  const [overview, setOverview] = useState<ScheduleOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleSummary | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_schedule' | 'without_schedule'>('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar datos en paralelo usando el servicio
      const [professionalsData, schedulesResponse, overviewData] = await Promise.all([
        scheduleService.getProfessionals(),
        scheduleService.getSchedules(),
        scheduleService.getOverview()
      ])

      setProfessionals(professionalsData)
      setSchedules(schedulesResponse.results || [])
      setOverview(overviewData)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = (professional: Professional) => {
    setSelectedProfessional(professional)
    setEditingSchedule(null)
    setIsScheduleModalOpen(true)
  }

  const handleEditSchedule = (schedule: ScheduleSummary) => {
    const professional = professionals.find(p => p.id === schedule.professional)
    if (professional) {
      setSelectedProfessional(professional)
      setEditingSchedule(schedule.id)
      setIsScheduleModalOpen(true)
    }
  }

  const handleDuplicateSchedule = (schedule: ScheduleSummary) => {
    setSelectedSchedule(schedule)
    setIsDuplicateModalOpen(true)
  }

  const handleScheduleModalClose = () => {
    setIsScheduleModalOpen(false)
    setSelectedProfessional(null)
    setEditingSchedule(null)
  }

  const handleDuplicateModalClose = () => {
    setIsDuplicateModalOpen(false)
    setSelectedSchedule(null)
  }

  const handleScheduleSaved = () => {
    loadData()
    handleScheduleModalClose()
  }

  const handleScheduleDuplicated = () => {
    loadData()
    handleDuplicateModalClose()
  }

  // Combinar datos de profesionales y horarios
  const getProfessionalWithSchedule = (): ProfessionalWithSchedule[] => {
    return professionals.map(professional => {
      const schedule = schedules.find(s => s.professional === professional.id)
      return {
        ...professional,
        schedule,
        hasSchedule: !!schedule,
        scheduleStatus: schedule?.is_active ? 'active' as const : schedule ? 'inactive' as const : 'none' as const
      }
    })
  }

  // Filtrar profesionales
  const filteredProfessionals = getProfessionalWithSchedule().filter(professional => {
    const matchesSearch = professional.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         professional.specialty?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'with_schedule' && professional.hasSchedule) ||
                         (statusFilter === 'without_schedule' && !professional.hasSchedule)

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando horarios...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md">
          <div className="flex items-center mb-4">
            <XCircle className="h-8 w-8 text-red-600 mr-3" />
            <h3 className="text-xl font-bold text-red-900">Error al cargar</h3>
          </div>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={loadData}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 py-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Horarios</h1>
              <p className="text-gray-600">Gestiona los horarios de trabajo de tu equipo</p>
            </div>
          </div>
        </div>

        {/* Quick Stats - Only 2 cards */}
        {overview && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-blue-600">
                    {overview.summary.total_professionals}
                  </h3>
                  <p className="text-blue-700 font-medium">Total Profesionales</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-bold text-green-600">
                    {overview.summary.active_schedules}
                  </h3>
                  <p className="text-green-700 font-medium">Horarios Activos</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and View Controls */}
        <div className="flex items-center justify-between space-x-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar profesionales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'with_schedule' | 'without_schedule')}
              className="border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="with_schedule">Con Horario</option>
              <option value="without_schedule">Sin Horario</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {filteredProfessionals.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {professionals.length === 0 ? 'No hay profesionales' : 'No se encontraron profesionales'}
              </h3>
              <p className="text-gray-600 mb-6">
                {professionals.length === 0 
                  ? 'Primero debes agregar profesionales a tu organización'
                  : 'Ajusta los filtros para ver más resultados'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
          } pt-6`}>
            {filteredProfessionals.map((professional) => (
              viewMode === 'grid' ? (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onCreateSchedule={handleCreateSchedule}
                  onEditSchedule={handleEditSchedule}
                  onDuplicateSchedule={handleDuplicateSchedule}
                />
              ) : (
                <ProfessionalRow
                  key={professional.id}
                  professional={professional}
                  onCreateSchedule={handleCreateSchedule}
                  onEditSchedule={handleEditSchedule}
                  onDuplicateSchedule={handleDuplicateSchedule}
                />
              )
            ))}
          </div>
        )}

      </div>

      {/* Modals */}
      {isScheduleModalOpen && selectedProfessional && (
        <ScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={handleScheduleModalClose}
          professional={selectedProfessional}
          scheduleId={editingSchedule}
          onSaved={handleScheduleSaved}
        />
      )}

      {isDuplicateModalOpen && selectedSchedule && (
        <DuplicateScheduleModal
          isOpen={isDuplicateModalOpen}
          onClose={handleDuplicateModalClose}
          sourceSchedule={selectedSchedule}
          professionals={professionals}
          onDuplicated={handleScheduleDuplicated}
        />
      )}
    </div>
  )
}

// Professional Card Component (Grid View)
interface ProfessionalCardProps {
  professional: Professional & { 
    schedule?: ScheduleSummary
    hasSchedule: boolean
    scheduleStatus: 'active' | 'inactive' | 'none'
  }
  onCreateSchedule: (professional: Professional) => void
  onEditSchedule: (schedule: ScheduleSummary) => void
  onDuplicateSchedule: (schedule: ScheduleSummary) => void
}

const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  professional,
  onCreateSchedule,
  onEditSchedule,
  onDuplicateSchedule
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusIcon = () => {
    switch (professional.scheduleStatus) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (professional.scheduleStatus) {
      case 'active':
        return 'Horario activo'
      case 'inactive':
        return 'Horario inactivo'
      default:
        return 'Sin horario'
    }
  }

  const getStatusColor = () => {
    switch (professional.scheduleStatus) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 hover:shadow-lg transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-lg font-medium text-white">
              {professional.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{professional.name}</h3>
            <p className="text-sm text-gray-600">{professional.email}</p>
            {professional.specialty && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-1">
                {professional.specialty}
              </span>
            )}
          </div>
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
              <button
                onClick={() => { /* TODO: Ver detalles */ setShowMenu(false) }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Ver detalles</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Info */}
      {professional.schedule && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{professional.schedule.active_days_count} días/semana</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{professional.schedule.total_weekly_hours}h semanales</span>
            </div>
          </div>
        </div>
      )}

      {/* Status and Actions */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
          getStatusColor()
        }`}>
          <span className={`w-2 h-2 rounded-full mr-2 ${
            professional.scheduleStatus === 'active' ? 'bg-green-500' : 
            professional.scheduleStatus === 'inactive' ? 'bg-red-500' : 'bg-gray-500'
          }`}></span>
          {getStatusText()}
        </span>
        
        <div className="flex items-center space-x-1">
          {professional.hasSchedule ? (
            <>
              <button
                onClick={() => onEditSchedule(professional.schedule!)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar horario"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDuplicateSchedule(professional.schedule!)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Duplicar horario"
              >
                <Copy className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onCreateSchedule(professional)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span>Crear Horario</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// Professional Row Component (List View)
interface ProfessionalRowProps {
  professional: Professional & { 
    schedule?: ScheduleSummary
    hasSchedule: boolean
    scheduleStatus: 'active' | 'inactive' | 'none'
  }
  onCreateSchedule: (professional: Professional) => void
  onEditSchedule: (schedule: ScheduleSummary) => void
  onDuplicateSchedule: (schedule: ScheduleSummary) => void
}

const ProfessionalRow: React.FC<ProfessionalRowProps> = ({
  professional,
  onCreateSchedule,
  onEditSchedule,
  onDuplicateSchedule
}) => {
  const [showMenu, setShowMenu] = useState(false)

  const getStatusText = () => {
    switch (professional.scheduleStatus) {
      case 'active':
        return 'Activo'
      case 'inactive':
        return 'Inactivo'
      default:
        return 'Sin horario'
    }
  }

  const getStatusColor = () => {
    switch (professional.scheduleStatus) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 p-4 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {professional.name.charAt(0)}
            </span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-1">
              <h3 className="font-medium text-gray-900 truncate">{professional.name}</h3>
              {professional.specialty && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {professional.specialty}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{professional.email}</span>
              
              {professional.schedule && (
                <>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{professional.schedule.active_days_count} días</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{professional.schedule.total_weekly_hours}h/sem</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            getStatusColor()
          }`}>
            {getStatusText()}
          </span>

          <div className="flex items-center space-x-1">
            {professional.hasSchedule ? (
              <>
                <button
                  onClick={() => onEditSchedule(professional.schedule!)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDuplicateSchedule(professional.schedule!)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onCreateSchedule(professional)}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>Crear</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 py-2 z-50">
                  <button
                    onClick={() => { /* TODO: Ver detalles */ setShowMenu(false) }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Eye className="h-4 w-4" />
                    <span>Ver detalles</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchedulesPage 