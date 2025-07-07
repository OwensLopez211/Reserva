import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, Mail, Phone, Calendar, Building, Save, RefreshCw, AlertCircle, CheckCircle, Eye, EyeOff, Camera, MapPin, CreditCard, Crown, Shield, TrendingUp, Users, Briefcase } from 'lucide-react'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto animate-pulse">
          <div className="h-8 bg-white/60 rounded-xl w-1/4 mb-4"></div>
          <div className="h-12 bg-white/60 rounded-xl mb-6"></div>
          <div className="bg-white/60 rounded-2xl p-8 space-y-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-gray-200/60 rounded-xl"></div>)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            Configuración de Cuenta
          </h1>
          <p className="text-gray-600 mt-2">Gestiona tu perfil y suscripción</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl mb-6">
          <div className="flex border-b border-gray-100">
            {[
              { id: 'profile', label: 'Mi Perfil', icon: User },
              ...(profile?.role === 'owner' ? [{ id: 'subscription', label: 'Suscripción', icon: CreditCard }] : [])
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'profile' | 'subscription')}
                  className={`flex items-center gap-3 px-6 py-4 font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Messages */}
          {(error || success) && (
            <div className={`m-6 rounded-xl p-4 border ${error ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center gap-3">
                {error ? <AlertCircle className="h-5 w-5 text-red-600" /> : <CheckCircle className="h-5 w-5 text-green-600" />}
                <p className={error ? 'text-red-700' : 'text-green-700'}>{error || success}</p>
                <button onClick={() => { setError(null); setSuccess(null) }} className="ml-auto text-gray-400 hover:text-gray-600">×</button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {activeTab === 'profile' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 text-center">
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
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                      <input type="text" value={formData.first_name} onChange={(e) => updateFormData({ first_name: e.target.value })} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Tu nombre" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                      <input type="text" value={formData.last_name} onChange={(e) => updateFormData({ last_name: e.target.value })} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Tu apellido" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="tel" value={formData.phone} onChange={(e) => updateFormData({ phone: e.target.value })} 
                          className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="+56 9 1234 5678" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                      <input type="date" value={formData.profile.birth_date} onChange={(e) => updateProfile({ birth_date: e.target.value })} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <textarea value={formData.profile.address} onChange={(e) => updateProfile({ address: e.target.value })} rows={3}
                        className="w-full pl-10 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="Tu dirección completa" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                      <select value={formData.profile.timezone} onChange={(e) => updateProfile({ timezone: e.target.value })} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        {timezoneOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                      <select value={formData.profile.language} onChange={(e) => updateProfile({ language: e.target.value })} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        {languageOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Notificaciones</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={formData.profile.email_notifications} onChange={(e) => updateProfile({ email_notifications: e.target.checked })} 
                          className="text-blue-600 focus:ring-blue-500 rounded" />
                        <span className="text-sm text-gray-700">Recibir notificaciones por email</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" checked={formData.profile.sms_notifications} onChange={(e) => updateProfile({ sms_notifications: e.target.checked })} 
                          className="text-blue-600 focus:ring-blue-500 rounded" />
                        <span className="text-sm text-gray-700">Recibir notificaciones por SMS</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleSave} disabled={saving} 
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-medium">
                      {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                    <button onClick={() => setShowPasswordChange(!showPasswordChange)} 
                      className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium">
                      {showPasswordChange ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPasswordChange ? 'Ocultar' : 'Cambiar Contraseña'}
                    </button>
                  </div>

                  {showPasswordChange && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Cambiar Contraseña</h4>
                      <div className="space-y-4">
                        <input type="password" value={passwordData.current_password} onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))} 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Contraseña actual" />
                        <input type="password" value={passwordData.new_password} onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))} 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Nueva contraseña" />
                        <input type="password" value={passwordData.confirm_password} onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))} 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all" placeholder="Confirmar nueva contraseña" />
                        <button onClick={handlePasswordChange} disabled={saving || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password} 
                          className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all font-medium">
                          {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Subscription Tab */
              <div className="max-w-4xl mx-auto">
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
                    <div className="text-center mb-8">
                      <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Suscripción</h2>
                      <p className="text-gray-600">Administra tu plan y facturación</p>
                    </div>

                    {/* Información del Plan y Próximo Cobro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <Shield className="h-8 w-8 text-green-600" />
                          <div>
                            <h3 className="font-bold text-gray-900">Plan Actual</h3>
                            <div className="flex items-center gap-2">
                              <p className="text-green-600 font-medium">{subscription.plan.name}</p>
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

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <CreditCard className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-bold text-gray-900">Próximo Cobro</h3>
                            <p className="text-blue-600 font-medium">
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

                    {/* Uso del Plan */}
                    {subscriptionUsage && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
                        <h3 className="font-bold text-gray-900 mb-4">Uso del Plan</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                              <div key={index} className="text-center">
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

                    {/* Historial de Facturas */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6">
                      <h3 className="font-bold text-gray-900 mb-4">Historial de Facturas</h3>
                      <div className="space-y-3">
                        {invoices.map((invoice, i) => (
                          <div key={invoice.id || i} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
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

                    <div className="flex flex-col sm:flex-row gap-3 mt-6">
                      <button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium">
                        Cambiar Plan
                      </button>
                      <button className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all font-medium">
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage