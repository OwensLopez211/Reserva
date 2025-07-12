import React, { useState, useEffect } from 'react'
import { Settings, Building, Phone, Mail, Globe, Clock, Users, Save, RefreshCw, AlertCircle, CheckCircle, Info, Download, Upload, MapPin, Calendar, Shield, BookOpen, Eye } from 'lucide-react'
import organizationService from '../services/organizationService'
import { OrganizationUpdateData, BusinessHours, BusinessRules, Terminology, INDUSTRY_TEMPLATES, COUNTRIES, WEEKDAYS, TIME_OPTIONS, THEME_COLORS } from '../types/organization'

const SettingsPage: React.FC = () => {
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
      setOrganizationData({
        name: org.name, description: org.description, industry_template: org.industry_template, email: org.email, phone: org.phone, website: org.website, address: org.address, city: org.city, country: org.country,
        settings: { business_hours: org.settings.business_hours || organizationService.getDefaultBusinessHours(), business_rules: org.business_rules || organizationService.getDefaultBusinessRules(), terminology: org.terminology || organizationService.getDefaultTerminology(), notifications: org.settings.notifications, appearance: org.settings.appearance, booking: org.settings.booking }
      })
    } catch {
      setError('Error al cargar la organización')
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
      await organizationService.updateOrganization(organizationData)
      setSuccess('Configuración guardada exitosamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Error al guardar configuración')
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
    } catch {
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
      } catch { setError('Error al importar configuración') }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-4 py-6 pt-20">
        <div className="animate-pulse">
          <div className="h-12 bg-white/60 rounded-xl w-80 mb-8"></div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-3">
              <div className="bg-white/60 rounded-2xl p-6 space-y-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-200/60 rounded-xl"></div>)}
              </div>
            </div>
            <div className="xl:col-span-9">
              <div className="bg-white/60 rounded-2xl p-8 space-y-6">
                {[...Array(6)].map((_, i) => <div key={i} className="h-20 bg-gray-200/60 rounded-xl"></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'basic', name: 'Información', icon: Building, desc: 'Datos básicos y contacto' },
    { id: 'hours', name: 'Horarios', icon: Clock, desc: 'Horarios de atención' },
    { id: 'rules', name: 'Reglas', icon: Shield, desc: 'Políticas de reservas' },
    { id: 'terminology', name: 'Terminología', icon: BookOpen, desc: 'Personalizar términos' },
    { id: 'appearance', name: 'Apariencia', icon: Eye, desc: 'Colores y estilo' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-4 py-6 ">
      <div className="w-full">
        {/* Messages */}
        {(error || success) && (
          <div className={`mb-8 rounded-2xl p-6 border backdrop-blur-sm ${error ? 'bg-red-50/80 border-red-200' : 'bg-green-50/80 border-green-200'}`}>
            <div className="flex items-center gap-4">
              {error ? <AlertCircle className="h-6 w-6 text-red-600" /> : <CheckCircle className="h-6 w-6 text-green-600" />}
              <p className={`text-lg font-medium ${error ? 'text-red-700' : 'text-green-700'}`}>{error || success}</p>
              <button 
                onClick={() => { setError(null); setSuccess(null) }} 
                className="ml-auto text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="xl:col-span-3">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden sticky top-6">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Configuración</h2>
                <nav className="space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl transition-all duration-200 text-left group ${
                          activeTab === tab.id 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className={`h-5 w-5 mt-0.5 ${activeTab === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                        <div className="flex-1">
                          <div className={`font-medium ${activeTab === tab.id ? 'text-white' : 'text-gray-900'}`}>
                            {tab.name}
                          </div>
                          <div className={`text-sm ${activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'}`}>
                            {tab.desc}
                          </div>
                        </div>
                </button>
              )
            })}
                </nav>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="xl:col-span-9">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl overflow-hidden">
              <div className="p-8">
            {activeTab === 'basic' && <BasicInfoTab organizationData={organizationData} updateOrganizationData={updateOrganizationData} />}
            {activeTab === 'hours' && <BusinessHoursTab businessHours={organizationData.settings.business_hours} updateBusinessHours={updateBusinessHours} />}
            {activeTab === 'rules' && <BusinessRulesTab businessRules={organizationData.settings.business_rules} updateBusinessRules={updateBusinessRules} />}
            {activeTab === 'terminology' && <TerminologyTab terminology={organizationData.settings.terminology} updateTerminology={updateTerminology} />}
                {activeTab === 'appearance' && <AppearanceTab appearance={organizationData.settings.appearance as Record<string, unknown> | undefined} updateSettings={updateSettings} />}

                {/* Action Buttons al final */}
                <div className="flex items-center gap-3 mt-8">
                  <button 
                    onClick={handleExportConfig}
                    className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 group"
                  >
                    <Download className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">Exportar</span>
                  </button>
                  <label className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer group">
                    <Upload className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    <span className="font-medium">Importar</span>
                    <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
                  </label>
                  <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  >
                    {saving ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    <span>{saving ? 'Guardando...' : 'Guardar cambios'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const BasicInfoTab: React.FC<{ organizationData: OrganizationUpdateData; updateOrganizationData: (updates: Partial<OrganizationUpdateData>) => void }> = ({ organizationData, updateOrganizationData }) => (
  <div className="space-y-10">
    {/* Header */}
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center gap-3 mb-3">
        <Building className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Información Básica</h2>
      </div>
      <p className="text-gray-600">Configura la información principal de tu organización</p>
    </div>

    {/* Organization Info */}
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Datos de la Organización</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Nombre de la Organización *</label>
            <input 
              type="text" 
              value={organizationData.name} 
              onChange={(e) => updateOrganizationData({ name: e.target.value })} 
              className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
              placeholder="Nombre de tu empresa" 
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Industria</label>
            <select 
              value={organizationData.industry_template} 
              disabled 
              className="w-full border border-gray-300 rounded-xl px-4 py-4 bg-gray-100 text-gray-600 cursor-not-allowed text-lg"
            >
            <option value="">Selecciona una industria</option>
            {INDUSTRY_TEMPLATES.map(template => <option key={template.value} value={template.value}>{template.label}</option>)}
          </select>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              No puede ser modificado después de la configuración inicial
            </p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Descripción</label>
          <textarea 
            value={organizationData.description} 
            onChange={(e) => updateOrganizationData({ description: e.target.value })} 
            rows={6}
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-white/80 backdrop-blur-sm" 
            placeholder="Describe tu negocio y servicios..."
          />
        </div>
      </div>
    </div>

    {/* Contact Information */}
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Phone className="h-5 w-5 text-green-600" />
        Información de Contacto
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="email" 
              value={organizationData.email} 
              disabled 
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed text-lg"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Teléfono</label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="tel" 
              value={organizationData.phone} 
              onChange={(e) => updateOrganizationData({ phone: e.target.value })} 
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
              placeholder="+56 9 1234 5678"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Sitio Web</label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="url" 
              value={organizationData.website} 
              onChange={(e) => updateOrganizationData({ website: e.target.value })} 
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
              placeholder="https://tuempresa.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">País</label>
          <select 
            value={organizationData.country} 
            disabled 
            className="w-full border border-gray-300 rounded-xl px-4 py-4 bg-gray-100 text-gray-600 cursor-not-allowed text-lg"
          >
            {COUNTRIES.map(country => <option key={country.value} value={country.value}>{country.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Dirección</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              value={organizationData.address} 
              onChange={(e) => updateOrganizationData({ address: e.target.value })} 
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
              placeholder="Av. Providencia 123"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Ciudad</label>
          <input 
            type="text" 
            value={organizationData.city} 
            onChange={(e) => updateOrganizationData({ city: e.target.value })} 
            className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
            placeholder="Santiago"
          />
        </div>
      </div>
    </div>
  </div>
)

const BusinessHoursTab: React.FC<{ businessHours: BusinessHours; updateBusinessHours: (day: keyof BusinessHours, updates: Partial<BusinessHours[keyof BusinessHours]>) => void }> = ({ businessHours, updateBusinessHours }) => (
  <div className="space-y-10">
    {/* Header */}
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center gap-3 mb-3">
        <Clock className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Horarios de Funcionamiento</h2>
      </div>
      <p className="text-gray-600">Configura los horarios en que tu negocio está abierto al público</p>
    </div>

    {/* Schedule Grid */}
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Horarios Semanales</h3>
      <div className="space-y-4">
      {WEEKDAYS.map(({ key, label }) => {
        const dayKey = key as keyof BusinessHours
        const schedule = businessHours[dayKey]
        return (
            <div key={key} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-32">
                  <label className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={schedule.is_open} 
                      onChange={() => updateBusinessHours(dayKey, { is_open: !schedule.is_open })} 
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300"
                    />
                    <span className="text-lg font-medium text-gray-900">{label}</span>
              </label>
            </div>
            {schedule.is_open ? (
              <div className="flex items-center gap-4 flex-1">
                    <div className="flex-1">
                      <select 
                        value={schedule.open} 
                        onChange={(e) => updateBusinessHours(dayKey, { open: e.target.value })} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                      >
                  {TIME_OPTIONS.map(time => <option key={time.value} value={time.value}>{time.label}</option>)}
                </select>
                    </div>
                    <div className="text-gray-400 text-xl font-medium">-</div>
                    <div className="flex-1">
                      <select 
                        value={schedule.close} 
                        onChange={(e) => updateBusinessHours(dayKey, { close: e.target.value })} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                      >
                  {TIME_OPTIONS.map(time => <option key={time.value} value={time.value}>{time.label}</option>)}
                </select>
                    </div>
              </div>
            ) : (
                  <div className="flex-1">
                    <span className="text-lg text-gray-500 italic">Cerrado</span>
                  </div>
            )}
              </div>
          </div>
        )
      })}
      </div>
    </div>
  </div>
)

const BusinessRulesTab: React.FC<{ businessRules: BusinessRules; updateBusinessRules: (updates: Partial<BusinessRules>) => void }> = ({ businessRules, updateBusinessRules }) => (
  <div className="space-y-10">
    {/* Header */}
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center gap-3 mb-3">
        <Shield className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Reglas de Negocio</h2>
      </div>
      <p className="text-gray-600">Define las políticas y reglas para las citas y reservas</p>
    </div>

    {/* Rules Configuration */}
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuración de Reservas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { label: 'Ventana de Cancelación', key: 'cancellation_window_hours', min: 0, max: 168, desc: 'Tiempo mínimo antes de la cita para cancelar', unit: 'horas' },
          { label: 'Días de Reserva Anticipada', key: 'advance_booking_days', min: 1, max: 365, desc: 'Cuántos días en el futuro se pueden reservar', unit: 'días' },
          { label: 'Buffer entre Citas', key: 'buffer_between_appointments', min: 0, max: 120, desc: 'Tiempo libre entre citas consecutivas', unit: 'minutos' },
          { label: 'Recordatorios', key: 'reminder_hours_before', min: 1, max: 168, desc: 'Cuándo enviar recordatorios automáticos', unit: 'horas antes' }
      ].map(field => (
          <div key={field.key} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
            <label className="block text-sm font-medium text-gray-700 mb-3">{field.label}</label>
            <div className="relative">
              <input 
                type="number" 
                min={field.min} 
                max={field.max} 
                                 value={String(businessRules[field.key as keyof BusinessRules])} 
            onChange={(e) => updateBusinessRules({ [field.key]: parseInt(e.target.value) })} 
            disabled={field.key === 'reminder_hours_before' && !businessRules.send_reminders}
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-lg pr-20"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {field.unit}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{field.desc}</p>
        </div>
      ))}
      </div>
    </div>

    {/* Options */}
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Opciones Adicionales</h3>
      <div className="space-y-4">
        {[
          { key: 'allow_walk_ins', label: 'Permitir clientes sin cita previa', desc: 'Los clientes pueden solicitar atención sin reserva' },
          { key: 'requires_confirmation', label: 'Requerir confirmación de citas', desc: 'Las citas deben ser confirmadas por el profesional' },
          { key: 'send_reminders', label: 'Enviar recordatorios automáticos', desc: 'Enviar notificaciones antes de las citas' }
      ].map(option => (
          <div key={option.key} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50">
            <label className="flex items-start gap-4">
              <input 
                type="checkbox" 
                                 checked={Boolean(businessRules[option.key as keyof BusinessRules])} 
            onChange={(e) => updateBusinessRules({ [option.key]: e.target.checked })} 
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300 mt-1"
              />
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900 block">{option.label}</span>
                <span className="text-sm text-gray-500">{option.desc}</span>
              </div>
        </label>
          </div>
      ))}
      </div>
    </div>
  </div>
)

const TerminologyTab: React.FC<{ terminology: Terminology; updateTerminology: (updates: Partial<Terminology>) => void }> = ({ terminology, updateTerminology }) => {
  const updateTerm = (key: keyof Terminology, field: 'singular' | 'plural', value: string) => {
    updateTerminology({ [key]: { ...terminology[key], [field]: value } })
  }

  const termConfig = [
    { key: 'professional', label: 'Profesional', icon: Users, desc: 'Personas que brindan servicios', color: 'from-blue-50 to-indigo-50 border-blue-100' },
    { key: 'client', label: 'Cliente', icon: Users, desc: 'Personas que reciben servicios', color: 'from-green-50 to-emerald-50 border-green-100' },
    { key: 'appointment', label: 'Cita', icon: Calendar, desc: 'Encuentros programados', color: 'from-purple-50 to-pink-50 border-purple-100' },
    { key: 'service', label: 'Servicio', icon: Settings, desc: 'Actividades ofrecidas', color: 'from-orange-50 to-red-50 border-orange-100' }
  ]
  
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Personalizar Terminología</h2>
        </div>
        <p className="text-gray-600">Adapta los términos utilizados en la aplicación a tu tipo de negocio</p>
      </div>

      {/* Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {termConfig.map(({ key, label, icon: Icon, desc, color }) => (
          <div key={key} className={`bg-gradient-to-r ${color} rounded-2xl p-8 border`}>
            <div className="flex items-center gap-3 mb-4">
              <Icon className="h-6 w-6 text-gray-700" />
              <h3 className="text-xl font-semibold text-gray-900">{label}</h3>
            </div>
            <p className="text-gray-600 mb-6">{desc}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Singular</label>
                <input 
                  type="text" 
                  value={terminology[key as keyof Terminology].singular} 
                  onChange={(e) => updateTerm(key as keyof Terminology, 'singular', e.target.value)} 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plural</label>
                <input 
                  type="text" 
                  value={terminology[key as keyof Terminology].plural} 
                  onChange={(e) => updateTerm(key as keyof Terminology, 'plural', e.target.value)} 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const AppearanceTab: React.FC<{ appearance: Record<string, unknown> | undefined; updateSettings: (settingsUpdates: Record<string, unknown>) => void }> = ({ appearance = {}, updateSettings }) => {
  const updateAppearance = (updates: Record<string, unknown>) => updateSettings({ appearance: { ...appearance, ...updates } })
  
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-center gap-3 mb-3">
          <Eye className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Personalización Visual</h2>
        </div>
        <p className="text-gray-600">Configura la apariencia y colores de tu aplicación</p>
      </div>

      {/* Theme Colors */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Paleta de Colores</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {THEME_COLORS.map(color => (
            <button 
              key={color.value} 
              onClick={() => updateAppearance({ theme_color: color.value })} 
              className={`group relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                appearance.theme_color === color.value 
                  ? 'border-gray-900 ring-4 ring-offset-2 ring-gray-400 scale-105' 
                  : 'border-gray-200 hover:border-gray-300 hover:scale-102'
              }`}
            >
              <div 
                className="h-16 w-full rounded-xl shadow-lg group-hover:shadow-xl transition-shadow" 
                style={{ backgroundColor: color.color }}
              ></div>
              <p className="text-sm font-medium text-center mt-4 text-gray-900">{color.label}</p>
              {appearance.theme_color === color.value && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <CheckCircle className="h-4 w-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
        <div className="flex items-start gap-4">
          <Info className="h-8 w-8 text-blue-600 mt-1" />
          <div>
            <h4 className="text-xl font-semibold text-blue-900 mb-2">Próximamente</h4>
            <p className="text-blue-700 text-lg leading-relaxed">
              Pronto podrás personalizar tu logo, usar colores adicionales y aplicar CSS personalizado 
              para crear una experiencia única que refleje la identidad de tu negocio.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage