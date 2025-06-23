// src/components/onboarding/steps/ProfessionalsStep.tsx
import React from 'react'
import { Users, UserPlus } from 'lucide-react'

interface ProfessionalData {
  name: string
  email: string
  phone: string
  specialty: string
  color_code: string
  accepts_walk_ins: boolean
}

interface ProfessionalsStepProps {
  professionals: ProfessionalData[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof ProfessionalData, value: ProfessionalData[keyof ProfessionalData]) => void
  onRemove: (index: number) => void
}

const ProfessionalsStep: React.FC<ProfessionalsStepProps> = ({
  professionals,
  onAdd,
  onUpdate,
  onRemove
}) => {
  const professionalColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
    '#795548', '#607D8B', '#E91E63', '#00BCD4', '#CDDC39'
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Users className="w-12 h-12 text-primary-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Tu Equipo de Trabajo</h2>
        <p className="text-gray-600">Agrega a los profesionales que trabajarán contigo</p>
      </div>

      <div className="space-y-4">
        {professionals.map((professional, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={professional.name}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  className="input-field"
                  placeholder="Ana García"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={professional.email}
                  onChange={(e) => onUpdate(index, 'email', e.target.value)}
                  className="input-field"
                  placeholder="ana@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <input
                  type="text"
                  value={professional.specialty}
                  onChange={(e) => onUpdate(index, 'specialty', e.target.value)}
                  className="input-field"
                  placeholder="Estilista, Doctor, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color en calendario
                </label>
                <div className="flex space-x-2">
                  {professionalColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onUpdate(index, 'color_code', color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        professional.color_code === color ? 'border-gray-600' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={professional.accepts_walk_ins}
                    onChange={(e) => onUpdate(index, 'accepts_walk_ins', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Acepta clientes sin cita previa</span>
                </label>
              </div>
            </div>
            {professionals.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="mt-3 text-red-600 text-sm hover:text-red-800"
              >
                Eliminar profesional
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
      >
        <UserPlus className="w-5 h-5 mx-auto mb-1" />
        Agregar otro profesional
      </button>
    </div>
  )
}

export default ProfessionalsStep
