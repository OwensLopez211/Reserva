import React, { useState, useEffect } from 'react'
import { Settings, Building, Phone, Mail, Globe, Clock, Users, Palette, Save, RefreshCw, AlertCircle, CheckCircle, Info, Download, Upload } from 'lucide-react'
import organizationService from '../services/organizationService'
import { Organization, OrganizationUpdateData, BusinessHours, BusinessRules, Terminology, INDUSTRY_TEMPLATES, COUNTRIES, WEEKDAYS, TIME_OPTIONS, THEME_COLORS } from '../types/organization'

const SettingsPage: React.FC = () => {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'hours' | 'rules' | 'terminology' | 'appearance'>('basic')

  const [organizationData, setOrganizationData] = useState<OrganizationUpdateData>({
    name: '', description: '', industry_template: '', email: '', phone: '', website: '', address: '', city: '', country: 'Chile',
    settings: { business_hours: organizationService.getDefaultBusinessHours(), business_rules: organizationService.getDefaultBusinessRules(), terminology: organizationService.getDefaultTerminology() }
  })

  useEffect(() => { loadOrganization() }, [])

  const loadOrganization = async () => {
    try {
      setLoading(true)
      setError(null)
      const org = await organizationService.getOrganization()
      setOrganization(org)
      setOrganizationData({
        name: org.name, description: org.description, industry_template: org.industry_template, email: org.email, phone: org.phone, website: org.website, address: org.address, city: org.city, country: org.country,
        settings: { business_hours: org.settings.business_hours || organizationService.getDefaultBusinessHours(), business_rules: org.business_rules || organizationService.getDefaultBusinessRules(), terminology: org.terminology || organizationService.getDefaultTerminology(), notifications: org.settings.notifications, appearance: org.settings.appearance, booking: org.settings.booking }
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
      const validationErrors = organizationService.validateOrganizationData(organizationData)
      if (validationErrors.length > 0) { setError(validationErrors[0]); return }
      const updatedOrg = await organizationService.updateOrganization(organizationData)
      setOrganization(updatedOrg)
      setSuccess('Configuración guardada exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const updateOrganizationData = (updates: Partial<OrganizationUpdateData>) => setOrganizationData(prev => ({ ...prev, ...updates }))
  const updateSettings = (settingsUpdates: Partial<typeof organizationData.settings>) => setOrganizationData(prev => ({ ...prev, settings: { ...prev.settings, ...settingsUpdates } }))
  const updateBusinessHours = (day: keyof BusinessHours, updates: Partial<BusinessHours[keyof BusinessHours]>) => {
    const newBusinessHours = { ...organizationData.settings.business_hours, [day]: { ...organizationData.settings.business_hours[day], ...updates } }
    updateSettings({ business_hours: newBusinessHours })
  }
  const updateBusinessRules = (updates: Partial<BusinessRules>) => updateSettings({ business_rules: { ...organizationData.settings.business_rules, ...updates } })
  const updateTerminology = (updates: Partial<Terminology>) => updateSettings({ terminology: { ...organizationData.settings.terminology, ...updates } })

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
        if (configData) { setOrganizationData(configData); setSuccess('Configuración importada exitosamente') }
        else { setError('Archivo de configuración inválido') }
      } catch (err) { setError('Error al importar configuración') }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-8 bg-white/60 rounded-xl w-1/4 mb-4"></div>
          <div className="h-12 bg-white/60 rounded-xl mb-6"></div>
          <div className="bg-white/60 rounded-2xl p-8 space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-200/60 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', name: 'Información', icon: Building },
    { id: 'hours', name: 'Horarios', icon: Clock },
    { id: 'rules', name: 'Reglas', icon: Settings },
    { id: 'terminology', name: 'Terminología', icon: Users },
    { id: 'appearance', name: 'Apariencia', icon: Palette }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">Configuración</h1>
              <p className="text-gray-600 mt-2">Gestiona tu organización y preferencias</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExportConfig} className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200 rounded-xl hover:bg-white transition-all shadow-sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200 rounded-xl hover:bg-white transition-all shadow-sm cursor-pointer">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importar</span>
                <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
              </label>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-lg">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="hidden sm:inline">{saving ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className={`mb-6 rounded-xl p-4 border ${error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <div className="flex items-center gap-3">
              {error ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
              <p className={error ? 'text-red-700' : 'text-green-700'}>{error || success}</p>
              <button onClick={() => { setError(null); setSuccess(null) }} className="ml-auto text-gray-400 hover:text-gray-600">×</button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-100">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 lg:px-6 py-4 font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50/50'
                  }`}>
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'basic' && <BasicInfoTab organizationData={organizationData} updateOrganizationData={updateOrganizationData} />}
            {activeTab === 'hours' && <BusinessHoursTab businessHours={organizationData.settings.business_hours} updateBusinessHours={updateBusinessHours} />}
            {activeTab === 'rules' && <BusinessRulesTab businessRules={organizationData.settings.business_rules} updateBusinessRules={updateBusinessRules} />}
            {activeTab === 'terminology' && <TerminologyTab terminology={organizationData.settings.terminology} updateTerminology={updateTerminology} />}
            {activeTab === 'appearance' && <AppearanceTab appearance={organizationData.settings.appearance} updateSettings={updateSettings} />}
          </div>
        </div>
      </div>
    </div>
  )
}

const BasicInfoTab: React.FC<{ organizationData: OrganizationUpdateData; updateOrganizationData: (updates: Partial<OrganizationUpdateData>) => void }> = ({ organizationData, updateOrganizationData }) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Organización *</label>
          <input type="text" value={organizationData.name} onChange={(e) => updateOrganizationData({ name: e.target.value })} 
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Nombre de tu empresa" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Industria</label>
          <select value={organizationData.industry_template} disabled className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed">
            <option value="">Selecciona una industria</option>
            {INDUSTRY_TEMPLATES.map(template => <option key={template.value} value={template.value}>{template.label}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">No puede ser modificado después de la configuración inicial</p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
        <textarea value={organizationData.description} onChange={(e) => updateOrganizationData({ description: e.target.value })} rows={5}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Describe tu negocio..." />
      </div>
    </div>

    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="email" value={organizationData.email} disabled className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="tel" value={organizationData.phone} onChange={(e) => updateOrganizationData({ phone: e.target.value })} 
              className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="+56 9 1234 5678" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sitio Web</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="url" value={organizationData.website} onChange={(e) => updateOrganizationData({ website: e.target.value })} 
              className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="https://tuempresa.com" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
          <select value={organizationData.country} disabled className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-100 text-gray-600 cursor-not-allowed">
            {COUNTRIES.map(country => <option key={country.value} value={country.value}>{country.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
          <input type="text" value={organizationData.address} onChange={(e) => updateOrganizationData({ address: e.target.value })} 
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Av. Providencia 123" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
          <input type="text" value={organizationData.city} onChange={(e) => updateOrganizationData({ city: e.target.value })} 
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Santiago" />
        </div>
      </div>
    </div>
  </div>
)

const BusinessHoursTab: React.FC<{ businessHours: BusinessHours; updateBusinessHours: (day: keyof BusinessHours, updates: Partial<BusinessHours[keyof BusinessHours]>) => void }> = ({ businessHours, updateBusinessHours }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Horarios de Funcionamiento</h3>
      <p className="text-sm text-gray-600 mb-6">Configura los horarios en que tu negocio está abierto</p>
    </div>
    <div className="space-y-3">
      {WEEKDAYS.map(({ key, label }) => {
        const dayKey = key as keyof BusinessHours
        const schedule = businessHours[dayKey]
        return (
          <div key={key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-24">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={schedule.is_open} onChange={() => updateBusinessHours(dayKey, { is_open: !schedule.is_open })} 
                  className="text-blue-600 focus:ring-blue-500 rounded" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            </div>
            {schedule.is_open ? (
              <div className="flex items-center gap-4 flex-1">
                <select value={schedule.open} onChange={(e) => updateBusinessHours(dayKey, { open: e.target.value })} 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TIME_OPTIONS.map(time => <option key={time.value} value={time.value}>{time.label}</option>)}
                </select>
                <span className="text-gray-400">-</span>
                <select value={schedule.close} onChange={(e) => updateBusinessHours(dayKey, { close: e.target.value })} 
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {TIME_OPTIONS.map(time => <option key={time.value} value={time.value}>{time.label}</option>)}
                </select>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Cerrado</span>
            )}
          </div>
        )
      })}
    </div>
  </div>
)

const BusinessRulesTab: React.FC<{ businessRules: BusinessRules; updateBusinessRules: (updates: Partial<BusinessRules>) => void }> = ({ businessRules, updateBusinessRules }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Reservas</h3>
      <p className="text-sm text-gray-600 mb-6">Define las reglas para las citas y reservas</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { label: 'Ventana de Cancelación (horas)', key: 'cancellation_window_hours', min: 0, max: 168, desc: 'Tiempo mínimo antes de la cita para cancelar' },
        { label: 'Días de Reserva Anticipada', key: 'advance_booking_days', min: 1, max: 365, desc: 'Cuántos días en el futuro se pueden reservar' },
        { label: 'Buffer entre Citas (minutos)', key: 'buffer_between_appointments', min: 0, max: 120, desc: 'Tiempo libre entre citas consecutivas' },
        { label: 'Recordatorios (horas antes)', key: 'reminder_hours_before', min: 1, max: 168, desc: 'Cuándo enviar recordatorios automáticos' }
      ].map(field => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
          <input type="number" min={field.min} max={field.max} value={businessRules[field.key as keyof BusinessRules]} 
            onChange={(e) => updateBusinessRules({ [field.key]: parseInt(e.target.value) })} 
            disabled={field.key === 'reminder_hours_before' && !businessRules.send_reminders}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:bg-gray-100" />
          <p className="text-xs text-gray-500 mt-1">{field.desc}</p>
        </div>
      ))}
    </div>
    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
      {[
        { key: 'allow_walk_ins', label: 'Permitir clientes sin cita previa' },
        { key: 'requires_confirmation', label: 'Requerir confirmación de citas' },
        { key: 'send_reminders', label: 'Enviar recordatorios automáticos' }
      ].map(option => (
        <label key={option.key} className="flex items-center gap-3">
          <input type="checkbox" checked={businessRules[option.key as keyof BusinessRules]} 
            onChange={(e) => updateBusinessRules({ [option.key]: e.target.checked })} 
            className="text-blue-600 focus:ring-blue-500 rounded" />
          <span className="text-sm text-gray-700">{option.label}</span>
        </label>
      ))}
    </div>
  </div>
)

const TerminologyTab: React.FC<{ terminology: Terminology; updateTerminology: (updates: Partial<Terminology>) => void }> = ({ terminology, updateTerminology }) => {
  const updateTerm = (key: keyof Terminology, field: 'singular' | 'plural', value: string) => {
    updateTerminology({ [key]: { ...terminology[key], [field]: value } })
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Personalizar Terminología</h3>
        <p className="text-sm text-gray-600 mb-6">Adapta los términos a tu tipo de negocio</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(terminology).map(([key, term]) => (
          <div key={key} className="bg-gray-50 p-4 rounded-xl">
            <h4 className="text-sm font-medium text-gray-900 mb-3 capitalize">
              {key === 'professional' && 'Profesional'} {key === 'client' && 'Cliente'} {key === 'appointment' && 'Cita'} {key === 'service' && 'Servicio'}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Singular</label>
                <input type="text" value={term.singular} onChange={(e) => updateTerm(key as keyof Terminology, 'singular', e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Plural</label>
                <input type="text" value={term.plural} onChange={(e) => updateTerm(key as keyof Terminology, 'plural', e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const AppearanceTab: React.FC<{ appearance: Record<string, unknown> | undefined; updateSettings: (settingsUpdates: Record<string, unknown>) => void }> = ({ appearance = {}, updateSettings }) => {
  const updateAppearance = (updates: any) => updateSettings({ appearance: { ...appearance, ...updates } })
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Personalización Visual</h3>
        <p className="text-sm text-gray-600 mb-6">Configura la apariencia de tu aplicación</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Color Principal</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {THEME_COLORS.map(color => (
            <button key={color.value} onClick={() => updateAppearance({ theme_color: color.value })} 
              className={`p-4 rounded-xl border-2 transition-all ${appearance.theme_color === color.value ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-400' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className="h-8 w-full rounded-lg" style={{ backgroundColor: color.color }}></div>
              <p className="text-xs text-center mt-2 text-gray-700">{color.label}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Próximamente</h4>
            <p className="text-sm text-blue-700 mt-1">Logo personalizado, colores adicionales y CSS personalizado para una experiencia única.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage