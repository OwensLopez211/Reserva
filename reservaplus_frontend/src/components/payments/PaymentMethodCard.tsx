import React, { useState } from 'react'
import { CreditCard, Star, Trash2, MoreVertical } from 'lucide-react'
import { PaymentMethod } from '../../services/paymentService'
import paymentService from '../../services/paymentService'

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod
  onUpdate: () => void
  onError: (error: string) => void
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ 
  paymentMethod, 
  onUpdate, 
  onError 
}) => {
  const [loading, setLoading] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleSetDefault = async () => {
    try {
      setLoading(true)
      await paymentService.setDefaultPaymentMethod(paymentMethod.id)
      onUpdate()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al establecer método por defecto')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método de pago?')) {
      return
    }

    try {
      setLoading(true)
      await paymentService.deletePaymentMethod(paymentMethod.id)
      onUpdate()
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error al eliminar método de pago')
    } finally {
      setLoading(false)
    }
  }

  const getCardBrandIcon = (brand: string) => {
    // Aquí puedes agregar iconos específicos para cada marca
    return <CreditCard className="h-6 w-6" />
  }

  const getCardBrandColor = (brand: string) => {
    const colors = {
      'visa': 'from-blue-500 to-blue-600',
      'mastercard': 'from-red-500 to-orange-500',
      'amex': 'from-green-500 to-teal-500',
      'default': 'from-gray-500 to-gray-600'
    }
    return colors[brand.toLowerCase() as keyof typeof colors] || colors.default
  }

  return (
    <div className={`relative bg-gradient-to-r ${getCardBrandColor(paymentMethod.card_brand)} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
      paymentMethod.is_default ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
    }`}>
      
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getCardBrandIcon(paymentMethod.card_brand)}
          <span className="font-semibold text-lg capitalize">
            {paymentMethod.card_brand}
          </span>
        </div>
        
        {/* Default Badge */}
        {paymentMethod.is_default && (
          <div className="flex items-center gap-1 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
            <Star className="h-3 w-3" />
            Por defecto
          </div>
        )}
        
        {/* Actions Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            disabled={loading}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showActions && (
            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[150px]">
              {!paymentMethod.is_default && (
                <button
                  onClick={handleSetDefault}
                  disabled={loading}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Establecer por defecto
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Number */}
      <div className="mb-6">
        <div className="text-xl font-mono tracking-wider">
          •••• •••• •••• {paymentMethod.card_last_four_digits}
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs opacity-75 uppercase tracking-wide">
            Titular
          </div>
          <div className="font-medium truncate">
            {paymentMethod.card_holder_name}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs opacity-75 uppercase tracking-wide">
            Expira
          </div>
          <div className="font-medium">
            {paymentMethod.expiration_month.toString().padStart(2, '0')}/
            {paymentMethod.expiration_year.toString().slice(-2)}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  )
}

export default PaymentMethodCard