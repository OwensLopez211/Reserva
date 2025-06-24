// src/pages/public/FeaturesPage.tsx
import React from 'react'
import { Calendar, Users, Clock, BarChart3, Zap, Shield, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import FeaturesHeroSection from '../../components/features/FeatureSection'
import FeatureShowcase from '../../components/features/FeatureShowcase'

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Calendario Inteligente',
      description: 'Sistema de calendario avanzado con múltiples vistas, arrastrar y soltar, y sincronización automática. Perfecto para gestionar todas tus citas de manera visual e intuitiva.',
      benefits: [
        { text: 'Vista diaria, semanal y mensual', highlight: true },
        'Arrastrar y soltar para reorganizar',
        'Código de colores por profesional',
        { text: 'Sincronización con Google Calendar', highlight: true },
        'Recordatorios automáticos',
        'Bloqueo de horarios no disponibles'
      ],
      colorScheme: {
        primary: 'from-emerald-500 to-cyan-500',
        secondary: 'from-emerald-50 to-cyan-50',
        background: 'bg-emerald-100',
        accent: 'text-emerald-600'
      }
    },
    {
      icon: Users,
      title: 'Gestión de Clientes',
      description: 'CRM completo diseñado para negocios de servicios. Mantén toda la información de tus clientes organizada y accesible, con historial completo de servicios.',
      benefits: [
        { text: 'Perfil completo del cliente', highlight: true },
        'Historial de servicios detallado',
        'Notas y observaciones privadas',
        'Datos de contacto actualizados',
        { text: 'Preferencias y alergias', highlight: true },
        'Fotos de antes y después'
      ],
      colorScheme: {
        primary: 'from-blue-500 to-purple-500',
        secondary: 'from-blue-50 to-purple-50',
        background: 'bg-blue-100',
        accent: 'text-blue-600'
      }
    },
    {
      icon: Clock,
      title: 'Automatización Inteligente',
      description: 'Automatiza tareas repetitivas y mejora la comunicación con tus clientes. Desde recordatorios hasta seguimiento post-servicio, todo funciona automáticamente.',
      benefits: [
        { text: 'Recordatorios por SMS y email', highlight: true },
        'Confirmación automática de citas',
        'Seguimiento post-servicio',
        'Notificaciones personalizables',
        { text: 'Encuestas de satisfacción automáticas', highlight: true },
        'Reagendamiento inteligente'
      ],
      colorScheme: {
        primary: 'from-purple-500 to-pink-500',
        secondary: 'from-purple-50 to-pink-50',
        background: 'bg-purple-100',
        accent: 'text-purple-600'
      }
    }
  ]

  const additionalFeatures = [
    {
      icon: BarChart3,
      title: 'Reportes y Analytics',
      description: 'Obtén insights valiosos sobre tu negocio con reportes detallados y métricas en tiempo real.',
      features: ['Ingresos por período', 'Clientes más frecuentes', 'Servicios más populares', 'Análisis de tendencias']
    },
    {
      icon: Zap,
      title: 'Configuración Rápida',
      description: 'Ponte en marcha en menos de 5 minutos con nuestro asistente de configuración.',
      features: ['Wizard de configuración', 'Importación de datos', 'Templates predefinidos', 'Migración asistida']
    },
    {
      icon: Shield,
      title: 'Seguridad Avanzada',
      description: 'Tus datos y los de tus clientes están protegidos con las mejores prácticas de seguridad.',
      features: ['Cifrado de datos', 'Copias de seguridad automáticas', 'Cumplimiento GDPR', 'Acceso seguro']
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section with full screen height */}
      <FeaturesHeroSection 
        title="Características Completas"
        subtitle="Descubre todas las herramientas que Reserva+ tiene para hacer crecer tu negocio de manera inteligente"
        variant="modern"
      />

      {/* Main Features Section */}
      <section id="features-content" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Section header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4 mr-2" />
              Módulos Principales
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Todo lo que necesitas para{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                gestionar tu negocio
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Cada característica ha sido diseñada pensando en la experiencia del usuario y la eficiencia del negocio
            </p>
          </div>

          {/* Feature showcases */}
          <div className="space-y-32">
            {features.map((feature, index) => (
              <FeatureShowcase
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                benefits={feature.benefits}
                isReversed={index % 2 === 1}
                colorScheme={feature.colorScheme}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Grid */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Y mucho más...
            </h2>
            <p className="text-xl text-gray-600">
              Características adicionales que potencian tu experiencia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon
              const colors = [
                'from-orange-500 to-red-500',
                'from-yellow-500 to-orange-500', 
                'from-indigo-500 to-purple-500'
              ]
              return (
                <div key={index} className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                  <div className={`w-16 h-16 bg-gradient-to-r ${colors[index]} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            ¿Listo para probar todas estas características?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Configura tu cuenta gratis y descubre cómo Reserva+ puede transformar tu negocio
          </p>
          <Link
            to="/login"
            className="group bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold hover:bg-emerald-50 transition-all duration-300 inline-flex items-center justify-center shadow-2xl transform hover:scale-105"
          >
            Empezar Gratis Ahora
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-emerald-200 mt-4">
            Configuración en 5 minutos • Apoyo personalizado incluido
          </p>
        </div>
      </section>
    </div>
  )
}

export default FeaturesPage