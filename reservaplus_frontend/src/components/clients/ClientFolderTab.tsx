import React, { useState, useEffect } from 'react'
import {
  FolderOpen,
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Save,
  X,
  AlertCircle,
  Clock,
  User,
  Tag,
  Search,
  Filter,
  Calendar,
  Star,
  MessageSquare,
  Paperclip,
  Eye,
  MoreVertical
} from 'lucide-react'

interface ClientNote {
  id: string
  title: string
  content: string
  category: 'general' | 'medical' | 'preferences' | 'important' | 'follow_up'
  is_private: boolean
  created_by: string
  created_by_name: string
  created_at: string
  updated_at: string
}

interface ClientFile {
  id: string
  name: string
  file_type: string
  file_size: number
  file_url: string
  category: 'document' | 'image' | 'medical' | 'other'
  uploaded_by: string
  uploaded_by_name: string
  uploaded_at: string
  description?: string
}

interface ClientFolderTabProps {
  clientId: string
  clientName: string
}

type TabType = 'notes' | 'files' | 'summary'

const ClientFolderTab: React.FC<ClientFolderTabProps> = ({ clientId, clientName }) => {
  const [activeSubTab, setActiveSubTab] = useState<TabType>('summary')
  const [notes, setNotes] = useState<ClientNote[]>([])
  const [files, setFiles] = useState<ClientFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Note management
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<ClientNote | null>(null)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'general' as ClientNote['category'],
    is_private: false
  })

  // File management
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Mock data for demonstration - these would come from the backend
  useEffect(() => {
    // Mock notes
    setNotes([
      {
        id: '1',
        title: 'Preferencias de servicio',
        content: 'Cliente prefiere citas en la mañana. Le gusta el corte clásico y usa productos sin sulfatos.',
        category: 'preferences',
        is_private: false,
        created_by: 'user1',
        created_by_name: 'Ana García',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: '2',
        title: 'Seguimiento importante',
        content: 'Cliente mencionó alergia a ciertos productos. Revisar lista de ingredientes antes del servicio.',
        category: 'important',
        is_private: true,
        created_by: 'user1',
        created_by_name: 'Ana García',
        created_at: '2024-01-20T14:15:00Z',
        updated_at: '2024-01-20T14:15:00Z'
      }
    ])

    // Mock files
    setFiles([
      {
        id: '1',
        name: 'Formulario_Consulta_Inicial.pdf',
        file_type: 'pdf',
        file_size: 524288,
        file_url: '/files/client-forms/form1.pdf',
        category: 'document',
        uploaded_by: 'user1',
        uploaded_by_name: 'Ana García',
        uploaded_at: '2024-01-10T09:00:00Z',
        description: 'Formulario de consulta inicial completado por el cliente'
      },
      {
        id: '2',
        name: 'foto_antes_tratamiento.jpg',
        file_type: 'jpg',
        file_size: 1048576,
        file_url: '/files/client-photos/before1.jpg',
        category: 'image',
        uploaded_by: 'user2',
        uploaded_by_name: 'Luis Rodríguez',
        uploaded_at: '2024-01-15T11:30:00Z',
        description: 'Foto antes del tratamiento de cabello'
      }
    ])
  }, [clientId])

  const handleCreateNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return

    const note: ClientNote = {
      id: Date.now().toString(),
      ...newNote,
      created_by: 'current_user',
      created_by_name: 'Usuario Actual',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setNotes(prev => [note, ...prev])
    setNewNote({ title: '', content: '', category: 'general', is_private: false })
    setIsCreateNoteOpen(false)
  }

  const handleEditNote = (note: ClientNote) => {
    setEditingNote(note)
    setNewNote({
      title: note.title,
      content: note.content,
      category: note.category,
      is_private: note.is_private
    })
  }

  const handleUpdateNote = () => {
    if (!editingNote || !newNote.title.trim() || !newNote.content.trim()) return

    setNotes(prev => prev.map(note => 
      note.id === editingNote.id 
        ? { ...note, ...newNote, updated_at: new Date().toISOString() }
        : note
    ))
    
    setEditingNote(null)
    setNewNote({ title: '', content: '', category: 'general', is_private: false })
  }

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'important': return 'bg-red-100 text-red-800'
      case 'medical': return 'bg-blue-100 text-blue-800'
      case 'preferences': return 'bg-green-100 text-green-800'
      case 'follow_up': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'important': return 'Importante'
      case 'medical': return 'Médico'
      case 'preferences': return 'Preferencias'
      case 'follow_up': return 'Seguimiento'
      default: return 'General'
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('doc')) return '📝'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const subTabs = [
    { id: 'summary' as TabType, label: 'Resumen', icon: Eye },
    { id: 'notes' as TabType, label: 'Notas', icon: MessageSquare },
    { id: 'files' as TabType, label: 'Archivos', icon: Paperclip }
  ]

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const SummaryView = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">{notes.length}</div>
          <div className="text-sm text-blue-700">Total Notas</div>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-600">{files.length}</div>
          <div className="text-sm text-green-700">Archivos</div>
        </div>
        <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-red-600">
            {notes.filter(n => n.category === 'important').length}
          </div>
          <div className="text-sm text-red-700">Importantes</div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-purple-600">
            {notes.filter(n => n.is_private).length}
          </div>
          <div className="text-sm text-purple-700">Privadas</div>
        </div>
      </div>

      {/* Recent Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas Recientes</h3>
        <div className="space-y-3">
          {notes.slice(0, 3).map(note => (
            <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{note.title}</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(note.category)}`}>
                  {getCategoryName(note.category)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.content}</p>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(note.created_at).toLocaleDateString('es-CL')} por {note.created_by_name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Files */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Archivos Recientes</h3>
        <div className="space-y-3">
          {files.slice(0, 3).map(file => (
            <div key={file.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="text-2xl">{getFileIcon(file.file_type)}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{file.name}</div>
                <div className="text-sm text-gray-500">
                  {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString('es-CL')}
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const NotesView = () => (
    <div className="space-y-6">
      {/* Notes Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las categorías</option>
            <option value="general">General</option>
            <option value="important">Importante</option>
            <option value="medical">Médico</option>
            <option value="preferences">Preferencias</option>
            <option value="follow_up">Seguimiento</option>
          </select>
        </div>

        <button
          onClick={() => setIsCreateNoteOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Nota</span>
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(note.category)}`}>
                  {getCategoryName(note.category)}
                </span>
                {note.is_private && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                    Privada
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEditNote(note)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="h-3 w-3 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="p-1 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-2">{note.title}</h4>
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">{note.content}</p>
            
            <div className="text-xs text-gray-400">
              <div>Por {note.created_by_name}</div>
              <div>{new Date(note.created_at).toLocaleDateString('es-CL')}</div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay notas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter !== 'all'
              ? 'No se encontraron notas con los filtros aplicados.'
              : 'Crea la primera nota para este cliente.'}
          </p>
        </div>
      )}
    </div>
  )

  const FilesView = () => (
    <div className="space-y-6">
      {/* Files Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value="document">Documentos</option>
            <option value="image">Imágenes</option>
            <option value="medical">Médicos</option>
            <option value="other">Otros</option>
          </select>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Subir Archivo</span>
        </button>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(file => (
          <div key={file.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="text-3xl">{getFileIcon(file.file_type)}</div>
              <div className="flex items-center space-x-1">
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="h-3 w-3 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download className="h-3 w-3 text-gray-500" />
                </button>
                <button className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-900 mb-1 truncate">{file.name}</h4>
            <p className="text-sm text-gray-600 mb-2">{formatFileSize(file.file_size)}</p>
            
            {file.description && (
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">{file.description}</p>
            )}
            
            <div className="text-xs text-gray-400">
              <div>Por {file.uploaded_by_name}</div>
              <div>{new Date(file.uploaded_at).toLocaleDateString('es-CL')}</div>
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <Paperclip className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay archivos</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter !== 'all'
              ? 'No se encontraron archivos con los filtros aplicados.'
              : 'Sube el primer archivo para este cliente.'}
          </p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Client Folder Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center space-x-3">
          <FolderOpen className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-bold text-indigo-900">Expediente de {clientName}</h2>
            <p className="text-sm text-indigo-700">
              Información confidencial y notas de seguimiento para uso exclusivo de la organización
            </p>
          </div>
        </div>
      </div>

      {/* Sub Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <nav className="flex space-x-8">
          {subTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSubTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
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

      {/* Tab Content */}
      {activeSubTab === 'summary' && <SummaryView />}
      {activeSubTab === 'notes' && <NotesView />}
      {activeSubTab === 'files' && <FilesView />}

      {/* Create/Edit Note Modal */}
      {(isCreateNoteOpen || editingNote) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingNote ? 'Editar Nota' : 'Nueva Nota'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreateNoteOpen(false)
                    setEditingNote(null)
                    setNewNote({ title: '', content: '', category: 'general', is_private: false })
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newNote.title}
                    onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Título de la nota..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <select
                      value={newNote.category}
                      onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value as ClientNote['category'] }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="general">General</option>
                      <option value="important">Importante</option>
                      <option value="medical">Médico</option>
                      <option value="preferences">Preferencias</option>
                      <option value="follow_up">Seguimiento</option>
                    </select>
                  </div>

                  <div className="flex items-center mt-7">
                    <input
                      type="checkbox"
                      checked={newNote.is_private}
                      onChange={(e) => setNewNote(prev => ({ ...prev, is_private: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">Nota privada</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contenido
                  </label>
                  <textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Escribe el contenido de la nota..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsCreateNoteOpen(false)
                    setEditingNote(null)
                    setNewNote({ title: '', content: '', category: 'general', is_private: false })
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingNote ? handleUpdateNote : handleCreateNote}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingNote ? 'Actualizar' : 'Crear'} Nota</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientFolderTab