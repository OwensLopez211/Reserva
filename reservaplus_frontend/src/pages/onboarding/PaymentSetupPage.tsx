// src/pages/onboarding/PaymentSetupPage.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CreditCard, Building, Shield, Check, AlertCircle, Lock, Star } from 'lucide-react'

interface PaymentData {
  paymentMethod: 'card' | 'transfer'
  billingInfo: {
    company_name: string
    tax_id: string
    address: string
    city: string
    country: string
  }
  cardInfo?: {
    number: string
    expiry: string
    cvc: string
    name: string
  }
}

const PaymentSetupPage: React.FC = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: 'card',
    billingInfo: {
      company_name: '',
      tax_id: '',
      address: '',
      city: '',
      country: 'Chile'
    },
    cardInfo: {
      number: '',
      expiry: '',
      cvc: '',
      name: ''
    }
  })

  useEffect(() => {
    // Cargar datos del plan y registro
    const planData = localStorage.getItem('selectedPlan')
    const registrationData = localStorage.getItem('registrationData')
    
    if (planData) {
      setSelectedPlan(JSON.parse(planData))
    }
    
    if (registrationData) {
      const regData = JSON.parse(registrationData)
      setPaymentData(prev => ({
        ...prev,
        billingInfo: {
          ...prev.billingInfo,
          company_name: regData.organizationName,
          address: regData.address || '',
          city: regData.city || '',
          country: regData.country || 'Chile'
        }
      }))
    } else {
      navigate('/onboarding/register')
    }
  }, [navigate])

  const updatePaymentData = (section: 'paymentMethod' | 'billingInfo' | 'cardInfo', field: string, value: string) => {
    if (section === 'paymentMethod') {
      setPaymentData(prev => ({ ...prev, paymentMethod: value as 'card' | 'transfer' }))
    } else if (section === 'billingInfo') {
      setPaymentData(prev => ({
        ...prev,
        billingInfo: { ...prev.billingInfo, [field]: value }
      }))
    } else if (section === 'cardInfo') {
      setPaymentData(prev => ({
        ...prev,
        cardInfo: { ...prev.cardInfo!, [field]: value }
      }))
    }

    // Limpiar errores
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = cleaned.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
      return parts.join(' ')
    } else {
      return cleaned
    }
  }

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4)
    }
    return cleaned
  }

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {}

    // Validar información de facturación
    if (!paymentData.billingInfo.company_name.trim()) {
      newErrors.company_name = 'El nombre de la empresa es requerido'
    }
    if (!paymentData.billingInfo.tax_id.trim()) {
      newErrors.tax_id = 'El RUT/NIT es requerido'
    }
    if (!paymentData.billingInfo.address.trim()) {
      newErrors.address = 'La dirección es requerida'
    }
    if (!paymentData.billingInfo.city.trim()) {
      newErrors.city = 'La ciudad es requerida'
    }

    // Validar información de tarjeta si es el método seleccionado
    if (paymentData.paymentMethod === 'card' && paymentData.cardInfo) {
      if (!paymentData.cardInfo.name.trim()) {
        newErrors.card_name = 'El nombre del titular es requerido'
      }
      if (!paymentData.cardInfo.number.replace(/\s/g, '')) {
        newErrors.card_number = 'El número de tarjeta es requerido'
      } else if (paymentData.cardInfo.number.replace(/\s/g, '').length < 13) {
        newErrors.card_number = 'Número de tarjeta inválido'
      }
      if (!paymentData.cardInfo.expiry || paymentData.cardInfo.expiry.length < 5) {
        newErrors.card_expiry = 'La fecha de vencimiento es requerida'
      }
      if (!paymentData.cardInfo.cvc || paymentData.cardInfo.cvc.length < 3) {
        newErrors.card_cvc = 'El código CVC es requerido'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Guardar datos de pago
      const existingData = JSON.parse(localStorage.getItem('onboardingData') || '{}')
      localStorage.setItem('onboardingData', JSON.stringify({
        ...existingData,
        paymentData: paymentData
      }))

      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Navegar a la página de bienvenida
      navigate('/onboarding/welcome')
    } catch (error) {
      console.error('Error al procesar pago:', error)
      setErrors({ submit: 'Error al procesar el pago. Por favor intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/onboarding/organization')
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3">
                <span className="text-white font-light text-lg">+</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Reserva+</h1>
            </div>
            <div className="text-sm text-gray-500">
              Paso 5 de 6
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="w-full bg-gray-200 h-2">
            <div className="w-5/6 bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 transition-all duration-500"></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Configuración de{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Pago
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Configure su método de pago y complete su suscripción
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulario de Pago */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-2xl border p-8">
              
              {/* Método de Pago */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Método de Pago</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => updatePaymentData('paymentMethod', '', 'card')}
                    className={`p-6 border-2 rounded-xl transition-all ${
                      paymentData.paymentMethod === 'card'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className={`w-8 h-8 mx-auto mb-3 ${
                      paymentData.paymentMethod === 'card' ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900">Tarjeta de Crédito/Débito</h4>
                      <p className="text-sm text-gray-500 mt-1">Pago inmediato y seguro</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updatePaymentData('paymentMethod', '', 'transfer')}
                    className={`p-6 border-2 rounded-xl transition-all ${
                      paymentData.paymentMethod === 'transfer'
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building className={`w-8 h-8 mx-auto mb-3 ${
                      paymentData.paymentMethod === 'transfer' ? 'text-emerald-600' : 'text-gray-400'
                    }`} />
                    <div className="text-center">
                      <h4 className="font-semibold text-gray-900">Transferencia Bancaria</h4>
                      <p className="text-sm text-gray-500 mt-1">Proceso manual, 1-2 días</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Información de Facturación */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Información de Facturación</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={paymentData.billingInfo.company_name}
                      onChange={(e) => updatePaymentData('billingInfo', 'company_name', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.company_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nombre de su empresa"
                    />
                    {errors.company_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.company_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT/NIT Empresa *
                    </label>
                    <input
                      type="text"
                      value={paymentData.billingInfo.tax_id}
                      onChange={(e) => updatePaymentData('billingInfo', 'tax_id', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.tax_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="12.345.678-9"
                    />
                    {errors.tax_id && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.tax_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={paymentData.billingInfo.address}
                      onChange={(e) => updatePaymentData('billingInfo', 'address', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Dirección de facturación"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.address}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={paymentData.billingInfo.city}
                      onChange={(e) => updatePaymentData('billingInfo', 'city', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Ciudad"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <select
                      value={paymentData.billingInfo.country}
                      onChange={(e) => updatePaymentData('billingInfo', 'country', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Chile">Chile</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Colombia">Colombia</option>
                      <option value="Perú">Perú</option>
                      <option value="México">México</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Información de Tarjeta */}
              {paymentData.paymentMethod === 'card' && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Información de Tarjeta</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Titular *
                      </label>
                      <input
                        type="text"
                        value={paymentData.cardInfo?.name || ''}
                        onChange={(e) => updatePaymentData('cardInfo', 'name', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.card_name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Nombre como aparece en la tarjeta"
                      />
                      {errors.card_name && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.card_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Tarjeta *
                      </label>
                      <input
                        type="text"
                        value={paymentData.cardInfo?.number || ''}
                        onChange={(e) => updatePaymentData('cardInfo', 'number', formatCardNumber(e.target.value))}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          errors.card_number ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      {errors.card_number && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.card_number}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Vencimiento *
                        </label>
                        <input
                          type="text"
                          value={paymentData.cardInfo?.expiry || ''}
                          onChange={(e) => updatePaymentData('cardInfo', 'expiry', formatExpiry(e.target.value))}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors.card_expiry ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="MM/AA"
                          maxLength={5}
                        />
                        {errors.card_expiry && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.card_expiry}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Código CVC *
                        </label>
                        <input
                          type="text"
                          value={paymentData.cardInfo?.cvc || ''}
                          onChange={(e) => updatePaymentData('cardInfo', 'cvc', e.target.value.replace(/\D/g, ''))}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            errors.card_cvc ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.card_cvc && (
                          <p className="mt-1 text-sm text-red-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.card_cvc}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transferencia Bancaria Info */}
              {paymentData.paymentMethod === 'transfer' && (
                <div className="mb-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-3">Instrucciones para Transferencia</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p>Después de completar el registro, recibirá las instrucciones de pago por email.</p>
                    <p>Su cuenta será activada dentro de 1-2 días hábiles una vez confirmado el pago.</p>
                    <p>Puede comenzar a usar la plataforma inmediatamente con el período de prueba.</p>
                  </div>
                </div>
              )}

              {/* Error general */}
              {errors.submit && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {errors.submit}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Resumen del Plan */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl border p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Plan Básico</h3>
                <p className="text-sm text-gray-500">14 días de prueba gratuita</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan mensual</span>
                  <span className="font-semibold">${selectedPlan.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prueba gratuita</span>
                  <span className="text-emerald-600 font-semibold">14 días</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total hoy</span>
                    <span className="text-2xl font-bold text-emerald-600">$0</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Se cobrará ${selectedPlan.price?.toLocaleString()} el {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  1 Usuario Admin
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  1 Recepcionista
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  3 Profesionales
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  500 citas/mes
                </div>
                <div className="flex items-center text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  Soporte incluido
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Pago seguro con encriptación SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handleBack}
            className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a Configuración
          </button>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                <Lock className="w-5 h-5 mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 mr-2" />
                Completar Registro
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </div>

        {/* Security Notice */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-xl shadow-lg border">
            <Shield className="w-6 h-6 text-green-600 mr-3" />
            <div className="text-left">
              <div className="font-medium text-gray-900">Pago 100% Seguro</div>
              <div className="text-sm text-gray-600">Encriptación SSL de nivel bancario</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentSetupPage