// src/components/onboarding/steps/OrganizationStep.tsx
import React from 'react'
import { Building2 } from 'lucide-react'

interface OrganizationData {
  name: string
  industry_template: string
  email: string
  phone: string
  address: string
  city: string
  country: string
}

interface OrganizationStepProps {
  data: OrganizationData
  onUpdate: (field: keyof OrganizationData, value: string) => void
  onSelectIndustry: (template: string) => void
}

const OrganizationStep: React.FC<OrganizationStepProps> = ({ 
  data, 
  onUpdate, 
  onSelectIndustry 
}) => {
  const industryTemplates = [
    { value: 'salon', label: 'Peluquería/Salón de Belleza', icon: '💇‍♀️' },
    { value: 'clinic', label: 'Clínica/Consultorio Médico', icon: '🏥' },
    { value: 'fitness', label: 'Entrenamiento Personal/Fitness', icon: '💪' },
    { value: 'spa', label: 'Spa/Centro de Bienestar', icon: '🧘‍♀️' },
    { value: 'dental', label: 'Clínica Dental', icon: '🦷' },
    { value: 'veterinary', label: 'Veterinaria', icon: '🐕' },
    { value: 'beauty', label: 'Centro de Estética', icon: '✨' },
    { value: 'massage', label: 'Centro de Masajes', icon: '💆‍♀️' },
    { value: 'other', label: 'Otro', icon: '🏢' }
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building2 className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Información de tu Organización</h2>
        <p className="text-gray-600">Cuéntanos sobre tu negocio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de tu negocio *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className="input-field"
            placeholder="Ej: Salón María"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de negocio *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {industryTemplates.map((template) => (
              <button
                key={template.value}
                type="button"
                onClick={() => onSelectIndustry(template.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  data.industry_template === template.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">{template.icon}</div>
                <div className="text-sm font-medium">{template.label}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email de contacto *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => onUpdate('email', e.target.value)}
            className="input-field"
            placeholder="contacto@tunegocio.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onUpdate('phone', e.target.value)}
            className="input-field"
            placeholder="+56 9 1234 5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <input
            type="text"
            value={data.address}
            onChange={(e) => onUpdate('address', e.target.value)}
            className="input-field"
            placeholder="Av. Principal 123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad
          </label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onUpdate('city', e.target.value)}
            className="input-field"
            placeholder="Santiago"
          />
        </div>
      </div>
    </div>
  )
}

export default OrganizationStep