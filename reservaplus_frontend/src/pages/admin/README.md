# Administración de Horarios - Frontend

Esta documentación explica cómo usar la funcionalidad de administración de horarios en ReservaPlus.

## Descripción General

La página de administración de horarios (`AdminSchedulesPage`) permite a los usuarios con rol `owner` configurar y gestionar los horarios de trabajo de todos los profesionales de su organización.

## Ubicación

- **Ruta**: `/app/admin/schedules`
- **Navegación**: Dropdown "Administración" → "Horarios"
- **Permisos**: Solo disponible para usuarios con rol `owner`

## Funcionalidades Principales

### 1. Vista General
- **Dashboard con estadísticas**: Total de profesionales, profesionales con horarios, horarios activos, etc.
- **Lista de profesionales**: Vista completa de todos los profesionales con el estado de sus horarios
- **Filtros de búsqueda**: Por nombre, email, especialidad
- **Filtros de estado**: Todos, con horario, sin horario

### 2. Gestión de Horarios

#### Crear Horario
- Botón "Crear Horario" para profesionales sin horario configurado
- Modal completo con 3 pestañas:
  - **Configuración General**: Zona horaria, duración de slots, tiempos de anticipación
  - **Horarios Semanales**: Configuración por día de la semana con descansos
  - **Excepciones**: Días especiales, vacaciones, horarios especiales

#### Editar Horario
- Botón de edición para profesionales con horario existente
- Mismo modal de creación con datos precargados
- Actualización en tiempo real

#### Duplicar Horario
- Funcionalidad para copiar horario completo entre profesionales
- Modal de selección del profesional destino
- Copia todos los horarios semanales, descansos y excepciones

## Componentes

### AdminSchedulesPage
**Archivo**: `src/pages/admin/AdminSchedulesPage.tsx`

**Props**: Ninguna (usa contexto de autenticación)

**Estado principal**:
```typescript
const [professionals, setProfessionals] = useState<Professional[]>([])
const [schedules, setSchedules] = useState<ScheduleSummary[]>([])
const [overview, setOverview] = useState<OverviewData | null>(null)
```

**Funciones principales**:
- `loadData()`: Carga datos de profesionales, horarios y estadísticas
- `handleCreateSchedule()`: Abre modal para crear horario
- `handleEditSchedule()`: Abre modal para editar horario
- `handleDuplicateSchedule()`: Abre modal para duplicar horario

### ScheduleModal
**Archivo**: `src/components/admin/ScheduleModal.tsx`

**Props**:
```typescript
interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  professional: Professional
  scheduleId?: string | null
  onSaved: () => void
}
```

**Funcionalidades**:
- Configuración general de horarios
- Gestión de horarios semanales con breaks
- Gestión de excepciones
- Validación de formularios

### DuplicateScheduleModal
**Archivo**: `src/components/admin/DuplicateScheduleModal.tsx`

**Props**:
```typescript
interface DuplicateScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  sourceSchedule: ScheduleSummary
  professionals: Professional[]
  onDuplicated: () => void
}
```

**Funcionalidades**:
- Selección de profesional destino
- Validación de disponibilidad
- Duplicación completa de configuración

## API Endpoints Utilizados

### Profesionales
- `GET /api/organizations/professionals/` - Lista de profesionales
- `GET /api/organizations/professionals/{id}/` - Detalles de profesional

### Horarios
- `GET /api/schedule/schedules/` - Lista de horarios
- `POST /api/schedule/schedules/` - Crear horario
- `GET /api/schedule/schedules/{id}/` - Obtener horario específico
- `PUT /api/schedule/schedules/{id}/` - Actualizar horario
- `POST /api/schedule/schedules/{id}/duplicate/` - Duplicar horario

### Estadísticas
- `GET /api/schedule/overview/` - Resumen general de horarios

## Tipos y Interfaces

Los tipos están definidos en `src/types/schedule.ts`:
- `Professional`: Información del profesional
- `ScheduleSummary`: Resumen de horario
- `ProfessionalSchedule`: Horario completo
- `WeeklySchedule`: Horario semanal
- `ScheduleBreak`: Descanso en horario
- `ScheduleException`: Excepción de horario

## Estados de Horarios

### Estados Visuales
- **🟢 Horario Activo**: Profesional con horario configurado y activo
- **🔴 Horario Inactivo**: Profesional con horario configurado pero inactivo
- **⚪ Sin Horario**: Profesional sin horario configurado

### Indicadores de Estado
```typescript
type ScheduleStatus = 'active' | 'inactive' | 'none'
```

## Flujo de Trabajo Típico

### Para Propietario Nuevo
1. **Acceder a la página**: Navegación → Administración → Horarios
2. **Ver estadísticas**: Dashboard muestra 0% completado
3. **Crear primer horario**: Seleccionar profesional → Crear Horario
4. **Configurar horario base**: Configuración general + horarios semanales
5. **Duplicar a otros**: Usar funcionalidad de duplicación para otros profesionales
6. **Ajustar individualmente**: Editar horarios específicos según necesidades

### Para Gestión Continua
1. **Monitorear estadísticas**: Dashboard de completitud
2. **Filtrar profesionales**: Buscar profesionales específicos
3. **Actualizar horarios**: Editar horarios existentes
4. **Gestionar excepciones**: Agregar vacaciones, días especiales
5. **Duplicar configuraciones**: Aplicar cambios similares a múltiples profesionales

## Validaciones

### Cliente (Frontend)
- Horarios de inicio < fin
- Descansos dentro de horarios de trabajo
- Fechas de excepciones válidas
- Horarios especiales con horas completas

### Servidor (Backend)
- Validación de permisos (solo owners)
- Verificación de organización
- Validación de datos de horarios
- Prevención de duplicados

## Manejo de Errores

### Errores Comunes
- **Error 403**: Usuario sin permisos (no es owner)
- **Error 404**: Profesional no encontrado
- **Error 400**: Datos de horario inválidos
- **Error 500**: Error del servidor

### Manejo en UI
- Mensajes de error contextuales
- Reintentos automáticos para cargar datos
- Validación en tiempo real
- Estados de carga y guardado

## Optimizaciones

### Performance
- Carga de datos en paralelo
- Queries optimizadas con `select_related`
- Paginación en listas grandes
- Debounce en búsquedas

### UX
- Estados de carga visual
- Confirmaciones para acciones destructivas
- Autoguardado en formularios
- Navegación intuitiva con breadcrumbs

## Extensibilidad

### Funcionalidades Futuras
- Vista de calendario de disponibilidad
- Reportes de horarios
- Plantillas de horarios predefinidas
- Importación masiva de horarios
- Notificaciones de cambios de horario

### Puntos de Extensión
- Nuevos tipos de excepciones
- Configuraciones adicionales por profesional
- Integración con sistemas externos
- Reglas de negocio personalizadas

## Testing

### Casos de Prueba Principales
1. Creación de horario completo
2. Edición de horario existente
3. Duplicación entre profesionales
4. Validaciones de formulario
5. Manejo de errores de API
6. Filtros y búsquedas
7. Estados de carga

### Datos de Prueba
El sistema incluye datos de ejemplo para testing y desarrollo. 