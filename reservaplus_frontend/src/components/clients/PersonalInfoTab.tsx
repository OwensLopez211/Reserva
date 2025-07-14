import React, { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Shield,
  Bell,
  MessageSquare,
  Edit,
  Save,
  X,
  AlertCircle,
  Check
} from 'lucide-react'
import { Client } from '../../services/clientService'
import clientService from '../../services/clientService'

interface PersonalInfoTabProps {
  client: Client
  onClientUpdate: (client: Client) => void
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ client, onClientUpdate }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedClient, setEditedClient] = useState<Partial<Client>>(client)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleEdit = () => {
    setIsEditing(true)
    setEditedClient(client)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedClient(client)
    setError(null)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      
      const updatedClient = await clientService.updateClient(client.id, editedClient)
      onClientUpdate(updatedClient)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating client:', error)
      setError('Error al actualizar la información del cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof Client, value: any) => {
    setEditedClient(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const InfoSection: React.FC<{
    title: string
    icon: React.ComponentType<{ className?: string }>
    children: React.ReactNode
  }> = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Icon className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  )

  const InfoField: React.FC<{
    label: string
    value: string | boolean | null
    field?: keyof Client
    type?: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'checkbox'
    placeholder?: string
  }> = ({ label, value, field, type = 'text', placeholder }) => {
    if (!isEditing) {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
          <div className="text-gray-900">
            {type === 'checkbox' ? (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {value ? 'Sí' : 'No'}
              </span>
            ) : (
              value || 'No especificado'
            )}
          </div>
        </div>
      )
    }

    if (type === 'textarea') {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
          <textarea
            value={editedClient[field as keyof Client] as string || ''}
            onChange={(e) => field && handleInputChange(field, e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )
    }

    if (type === 'checkbox') {
      return (
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={editedClient[field as keyof Client] as boolean || false}
              onChange={(e) => field && handleInputChange(field, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">{label}</label>
          </div>
        </div>
      )
    }

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          value={editedClient[field as keyof Client] as string || ''}
          onChange={(e) => field && handleInputChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex justify-end space-x-3">
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Editar Información</span>
          </button>
        ) : (
          <>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Cancelar</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <InfoSection title="Información Básica" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              label="Nombre"
              value={client.first_name}
              field="first_name"
              placeholder="Ingrese el nombre"
            />
            <InfoField
              label="Apellido"
              value={client.last_name}
              field="last_name"
              placeholder="Ingrese el apellido"
            />
          </div>
          <InfoField
            label="Fecha de Nacimiento"
            value={client.birth_date ? clientService.formatBirthDate(client.birth_date) : null}
            field="birth_date"
            type="date"
          />
          <InfoField
            label="Notas"
            value={client.notes}
            field="notes"
            type="textarea"
            placeholder="Agregar notas sobre el cliente..."
          />
        </InfoSection>

        {/* Contact Information */}
        <InfoSection title="Información de Contacto" icon={Mail}>
          <InfoField
            label="Email"
            value={client.email}
            field="email"
            type="email"
            placeholder="correo@ejemplo.com"
          />
          <InfoField
            label="Teléfono"
            value={client.phone}
            field="phone"
            type="tel"
            placeholder="+56 9 XXXX XXXX"
          />
          <InfoField
            label="Dirección"
            value={client.address}
            field="address"
            type="textarea"
            placeholder="Dirección completa del cliente..."
          />
        </InfoSection>

        {/* Emergency Contact */}
        <InfoSection title="Contacto de Emergencia" icon={Heart}>
          <InfoField
            label="Contacto de Emergencia"
            value={client.emergency_contact}
            field="emergency_contact"
            type="textarea"
            placeholder="Nombre y teléfono del contacto de emergencia..."
          />
        </InfoSection>

        {/* Preferences and Permissions */}
        <InfoSection title="Preferencias y Permisos" icon={Shield}>
          <InfoField
            label="Acepta marketing"
            value={client.marketing_consent}
            field="marketing_consent"
            type="checkbox"
          />
          <InfoField
            label="Notificaciones por email"
            value={client.email_notifications}
            field="email_notifications"
            type="checkbox"
          />
          <InfoField
            label="Notificaciones por SMS"
            value={client.sms_notifications}
            field="sms_notifications"
            type="checkbox"
          />
        </InfoSection>
      </div>

      {/* Client Statistics */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Estadísticas del Cliente</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">{client.appointments_count}</div>
            <div className="text-sm text-indigo-700">Total de Citas</div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {clientService.getClientTypeDisplay(client.client_type)}
            </div>
            <div className="text-sm text-purple-700">Tipo de Cliente</div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {clientService.formatCreatedAt(client.created_at)}
            </div>
            <div className="text-sm text-green-700">Cliente desde</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoTab