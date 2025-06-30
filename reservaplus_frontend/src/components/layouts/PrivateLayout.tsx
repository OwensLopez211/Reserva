// src/components/layouts/PrivateLayout.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Navigation from '../common/Navigation'

const PrivateLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegación horizontal */}
      <Navigation />
      
      {/* Contenido principal */}
      <main className="flex-1">
        <div className="w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default PrivateLayout