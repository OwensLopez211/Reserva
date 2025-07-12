import React, { useState } from 'react'
import { X, Copy, Users, CheckCircle, AlertCircle } from 'lucide-react'
import scheduleService from '../../services/scheduleService'
import { Professional, ScheduleSummary, DuplicateScheduleModalProps } from '../../types/schedule'

const DuplicateScheduleModal: React.FC<DuplicateScheduleModalProps> = ({
  isOpen,
  onClose,
  sourceSchedule,
  professionals,
  onDuplicated
}) => {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('')
  const [duplicating, setDuplicating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtrar profesionales que no tienen horarios o que no son el profesional fuente
  const availableProfessionals = professionals.filter(professional => 
    professional.id !== sourceSchedule.professional && professional.is_active
  )

  const handleDuplicate = async () => {
    if (!selectedProfessional) {
      setError('Selecciona un profesional de destino')
      return
    }

    try {
      setDuplicating(true)
      setError(null)

      await scheduleService.duplicateSchedule(sourceSchedule.id, {
        target_professional_id: selectedProfessional
      })

      onDuplicated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setDuplicating(false)
    }
  }

  const handleClose = () => {
    setSelectedProfessional('')
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Copy className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Duplicar Horario
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Copia el horario de {sourceSchedule.professional_name} a otro profesional
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Source Schedule Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Horario fuente:
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">{sourceSchedule.professional_name}</p>
                <div className="flex items-center space-x-4 text-sm text-blue-700 mt-1">
                  <span>{sourceSchedule.active_days_count} días/semana</span>
                  <span>{sourceSchedule.total_weekly_hours}h semanales</span>
                  <span>Slots de {sourceSchedule.slot_duration} min</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {sourceSchedule.is_active ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="text-sm text-blue-700">
                  {sourceSchedule.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>

          {/* Professional Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona el profesional de destino:
            </label>
            
            {availableProfessionals.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay profesionales disponibles
                </h3>
                <p className="text-gray-600">
                  Todos los profesionales activos ya tienen horarios configurados o no hay otros profesionales.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {availableProfessionals.map((professional) => (
                  <label
                    key={professional.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedProfessional === professional.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="professional"
                      value={professional.id}
                      checked={selectedProfessional === professional.id}
                      onChange={(e) => setSelectedProfessional(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{professional.name}</h4>
                          <p className="text-sm text-gray-600">{professional.email}</p>
                          {professional.specialty && (
                            <p className="text-sm text-gray-500">{professional.specialty}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-3 rounded-full bg-green-400"></div>
                          <span className="text-sm text-gray-500">Disponible</span>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Warning Message */}
          {selectedProfessional && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Importante
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Se copiará toda la configuración del horario fuente</li>
                      <li>Si el profesional ya tiene horario, será reemplazado</li>
                      <li>Se incluyen horarios semanales, descansos y excepciones</li>
                      <li>El nuevo horario estará activo por defecto</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDuplicate}
            disabled={!selectedProfessional || duplicating || availableProfessionals.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="h-4 w-4" />
            <span>
              {duplicating ? 'Duplicando...' : 'Duplicar Horario'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DuplicateScheduleModal 