import React, { useState, useEffect } from 'react'
import { 
  X, 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  CheckCircle,
  Copy,
  Loader2
} from 'lucide-react'
import { User as UserType, UserRole, CreateUserData, UpdateUserData, CreateUserResponse } from '../../services/userService'
import userService from '../../services/userService'

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  user?: UserType
  onSave: (userData: CreateUserData | UpdateUserData) => Promise<void | CreateUserResponse>
  roles: UserRole[]
  isLoading: boolean
}

const UserModal: React.FC<UserModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onSave, 
  roles, 
  isLoading 
}) => {
  const [formData, setFormData] = useState<CreateUserData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'staff',
    is_professional: false
  })
  const [errors, setErrors] = useState<string[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPasswordAlert, setShowPasswordAlert] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone || '',
        role: user.role === 'owner' ? 'admin' : user.role,
        is_professional: user.is_professional
      })
    } else {
      setFormData({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        role: 'staff',
        is_professional: false
      })
    }
    setErrors([])
    setFieldErrors({})
    setGeneratedPassword(null)
    setShowPasswordAlert(false)
    setPasswordCopied(false)
    setEmailChecking(false)
  }, [user, isOpen])

  // Auto-generate username when creating new user
  useEffect(() => {
    if (!user && formData.first_name && formData.last_name) {
      const generatedUsername = userService.generateUsername(formData.first_name, formData.last_name)
      setFormData(prev => ({ ...prev, username: generatedUsername }))
    }
  }, [formData.first_name, formData.last_name, user])

  const handleInputChange = (field: keyof CreateUserData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Auto-set is_professional when role is 'professional'
      if (field === 'role' && value === 'professional') {
        newData.is_professional = true
      }
      // Auto-unset is_professional when role is not 'professional' (unless manually checked)
      else if (field === 'role' && value !== 'professional' && prev.role === 'professional') {
        newData.is_professional = false
      }
      
      return newData
    })
    
    // Clear specific field error when user starts typing
    setFieldErrors(prev => ({ ...prev, [field]: [] }))
    setErrors(prev => prev.filter(error => !error.toLowerCase().includes(field.toLowerCase())))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])
    setFieldErrors({})

    // Validate form data
    const validationErrors = userService.validateUserData(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (user) {
        // Update existing user
        const updateData: UpdateUserData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          is_professional: formData.is_professional
        }
        await onSave(updateData)
        onClose()
      } else {
        // Create new user
        const result = await userService.createUser(formData)
        
        // Si se generó una contraseña temporal, mostrarla
        if (result.temp_password) {
          setGeneratedPassword(result.temp_password)
          setShowPasswordAlert(true)
        } else {
          onClose()
        }
      }
    } catch (error: unknown) {
      // Handle different types of errors
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: Record<string, unknown> } }).response
        if (response?.data) {
          const data = response.data
          
          // Handle field-specific errors
          if (typeof data === 'object' && !Array.isArray(data)) {
            const newFieldErrors: Record<string, string[]> = {}
            const generalErrors: string[] = []
            
                           for (const [field, messages] of Object.entries(data)) {
                 if (field === 'non_field_errors') {
                   generalErrors.push(...(Array.isArray(messages) ? messages.map(String) : [String(messages)]))
                 } else {
                   newFieldErrors[field] = Array.isArray(messages) ? messages.map(String) : [String(messages)]
                 }
               }
            
            setFieldErrors(newFieldErrors)
            setErrors(generalErrors)
            return
          }
          
          // Handle single error message
          if (data.detail) {
            setErrors([String(data.detail)])
            return
          }
        }
      }
      
      // Fallback error message
      setErrors(['Error al guardar usuario'])
    }
  }

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword)
        setPasswordCopied(true)
        setTimeout(() => setPasswordCopied(false), 2000)
      } catch (err) {
        console.error('Error copying password:', err)
      }
    }
  }

  const handleCompleteCreation = () => {
    setShowPasswordAlert(false)
    setGeneratedPassword(null)
    onClose()
    // Reload users in parent component
    window.location.reload()
  }

  const getFieldError = (field: string): string | null => {
    const error = fieldErrors[field]
    return error && error.length > 0 ? error[0] : null
  }

  const handleEmailBlur = async (email: string) => {
    if (!email || !email.includes('@')) return
    
    // Si estamos editando y el email no cambió, no verificar
    if (user && user.email === email) return
    
    setEmailChecking(true)
    
    try {
      const exists = await userService.checkEmailExists(email)
      if (exists) {
        setFieldErrors(prev => ({ 
          ...prev, 
          email: ['Este email ya está registrado en la plataforma.'] 
        }))
      } else {
        setFieldErrors(prev => ({ 
          ...prev, 
          email: [] 
        }))
      }
    } catch (error) {
      console.error('Error verificando email:', error)
    } finally {
      setEmailChecking(false)
    }
  }



  if (!isOpen) return null

  const isEditing = !!user

  // Password generated alert
  if (showPasswordAlert && generatedPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 text-white rounded-t-2xl">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-bold">¡Usuario Creado Exitosamente!</h3>
                <p className="text-green-100 text-sm">Se ha generado una contraseña temporal</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">
                La contraseña temporal para <strong>{formData.first_name} {formData.last_name}</strong> es:
              </p>
              
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-between">
                <code className="text-lg font-mono text-gray-800 select-all">
                  {generatedPassword}
                </code>
                <button
                  onClick={handleCopyPassword}
                  className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copiar contraseña"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              
              {passwordCopied && (
                <p className="text-green-600 text-sm mt-2">¡Contraseña copiada al portapapeles!</p>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Importante:</strong> Esta contraseña es temporal. El usuario deberá cambiarla en su primer inicio de sesión.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleCompleteCreation}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                <p className="text-emerald-100 text-sm">
                  {isEditing ? 'Modifica la información del usuario' : 'Completa los datos del nuevo miembro del equipo'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-white/80 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Se encontraron los siguientes errores:
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Info Alert for New Users */}
          {!isEditing && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Contraseña Automática
                  </h4>
                  <p className="text-sm text-blue-700">
                    Se generará automáticamente una contraseña temporal para el nuevo usuario. 
                    La contraseña se mostrará al completar el registro.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                Información Personal
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      getFieldError('first_name') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ingresa el nombre"
                  />
                  {getFieldError('first_name') && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('first_name')}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      getFieldError('last_name') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ingresa el apellido"
                  />
                  {getFieldError('last_name') && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {getFieldError('last_name')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                      getFieldError('username') ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="usuario123"
                  />
                </div>
                {getFieldError('username') ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('username')}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500">
                    Se genera automáticamente basado en el nombre y apellido
                  </p>
                )}
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Mail className="w-4 h-4 text-green-600" />
                </div>
                Información de Contacto
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={(e) => handleEmailBlur(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                        getFieldError('email') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="correo@ejemplo.com"
                    />
                    {emailChecking && (
                      <p className="mt-1 text-sm text-blue-600 flex items-center">
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        Verificando email...
                      </p>
                    )}
                    {getFieldError('email') && !emailChecking && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {getFieldError('email')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Role and Permissions Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                Rol y Permisos
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol del Usuario <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value as CreateUserData['role'])}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    {roles.filter(role => role.editable).map(role => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Role description */}
                  {roles.find(r => r.id === formData.role) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">
                        {roles.find(r => r.id === formData.role)?.description}
                      </p>
                      {formData.role === 'professional' && (
                        <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                          <p className="text-xs text-emerald-700 font-medium">
                            ✨ Se creará automáticamente:
                          </p>
                          <ul className="text-xs text-emerald-600 mt-1 space-y-1">
                            <li>• Perfil profesional completo</li>
                            <li>• Configuración de horarios básica</li>
                            <li>• Disponibilidad para reservas</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_professional"
                        checked={formData.is_professional}
                        onChange={(e) => handleInputChange('is_professional', e.target.checked)}
                        disabled={formData.role === 'professional'}
                        className={`w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300 ${
                          formData.role === 'professional' ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <label htmlFor="is_professional" className={`ml-3 text-sm font-medium ${
                        formData.role === 'professional' ? 'text-gray-500' : 'text-gray-900'
                      }`}>
                        Es profesional
                      </label>
                      {formData.role === 'professional' && (
                        <span className="ml-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          Automático
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 ml-8">
                      {formData.role === 'professional' 
                        ? 'Se creará automáticamente un perfil profesional completo con horarios'
                        : 'Los profesionales pueden gestionar servicios y atender clientes'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl hover:from-emerald-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
              >
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default UserModal 