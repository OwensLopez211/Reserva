import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Calendar,
  Phone,
  Users,
  UserCheck
} from 'lucide-react'
import clientService, { Client } from '../../services/clientService'

interface ClientTableProps {
  clients: Client[]
  loading: boolean
  currentPage?: number
  setCurrentPage?: (page: number) => void
  totalPages?: number
  totalCount?: number
  pageSize?: number
  setPageSize?: (size: number) => void
  activeDropdown: string | null
  setActiveDropdown: (id: string | null) => void
  onEditClient?: (client: Client) => void
  onDeleteClient?: (clientId: string) => void
  onToggleStatus?: (clientId: string) => void
  showPagination?: boolean
}

const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  loading,
  currentPage = 1,
  setCurrentPage,
  totalPages = 1,
  totalCount = clients.length,
  pageSize = 10,
  setPageSize,
  activeDropdown,
  setActiveDropdown,
  onEditClient,
  onDeleteClient,
  onToggleStatus,
  showPagination = true
}) => {
  const navigate = useNavigate()
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0 })

  const handleAction = (action: string, clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    
    switch (action) {
      case 'view':
        navigate(`/app/clients/${clientId}`)
        break
      case 'edit':
        if (client && onEditClient) onEditClient(client)
        break
      case 'delete':
        if (onDeleteClient) onDeleteClient(clientId)
        break
      case 'toggle-status':
        if (onToggleStatus) onToggleStatus(clientId)
        break
    }
    setActiveDropdown(null)
  }

  const handleDropdownClick = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation()
    
    if (activeDropdown === clientId) {
      setActiveDropdown(null)
      return
    }

    const buttonRect = (e.target as HTMLElement).closest('button')?.getBoundingClientRect()
    if (buttonRect) {
      const top = buttonRect.bottom + window.scrollY + 4
      const left = buttonRect.right - 192 // 192px = w-48 width

      setDropdownPosition({ top, left })
      setActiveDropdown(clientId)
    }
  }

  // Effect to close dropdown on click outside or scroll
  React.useEffect(() => {
    const handleScroll = () => setActiveDropdown(null)
    const handleResize = () => setActiveDropdown(null)
    
    if (activeDropdown) {
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [activeDropdown])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Cargando clientes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      {/* Desktop Table View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Citas
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Registro
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors duration-150" data-client-id={client.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {client.full_name}
                      </div>
                      {client.notes && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{client.notes}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    client.client_type === 'internal' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                    client.client_type === 'registered' ? 'bg-green-100 text-green-700 border border-green-200' :
                    'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {clientService.getClientTypeDisplay(client.client_type)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {client.email && (
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="h-3 w-3 mr-2 text-gray-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-3 w-3 mr-2 text-gray-400" />
                      <span>{client.phone}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center text-sm text-gray-900">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium">{client.appointments_count}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {client.is_active ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm font-medium text-green-700">Activo</span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm font-medium text-red-700">Inactivo</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {clientService.formatCreatedAt(client.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="relative">
                    <button
                      onClick={(e) => handleDropdownClick(e, client.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>
                    
                    {activeDropdown === client.id && (
                      <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}>
                        <div 
                          className="absolute w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40"
                          style={{
                            top: `${dropdownPosition.top}px`,
                            left: `${dropdownPosition.left}px`
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleAction('view', client.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <Eye className="h-4 w-4 mr-3 text-gray-500" />
                            Ver perfil
                          </button>
                          {onEditClient && (
                            <button
                              onClick={() => handleAction('edit', client.id)}
                              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                              <Edit className="h-4 w-4 mr-3 text-gray-500" />
                              Editar cliente
                            </button>
                          )}
                          {onToggleStatus && (
                            <button
                              onClick={() => handleAction('toggle-status', client.id)}
                              className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                            >
                              {client.is_active ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-3 text-gray-500" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-3 text-gray-500" />
                                  Activar
                                </>
                              )}
                            </button>
                          )}
                          {onDeleteClient && (
                            <button
                              onClick={() => handleAction('delete', client.id)}
                              className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile & Tablet Card View */}
      <div className="lg:hidden">
        <div className="divide-y divide-gray-100">
          {clients.map((client) => (
            <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-base font-semibold text-white">
                      {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {client.full_name}
                      </h3>
                      <div className="flex items-center ml-2">
                        {client.is_active ? (
                          <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      {client.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <UserCheck className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          client.client_type === 'internal' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          client.client_type === 'registered' ? 'bg-green-100 text-green-700 border border-green-200' :
                          'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                          {clientService.getClientTypeDisplay(client.client_type)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{client.appointments_count} citas</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative ml-2">
                  <button
                    onClick={(e) => handleDropdownClick(e, client.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
                  >
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                  
                  {activeDropdown === client.id && (
                    <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)}>
                      <div 
                        className="absolute w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-40"
                        style={{
                          top: `${dropdownPosition.top}px`,
                          left: `${dropdownPosition.left}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleAction('view', client.id)}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <Eye className="h-4 w-4 mr-3 text-gray-500" />
                          Ver perfil
                        </button>
                        {onEditClient && (
                          <button
                            onClick={() => handleAction('edit', client.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <Edit className="h-4 w-4 mr-3 text-gray-500" />
                            Editar cliente
                          </button>
                        )}
                        {onToggleStatus && (
                          <button
                            onClick={() => handleAction('toggle-status', client.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                          >
                            {client.is_active ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-3 text-gray-500" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-3 text-gray-500" />
                                Activar
                              </>
                            )}
                          </button>
                        )}
                        {onDeleteClient && (
                          <button
                            onClick={() => handleAction('delete', client.id)}
                            className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                          >
                            <Trash2 className="h-4 w-4 mr-3" />
                            Eliminar
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {clients.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            No se encontraron clientes para mostrar.
          </p>
        </div>
      )}
      
      {/* Enhanced Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="bg-gray-50 px-4 py-4 border-t border-gray-200">
          {/* Mobile Pagination */}
          <div className="flex items-center justify-between sm:hidden">
            <button 
              onClick={() => setCurrentPage && setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700 font-medium">
              {currentPage} de {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage && setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Siguiente
            </button>
          </div>
          
          {/* Desktop Pagination */}
          <div className="hidden sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-semibold text-gray-900">{(currentPage - 1) * pageSize + 1}</span> a{' '}
                <span className="font-semibold text-gray-900">{Math.min(currentPage * pageSize, totalCount)}</span> de{' '}
                <span className="font-semibold text-gray-900">{totalCount}</span> clientes
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setCurrentPage && setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Anterior
                </button>
                <div className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  {currentPage}
                </div>
                <button 
                  onClick={() => setCurrentPage && setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Siguiente
                </button>
              </div>
              {setPageSize && (
                <select 
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage && setCurrentPage(1)
                  }}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-150"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientTable