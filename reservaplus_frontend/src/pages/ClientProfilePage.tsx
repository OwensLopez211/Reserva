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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/app/clients')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{client.full_name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      clientService.getClientTypeColor(client.client_type)
                    }`}>
                      {clientService.getClientTypeDisplay(client.client_type)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-blue-900">Email</div>
                  <div className="text-xs text-blue-700">{client.email || 'No especificado'}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-green-900">Teléfono</div>
                  <div className="text-xs text-green-700">{client.phone}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-purple-900">Total Citas</div>
                  <div className="text-xs text-purple-700">{client.appointments_count}</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 rounded-xl">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="text-sm font-medium text-amber-900">Cliente desde</div>
                  <div className="text-xs text-amber-700">{clientService.formatCreatedAt(client.created_at)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6">
            <nav className="flex space-x-8">
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
                    <div className="text-left">
                      <div>{tab.label}</div>
                      <div className="text-xs text-gray-400">{tab.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
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