import React from 'react'
import { Outlet } from 'react-router-dom'
import MarketplaceNavbar from '../marketplace/MarketplaceNavbar'
import MarketplaceFooter from '../marketplace/MarketplaceFooter'

const MarketplaceLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Marketplace Navbar */}
      <MarketplaceNavbar />
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Marketplace Footer */}
      <MarketplaceFooter />
    </div>
  )
}

export default MarketplaceLayout 