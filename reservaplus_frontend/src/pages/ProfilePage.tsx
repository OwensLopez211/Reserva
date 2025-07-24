import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, Calendar, Building, Save, RefreshCw, AlertCircle, CheckCircle, Eye, EyeOff, Camera, MapPin, CreditCard, Crown, Shield, TrendingUp, Users, Briefcase, Settings, Lock } from 'lucide-react'
import profileService, { User as ProfileUser, ProfileUpdateData } from '../services/profileService'
import subscriptionService, { OrganizationSubscription, SubscriptionUsage, Invoice, PaymentMethod } from '../services/subscriptionService'

interface UserProfileUpdate {
  first_name: string
  last_name: string
  phone: string
  profile: ProfileUpdateData
}

const ProfilePage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile')
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  
  // Estados para la suscripción
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null)
  const [subscriptionUsage, setSubscriptionUsage] = useState<SubscriptionUsage | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  
  // Estados para el sistema de pagos real
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [mpPaymentMethods, setMpPaymentMethods] = useState<MPPaymentMethod[]>([])
  const [recentPayments, setRecentPayments] = useState<Payment[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)

  const [formData, setFormData] = useState<UserProfileUpdate>({
    first_name: '', last_name: '', phone: '',
    profile: { birth_date: '', address: '', timezone: 'America/Santiago', language: 'es', email_notifications: true, sms_notifications: false }
  })

  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' })

  useEffect(() => { loadProfile() }, [])

  // Efecto para detectar el parámetro 'tab' de la URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'subscription' && profile?.role === 'owner') {
      setActiveTab('subscription')
    } else if (tabParam === 'profile' || !tabParam) {
      setActiveTab('profile')
    }
  }, [searchParams, profile?.role])

  // Efecto para resetear tab si el usuario no es owner
  useEffect(() => {
    if (profile && profile.role !== 'owner' && activeTab === 'subscription') {
      setActiveTab('profile')
    }
  }, [profile, activeTab])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const { user, profile: profileData } = await profileService.getCompleteProfile()
      setProfile(user)
      setFormData({
        first_name: user.first_name || '', last_name: user.last_name || '', phone: user.phone || '',
        profile: {
          birth_date: profileData.birth_date || '', address: profileData.address || '',
          timezone: profileData.timezone || 'America/Santiago', language: profileData.language || 'es',
          email_notifications: profileData.email_notifications !== false, sms_notifications: profileData.sms_notifications === true
        }
      })
      
      // Cargar información de suscripción si es owner
      if (user.role === 'owner') {
        await loadSubscriptionData()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptionData = async () => {
    try {
      setSubscriptionLoading(true)
      const [subscriptionData, usageData, invoiceData, paymentData] = await Promise.all([
        subscriptionService.getMySubscription(),
        subscriptionService.getSubscriptionUsage(),
        subscriptionService.getInvoiceHistory(),
        subscriptionService.getPaymentMethods()
      ])
      
      setSubscription(subscriptionData)
      setSubscriptionUsage(usageData)
      setInvoices(invoiceData)
      setPaymentMethods(paymentData)
    } catch (err) {
      console.error('Error loading subscription data:', err)
      // No mostramos error aquí para no interferir con el perfil
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      const userErrors = profileService.validateUserData({ first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone })
      const profileErrors = profileService.validateProfileData(formData.profile)
      const allErrors = [...userErrors, ...profileErrors]
      if (allErrors.length > 0) { setError(allErrors.join(', ')); return }
      await profileService.updateCompleteProfile({ first_name: formData.first_name, last_name: formData.last_name, phone: formData.phone }, formData.profile)
      setSuccess('Perfil actualizado exitosamente')
      await loadProfile()
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      setError(null)
      setSuccess(null)
      const passwordErrors = profileService.validatePasswordData(passwordData)
      if (passwordErrors.length > 0) { setError(passwordErrors.join(', ')); return }
      setSaving(true)
      await profileService.changePassword({ current_password: passwordData.current_password, new_password: passwordData.new_password })
      setSuccess('Contraseña cambiada exitosamente')
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setShowPasswordChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const updateFormData = (updates: Partial<UserProfileUpdate>) => setFormData(prev => ({ ...prev, ...updates }))
  const updateProfile = (updates: Partial<ProfileUpdateData>) => setFormData(prev => ({ ...prev, profile: { ...prev.profile, ...updates } }))

  const timezoneOptions = profileService.getTimezoneOptions()
  const languageOptions = profileService.getLanguageOptions()
  const formattedUserData = profile ? profileService.formatUserData(profile) : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-4 py-6">
        <div className="animate-pulse">
          <div className="h-12 bg-white/60 rounded-xl w-80 mb-8"></div>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-3">
              <div className="bg-white/60 rounded-2xl p-6 space-y-4">
                {[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-gray-200/60 rounded-xl"></div>)}
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
    { id: 'profile', name: 'Mi Perfil', icon: User, desc: 'Información personal y configuración' },
    ...(profile?.role === 'owner' ? [{ id: 'subscription', name: 'Suscripción', icon: CreditCard, desc: 'Plan y facturación' }] : [])
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 px-4 py-6">
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
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Mi Cuenta</h2>
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
                {activeTab === 'profile' && <ProfileTab formData={formData} updateFormData={updateFormData} updateProfile={updateProfile} passwordData={passwordData} setPasswordData={setPasswordData} showPasswordChange={showPasswordChange} setShowPasswordChange={setShowPasswordChange} handlePasswordChange={handlePasswordChange} saving={saving} timezoneOptions={timezoneOptions} languageOptions={languageOptions} formattedUserData={formattedUserData} profile={profile} />}
                {activeTab === 'subscription' && <SubscriptionTab subscription={subscription} subscriptionUsage={subscriptionUsage} invoices={invoices} paymentMethods={paymentMethods} subscriptionLoading={subscriptionLoading} loadSubscriptionData={loadSubscriptionData} />}

                {/* Botón Guardar al final */}
                <div className="flex items-center gap-3 mt-8">
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

const ProfileTab: React.FC<{
  formData: UserProfileUpdate
  updateFormData: (updates: Partial<UserProfileUpdate>) => void
  updateProfile: (updates: Partial<ProfileUpdateData>) => void
  passwordData: { current_password: string; new_password: string; confirm_password: string }
  setPasswordData: React.Dispatch<React.SetStateAction<{ current_password: string; new_password: string; confirm_password: string }>>
  showPasswordChange: boolean
  setShowPasswordChange: React.Dispatch<React.SetStateAction<boolean>>
  handlePasswordChange: () => Promise<void>
  saving: boolean
  timezoneOptions: Array<{ value: string; label: string }>
  languageOptions: Array<{ value: string; label: string }>
  formattedUserData: { initials?: string; displayName?: string; memberSince?: string } | null
  profile: ProfileUser | null
}> = ({ formData, updateFormData, updateProfile, passwordData, setPasswordData, showPasswordChange, setShowPasswordChange, handlePasswordChange, saving, timezoneOptions, languageOptions, formattedUserData, profile }) => (
  <div className="space-y-10">
    {/* Header */}
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center gap-3 mb-3">
        <User className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Información Personal</h2>
      </div>
      <p className="text-gray-600">Actualiza tu información personal y configuración de cuenta</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card */}
      <div className="lg:col-span-1">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center border border-blue-100">
          <div className="relative inline-block mb-4">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white">{formattedUserData?.initials}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 h-8 w-8 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Camera className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{formattedUserData?.displayName}</h3>
          <p className="text-blue-600 font-medium capitalize">{profile?.role}</p>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2"><Building className="h-4 w-4" />{profile?.organization_name}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4" />{profile?.email}</div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Desde {formattedUserData?.memberSince}</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-2 space-y-8">
        {/* Personal Information */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Información Personal
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Nombre</label>
              <input 
                type="text" 
                value={formData.first_name} 
                onChange={(e) => updateFormData({ first_name: e.target.value })} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
                placeholder="Tu nombre" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Apellido</label>
              <input 
                type="text" 
                value={formData.last_name} 
                onChange={(e) => updateFormData({ last_name: e.target.value })} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
                placeholder="Tu apellido" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => updateFormData({ phone: e.target.value })} 
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
                  placeholder="+56 9 1234 5678" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Fecha de Nacimiento</label>
              <input 
                type="date" 
                value={formData.profile.birth_date} 
                onChange={(e) => updateProfile({ birth_date: e.target.value })} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-purple-600" />
            Dirección
          </h3>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <textarea 
              value={formData.profile.address} 
              onChange={(e) => updateProfile({ address: e.target.value })} 
              rows={3}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-lg bg-white/80 backdrop-blur-sm" 
              placeholder="Tu dirección completa" 
            />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Preferencias
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Zona Horaria</label>
              <select 
                value={formData.profile.timezone} 
                onChange={(e) => updateProfile({ timezone: e.target.value })} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm"
              >
                {timezoneOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Idioma</label>
              <select 
                value={formData.profile.language} 
                onChange={(e) => updateProfile({ language: e.target.value })} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm"
              >
                {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-8 border border-teal-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Notificaciones</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <input 
                type="checkbox" 
                checked={formData.profile.email_notifications} 
                onChange={(e) => updateProfile({ email_notifications: e.target.checked })} 
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300" 
              />
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900 block">Notificaciones por Email</span>
                <span className="text-sm text-gray-500">Recibir notificaciones importantes por correo electrónico</span>
              </div>
            </label>
            <label className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/50">
              <input 
                type="checkbox" 
                checked={formData.profile.sms_notifications} 
                onChange={(e) => updateProfile({ sms_notifications: e.target.checked })} 
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 rounded border-gray-300" 
              />
              <div className="flex-1">
                <span className="text-lg font-medium text-gray-900 block">Notificaciones por SMS</span>
                <span className="text-sm text-gray-500">Recibir recordatorios y alertas por mensaje de texto</span>
              </div>
            </label>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-8 border border-red-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-red-600" />
            Seguridad
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => setShowPasswordChange(!showPasswordChange)} 
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium bg-white/80 backdrop-blur-sm"
            >
              {showPasswordChange ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPasswordChange ? 'Ocultar' : 'Cambiar Contraseña'}
            </button>
          </div>

          {showPasswordChange && (
            <div className="mt-6 space-y-4">
              <input 
                type="password" 
                value={passwordData.current_password} 
                onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
                placeholder="Contraseña actual" 
              />
              <input 
                type="password" 
                value={passwordData.new_password} 
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
                placeholder="Nueva contraseña" 
              />
              <input 
                type="password" 
                value={passwordData.confirm_password} 
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))} 
                className="w-full border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-lg bg-white/80 backdrop-blur-sm" 
                placeholder="Confirmar nueva contraseña" 
              />
              <button 
                onClick={handlePasswordChange} 
                disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password} 
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium"
              >
                {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)

const SubscriptionTab: React.FC<{
  subscription: OrganizationSubscription | null
  subscriptionUsage: SubscriptionUsage | null
  invoices: Invoice[]
  paymentMethods: PaymentMethod[]
  subscriptionLoading: boolean
  loadSubscriptionData: () => Promise<void>
}> = ({ subscription, subscriptionUsage, invoices, paymentMethods, subscriptionLoading, loadSubscriptionData }) => (
  <div className="space-y-10">
    {/* Header */}
    <div className="border-b border-gray-200 pb-6">
      <div className="flex items-center gap-3 mb-3">
        <CreditCard className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Suscripción</h2>
      </div>
      <p className="text-gray-600">Administra tu plan y configuración de facturación</p>
    </div>

    {subscriptionLoading ? (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
        </div>
        <div className="h-48 bg-gray-200 rounded-2xl"></div>
      </div>
    ) : subscription ? (
      <>
        {/* Plan Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Plan Actual</h3>
                <div className="flex items-center gap-2">
                  <p className="text-green-600 font-medium text-lg">{subscription.plan.name}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                    subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {subscription.status === 'trial' ? 'Periodo de Prueba' : 
                     subscription.status === 'active' ? 'Activa' : subscription.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              {subscription.plan.features.slice(0, 3).map((feature, index) => (
                <p key={index}>• {feature}</p>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Próximo Cobro</h3>
                <p className="text-blue-600 font-medium text-lg">
                  ${subscription.plan.price_monthly.toLocaleString('es-CL')} CLP
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>Renovación: {new Date(subscription.current_period_end).toLocaleDateString('es-CL')}</p>
              <p>Método: {paymentMethods[0]?.last_four ? `•••• ${paymentMethods[0].last_four}` : 'No configurado'}</p>
            </div>
          </div>
        </div>

        {/* Usage */}
        {subscriptionUsage && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-100">
            <h3 className="font-bold text-gray-900 text-lg mb-6">Uso del Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { 
                  label: 'Profesionales', 
                  current: subscriptionUsage.current_professionals_count, 
                  max: subscriptionUsage.plan_limits.max_professionals,
                  icon: Users,
                  color: 'blue'
                },
                { 
                  label: 'Servicios', 
                  current: subscriptionUsage.current_services_count, 
                  max: subscriptionUsage.plan_limits.max_services,
                  icon: Briefcase,
                  color: 'green'
                },
                { 
                  label: 'Clientes', 
                  current: subscriptionUsage.current_clients_count, 
                  max: subscriptionUsage.plan_limits.max_clients,
                  icon: Users,
                  color: 'purple'
                },
                { 
                  label: 'Citas/Mes', 
                  current: subscriptionUsage.current_month_appointments_count, 
                  max: subscriptionUsage.plan_limits.max_monthly_appointments,
                  icon: TrendingUp,
                  color: 'orange'
                }
              ].map((metric, index) => {
                const percentage = subscriptionService.calculateUsagePercentage(metric.current, metric.max)
                const Icon = metric.icon
                return (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-2 text-${metric.color}-600`} />
                    <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                    <p className="text-xs text-gray-500 mb-2">{metric.current} / {metric.max}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${subscriptionService.getUsageColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{percentage}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Invoice History */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-100">
          <h3 className="font-bold text-gray-900 text-lg mb-6">Historial de Facturas</h3>
          <div className="space-y-3">
            {invoices.map((invoice, i) => (
              <div key={invoice.id || i} className="flex items-center justify-between py-4 px-6 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50">
                <div>
                  <p className="font-medium text-gray-900">{invoice.date}</p>
                  <p className="text-sm text-gray-500">{invoice.plan_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{invoice.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    invoice.status === 'paid' ? 'text-green-600 bg-green-100' :
                    invoice.status === 'pending' ? 'text-orange-600 bg-orange-100' :
                    'text-red-600 bg-red-100'
                  }`}>
                    {invoice.status === 'paid' ? 'Pagada' : 
                     invoice.status === 'pending' ? 'Pendiente' : 'Fallida'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium">
            Cambiar Plan
          </button>
          <button className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium bg-white/80 backdrop-blur-sm">
            Actualizar Método de Pago
          </button>
        </div>
      </>
    ) : (
      <div className="text-center py-12">
        <Crown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No se pudo cargar la información</h3>
        <p className="text-gray-600 mb-4">Hubo un problema al obtener los datos de tu suscripción</p>
        <button 
          onClick={loadSubscriptionData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    )}
  </div>
)

export default ProfilePage