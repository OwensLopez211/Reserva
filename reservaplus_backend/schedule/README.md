# App Schedule - Configuración de Horarios

Esta app maneja la configuración de horarios para los profesionales en ReservaPlus.

## Modelos Principales

### ProfessionalSchedule
- **Propósito**: Configuración general de horarios para un profesional
- **Campos clave**:
  - `professional`: OneToOne con Professional
  - `timezone`: Zona horaria del profesional
  - `min_booking_notice`: Tiempo mínimo de anticipación para reservas
  - `max_booking_advance`: Tiempo máximo de anticipación para reservas
  - `slot_duration`: Duración de cada slot de tiempo
  - `accepts_bookings`: Si acepta reservas actualmente

### WeeklySchedule
- **Propósito**: Horarios semanales recurrentes
- **Campos clave**:
  - `weekday`: Día de la semana (0=Lunes, 6=Domingo)
  - `start_time`: Hora de inicio
  - `end_time`: Hora de fin
  - `is_active`: Si está activo

### ScheduleBreak
- **Propósito**: Descansos dentro de los horarios de trabajo
- **Campos clave**:
  - `weekly_schedule`: Relación con WeeklySchedule
  - `start_time`: Hora de inicio del descanso
  - `end_time`: Hora de fin del descanso
  - `name`: Nombre del descanso

### ScheduleException
- **Propósito**: Excepciones para días específicos
- **Tipos de excepciones**:
  - `unavailable`: No disponible
  - `vacation`: Vacaciones
  - `sick_leave`: Licencia médica
  - `special_hours`: Horario especial
  - `holiday`: Día festivo

### AvailabilitySlot
- **Propósito**: Slots de disponibilidad calculados automáticamente
- **Campos clave**:
  - `date`: Fecha del slot
  - `start_time`: Hora de inicio
  - `end_time`: Hora de fin
  - `is_available`: Si está disponible
  - `is_blocked`: Si está bloqueado

## Endpoints API

### Horarios de Profesionales
- `GET /api/schedule/schedules/` - Listar horarios
- `POST /api/schedule/schedules/` - Crear horario
- `GET /api/schedule/schedules/{id}/` - Obtener horario específico
- `PUT /api/schedule/schedules/{id}/` - Actualizar horario
- `DELETE /api/schedule/schedules/{id}/` - Eliminar horario

### Acciones Especiales
- `POST /api/schedule/schedules/{id}/duplicate/` - Duplicar horario
- `POST /api/schedule/schedules/{id}/toggle_bookings/` - Activar/desactivar reservas

### Horarios Semanales
- `GET /api/schedule/weekly-schedules/` - Listar horarios semanales
- `POST /api/schedule/weekly-schedules/` - Crear horario semanal
- `PUT /api/schedule/weekly-schedules/{id}/` - Actualizar horario semanal
- `DELETE /api/schedule/weekly-schedules/{id}/` - Eliminar horario semanal

### Descansos
- `GET /api/schedule/breaks/` - Listar descansos
- `POST /api/schedule/breaks/` - Crear descanso
- `PUT /api/schedule/breaks/{id}/` - Actualizar descanso
- `DELETE /api/schedule/breaks/{id}/` - Eliminar descanso

### Excepciones
- `GET /api/schedule/exceptions/` - Listar excepciones
- `POST /api/schedule/exceptions/` - Crear excepción
- `PUT /api/schedule/exceptions/{id}/` - Actualizar excepción
- `DELETE /api/schedule/exceptions/{id}/` - Eliminar excepción

### Disponibilidad
- `GET /api/schedule/availability/` - Consultar slots de disponibilidad
- `GET /api/schedule/availability/by_professional/` - Obtener disponibilidad por profesional

### Vistas Especiales
- `GET /api/schedule/overview/` - Resumen general de horarios
- `GET /api/schedule/professional/{id}/` - Obtener horario completo de un profesional
- `POST /api/schedule/professional/{id}/` - Crear horario para un profesional

## Utilidades

### Funciones Principales
- `generate_availability_slots()`: Generar slots de disponibilidad
- `bulk_create_availability_slots()`: Crear slots en masa
- `get_professional_availability()`: Obtener disponibilidad de un profesional
- `block_time_slot()`: Bloquear slots de tiempo
- `unblock_time_slot()`: Desbloquear slots de tiempo
- `get_schedule_conflicts()`: Verificar conflictos en horarios
- `calculate_working_hours()`: Calcular horas de trabajo totales
- `get_default_schedule_template()`: Obtener plantilla por defecto

## Ejemplo de Uso

### Crear un horario completo
```python
from schedule.models import ProfessionalSchedule
from schedule.serializers import ProfessionalScheduleCreateSerializer

data = {
    'professional': professional_id,
    'timezone': 'America/Santiago',
    'slot_duration': 30,
    'weekly_schedules': [
        {
            'weekday': 0,  # Lunes
            'start_time': '09:00',
            'end_time': '18:00',
            'breaks': [
                {
                    'start_time': '12:00',
                    'end_time': '13:00',
                    'name': 'Almuerzo'
                }
            ]
        }
    ]
}

serializer = ProfessionalScheduleCreateSerializer(data=data)
if serializer.is_valid():
    schedule = serializer.save()
```

### Generar slots de disponibilidad
```python
from schedule.utils import bulk_create_availability_slots
from datetime import date, timedelta

start_date = date.today()
end_date = start_date + timedelta(days=30)

slots_created = bulk_create_availability_slots(
    professional_schedule,
    start_date,
    end_date
)
```

### Bloquear tiempo
```python
from schedule.utils import block_time_slot
from datetime import date, time

blocked_count = block_time_slot(
    professional_schedule,
    date(2024, 1, 15),
    time(14, 0),  # 2:00 PM
    time(15, 0),  # 3:00 PM
    "Reunión importante"
)
```

## Configuración Admin

La app incluye configuración completa para el admin de Django con:
- Inlines para horarios semanales y excepciones
- Filtros por estado, día de la semana, etc.
- Búsqueda por nombre de profesional
- Jerarquía de fechas para excepciones

## Características Avanzadas

### Multi-tenant
- Todos los horarios están asociados a la organización del profesional
- Filtrado automático por organización del usuario

### Validaciones
- Horarios de inicio/fin válidos
- Descansos dentro de horarios de trabajo
- Validación de horarios especiales

### Flexibilidad
- Múltiples horarios por día
- Excepciones puntuales
- Horarios especiales
- Bloqueo de slots individual

### Performance
- Creación en masa de slots
- Consultas optimizadas con select_related
- Índices en campos de búsqueda frecuente 