import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './components/MainLayout'
import './App.css'

// Páginas
const Home = () => (
  <div className="container mx-auto py-8">
    <h1 className="text-3xl font-bold text-gray-900">Bienvenido a ReservaPlus</h1>
    <p className="mt-4 text-gray-600">Tu sistema de reservas favorito</p>
  </div>
)

const Reservas = () => (
  <div className="container mx-auto py-8">
    <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
    <p className="mt-4 text-gray-600">Gestiona tus reservas aquí</p>
  </div>
)

const Perfil = () => (
  <div className="container mx-auto py-8">
    <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
    <p className="mt-4 text-gray-600">Gestiona tu información personal</p>
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="reservas" element={<Reservas />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
