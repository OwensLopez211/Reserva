# Reserva+ 📅

Sistema integral de gestión de citas y administración empresarial para negocios de servicios en Chile.

## 🎯 Descripción

**Reserva+** es una plataforma SaaS multi-tenant diseñada específicamente para empresas de servicios que necesitan gestionar citas, clientes, personal y operaciones de manera eficiente. La plataforma ofrece una solución completa desde la reserva pública hasta la administración avanzada del negocio.

## ✨ Características Principales

### 📋 Gestión de Citas
- **Ciclo completo de citas**: Pendiente → Confirmada → Registrada → En progreso → Completada
- **Vista de calendario** con programación intuitiva
- **Citas presenciales** (walk-in) y programadas
- **Citas recurrentes** y seguimiento del historial
- **Gestión de cancelaciones** y no presentaciones

### 👥 Gestión de Clientes
- **Sistema multi-tipo**: Clientes internos, registrados e invitados
- **Perfiles completos** con información de contacto y preferencias
- **Notas y archivos** adjuntos por cliente
- **Reservas públicas** con registro de clientes
- **Reservas de invitados** sin necesidad de registro

### 👨‍💼 Gestión de Profesionales y Personal
- **Perfiles de profesionales** con especialidades y servicios
- **Roles de personal**: Propietario, administrador, personal, profesional, recepción
- **Gestión de horarios** por profesional
- **Calendario codificado por colores**

### 🛍️ Gestión de Servicios
- **Catálogo de servicios** con precios y duración
- **Categorías y descripciones** detalladas
- **Tiempo de preparación** y limpieza (buffer time)
- **Asociación profesional-servicio**

### 🏢 Gestión Organizacional
- **Arquitectura multi-tenant** (cada negocio aislado)
- **Plantillas por industria**: Salón, clínica, fitness, spa, dental, veterinaria, etc.
- **Configuración y branding** personalizado
- **Presencia en marketplace**

### 🌐 Sistema de Reservas Públicas
- **Interfaz pública** para reservas de clientes
- **Soporte para invitados** y clientes registrados
- **Confirmaciones por email** y notificaciones
- **Seguimiento de estado** de citas

### 🏪 Marketplace Integrado
- **Plataforma de descubrimiento** de negocios
- **Perfiles organizacionales** con calificaciones y reseñas
- **Navegación por categorías** y negocios destacados

### 💳 Gestión de Suscripciones
- **Múltiples niveles**: Gratuito, Básico, Profesional, Empresarial
- **Límites de uso** y contadores
- **Períodos de prueba** y gestión del ciclo de vida

### 🚀 Sistema de Onboarding
- **Proceso guiado** para nuevos negocios
- **Selección de plan** y configuración de equipo
- **Configuración de servicios** y organización

## 🛠️ Stack Tecnológico

### Backend (Django REST Framework)
- **Framework**: Django 4.2.7 con Django REST Framework 3.14.0
- **Base de datos**: SQLite3 (desarrollo), soporte para PostgreSQL
- **Autenticación**: Implementación JWT personalizada
- **Librerías clave**:
  - `django-cors-headers` para manejo de CORS
  - `django-filter` para filtrado de API
  - `celery` para tareas en segundo plano
  - `redis` para caché y cola de tareas
  - `PyJWT` para manejo de tokens JWT

### Frontend (React + TypeScript)
- **Framework**: React 19.1.0 con TypeScript
- **Herramienta de construcción**: Vite 6.3.5
- **Enrutamiento**: React Router DOM 7.6.2
- **Estilos**: Tailwind CSS 3.4.17
- **Librerías clave**:
  - `axios` para comunicación con API
  - `react-hook-form` con `zod` para validación de formularios
  - `date-fns` para manipulación de fechas
  - `lucide-react` para iconos

## 🏗️ Estructura del Proyecto

```
Reserva/
├── reservaplus_backend/          # Backend Django
│   ├── appointments/             # Gestión de citas
│   ├── core/                     # Funcionalidades centrales
│   ├── organizations/            # Gestión organizacional
│   ├── plans/                    # Planes y suscripciones
│   ├── schedule/                 # Gestión de horarios
│   ├── users/                    # Gestión de usuarios
│   ├── onboarding/              # Sistema de onboarding
│   ├── notifications/           # Sistema de notificaciones
│   └── requirements.txt         # Dependencias Python
└── reservaplus_frontend/        # Frontend React
    ├── src/
    │   ├── components/          # Componentes reutilizables
    │   ├── pages/              # Páginas de la aplicación
    │   ├── services/           # Servicios API
    │   ├── contexts/           # Contextos React
    │   ├── hooks/              # Hooks personalizados
    │   └── types/              # Definiciones TypeScript
    └── package.json            # Dependencias Node.js
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Python 3.12+
- Node.js 18+
- Redis (para tareas en segundo plano)

### Backend (Django)

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd Reserva/reservaplus_backend
   ```

2. **Crear entorno virtual**
   ```bash
   python -m venv venv
   source venv/bin/activate  # En Windows: venv\Scripts\activate
   ```

3. **Instalar dependencias**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env con las configuraciones necesarias
   DEBUG=True
   SECRET_KEY=tu-clave-secreta
   DATABASE_URL=sqlite:///db.sqlite3
   ```

5. **Ejecutar migraciones**
   ```bash
   python manage.py migrate
   ```

6. **Crear superusuario**
   ```bash
   python manage.py createsuperuser
   ```

7. **Ejecutar servidor de desarrollo**
   ```bash
   python manage.py runserver
   ```

### Frontend (React)

1. **Navegar al directorio frontend**
   ```bash
   cd ../reservaplus_frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Compilar para producción**
   ```bash
   npm run build
   ```

## 🔧 Scripts Disponibles

### Backend
- `python manage.py runserver` - Ejecutar servidor de desarrollo
- `python manage.py test` - Ejecutar pruebas
- `python manage.py migrate` - Aplicar migraciones
- `python manage.py collectstatic` - Recopilar archivos estáticos

### Frontend
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run lint` - Verificar código con ESLint
- `npm run type-check` - Verificar tipos TypeScript

## 🌍 Configuración Regional

- **Idioma**: Español (Chile) - `es-cl`
- **Zona horaria**: America/Santiago
- **Moneda**: Peso chileno (CLP)
- **Formato de fecha**: DD/MM/YYYY

## 🏢 Industrias Soportadas

- 💇 **Salones de belleza**
- 🏥 **Clínicas médicas**
- 💪 **Centros de fitness**
- 🧖 **Spas y bienestar**
- 🦷 **Consultas dentales**
- 🐕 **Clínicas veterinarias**
- 📚 **Servicios educativos**
- 🔧 **Servicios técnicos**

## 👥 Roles de Usuario

- **👑 Propietario**: Acceso completo al sistema
- **⚙️ Administrador**: Gestión de configuración y personal
- **👨‍💼 Profesional**: Gestión de citas y servicios propios
- **👥 Personal**: Operaciones básicas y asistencia
- **📞 Recepción**: Gestión de citas y atención al cliente

## 🔐 Seguridad

- Autenticación JWT con refresh tokens
- Aislamiento multi-tenant
- Validación de permisos por rol
- Protección CORS configurada
- Validación de entrada con Zod

## 📄 Licencia

Este proyecto está bajo licencia propietaria. Todos los derechos reservados.

## 🤝 Contribución

Este es un proyecto privado. Para consultas sobre contribuciones, contacta al equipo de desarrollo.

## 📞 Soporte

Para soporte técnico o consultas comerciales, contacta a nuestro equipo de desarrollo.

---

**Desarrollado con ❤️ para la comunidad empresarial chilena**