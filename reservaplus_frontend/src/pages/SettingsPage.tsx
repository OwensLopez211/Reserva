import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Building, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  Users, 
  Palette,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Upload
} from 'lucide-react'

import organizationService from '../services/organizationService'
import { 
  Organization, 
  OrganizationUpdateData,
  BusinessHours,
  BusinessRules,
  Terminology,
  INDUSTRY_TEMPLATES,
  COUNTRIES,
  WEEKDAYS,
  TIME_OPTIONS,
  THEME_COLORS
} from '../types/organization'

const SettingsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'rules' | 'terminology' | 'appearance'>('basic')

  const [organizationData, setOrganizationData] = useState<OrganizationUpdateData>({
    name: '',
    description: '',
    industry_template: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    country: 'Chile',
    settings: {
      business_hours: organizationService.getDefaultBusinessHours(),
      business_rules: organizationService.getDefaultBusinessRules(),
      terminology: organizationService.getDefaultTerminology()
    }
  })

  useEffect(() => {
    loadOrganization()
  }, [])

  const loadOrganization = async () => {
    try {
      setLoading(true)
      setError(null)

      const org = await organizationService.getOrganization()
      setOrganization(org)

      // Llenar formulario con datos actuales
      setOrganizationData({
        name: org.name,
        description: org.description,
        industry_template: org.industry_template,
        email: org.email,
        phone: org.phone,
        website: org.website,
        address: org.address,
        city: org.city,
        country: org.country,
        settings: {
          business_hours: org.settings.business_hours || organizationService.getDefaultBusinessHours(),
          business_rules: org.business_rules || organizationService.getDefaultBusinessRules(),
          terminology: org.terminology || organizationService.getDefaultTerminology(),
          notifications: org.settings.notifications,
          appearance: org.settings.appearance,
          booking: org.settings.booking
        }
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
      setSuccess(null)

      // Validar datos
      const validationErrors = organizationService.validateOrganizationData(organizationData)
      if (validationErrors.length > 0) {
        setError(validationErrors[0])
        return
      }

      const updatedOrg = await organizationService.updateOrganization(organizationData)
      setOrganization(updatedOrg)
      setSuccess('Configuración guardada exitosamente')

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateOrganizationData = (updates: Partial<OrganizationUpdateData>) => {
    setOrganizationData(prev => ({ ...prev, ...updates }))
  }

  const updateSettings = (settingsUpdates: Partial<typeof organizationData.settings>) => {
    setOrganizationData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settingsUpdates }
    }))
  }

  const updateBusinessHours = (day: keyof BusinessHours, updates: Partial<BusinessHours[keyof BusinessHours]>) => {
    const newBusinessHours = {
      ...organizationData.settings.business_hours,
      [day]: { ...organizationData.settings.business_hours[day], ...updates }
    }
    updateSettings({ business_hours: newBusinessHours })
  }

  const updateBusinessRules = (updates: Partial<BusinessRules>) => {
    const newBusinessRules = { ...organizationData.settings.business_rules, ...updates }
    updateSettings({ business_rules: newBusinessRules })
  }

  const updateTerminology = (updates: Partial<Terminology>) => {
    const newTerminology = { ...organizationData.settings.terminology, ...updates }
    updateSettings({ terminology: newTerminology })
  }

  const handleExportConfig = async () => {
    try {
      const configJson = await organizationService.exportConfiguration()
      const blob = new Blob([configJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `configuracion-${organizationData.name.toLowerCase().replace(/\s+/g, '-')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar configuración')
    }
  }

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const configData = organizationService.validateImportedConfig(e.target?.result as string)
        if (configData) {
          setOrganizationData(configData)
          setSuccess('Configuración importada exitosamente')
        } else {
          setError('Archivo de configuración inválido')
        }
      } catch (err) {
        setError('Error al importar configuración')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  if (loading) {
    return (
      <div className="animate-fadeIn p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="bg-white rounded-lg border p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración General</h1>
              <p className="mt-2 text-gray-600">
                Gestiona la información y preferencias de tu organización
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportConfig}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </button>
              
              <label className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Importar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportConfig}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <p className="text-green-700">{success}</p>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'basic', name: 'Información Básica', icon: Building },
                { id: 'hours', name: 'Horarios', icon: Clock },
                { id: 'rules', name: 'Reglas de Negocio', icon: Settings },
                { id: 'terminology', name: 'Terminología', icon: Users },
                { id: 'appearance', name: 'Apariencia', icon: Palette }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Información Básica */}
            {activeTab === 'basic' && (
              <BasicInfoTab
                organizationData={organizationData}
                updateOrganizationData={updateOrganizationData}
              />
            )}

            {/* Horarios */}
            {activeTab === 'hours' && (
              <BusinessHoursTab
                businessHours={organizationData.settings.business_hours}
                updateBusinessHours={updateBusinessHours}
              />
            )}

            {/* Reglas de Negocio */}
            {activeTab === 'rules' && (
              <BusinessRulesTab
                businessRules={organizationData.settings.business_rules}
                updateBusinessRules={updateBusinessRules}
              />
            )}

            {/* Terminología */}
            {activeTab === 'terminology' && (
              <TerminologyTab
                terminology={organizationData.settings.terminology}
                updateTerminology={updateTerminology}
              />
            )}

            {/* Apariencia */}
            {activeTab === 'appearance' && (
              <AppearanceTab
                appearance={organizationData.settings.appearance}
                updateSettings={updateSettings}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para Información Básica
interface BasicInfoTabProps {
  organizationData: OrganizationUpdateData
  updateOrganizationData: (updates: Partial<OrganizationUpdateData>) => void
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  organizationData,
  updateOrganizationData
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de la Organización</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Organización *
            </label>
            <input
              type="text"
              value={organizationData.name}
              onChange={(e) => updateOrganizationData({ name: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nombre de tu empresa o negocio"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Industria *
            </label>
            <select
              value={organizationData.industry_template}
              onChange={(e) => updateOrganizationData({ industry_template: e.target.value })}
              disabled={true}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            >
              <option value="">Selecciona una industria</option>
              {INDUSTRY_TEMPLATES.map(template => (
                <option key={template.value} value={template.value}>
                  {template.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              El tipo de industria no puede ser modificado después de la configuración inicial
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={organizationData.description}
            onChange={(e) => updateOrganizationData({ description: e.target.value })}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe brevemente tu negocio..."
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={organizationData.email}
                onChange={(e) => updateOrganizationData({ email: e.target.value })}
                disabled={true}
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="contacto@tuempresa.com"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              El email de contacto no puede ser modificado
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={organizationData.phone}
                onChange={(e) => updateOrganizationData({ phone: e.target.value })}
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+56 9 1234 5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sitio Web
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="url"
                value={organizationData.website}
                onChange={(e) => updateOrganizationData({ website: e.target.value })}
                className="w-full pl-10 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://tuempresa.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País
            </label>
            <select
              value={organizationData.country}
              onChange={(e) => updateOrganizationData({ country: e.target.value })}
              disabled={true}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
            >
              {COUNTRIES.map(country => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              El país no puede ser modificado después de la configuración inicial
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={organizationData.address}
              onChange={(e) => updateOrganizationData({ address: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Av. Providencia 123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              value={organizationData.city}
              onChange={(e) => updateOrganizationData({ city: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Santiago"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para Horarios de Negocio
interface BusinessHoursTabProps {
  businessHours: BusinessHours
  updateBusinessHours: (day: keyof BusinessHours, updates: Partial<BusinessHours[keyof BusinessHours]>) => void
}

const BusinessHoursTab: React.FC<BusinessHoursTabProps> = ({
  businessHours,
  updateBusinessHours
}) => {
  const toggleDay = (day: keyof BusinessHours) => {
    updateBusinessHours(day, { is_open: !businessHours[day].is_open })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios de Funcionamiento</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configura los horarios en que tu negocio está abierto para recibir clientes.
        </p>
        
        <div className="space-y-4">
          {WEEKDAYS.map(({ key, label }) => {
            const dayKey = key as keyof BusinessHours
            const schedule = businessHours[dayKey]
            
            return (
              <div key={key} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-24">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={schedule.is_open}
                      onChange={() => toggleDay(dayKey)}
                      className="text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">
                      {label}
                    </span>
                  </label>
                </div>

                {schedule.is_open ? (
                  <div className="flex items-center space-x-4 flex-1">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Abre</label>
                      <select
                        value={schedule.open}
                        onChange={(e) => updateBusinessHours(dayKey, { open: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <span className="text-gray-400">-</span>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cierra</label>
                      <select
                        value={schedule.close}
                        onChange={(e) => updateBusinessHours(dayKey, { close: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TIME_OPTIONS.map(time => (
                          <option key={time.value} value={time.value}>
                            {time.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <span className="text-sm text-gray-500">Cerrado</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Componente para Reglas de Negocio
interface BusinessRulesTabProps {
  businessRules: BusinessRules
  updateBusinessRules: (updates: Partial<BusinessRules>) => void
}

const BusinessRulesTab: React.FC<BusinessRulesTabProps> = ({
  businessRules,
  updateBusinessRules
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Reservas</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ventana de Cancelación (horas)
              </label>
              <input
                type="number"
                min="0"
                max="168"
                value={businessRules.cancellation_window_hours}
                onChange={(e) => updateBusinessRules({ cancellation_window_hours: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tiempo mínimo antes de la cita para permitir cancelaciones
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de Reserva Anticipada
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={businessRules.advance_booking_days}
                onChange={(e) => updateBusinessRules({ advance_booking_days: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cuántos días en el futuro se pueden hacer reservas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buffer entre Citas (minutos)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={businessRules.buffer_between_appointments}
                onChange={(e) => updateBusinessRules({ buffer_between_appointments: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tiempo libre entre citas consecutivas
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recordatorios (horas antes)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={businessRules.reminder_hours_before}
                onChange={(e) => updateBusinessRules({ reminder_hours_before: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!businessRules.send_reminders}
              />
              <p className="text-xs text-gray-500 mt-1">
                Cuándo enviar recordatorios automáticos
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={businessRules.allow_walk_ins}
                onChange={(e) => updateBusinessRules({ allow_walk_ins: e.target.checked })}
                className="text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Permitir clientes sin cita previa
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={businessRules.requires_confirmation}
                onChange={(e) => updateBusinessRules({ requires_confirmation: e.target.checked })}
                className="text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Requerir confirmación de citas
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={businessRules.send_reminders}
                onChange={(e) => updateBusinessRules({ send_reminders: e.target.checked })}
                className="text-blue-600 focus:ring-blue-500 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enviar recordatorios automáticos
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para Terminología
interface TerminologyTabProps {
  terminology: Terminology
  updateTerminology: (updates: Partial<Terminology>) => void
}

const TerminologyTab: React.FC<TerminologyTabProps> = ({
  terminology,
  updateTerminology
}) => {
  const updateTerm = (key: keyof Terminology, field: 'singular' | 'plural', value: string) => {
    updateTerminology({
      [key]: {
        ...terminology[key],
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personalizar Terminología</h3>
        <p className="text-sm text-gray-600 mb-6">
          Personaliza los términos que se usan en tu aplicación para que se adapten a tu tipo de negocio.
        </p>
        
        <div className="space-y-6">
          {Object.entries(terminology).map(([key, term]) => (
            <div key={key} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3 capitalize">
                {key === 'professional' && 'Profesional'}
                {key === 'client' && 'Cliente'}
                {key === 'appointment' && 'Cita'}
                {key === 'service' && 'Servicio'}
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Singular</label>
                  <input
                    type="text"
                    value={term.singular}
                    onChange={(e) => updateTerm(key as keyof Terminology, 'singular', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Plural</label>
                  <input
                    type="text"
                    value={term.plural}
                    onChange={(e) => updateTerm(key as keyof Terminology, 'plural', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente para Apariencia
interface AppearanceTabProps {
  appearance: Record<string, unknown> | undefined
  updateSettings: (settingsUpdates: Record<string, unknown>) => void
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({
  appearance = {},
  updateSettings
}) => {
  const updateAppearance = (updates: any) => {
    updateSettings({ 
      appearance: { 
        ...appearance, 
        ...updates 
      } 
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personalización Visual</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Principal
            </label>
            <div className="grid grid-cols-4 gap-3">
              {THEME_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => updateAppearance({ theme_color: color.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    appearance.theme_color === color.value
                      ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: color.color }}
                >
                  <div className="h-6 w-full rounded" style={{ backgroundColor: color.color }}></div>
                  <p className="text-xs text-center mt-2 text-gray-700">{color.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Próximamente</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Pronto podrás personalizar el logo, colores adicionales y CSS personalizado para una experiencia completamente personalizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage 