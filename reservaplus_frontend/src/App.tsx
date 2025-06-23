// src/App.tsx - Actualizado con sistema de onboarding
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import ProtectedRoute from './components/ProtectedRoute'
import { OnboardingGuard } from './components/onboarding/OnboardingGuard'
import PublicLayout from './components/layouts/PublicLayout'
import PrivateLayout from './components/layouts/PrivateLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import { OnboardingWelcome } from './components/onboarding/OnboardingWelcome'
import './App.css'

// Páginas temporales para las rutas privadas
const ReservasPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
    <p className="mt-4 text-gray-600">Gestiona tus reservas aquí</p>
  </div>
)

const ClientesPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
    <p className="mt-4 text-gray-600">Gestiona tu base de clientes</p>
  </div>
)

const PerfilPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
    <p className="mt-4 text-gray-600">Gestiona tu información personal</p>
  </div>
)

const ConfiguracionPage = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
    <p className="mt-4 text-gray-600">Configura tu organización y preferencias</p>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<PublicLayout />}>
              <Route path="login" element={<LoginPage />} />
            </Route>

            {/* Ruta de onboarding - requiere autenticación pero no onboarding completo */}
            <Route 
              path="/onboarding" 
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              } 
            />

            {/* Ruta de bienvenida - para usuarios recién registrados */}
            <Route 
              path="/welcome" 
              element={
                <ProtectedRoute>
                  <OnboardingWelcome />
                </ProtectedRoute>
              } 
            />

            {/* Rutas privadas - requieren autenticación Y onboarding completo */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <OnboardingGuard>
                    <PrivateLayout />
                  </OnboardingGuard>
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="reservas" element={<ReservasPage />} />
              <Route path="clientes" element={<ClientesPage />} />
              <Route path="perfil" element={<PerfilPage />} />
              <Route path="configuracion" element={<ConfiguracionPage />} />
            </Route>

            {/* Ruta por defecto - redirigir al dashboard si está autenticado y configurado */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </OnboardingProvider>
    </AuthProvider>
  )
}

export default App