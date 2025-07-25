import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
// import MarketplaceNavbar from '../marketplace/MarketplaceNavbar'
// import MarketplaceFooter from '../marketplace/MarketplaceFooter'

const MarketplaceLayout: React.FC = () => {
  const location = useLocation()

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Marketplace Navbar */}

      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Marketplace Footer */}
    </div>
  )
}

export default MarketplaceLayout 