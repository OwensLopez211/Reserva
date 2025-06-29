// src/App.tsx - VERSIÓN CORREGIDA
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { OnboardingProvider } from './contexts/OnboardingContext'
import { TransitionProvider } from './contexts/TransitionContext'
import ProtectedRoute from './components/ProtectedRoute'
import { OnboardingGuard } from './components/onboarding/OnboardingGuard'
import { OnboardingNavigator } from './components/onboarding/OnboardingNavigator'
import PublicLayout from './components/layouts/PublicLayout'
import PrivateLayout from './components/layouts/PrivateLayout'

// Páginas públicas
import HomePage from './pages/public/HomePage'
import { FeaturesPage } from './pages/public/FeaturesPage'
import { PricingPage } from './pages/public/PricingPage'

// Páginas de autenticación
import LoginLayout from './components/layouts/LoginLayout'

// Páginas de onboarding
import PlanSelectionPage from './pages/onboarding/PlanSelectionPage'
import RegistrationPage from './pages/onboarding/RegistrationPage'
import TeamSetupPage from './pages/onboarding/TeamSetupPage'
import OrganizationConfigPage from './pages/onboarding/OrganizationConfigPage'
import OnboardingWelcomePage from './pages/onboarding/OnboardingWelcomePage'
import ServicesSetupPage from './pages/onboarding/ServicesSetupPage'

// Páginas privadas
import DashboardPage from './pages/dashboard/DashboardPage'

import './App.css'

// Páginas temporales para las rutas privadas con animaciones
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

// Páginas legales con animaciones mejoradas
const PrivacyPage = () => (
  <div className="py-16 animate-slideUp">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 animate-fadeIn delay-200">
        Política de Privacidad
      </h1>
      <div className="prose prose-lg text-gray-600 animate-fadeIn delay-400">
        <p>Última actualización: Enero 2025</p>
        <p>Tu privacidad es importante para nosotros. Esta política describe cómo recopilamos, usamos y protegemos tu información.</p>
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información que recopilamos</h2>
            <p>Recopilamos información que nos proporcionas directamente, como cuando creas una cuenta, configuras tu perfil o contactas con nosotros.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cómo usamos tu información</h2>
            <p>Utilizamos la información para proporcionar, mantener y mejorar nuestros servicios, así como para comunicarnos contigo.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Protección de datos</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger tu información personal.</p>
          </section>
        </div>
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
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Aceptación de términos</h2>
            <p>Al acceder y utilizar este servicio, aceptas estar sujeto a estos términos y condiciones.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Uso del servicio</h2>
            <p>Te comprometes a utilizar el servicio de manera legal y de acuerdo con estos términos.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitaciones</h2>
            <p>El servicio se proporciona "tal como está" sin garantías de ningún tipo.</p>
          </section>
        </div>
      </div>
    </div>
  </div>
)

const ContactPage = () => (
  <div className="py-16 animate-slideUp">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center animate-fadeIn delay-200">
        Contáctanos
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="animate-fadeIn delay-400">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información de contacto</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-emerald-600 text-sm">📧</span>
              </div>
              <span>hola@reservaplus.com</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-emerald-600 text-sm">📱</span>
              </div>
              <span>+56 9 1234 5678</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-emerald-600 text-sm">📍</span>
              </div>
              <span>Santiago, Chile</span>
            </div>
          </div>
        </div>
        <div className="animate-fadeIn delay-600">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Envíanos un mensaje</h2>
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Tu nombre"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="email"
              placeholder="Tu email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              rows={4}
              placeholder="Tu mensaje"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Enviar mensaje
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
)

const HelpPage = () => (
  <div className="py-16 animate-slideUp">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center animate-fadeIn delay-200">
        Centro de Ayuda
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Primeros Pasos',
            description: 'Aprende cómo configurar tu cuenta y empezar a usar Reserva+.',
            icon: '🚀'
          },
          {
            title: 'Gestión de Citas',
            description: 'Todo lo que necesitas saber sobre el calendario y las reservas.',
            icon: '📅'
          },
          {
            title: 'Clientes y Servicios',
            description: 'Cómo gestionar tu base de clientes y configurar servicios.',
            icon: '👥'
          },
          {
            title: 'Reportes y Analytics',
            description: 'Comprende tus métricas y genera reportes útiles.',
            icon: '📊'
          },
          {
            title: 'Configuración Avanzada',
            description: 'Personaliza Reserva+ según las necesidades de tu negocio.',
            icon: '⚙️'
          },
          {
            title: 'Soporte Técnico',
            description: 'Resuelve problemas técnicos y obtén ayuda especializada.',
            icon: '🛠️'
          }
        ].map((item, index) => (
          <div 
            key={index} 
            className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:scale-105 animate-fadeIn cursor-pointer"
            style={{ animationDelay: `${(index + 1) * 200}ms` }}
          >
            <div className="text-3xl mb-4">{item.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <BrowserRouter>
          <TransitionProvider>
            <div className="app-container">
              <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="features" element={<FeaturesPage />} />
                  <Route path="pricing" element={<PricingPage />} />
                  <Route path="contact" element={<ContactPage />} />
                  <Route path="privacy" element={<PrivacyPage />} />
                  <Route path="terms" element={<TermsPage />} />
                  <Route path="help" element={<HelpPage />} />
                </Route>

                {/* Login fuera del layout público */}
                <Route path="/login" element={<LoginLayout />} />

                {/* RUTAS DE ONBOARDING - PÚBLICAS (sin autenticación requerida) */}
                <Route path="/onboarding" element={<OnboardingNavigator />}>
                  <Route path="plan" element={<PlanSelectionPage />} />
                  <Route path="register" element={<RegistrationPage />} />
                  {/* Las siguientes requieren estar registrado */}
                  <Route path="team" element={
                    <ProtectedRoute>
                      <TeamSetupPage />
                    </ProtectedRoute>
                  } />
                  <Route path="services" element={
                    <ProtectedRoute>
                      <ServicesSetupPage />
                    </ProtectedRoute>
                  } />
                  <Route path="organization" element={
                    <ProtectedRoute>
                      <OrganizationConfigPage />
                    </ProtectedRoute>
                  } />
                  <Route path="welcome" element={
                    <ProtectedRoute>
                      <OnboardingWelcomePage />
                    </ProtectedRoute>
                  } />
                  {/* Ruta por defecto del onboarding - manejada por OnboardingNavigator */}
                  <Route index element={<div />} />
                </Route>

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
                  {/* Ruta por defecto de la app */}
                  <Route index element={<Navigate to="/app/dashboard" replace />} />
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
            </div>
          </TransitionProvider>
        </BrowserRouter>
      </OnboardingProvider>
    </AuthProvider>
  )
}

export default App