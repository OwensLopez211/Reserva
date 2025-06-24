// src/App.tsx - Con transiciones mejoradas
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import ProtectedRoute from './components/ProtectedRoute'
import { OnboardingGuard } from './components/onboarding/OnboardingGuard'
import PublicLayout from './components/layouts/PublicLayout'
import PrivateLayout from './components/layouts/PrivateLayout'
import { RouteTransitionWrapper } from './components/transitions/RouteTransitionWrapper'

// Páginas públicas
import HomePage from './pages/public/HomePage'
import { FeaturesPage } from './pages/public/FeaturesPage'
import { PricingPage } from './pages/public/PricingPage'

// Páginas de autenticación
import LoginLayout from './components/layouts/LoginLayout'

// Páginas de onboarding
import OnboardingPage from './pages/onboarding/OnboardingPage'
import { OnboardingWelcome } from './components/onboarding/OnboardingWelcome'

// Páginas privadas
import DashboardPage from './pages/dashboard/DashboardPage'

import './App.css'

// Páginas temporales para las rutas privadas
const ReservasPage = () => (
  <div className="animate-fadeIn">
    <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
    <p className="mt-4 text-gray-600">Gestiona tus reservas aquí</p>
  </div>
)

const ClientesPage = () => (
  <div className="animate-fadeIn">
    <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
    <p className="mt-4 text-gray-600">Gestiona tu base de clientes</p>
  </div>
)

const PerfilPage = () => (
  <div className="animate-fadeIn">
    <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
    <p className="mt-4 text-gray-600">Gestiona tu información personal</p>
  </div>
)

const ConfiguracionPage = () => (
  <div className="animate-fadeIn">
    <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
    <p className="mt-4 text-gray-600">Configura tu organización y preferencias</p>
  </div>
)

// Páginas legales temporales con transiciones
const PrivacyPage = () => (
  <div className="py-16 animate-slideUp">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 animate-fadeIn delay-200">
        Política de Privacidad
      </h1>
      <div className="prose prose-lg text-gray-600 animate-fadeIn delay-400">
        <p>Última actualización: Enero 2025</p>
        <p>Tu privacidad es importante para nosotros. Esta política describe cómo recopilamos, usamos y protegemos tu información.</p>
      </div>
    </div>
  </div>
)

const TermsPage = () => (
  <div className="py-16 animate-slideUp">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 animate-fadeIn delay-200">
        Términos de Servicio
      </h1>
      <div className="prose prose-lg text-gray-600 animate-fadeIn delay-400">
        <p>Última actualización: Enero 2025</p>
        <p>Al usar Reserva+, aceptas estos términos de servicio.</p>
      </div>
    </div>
  </div>
)

const HelpPage = () => (
  <div className="py-16 animate-slideUp">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 animate-fadeIn delay-200">
        Centro de Ayuda
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Primeros Pasos',
            description: 'Aprende cómo configurar tu cuenta y empezar a usar Reserva+.'
          },
          {
            title: 'Gestión de Citas',
            description: 'Todo lo que necesitas saber sobre el calendario y las reservas.'
          },
          {
            title: 'Clientes y Servicios',
            description: 'Cómo gestionar tu base de clientes y configurar servicios.'
          }
        ].map((item, index) => (
          <div 
            key={index} 
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeIn"
            style={{ animationDelay: `${(index + 1) * 200}ms` }}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Componente wrapper para rutas con transiciones
const AnimatedRoutes = () => {
  const location = useLocation()
  
  return (
    <RouteTransitionWrapper key={location.pathname}>
      <Routes location={location}>
        {/* Rutas públicas */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="features" element={<FeaturesPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>

        {/* Login fuera del layout público */}
        <Route path="/login" element={<LoginLayout />} />

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
          path="/app"
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

        {/* Rutas de redirección */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/reservas" element={<Navigate to="/app/reservas" replace />} />
        <Route path="/clientes" element={<Navigate to="/app/clientes" replace />} />
        <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
        <Route path="/configuracion" element={<Navigate to="/app/configuracion" replace />} />

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RouteTransitionWrapper>
  )
}

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <BrowserRouter>
          <div className="app-container">
            <AnimatedRoutes />
          </div>
        </BrowserRouter>
      </OnboardingProvider>
    </AuthProvider>
  )
}

export default App