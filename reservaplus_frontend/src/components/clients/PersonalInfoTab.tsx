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
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({})
  const [editedClient, setEditedClient] = useState<Partial<Client>>(client)
  const [savingSections, setSavingSections] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  const handleEditSection = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: true }))
    setEditedClient(client)
    setError(null)
  }

  const handleCancelSection = (section: string) => {
    setEditingSections(prev => ({ ...prev, [section]: false }))
    setEditedClient(client)
    setError(null)
  }

  const handleSaveSection = async (section: string) => {
    try {
      setSavingSections(prev => ({ ...prev, [section]: true }))
      setError(null)
      
      const updatedClient = await clientService.updateClient(client.id, editedClient)
      onClientUpdate(updatedClient)
      setEditingSections(prev => ({ ...prev, [section]: false }))
    } catch (error) {
      console.error('Error updating client:', error)
      setError('Error al actualizar la información del cliente')
    } finally {
      setSavingSections(prev => ({ ...prev, [section]: false }))
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
    sectionKey: string
  }> = ({ title, icon: Icon, children, sectionKey }) => {
    const isEditing = editingSections[sectionKey]
    const isSaving = savingSections[sectionKey]

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={() => handleEditSection(sectionKey)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
                title="Editar sección"
              >
                <Edit className="h-4 w-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleCancelSection(sectionKey)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                  title="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleSaveSection(sectionKey)}
                  disabled={isSaving}
                  className="p-1.5 hover:bg-green-100 rounded-lg transition-colors text-green-600 hover:text-green-700 disabled:opacity-50"
                  title="Guardar cambios"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
        {children}
      </div>
    )
  }

  const InfoField: React.FC<{
    label: string
    value: string | boolean | null
    field?: keyof Client
    type?: 'text' | 'email' | 'tel' | 'date' | 'textarea' | 'checkbox'
    placeholder?: string
    sectionKey: string
  }> = ({ label, value, field, type = 'text', placeholder, sectionKey }) => {
    if (!editingSections[sectionKey]) {
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
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Basic Information */}
        <InfoSection title="Información Básica" icon={User} sectionKey="basic">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InfoField
              label="Nombre"
              value={client.first_name}
              field="first_name"
              placeholder="Ingrese el nombre"
              sectionKey="basic"
            />
            <InfoField
              label="Apellido"
              value={client.last_name}
              field="last_name"
              placeholder="Ingrese el apellido"
              sectionKey="basic"
            />
          </div>
          <InfoField
            label="Fecha de Nacimiento"
            value={client.birth_date ? clientService.formatBirthDate(client.birth_date) : null}
            field="birth_date"
            type="date"
            sectionKey="basic"
          />
          <InfoField
            label="Notas"
            value={client.notes}
            field="notes"
            type="textarea"
            placeholder="Agregar notas sobre el cliente..."
            sectionKey="basic"
          />
        </InfoSection>

        {/* Contact Information */}
        <InfoSection title="Información de Contacto" icon={Mail} sectionKey="contact">
          <InfoField
            label="Email"
            value={client.email}
            field="email"
            type="email"
            placeholder="correo@ejemplo.com"
            sectionKey="contact"
          />
          <InfoField
            label="Teléfono"
            value={client.phone}
            field="phone"
            type="tel"
            placeholder="+56 9 XXXX XXXX"
            sectionKey="contact"
          />
          <InfoField
            label="Dirección"
            value={client.address}
            field="address"
            type="textarea"
            placeholder="Dirección completa del cliente..."
            sectionKey="contact"
          />
        </InfoSection>

        {/* Emergency Contact */}
        <InfoSection title="Contacto de Emergencia" icon={Heart} sectionKey="emergency">
          <InfoField
            label="Contacto de Emergencia"
            value={client.emergency_contact}
            field="emergency_contact"
            type="textarea"
            placeholder="Nombre y teléfono del contacto de emergencia..."
            sectionKey="emergency"
          />
        </InfoSection>

        {/* Preferences and Permissions */}
        <InfoSection title="Preferencias y Permisos" icon={Shield} sectionKey="preferences">
          <InfoField
            label="Acepta marketing"
            value={client.marketing_consent}
            field="marketing_consent"
            type="checkbox"
            sectionKey="preferences"
          />
          <InfoField
            label="Notificaciones por email"
            value={client.email_notifications}
            field="email_notifications"
            type="checkbox"
            sectionKey="preferences"
          />
          <InfoField
            label="Notificaciones por SMS"
            value={client.sms_notifications}
            field="sms_notifications"
            type="checkbox"
            sectionKey="preferences"
          />
        </InfoSection>
      </div>

      {/* Compact Client Statistics */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
        <h3 className="text-base font-semibold text-indigo-900 mb-3 flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Estadísticas del Cliente</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3">
            <div className="text-xl font-bold text-indigo-600">{client.appointments_count}</div>
            <div className="text-xs text-indigo-700">Total de Citas</div>
          </div>
          
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm font-bold text-purple-600">
              {clientService.getClientTypeDisplay(client.client_type)}
            </div>
            <div className="text-xs text-purple-700">Tipo de Cliente</div>
          </div>
          
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm font-bold text-green-600">
              {clientService.formatCreatedAt(client.created_at)}
            </div>
            <div className="text-xs text-green-700">Cliente desde</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoTab