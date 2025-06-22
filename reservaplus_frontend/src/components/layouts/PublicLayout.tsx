// src/components/layouts/PublicLayout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header público simple */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary-600">
                ReservaPlus
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Sistema de Reservas
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main>
        <Outlet />
      </main>

      {/* Footer simple */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            © 2025 ReservaPlus. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout