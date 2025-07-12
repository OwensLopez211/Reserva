# Gestión de Servicios

## Descripción

La funcionalidad de gestión de servicios permite a los usuarios con rol **owner** crear, modificar y administrar todos los servicios que ofrece la organización. Esta funcionalidad incluye configuración de precios, duraciones, categorías y asignación de profesionales.

## Ubicación

- **Ruta**: `/app/services`
- **Componente Principal**: `ServicesPage`
- **Componente Modal**: `ServiceModal`

## Características

### 1. Dashboard de Servicios

- **Estadísticas en tiempo real**:
  - Total de servicios configurados
  - Servicios activos
  - Duración promedio
  - Precio promedio

### 2. Lista de Servicios

- **Vista en formato de tarjetas** con información detallada
- **Filtros avanzados**:
  - Búsqueda por nombre, descripción o categoría
  - Filtro por categoría
  - Filtro por estado (activo/inactivo)
  - Filtro por preparación requerida

### 3. Gestión de Servicios

#### Crear Servicio
- Nombre y descripción
- Categoría (cortes, coloración, tratamientos, etc.)
- Duración (15 minutos a 4 horas)
- Precio con formato de moneda chilena
- Tiempos de buffer (preparación y limpieza)
- Asignación de profesionales
- Configuración de estado

#### Editar Servicio
- Modificar todos los campos del servicio
- Mantener historial de cambios
- Validación de datos

#### Eliminar Servicio
- Confirmación antes de eliminar
- Verificación de dependencias

#### Activar/Desactivar Servicio
- Cambio de estado sin eliminar
- Visualización clara del estado

### 4. Configuración Avanzada

- **Tiempos de Buffer**:
  - Tiempo de preparación (antes del servicio)
  - Tiempo de limpieza (después del servicio)
  - Cálculo automático de duración total

- **Asignación de Profesionales**:
  - Selección múltiple de profesionales
  - Vista previa de profesionales asignados
  - Código de color por profesional

- **Opciones Especiales**:
  - Requiere preparación especial
  - Estado activo/inactivo

## Componentes

### ServicesPage

**Ubicación**: `src/pages/ServicesPage.tsx`

**Características**:
- Dashboard con estadísticas
- Lista filtrable de servicios
- Integración con ServicesService
- Manejo de estados de carga y errores

### ServiceModal

**Ubicación**: `src/components/admin/ServiceModal.tsx`

**Características**:
- Formulario completo para crear/editar servicios
- Validación en tiempo real
- Selección múltiple de profesionales
- Resumen de duración con buffers
- Formateo automático de precios

## Servicios

### ServicesService

**Ubicación**: `src/services/servicesService.ts`

**Métodos principales**:
- `getServices()`: Obtener lista de servicios con filtros
- `getService(id)`: Obtener servicio específico
- `createService()`: Crear nuevo servicio
- `updateService()`: Actualizar servicio existente
- `deleteService()`: Eliminar servicio
- `toggleServiceStatus()`: Cambiar estado activo/inactivo
- `getProfessionals()`: Obtener profesionales disponibles
- `getLimitsInfo()`: Información de límites del plan

**Utilidades**:
- `validateServiceData()`: Validar datos antes de guardar
- `formatPrice()`: Formatear precios en CLP
- `formatDuration()`: Formatear duración legible
- `getCategoryName()`: Obtener nombre de categoría
- `calculateTotalDuration()`: Calcular duración total con buffers

## Tipos TypeScript

### Interfaces Principales

```typescript
interface Service {
  id: string
  name: string
  description: string
  category: string
  duration_minutes: number
  price: string
  buffer_time_before: number
  buffer_time_after: number
  total_duration_minutes: number
  is_active: boolean
  requires_preparation: boolean
  organization: string
  professionals: string[]
  professionals_count: number
  created_at: string
  updated_at: string
}

interface ServiceData {
  name: string
  description: string
  category: string
  duration_minutes: number
  price: string
  buffer_time_before: number
  buffer_time_after: number
  is_active: boolean
  requires_preparation: boolean
  professionals: string[]
}
```

### Constantes

- `SERVICE_CATEGORIES`: Categorías predefinidas de servicios
- `DURATION_OPTIONS`: Opciones de duración (15 min - 4 horas)
- `BUFFER_TIME_OPTIONS`: Opciones de tiempo de buffer (0 - 30 min)

## Navegación

### Acceso desde Navegación

1. **Menú "Ventas"** → "Productos/Servicios"
2. **Menú "Administración"** → "Servicios"

Ambos enlaces llevan a la misma página: `/app/services`

### Permisos

- **Owner**: Acceso completo (crear, editar, eliminar, activar/desactivar)
- **Admin**: Acceso completo (crear, editar, eliminar, activar/desactivar)
- **Otros roles**: Sin acceso

## Integración con Backend

### Endpoints API

- `GET /api/organizations/services/` - Lista servicios
- `POST /api/organizations/services/` - Crear servicio
- `GET /api/organizations/services/{id}/` - Obtener servicio
- `PUT /api/organizations/services/{id}/` - Actualizar servicio
- `DELETE /api/organizations/services/{id}/` - Eliminar servicio
- `GET /api/organizations/services/limits_info/` - Información de límites
- `GET /api/organizations/professionals/` - Lista profesionales

### Validaciones

- **Límites de plan**: Validación de límites según el plan de suscripción
- **Datos requeridos**: Nombre, categoría, duración, precio
- **Rangos válidos**: Duración (1-480 min), Precio (0-1,000,000), Buffers (0-60 min)

## Casos de Uso

### Flujo Típico - Crear Servicio

1. **Acceder** a la página de servicios
2. **Hacer clic** en "Nuevo Servicio"
3. **Completar** información básica (nombre, categoría, descripción)
4. **Configurar** duración y precio
5. **Establecer** tiempos de buffer si es necesario
6. **Asignar** profesionales que pueden realizar el servicio
7. **Configurar** opciones especiales
8. **Guardar** el servicio

### Flujo Típico - Editar Servicio

1. **Encontrar** el servicio en la lista (usar filtros si es necesario)
2. **Hacer clic** en el botón "Editar"
3. **Modificar** los campos necesarios
4. **Guardar** los cambios

### Flujo Típico - Gestionar Estado

1. **Encontrar** el servicio en la lista
2. **Hacer clic** en el botón de estado (activar/desactivar)
3. **Confirmar** el cambio si es necesario

## Casos de Prueba

### Pruebas de Funcionalidad

1. **Crear servicio** con todos los campos
2. **Editar servicio** existente
3. **Eliminar servicio** con confirmación
4. **Filtrar servicios** por categoría y estado
5. **Buscar servicios** por nombre
6. **Asignar profesionales** a servicios
7. **Calcular duración total** con buffers
8. **Validar límites** del plan

### Pruebas de Validación

1. **Campos requeridos** no pueden estar vacíos
2. **Duración** debe estar en rango válido
3. **Precio** debe ser número válido
4. **Buffers** no pueden ser negativos
5. **Profesionales** deben pertenecer a la organización

### Pruebas de UI/UX

1. **Responsive design** en diferentes tamaños de pantalla
2. **Estados de carga** durante operaciones
3. **Mensajes de error** claros y útiles
4. **Confirmaciones** antes de acciones destructivas
5. **Feedback visual** para acciones exitosas

## Mejoras Futuras

- **Duplicación de servicios** para crear servicios similares rápidamente
- **Plantillas de servicios** por industria
- **Historial de cambios** para servicios
- **Importación/exportación** de servicios
- **Servicios combinados** (paquetes)
- **Descuentos y promociones** por servicio
- **Reportes de popularidad** de servicios
- **Integración con sistema de inventario**

## Soporte y Mantenimiento

Para reportar bugs o solicitar nuevas características, contactar al equipo de desarrollo a través de los canales establecidos en la organización. 