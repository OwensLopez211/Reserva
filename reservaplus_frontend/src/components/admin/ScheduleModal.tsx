import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Calendar } from 'lucide-react'
import scheduleService from '../../services/scheduleService'
import { 
  WeeklySchedule, 
  ScheduleBreak, 
  ScheduleException, 
  ScheduleData,
  ScheduleModalProps,
  WEEKDAYS,
  EXCEPTION_TYPES
} from '../../types/schedule'



const ScheduleModal: React.FC<ScheduleModalProps> = ({
  isOpen,
  onClose,
  professional,
  scheduleId,
  onSaved
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'weekly' | 'exceptions'>('general')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    professional: professional.id,
    timezone: 'America/Santiago',
    min_booking_notice: 60,
    max_booking_advance: 10080,
    slot_duration: 30,
    is_active: true,
    accepts_bookings: true,
    weekly_schedules: [],
    exceptions: []
  })

  useEffect(() => {
    if (isOpen) {
      if (scheduleId) {
        loadSchedule()
      } else {
        // Reset to default values for new schedule
        setScheduleData({
          professional: professional.id,
          timezone: 'America/Santiago',
          min_booking_notice: 60,
          max_booking_advance: 10080,
          slot_duration: 30,
          is_active: true,
          accepts_bookings: true,
          weekly_schedules: [],
          exceptions: []
        })
      }
      setActiveTab('general')
      setError(null)
    }
  }, [isOpen, scheduleId, professional.id])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await scheduleService.getSchedule(scheduleId!)
      setScheduleData({
        professional: data.professional,
        timezone: data.timezone,
        min_booking_notice: data.min_booking_notice,
        max_booking_advance: data.max_booking_advance,
        slot_duration: data.slot_duration,
        is_active: data.is_active,
        accepts_bookings: data.accepts_bookings,
        weekly_schedules: data.weekly_schedules || [],
        exceptions: data.exceptions || []
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      if (scheduleId) {
        await scheduleService.updateSchedule(scheduleId, scheduleData)
      } else {
        await scheduleService.createSchedule(scheduleData)
      }

      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  const addWeeklySchedule = () => {
    setScheduleData(prev => ({
      ...prev,
      weekly_schedules: [
        ...prev.weekly_schedules,
        {
          weekday: 0,
          start_time: '09:00',
          end_time: '18:00',
          is_active: true,
          breaks: []
        }
      ]
    }))
  }

  const updateWeeklySchedule = (index: number, updates: Partial<WeeklySchedule>) => {
    setScheduleData(prev => ({
      ...prev,
      weekly_schedules: prev.weekly_schedules.map((schedule, i) => 
        i === index ? { ...schedule, ...updates } : schedule
      )
    }))
  }

  const removeWeeklySchedule = (index: number) => {
    setScheduleData(prev => ({
      ...prev,
      weekly_schedules: prev.weekly_schedules.filter((_, i) => i !== index)
    }))
  }

  const addBreak = (scheduleIndex: number) => {
    setScheduleData(prev => ({
      ...prev,
      weekly_schedules: prev.weekly_schedules.map((schedule, i) => 
        i === scheduleIndex 
          ? {
              ...schedule,
              breaks: [
                ...schedule.breaks,
                {
                  start_time: '12:00',
                  end_time: '13:00',
                  name: 'Almuerzo',
                  is_active: true
                }
              ]
            }
          : schedule
      )
    }))
  }

  const updateBreak = (scheduleIndex: number, breakIndex: number, updates: Partial<ScheduleBreak>) => {
    setScheduleData(prev => ({
      ...prev,
      weekly_schedules: prev.weekly_schedules.map((schedule, i) => 
        i === scheduleIndex 
          ? {
              ...schedule,
              breaks: schedule.breaks.map((breakItem, j) => 
                j === breakIndex ? { ...breakItem, ...updates } : breakItem
              )
            }
          : schedule
      )
    }))
  }

  const removeBreak = (scheduleIndex: number, breakIndex: number) => {
    setScheduleData(prev => ({
      ...prev,
      weekly_schedules: prev.weekly_schedules.map((schedule, i) => 
        i === scheduleIndex 
          ? {
              ...schedule,
              breaks: schedule.breaks.filter((_, j) => j !== breakIndex)
            }
          : schedule
      )
    }))
  }

  const addException = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    setScheduleData(prev => ({
      ...prev,
      exceptions: [
        ...prev.exceptions,
        {
          date: tomorrow.toISOString().split('T')[0],
          exception_type: 'unavailable',
          reason: '',
          is_active: true
        }
      ]
    }))
  }

  const updateException = (index: number, updates: Partial<ScheduleException>) => {
    setScheduleData(prev => ({
      ...prev,
      exceptions: prev.exceptions.map((exception, i) => 
        i === index ? { ...exception, ...updates } : exception
      )
    }))
  }

  const removeException = (index: number) => {
    setScheduleData(prev => ({
      ...prev,
      exceptions: prev.exceptions.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {scheduleId ? 'Editar Horario' : 'Crear Horario'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {professional.name} - {professional.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Configuración General
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'weekly'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Horarios Semanales
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'exceptions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Excepciones
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <>
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona Horaria
                      </label>
                      <select
                        value={scheduleData.timezone}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="America/Santiago">América/Santiago</option>
                        <option value="America/Argentina/Buenos_Aires">América/Buenos Aires</option>
                        <option value="America/Lima">América/Lima</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración de Slots (minutos)
                      </label>
                      <select
                        value={scheduleData.slot_duration}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, slot_duration: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>60 minutos</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiempo mínimo de anticipación (minutos)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={scheduleData.min_booking_notice}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, min_booking_notice: Number(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tiempo máximo de anticipación (días)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={Math.round(scheduleData.max_booking_advance / 1440)}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, max_booking_advance: Number(e.target.value) * 1440 }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scheduleData.is_active}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, is_active: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Horario activo</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scheduleData.accepts_bookings}
                        onChange={(e) => setScheduleData(prev => ({ ...prev, accepts_bookings: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Acepta reservas</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Weekly Schedules Tab */}
              {activeTab === 'weekly' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Horarios Semanales</h3>
                    <button
                      onClick={addWeeklySchedule}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Día</span>
                    </button>
                  </div>

                  {scheduleData.weekly_schedules.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay horarios configurados</h3>
                      <p className="text-gray-600 mb-4">Agrega horarios para cada día de la semana</p>
                      <button
                        onClick={addWeeklySchedule}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Agregar primer día
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduleData.weekly_schedules.map((schedule, index) => (
                        <WeeklyScheduleForm
                          key={index}
                          schedule={schedule}
                          onUpdate={(updates) => updateWeeklySchedule(index, updates)}
                          onRemove={() => removeWeeklySchedule(index)}
                          onAddBreak={() => addBreak(index)}
                          onUpdateBreak={(breakIndex, updates) => updateBreak(index, breakIndex, updates)}
                          onRemoveBreak={(breakIndex) => removeBreak(index, breakIndex)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Exceptions Tab */}
              {activeTab === 'exceptions' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Excepciones</h3>
                    <button
                      onClick={addException}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Agregar Excepción</span>
                    </button>
                  </div>

                  {scheduleData.exceptions.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay excepciones configuradas</h3>
                      <p className="text-gray-600 mb-4">Agrega excepciones para días específicos</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {scheduleData.exceptions.map((exception, index) => (
                        <ExceptionForm
                          key={index}
                          exception={exception}
                          onUpdate={(updates) => updateException(index, updates)}
                          onRemove={() => removeException(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente para formulario de horario semanal
interface WeeklyScheduleFormProps {
  schedule: WeeklySchedule
  onUpdate: (updates: Partial<WeeklySchedule>) => void
  onRemove: () => void
  onAddBreak: () => void
  onUpdateBreak: (breakIndex: number, updates: Partial<ScheduleBreak>) => void
  onRemoveBreak: (breakIndex: number) => void
}

const WeeklyScheduleForm: React.FC<WeeklyScheduleFormProps> = ({
  schedule,
  onUpdate,
  onRemove,
  onAddBreak,
  onUpdateBreak,
  onRemoveBreak
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <select
            value={schedule.weekday}
            onChange={(e) => onUpdate({ weekday: Number(e.target.value) })}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {WEEKDAYS.map(day => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2">
            <input
              type="time"
              value={schedule.start_time}
              onChange={(e) => onUpdate({ start_time: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">-</span>
            <input
              type="time"
              value={schedule.end_time}
              onChange={(e) => onUpdate({ end_time: e.target.value })}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={schedule.is_active}
              onChange={(e) => onUpdate({ is_active: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Activo</span>
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onAddBreak}
            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Agregar descanso"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Eliminar día"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Breaks */}
      {schedule.breaks.length > 0 && (
        <div className="space-y-2 ml-4">
          <h4 className="text-sm font-medium text-gray-700">Descansos:</h4>
          {schedule.breaks.map((breakItem, breakIndex) => (
            <div key={breakIndex} className="flex items-center space-x-2 text-sm">
              <input
                type="text"
                value={breakItem.name}
                onChange={(e) => onUpdateBreak(breakIndex, { name: e.target.value })}
                placeholder="Nombre del descanso"
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="time"
                value={breakItem.start_time}
                onChange={(e) => onUpdateBreak(breakIndex, { start_time: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-gray-400">-</span>
              <input
                type="time"
                value={breakItem.end_time}
                onChange={(e) => onUpdateBreak(breakIndex, { end_time: e.target.value })}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => onRemoveBreak(breakIndex)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente para formulario de excepciones
interface ExceptionFormProps {
  exception: ScheduleException
  onUpdate: (updates: Partial<ScheduleException>) => void
  onRemove: () => void
}

const ExceptionForm: React.FC<ExceptionFormProps> = ({
  exception,
  onUpdate,
  onRemove
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            value={exception.date}
            onChange={(e) => onUpdate({ date: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={exception.exception_type}
            onChange={(e) => onUpdate({ exception_type: e.target.value as 'unavailable' | 'vacation' | 'sick_leave' | 'special_hours' | 'holiday' })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EXCEPTION_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {exception.exception_type === 'special_hours' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
              <input
                type="time"
                value={exception.start_time || ''}
                onChange={(e) => onUpdate({ start_time: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
              <input
                type="time"
                value={exception.end_time || ''}
                onChange={(e) => onUpdate({ end_time: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
          <input
            type="text"
            value={exception.reason}
            onChange={(e) => onUpdate({ reason: e.target.value })}
            placeholder="Motivo de la excepción"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {exception.notes !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={exception.notes}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Notas adicionales"
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={exception.is_active}
            onChange={(e) => onUpdate({ is_active: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Activo</span>
        </label>

        <button
          onClick={onRemove}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span className="text-sm">Eliminar</span>
        </button>
      </div>
    </div>
  )
}

export default ScheduleModal 