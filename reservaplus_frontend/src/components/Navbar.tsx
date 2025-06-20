import { Link } from 'react-router-dom'

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg w-full">
      <div className="w-full">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
              ReservaPlus
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              Inicio
            </Link>
            <Link to="/reservas" className="text-gray-600 hover:text-gray-900">
              Reservas
            </Link>
            <Link to="/perfil" className="text-gray-600 hover:text-gray-900">
              Perfil
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 