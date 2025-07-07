// src/components/layout/Footer.tsx
import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin,
  ArrowUp,
  Heart,
  Calendar,
  Shield,
  Zap
} from 'lucide-react'

interface FooterProps {
  variant?: 'default' | 'modern' | 'minimal'
}

const Footer: React.FC<FooterProps> = ({ variant = 'modern' }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const currentYear = new Date().getFullYear()

  const footerLinks = {
    product: [
      { name: 'Marketplace', href: '/marketplace' },
      { name: 'Características', href: '/features' },
      { name: 'Precios', href: '/pricing' },
      { name: 'Demo', href: '/demo' }
    ],
    company: [
      { name: 'Acerca de', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Carreras', href: '/careers' },
      { name: 'Contacto', href: '/contact' }
    ],
    support: [
      { name: 'Centro de Ayuda', href: '/help' },
      { name: 'Documentación', href: '/docs' },
      { name: 'API', href: '/api' },
      { name: 'Estado', href: '/status' }
    ],
    legal: [
      { name: 'Privacidad', href: '/privacy' },
      { name: 'Términos', href: '/terms' },
      { name: 'Cookies', href: '/cookies' },
      { name: 'Legal', href: '/legal' }
    ]
  }

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' }
  ]

  if (variant === 'minimal') {
    return (
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white font-light text-sm">+</span>
              </div>
              <span className="text-xl font-semibold text-gray-800">Reserva+</span>
            </div>
            <p className="text-gray-600 text-sm">
              &copy; {currentYear} Reserva+. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    )
  }

  if (variant === 'default') {
    return (
      <footer className="bg-white shadow-lg mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-3">
                  <span className="text-white font-light text-lg">+</span>
                </div>
                <span className="text-2xl font-semibold text-gray-800">Reserva+</span>
              </div>
              <p className="text-gray-600 mb-6 max-w-md">
                La plataforma completa para gestionar reservas, clientes y servicios. 
                Diseñada para emprendedores que buscan crecer.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-gray-100 hover:bg-emerald-100 rounded-lg flex items-center justify-center transition-colors"
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5 text-gray-600 hover:text-emerald-600" />
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Enlaces Rápidos
              </h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                Contacto
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  hola@reservaplus.com
                </li>
                <li className="flex items-center text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  +1 (555) 123-4567
                </li>
                <li className="flex items-center text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  Santiago, Chile
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600">
              &copy; {currentYear} Reserva+. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    )
  }

  // Modern variant (default)
  return (
    <footer className="relative bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-600/5 via-cyan-600/5 to-blue-600/5"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          {/* Brand section */}
          <div className="lg:col-span-4">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4">
                <span className="text-white font-light text-xl">+</span>
              </div>
              <div>
                <span className="text-2xl font-bold">Reserva+</span>
                <div className="text-sm text-emerald-400">Gestión Inteligente</div>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 max-w-sm leading-relaxed">
              La plataforma completa para gestionar reservas, clientes y servicios. 
              Diseñada por emprendedores, para emprendedores que buscan crecer.
            </p>

            {/* Key features */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-3 h-3 text-emerald-400" />
                </div>
                <span className="text-sm text-gray-300">Setup en 5 minutos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-3 h-3 text-cyan-400" />
                </div>
                <span className="text-sm text-gray-300">Datos seguros</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-3 h-3 text-blue-400" />
                </div>
                <span className="text-sm text-gray-300">Apoyo personalizado</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/10 hover:border-emerald-500/30"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4 text-gray-400 hover:text-emerald-400 transition-colors" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Links sections */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              
              {/* Product */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Producto
                </h3>
                <ul className="space-y-3">
                  {footerLinks.product.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-emerald-400 transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Empresa
                </h3>
                <ul className="space-y-3">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Soporte
                </h3>
                <ul className="space-y-3">
                  {footerLinks.support.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-blue-400 transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  Legal
                </h3>
                <ul className="space-y-3">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter section */}
        <div className="border-t border-white/10 pt-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Mantente actualizado
              </h3>
              <p className="text-gray-400 text-sm">
                Recibe las últimas noticias y actualizaciones sobre Reserva+
              </p>
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 lg:w-64 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
              />
              <button className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium hover:from-emerald-400 hover:to-cyan-400 transition-all duration-300 transform hover:scale-105">
                Suscribirse
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span>&copy; {currentYear} Reserva+. Todos los derechos reservados.</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1">
                Hecho con <Heart className="w-4 h-4 text-red-400" /> en Santiago, Chile
              </span>
            </div>
            
            <button
              onClick={scrollToTop}
              className="w-10 h-10 bg-white/5 hover:bg-emerald-500/20 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 border border-white/10 hover:border-emerald-500/30"
              aria-label="Volver arriba"
            >
              <ArrowUp className="w-4 h-4 text-gray-400 hover:text-emerald-400 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer