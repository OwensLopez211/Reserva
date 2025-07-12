# Configuración de Organización

## Descripción
La página de configuración permite al rol **Owner** gestionar completamente la información, preferencias y configuraciones de la organización.

## Ubicación
- **Ruta**: `/app/settings`
- **Menú**: Administración → Configuración General
- **Acceso**: Solo disponible para usuarios con rol `owner`

## Características Principales

### 1. Información Básica
- **Nombre de la organización**: Nombre que aparece en toda la plataforma
- **Tipo de industria**: Plantilla que define terminología y reglas por defecto
- **Descripción**: Descripción breve del negocio
- **Información de contacto**: Email, teléfono, sitio web
- **Ubicación**: Dirección, ciudad, país

### 2. Horarios de Funcionamiento
- **Configuración por día**: Horario de apertura y cierre para cada día de la semana
- **Días cerrados**: Posibilidad de marcar días como no laborables
- **Horarios flexibles**: Intervalos de 30 minutos para máxima flexibilidad
- **Vista previa**: Muestra el estado actual (abierto/cerrado)

### 3. Reglas de Negocio
- **Ventana de cancelación**: Tiempo mínimo antes de una cita para cancelar
- **Reservas anticipadas**: Cuántos días en el futuro se pueden hacer reservas
- **Buffer entre citas**: Tiempo libre obligatorio entre citas consecutivas
- **Recordatorios**: Configuración de recordatorios automáticos
- **Opciones adicionales**:
  - Permitir clientes sin cita previa
  - Requerir confirmación de citas
  - Enviar recordatorios automáticos

### 4. Terminología Personalizada
- **Profesional**: Singular y plural (ej: "Estilista/Estilistas")
- **Cliente**: Singular y plural (ej: "Paciente/Pacientes")
- **Cita**: Singular y plural (ej: "Consulta/Consultas")
- **Servicio**: Singular y plural (ej: "Tratamiento/Tratamientos")

### 5. Apariencia
- **Color principal**: Selección de color para la interfaz
- **Próximamente**: Logo personalizado, colores adicionales, CSS personalizado

## Funcionalidades Avanzadas

### Importar/Exportar Configuración
- **Exportar**: Descarga la configuración actual en formato JSON
- **Importar**: Carga configuración desde archivo JSON
- **Usar caso**: Transferir configuración entre organizaciones o crear respaldos

### Validaciones
- **Campos obligatorios**: Nombre, email, tipo de industria
- **Formato de datos**: Validación de email, URLs, horarios
- **Reglas de negocio**: Rangos válidos para todos los parámetros numéricos
- **Horarios**: Verificación de que el horario de cierre sea posterior al de apertura

### Plantillas por Industria
- **Salón de belleza**: Terminología y reglas optimizadas para peluquerías
- **Clínica médica**: Configuración para consultorios y clínicas
- **Spa**: Terminología y reglas para centros de bienestar
- **Más plantillas**: Dental, fitness, veterinaria, etc.

## Componentes Técnicos

### Tipos TypeScript
- `Organization`: Interfaz completa de la organización
- `OrganizationSettings`: Configuraciones específicas
- `BusinessHours`: Horarios de funcionamiento
- `BusinessRules`: Reglas de negocio
- `Terminology`: Terminología personalizada

### Servicios
- `OrganizationService`: Gestión completa de la organización
- Métodos principales:
  - `getOrganization()`: Obtiene información actual
  - `updateOrganization()`: Actualiza configuración
  - `validateOrganizationData()`: Valida datos antes de guardar
  - `exportConfiguration()`: Exporta configuración
  - `importConfiguration()`: Importa configuración

### Componentes
- `SettingsPage`: Página principal con pestañas
- `BasicInfoTab`: Información básica y contacto
- `BusinessHoursTab`: Configuración de horarios
- `BusinessRulesTab`: Reglas de negocio
- `TerminologyTab`: Terminología personalizada
- `AppearanceTab`: Personalización visual

## Integración con Backend

### Endpoints Utilizados
- `GET /api/organizations/me/`: Obtener información de la organización
- `PUT /api/organizations/organizations/{id}/`: Actualizar organización
- Los datos se validan tanto en frontend como backend

### Campos del Modelo
- Campos básicos: `name`, `email`, `phone`, `website`, `address`, `city`, `country`
- Configuraciones: `settings` (JSONField con configuraciones dinámicas)
- Metadatos: `industry_template`, `terminology`, `business_rules`

## Casos de Uso

### Configuración Inicial
1. Owner completa el onboarding
2. Accede a configuración para ajustar detalles
3. Personaliza terminología según su industria
4. Ajusta horarios y reglas de negocio

### Cambios de Configuración
1. Owner accede a configuración
2. Modifica los campos necesarios
3. Sistema valida los cambios
4. Configuración se aplica inmediatamente

### Migración de Configuración
1. Owner exporta configuración actual
2. Importa configuración en nueva organización
3. Ajusta detalles específicos
4. Guarda configuración final

## Consideraciones de Seguridad

### Acceso Restringido
- Solo usuarios con rol `owner` pueden acceder
- Validación de permisos en cada operación
- Datos sensibles protegidos

### Validación de Datos
- Validación en frontend y backend
- Sanitización de datos de entrada
- Verificación de tipos y rangos

## Mejoras Futuras

### Funcionalidades Planeadas
- **Multi-idioma**: Soporte para múltiples idiomas
- **Themes avanzados**: Personalización completa de la interfaz
- **Configuración por ubicación**: Para negocios con múltiples locales
- **Integración con calendario**: Sincronización con calendarios externos
- **Notificaciones avanzadas**: Configuración granular de notificaciones

### Optimizaciones
- **Caching**: Cache de configuración para mejor rendimiento
- **Validación en tiempo real**: Validación mientras el usuario escribe
- **Previsualización**: Vista previa de cambios antes de guardar
- **Historial de cambios**: Registro de modificaciones realizadas

## Testing

### Casos de Prueba
- **Funcionalidad básica**: Crear, leer, actualizar configuración
- **Validaciones**: Verificar que las validaciones funcionan correctamente
- **Importar/Exportar**: Verificar que la funcionalidad de importación/exportación funciona
- **Interfaz**: Verificar que todos los componentes se renderizan correctamente
- **Roles**: Verificar que solo los owners pueden acceder

### Pruebas de Integración
- **API**: Verificar que los endpoints del backend responden correctamente
- **Persistencia**: Verificar que los datos se guardan y cargan correctamente
- **Validación**: Verificar que la validación funciona en frontend y backend 