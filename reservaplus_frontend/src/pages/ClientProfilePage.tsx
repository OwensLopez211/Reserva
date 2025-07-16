import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Calendar,
  FolderOpen,
  Edit,
  Mail,
  Phone,
  MapPin,
  Shield,
  FileText,
  Clock,
  Activity
} from 'lucide-react'
import clientService, { Client } from '../services/clientService'
import PersonalInfoTab from '../components/clients/PersonalInfoTab'
import AppointmentHistoryTab from '../components/clients/AppointmentHistoryTab'
import ClientFolderTab from '../components/clients/ClientFolderTab'

type TabType = 'personal' | 'appointments' | 'folder'

const ClientProfilePage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('personal')

  const loadClient = async () => {
    if (!clientId) return
    
    try {
      setLoading(true)
      const clientData = await clientService.getClient(clientId)
      setClient(clientData)
      setError(null)
    } catch (error) {
      console.error('Error loading client:', error)
      setError('Error al cargar la información del cliente')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClient()
  }, [clientId])

  const tabs = [
    {
      id: 'personal' as TabType,
      label: 'Información Personal',
      icon: User,
      description: 'Datos básicos y contacto'
    },
    {
      id: 'appointments' as TabType,
      label: 'Historial de Citas',
      icon: Calendar,
      description: 'Citas pasadas y futuras'
    },
    {
      id: 'folder' as TabType,
      label: 'Expediente del Cliente',
      icon: FolderOpen,
      description: 'Notas y archivos organizacionales'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando perfil del cliente...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
            {error || 'Cliente no encontrado'}
          </div>
          <button
            onClick={() => navigate('/clients')}
            className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Clientes</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/app/clients')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{client.full_name}</h1>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      clientService.getClientTypeColor(client.client_type)
                    }`}>
                      {clientService.getClientTypeDisplay(client.client_type)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      client.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Quick Info */}
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{client.email || 'Sin email'}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{client.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{client.appointments_count} citas</span>
              </div>
            </div>
          </div>

          {/* Compact Tab Navigation */}
          <div className="mt-3">
            <nav className="flex space-x-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'personal' && (
          <PersonalInfoTab client={client} onClientUpdate={setClient} />
        )}
        
        {activeTab === 'appointments' && (
          <AppointmentHistoryTab clientId={client.id} />
        )}
        
        {activeTab === 'folder' && (
          <ClientFolderTab clientId={client.id} clientName={client.full_name} />
        )}
      </div>
    </div>
  )
}

export default ClientProfilePage