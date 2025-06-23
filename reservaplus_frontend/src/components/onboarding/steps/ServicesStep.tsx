// src/components/onboarding/steps/ServicesStep.tsx
import React from 'react'
import { Briefcase } from 'lucide-react'

interface ServiceData {
  name: string
  description: string
  category: string
  duration_minutes: number
  price: number
  buffer_time_after: number
}

interface ServicesStepProps {
  services: ServiceData[]
  industryTemplate: string
  onAdd: (suggested?: Partial<ServiceData>) => void
  onUpdate: (index: number, field: keyof ServiceData, value: ServiceData[keyof ServiceData]) => void
  onRemove: (index: number) => void
}

const ServicesStep: React.FC<ServicesStepProps> = ({
  services,
  industryTemplate,
  onAdd,
  onUpdate,
  onRemove
}) => {
  const getSuggestedServices = (industry: string) => {
    const suggestions = {
      salon: [
        { name: 'Corte de Cabello', duration_minutes: 45, price: 15000, category: 'Cabello' },
        { name: 'Peinado', duration_minutes: 30, price: 12000, category: 'Cabello' },
        { name: 'Tinte', duration_minutes: 90, price: 35000, category: 'Color' },
        { name: 'Manicure', duration_minutes: 30, price: 8000, category: 'Uñas' }
      ],
      clinic: [
        { name: 'Consulta General', duration_minutes: 30, price: 25000, category: 'Consultas' },
        { name: 'Control', duration_minutes: 20, price: 15000, category: 'Controles' },
        { name: 'Procedimiento Menor', duration_minutes: 45, price: 40000, category: 'Procedimientos' }
      ],
      spa: [
        { name: 'Masaje Relajante', duration_minutes: 60, price: 30000, category: 'Masajes' },
        { name: 'Facial Hidratante', duration_minutes: 45, price: 25000, category: 'Faciales' },
        { name: 'Tratamiento Corporal', duration_minutes: 90, price: 45000, category: 'Corporales' }
      ],
      dental: [
        { name: 'Consulta Dental', duration_minutes: 30, price: 20000, category: 'Consultas' },
        { name: 'Limpieza Dental', duration_minutes: 45, price: 35000, category: 'Prevención' },
        { name: 'Empaste', duration_minutes: 60, price: 50000, category: 'Restauración' }
      ]
    }
    return suggestions[industry as keyof typeof suggestions] || suggestions.salon
  }

  const suggested = getSuggestedServices(industryTemplate)

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Briefcase className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Servicios que Ofreces</h2>
        <p className="text-gray-600">Define los servicios de tu negocio</p>
      </div>

      {suggested.length > 0 && services.length === 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3">Servicios sugeridos para tu industria:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggested.map((service, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onAdd(service)}
                className="p-3 bg-white border border-blue-200 rounded-lg text-left hover:border-blue-300 transition-colors"
              >
                <div className="font-medium text-gray-900">{service.name}</div>
                <div className="text-sm text-gray-600">
                  {service.duration_minutes} min - ${service.price.toLocaleString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {services.map((service, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del servicio *
                </label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value as ServiceData[keyof ServiceData])}
                  className="input-field"
                  placeholder="Corte de cabello"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={service.category}
                  onChange={(e) => onUpdate(index, 'category', e.target.value as ServiceData[keyof ServiceData])}
                  className="input-field"
                  placeholder="Cabello, Uñas, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración (min) *
                </label>
                <input
                  type="number"
                  value={service.duration_minutes}
                  onChange={(e) => onUpdate(index, 'duration_minutes', parseInt(e.target.value) as ServiceData[keyof ServiceData])}
                  className="input-field"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio ($) *
                </label>
                <input
                  type="number"
                  value={service.price}
                  onChange={(e) => onUpdate(index, 'price', parseInt(e.target.value) as ServiceData[keyof ServiceData])}
                  className="input-field"
                  placeholder="15000"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={service.description}
                  onChange={(e) => onUpdate(index, 'description', e.target.value as ServiceData[keyof ServiceData])}
                  className="input-field"
                  rows={2}
                  placeholder="Descripción detallada del servicio..."
                />
              </div>
            </div>
            {services.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="mt-3 text-red-600 text-sm hover:text-red-800"
              >
                Eliminar servicio
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAdd()}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
      >
        <Briefcase className="w-5 h-5 mx-auto mb-1" />
        Agregar otro servicio
      </button>
    </div>
  )
}

export default ServicesStep