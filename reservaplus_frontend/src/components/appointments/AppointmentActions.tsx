import React, { useState } from 'react'
import { 
  Check, 
  X, 
  UserCheck, 
  Play, 
  CheckCircle, 
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react'
import appointmentService, { Appointment } from '../../services/appointmentService'

interface AppointmentActionsProps {
  appointment: Appointment
  onUpdate: (appointment: Appointment) => void
  compact?: boolean
}

const AppointmentActions: React.FC<AppointmentActionsProps> = ({
  appointment,
  onUpdate,
  compact = false
}) => {
  const [loading, setLoading] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)

  const handleAction = async (action: 'confirm' | 'cancel' | 'check_in' | 'start' | 'complete' | 'no_show', reason?: string) => {
    setLoading(true)
    try {
      let updatedAppointment: Appointment

      switch (action) {
        case 'confirm':
          updatedAppointment = await appointmentService.confirmAppointment(appointment.id)
          break
        case 'cancel':
          updatedAppointment = await appointmentService.cancelAppointment(appointment.id, reason)
          break
        case 'check_in':
          updatedAppointment = await appointmentService.checkInAppointment(appointment.id)
          break
        case 'start':
          updatedAppointment = await appointmentService.startService(appointment.id)
          break
        case 'complete':
          updatedAppointment = await appointmentService.completeAppointment(appointment.id)
          break
        case 'no_show':
          updatedAppointment = await appointmentService.markNoShow(appointment.id)
          break
        default:
          return
      }

      onUpdate(updatedAppointment)
    } catch (error) {
      console.error('Error updating appointment:', error)
      alert('Error al actualizar la cita')
    } finally {
      setLoading(false)
      setShowMoreActions(false)
    }
  }

  const handleCancelWithReason = () => {
    const reason = prompt('Razón de cancelación (opcional):')
    if (reason !== null) {
      handleAction('cancel', reason)
    }
  }

  const getAvailableActions = () => {
    const actions = []

    switch (appointment.status) {
      case 'pending':
        actions.push(
          {
            key: 'confirm',
            label: 'Confirmar',
            icon: Check,
            color: 'bg-green-500 hover:bg-green-600',
            onClick: () => handleAction('confirm')
          },
          {
            key: 'cancel',
            label: 'Cancelar',
            icon: X,
            color: 'bg-red-500 hover:bg-red-600',
            onClick: handleCancelWithReason
          }
        )
        break

      case 'confirmed':
        actions.push(
          {
            key: 'check_in',
            label: 'Check-in',
            icon: UserCheck,
            color: 'bg-blue-500 hover:bg-blue-600',
            onClick: () => handleAction('check_in')
          },
          {
            key: 'cancel',
            label: 'Cancelar',
            icon: X,
            color: 'bg-red-500 hover:bg-red-600',
            onClick: handleCancelWithReason
          }
        )
        break

      case 'checked_in':
        actions.push(
          {
            key: 'start',
            label: 'Iniciar',
            icon: Play,
            color: 'bg-orange-500 hover:bg-orange-600',
            onClick: () => handleAction('start')
          },
          {
            key: 'no_show',
            label: 'No Show',
            icon: AlertTriangle,
            color: 'bg-gray-500 hover:bg-gray-600',
            onClick: () => handleAction('no_show')
          }
        )
        break

      case 'in_progress':
        actions.push(
          {
            key: 'complete',
            label: 'Completar',
            icon: CheckCircle,
            color: 'bg-green-500 hover:bg-green-600',
            onClick: () => handleAction('complete')
          }
        )
        break

      case 'completed':
      case 'cancelled':
      case 'no_show':
        // No hay acciones disponibles para estos estados
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

  if (availableActions.length === 0) {
    return null
  }

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMoreActions(!showMoreActions)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          disabled={loading}
        >
          <MoreHorizontal className="h-4 w-4 text-gray-500" />
        </button>

        {showMoreActions && (
          <div className="absolute right-0 top-8 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-10">
            {availableActions.map((action) => (
              <button
                key={action.key}
                onClick={action.onClick}
                disabled={loading}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 disabled:opacity-50"
              >
                <action.icon className="h-4 w-4 text-gray-500" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {availableActions.map((action) => (
        <button
          key={action.key}
          onClick={action.onClick}
          disabled={loading}
          className={`px-3 py-1 text-xs font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 ${action.color}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
          ) : (
            <action.icon className="h-3 w-3" />
          )}
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  )
}

export default AppointmentActions 