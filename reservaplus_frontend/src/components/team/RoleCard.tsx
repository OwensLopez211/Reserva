import React from 'react'
import { CheckCircle, Crown, Shield, UserCheck, Users, Briefcase } from 'lucide-react'
import { UserRole } from '../../services/userService'

interface RoleCardProps {
  role: UserRole
}

const RoleCard: React.FC<RoleCardProps> = ({ role }) => {
  const icons = {
    owner: Crown,
    admin: Shield,
    professional: UserCheck,
    reception: Users,
    staff: Briefcase
  }
  
  const Icon = icons[role.id as keyof typeof icons] || Briefcase

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r from-${role.color}-500 to-${role.color}-600 p-6 relative min-h-[100px]`}>
        <div className="flex items-start justify-between h-full">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{role.name}</h3>
            </div>
          </div>
          {!role.editable && (
            <span className="text-xs text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
              No editable
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">{role.description}</p>
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Permisos incluidos
          </h4>
          <div className="space-y-2">
            {role.permissions.slice(0, 3).map((permission, index) => (
              <div key={index} className="flex items-start text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{permission}</span>
              </div>
            ))}
            {role.permissions.length > 3 && (
              <div className="text-xs text-gray-500 pl-6">
                +{role.permissions.length - 3} permisos más
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleCard