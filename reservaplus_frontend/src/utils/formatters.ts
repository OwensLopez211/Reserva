// src/utils/formatters.ts - Funciones de formateo para la aplicación

/**
 * Formatea un precio en formato chileno (punto como separador de miles)
 * Ejemplo: 29990 -> "29.990"
 */
export const formatPrice = (price: number | string): string => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price
  
  if (isNaN(numericPrice)) {
    return '0'
  }
  
  // Usar toLocaleString con configuración para Chile
  return numericPrice.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Formatea un precio con símbolo de moneda en formato chileno
 * Ejemplo: 29990 -> "$29.990"
 */
export const formatPriceWithSymbol = (price: number | string): string => {
  const formattedPrice = formatPrice(price)
  return `$${formattedPrice}`
}

/**
 * Formatea un precio con período en formato chileno
 * Ejemplo: (29990, '/mes') -> "$29.990/mes"
 */
export const formatPriceWithPeriod = (price: number | string, period: string): string => {
  const formattedPrice = formatPrice(price)
  return `$${formattedPrice}${period}`
}

/**
 * Formatea miles en formato chileno (para casos generales)
 * Ejemplo: 1500 -> "1.500"
 */
export const formatNumber = (number: number | string): string => {
  const numericValue = typeof number === 'string' ? parseFloat(number) : number
  
  if (isNaN(numericValue)) {
    return '0'
  }
  
  return numericValue.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Formatea número de teléfono chileno en tiempo real
 * Ejemplo: "56912345678" -> "+56 9 1234 5678"
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remover todos los caracteres no numéricos
  const cleaned = phone.replace(/\D/g, '')
  
  // Si está vacío, retornar vacío
  if (!cleaned) return ''
  
  // Si empieza con 56, formatear como número chileno
  if (cleaned.startsWith('56')) {
    if (cleaned.length <= 2) return `+${cleaned}`
    if (cleaned.length <= 3) return `+${cleaned.slice(0, 2)} ${cleaned.slice(2)}`
    if (cleaned.length <= 7) return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3)}`
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7, 11)}`
  }
  
  // Si empieza con 9 (celular sin código país)
  if (cleaned.startsWith('9')) {
    if (cleaned.length <= 1) return `+56 ${cleaned}`
    if (cleaned.length <= 5) return `+56 ${cleaned.slice(0, 1)} ${cleaned.slice(1)}`
    return `+56 ${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5, 9)}`
  }
  
  // Para otros números, agregar +56 automáticamente
  if (cleaned.length <= 4) return `+56 ${cleaned}`
  if (cleaned.length <= 8) return `+56 ${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
  return `+56 ${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)}`
}

/**
 * Obtiene solo los números del teléfono (para enviar al backend)
 * Ejemplo: "+56 9 1234 5678" -> "56912345678"
 */
export const getPhoneNumbers = (formattedPhone: string): string => {
  return formattedPhone.replace(/\D/g, '')
}

/**
 * Formatea precio en tiempo real mientras el usuario escribe
 * Ejemplo: "29990" -> "29.990"
 */
export const formatPriceInput = (value: string): string => {
  // Remover todo excepto números
  const numbers = value.replace(/\D/g, '')
  
  if (!numbers) return ''
  
  // Convertir a número y formatear
  const numericValue = parseInt(numbers)
  return formatPrice(numericValue)
}

/**
 * Obtiene el valor numérico de un precio formateado
 * Ejemplo: "29.990" -> 29990
 */
export const getPriceNumber = (formattedPrice: string): number => {
  const numbers = formattedPrice.replace(/\D/g, '')
  return numbers ? parseInt(numbers) : 0
} 