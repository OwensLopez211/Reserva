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
  MoreVertical
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
      <div className="animate-fadeIn p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg border">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-fadeIn p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-900">Error al cargar los datos</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={loadData}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurar Horarios</h1>
          <p className="mt-2 text-gray-600">
            Gestiona los horarios de trabajo y disponibilidad de tu equipo
          </p>
        </div>

        {/* Statistics Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {overview.summary.total_professionals}
                  </h3>
                  <p className="text-sm text-gray-600">Total Profesionales</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {overview.summary.professionals_with_schedule}
                  </h3>
                  <p className="text-sm text-gray-600">Con Horario</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {overview.summary.active_schedules}
                  </h3>
                  <p className="text-sm text-gray-600">Activos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {overview.summary.completion_rate}%
                  </h3>
                  <p className="text-sm text-gray-600">Completado</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'with_schedule' | 'without_schedule')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="with_schedule">Con Horario</option>
                <option value="without_schedule">Sin Horario</option>
              </select>
            </div>
          </div>
        </div>

        {/* Professionals List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Profesionales ({filteredProfessionals.length})
            </h2>
          </div>

          {filteredProfessionals.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron profesionales
              </h3>
              <p className="text-gray-600">
                Ajusta los filtros para ver más resultados
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProfessionals.map((professional) => (
                <ProfessionalRow
                  key={professional.id}
                  professional={professional}
                  onCreateSchedule={handleCreateSchedule}
                  onEditSchedule={handleEditSchedule}
                  onDuplicateSchedule={handleDuplicateSchedule}
                />
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
    </div>
  )
}

// Componente para cada fila de profesional
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
        return 'text-green-600 bg-green-50'
      case 'inactive':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-lg font-medium text-white">
              {professional.name.charAt(0)}
            </span>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {professional.name}
            </h3>
            <p className="text-sm text-gray-600">{professional.email}</p>
            {professional.specialty && (
              <p className="text-sm text-gray-500">{professional.specialty}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Status Badge */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </div>

          {/* Schedule Info */}
          {professional.schedule && (
            <div className="hidden md:block text-right">
              <p className="text-sm text-gray-900">
                {professional.schedule.active_days_count} días/semana
              </p>
              <p className="text-sm text-gray-600">
                {professional.schedule.total_weekly_hours}h semanales
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {professional.hasSchedule ? (
              <>
                <button
                  onClick={() => onEditSchedule(professional.schedule!)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title="Editar horario"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDuplicateSchedule(professional.schedule!)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  title="Duplicar horario"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onCreateSchedule(professional)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Horario</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        // TODO: Implementar ver detalles
                        setShowMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Ver detalles
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implementar exportar
                        setShowMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Exportar horario
                    </button>
                  </div>
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