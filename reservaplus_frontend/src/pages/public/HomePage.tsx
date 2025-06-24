// src/pages/public/HomePage.tsx
import React from 'react'
import { Calendar, Users, Clock, BarChart3 } from 'lucide-react'
import HeroSection from '../../components/home/HeroSection'
import FeaturesSection from '../../components/home/FeaturesSection'
import CTASection from '../../components/home/CTASection'

const features = [
  {
    icon: Calendar,
    title: 'Calendario Inteligente',
    description: 'Gestiona todas tus citas y reservas desde un calendario intuitivo y fácil de usar.'
  },
  {
    icon: Users,
    title: 'Gestión de Clientes',
    description: 'Mantén un registro completo de tus clientes con historial de servicios y preferencias.'
  },
  {
    icon: Clock,
    title: 'Automatización',
    description: 'Envía recordatorios automáticos y confirma citas sin intervención manual.'
  },
  {
    icon: BarChart3,
    title: 'Reportes y Analytics',
    description: 'Obtén insights valiosos sobre tu negocio con reportes detallados.'
  }
]

const HomePage: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesSection features={features} />
      <CTASection />
    </div>
  )
}

export default HomePage