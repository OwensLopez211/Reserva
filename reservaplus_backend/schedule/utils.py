# schedule/utils.py

from datetime import datetime, timedelta, time
from django.utils import timezone
from .models import (
    ProfessionalSchedule,
    WeeklySchedule,
    ScheduleException,
    AvailabilitySlot
)


def generate_availability_slots(professional_schedule, start_date, end_date):
    """
    Generar slots de disponibilidad para un profesional en un rango de fechas
    """
    slots = []
    current_date = start_date
    
    while current_date <= end_date:
        # Obtener día de la semana (0=Lunes, 6=Domingo)
        weekday = current_date.weekday()
        
        # Verificar si hay excepciones para este día
        exception = professional_schedule.exceptions.filter(
            date=current_date,
            is_active=True
        ).first()
        
        if exception:
            if exception.exception_type == 'unavailable':
                # Día no disponible, continuar con el siguiente día
                current_date += timedelta(days=1)
                continue
            elif exception.exception_type == 'special_hours':
                # Horario especial
                if exception.start_time and exception.end_time:
                    day_slots = generate_day_slots(
                        professional_schedule,
                        current_date,
                        exception.start_time,
                        exception.end_time
                    )
                    slots.extend(day_slots)
        else:
            # Horario normal - buscar horarios semanales
            weekly_schedules = professional_schedule.weekly_schedules.filter(
                weekday=weekday,
                is_active=True
            )
            
            for weekly_schedule in weekly_schedules:
                day_slots = generate_day_slots(
                    professional_schedule,
                    current_date,
                    weekly_schedule.start_time,
                    weekly_schedule.end_time,
                    weekly_schedule.breaks.filter(is_active=True)
                )
                slots.extend(day_slots)
        
        current_date += timedelta(days=1)
    
    return slots


def generate_day_slots(professional_schedule, date, start_time, end_time, breaks=None):
    """
    Generar slots para un día específico
    """
    slots = []
    slot_duration = timedelta(minutes=professional_schedule.slot_duration)
    
    # Crear datetime objects para cálculos
    current_datetime = datetime.combine(date, start_time)
    end_datetime = datetime.combine(date, end_time)
    
    # Procesar breaks si existen
    break_periods = []
    if breaks:
        for break_item in breaks:
            break_start = datetime.combine(date, break_item.start_time)
            break_end = datetime.combine(date, break_item.end_time)
            break_periods.append((break_start, break_end))
    
    # Generar slots
    while current_datetime < end_datetime:
        slot_end = current_datetime + slot_duration
        
        # Verificar si el slot completo cabe antes del fin del día
        if slot_end > end_datetime:
            break
        
        # Verificar si el slot está en un periodo de descanso
        in_break = False
        for break_start, break_end in break_periods:
            if (current_datetime >= break_start and current_datetime < break_end) or \
               (slot_end > break_start and slot_end <= break_end) or \
               (current_datetime < break_start and slot_end > break_end):
                in_break = True
                break
        
        if not in_break:
            slots.append({
                'professional_schedule': professional_schedule,
                'date': date,
                'start_time': current_datetime.time(),
                'end_time': slot_end.time(),
                'is_available': True,
                'is_blocked': False
            })
        
        current_datetime = slot_end
    
    return slots


def bulk_create_availability_slots(professional_schedule, start_date, end_date):
    """
    Crear slots de disponibilidad en masa para un profesional
    """
    # Limpiar slots existentes en el rango
    AvailabilitySlot.objects.filter(
        professional_schedule=professional_schedule,
        date__range=[start_date, end_date]
    ).delete()
    
    # Generar nuevos slots
    slots_data = generate_availability_slots(
        professional_schedule, 
        start_date, 
        end_date
    )
    
    # Crear objetos AvailabilitySlot
    slots_objects = [
        AvailabilitySlot(**slot_data) for slot_data in slots_data
    ]
    
    # Crear en masa
    AvailabilitySlot.objects.bulk_create(slots_objects)
    
    return len(slots_objects)


def get_professional_availability(professional_schedule, date):
    """
    Obtener disponibilidad de un profesional para una fecha específica
    """
    return AvailabilitySlot.objects.filter(
        professional_schedule=professional_schedule,
        date=date,
        is_available=True,
        is_blocked=False
    ).order_by('start_time')


def block_time_slot(professional_schedule, date, start_time, end_time, reason=""):
    """
    Bloquear un slot de tiempo específico
    """
    slots = AvailabilitySlot.objects.filter(
        professional_schedule=professional_schedule,
        date=date,
        start_time__gte=start_time,
        end_time__lte=end_time
    )
    
    updated_count = slots.update(
        is_blocked=True,
        blocked_reason=reason
    )
    
    return updated_count


def unblock_time_slot(professional_schedule, date, start_time, end_time):
    """
    Desbloquear un slot de tiempo específico
    """
    slots = AvailabilitySlot.objects.filter(
        professional_schedule=professional_schedule,
        date=date,
        start_time__gte=start_time,
        end_time__lte=end_time
    )
    
    updated_count = slots.update(
        is_blocked=False,
        blocked_reason=""
    )
    
    return updated_count


def get_schedule_conflicts(professional_schedule, date, start_time, end_time):
    """
    Verificar conflictos en el horario para una fecha y hora específica
    """
    conflicts = []
    
    # Verificar slots bloqueados
    blocked_slots = AvailabilitySlot.objects.filter(
        professional_schedule=professional_schedule,
        date=date,
        start_time__lt=end_time,
        end_time__gt=start_time,
        is_blocked=True
    )
    
    for slot in blocked_slots:
        conflicts.append({
            'type': 'blocked_slot',
            'start_time': slot.start_time,
            'end_time': slot.end_time,
            'reason': slot.blocked_reason
        })
    
    # Verificar excepciones
    exception = professional_schedule.exceptions.filter(
        date=date,
        is_active=True
    ).first()
    
    if exception and exception.exception_type == 'unavailable':
        conflicts.append({
            'type': 'unavailable_day',
            'reason': exception.reason
        })
    
    return conflicts


def calculate_working_hours(professional_schedule, start_date, end_date):
    """
    Calcular horas de trabajo totales para un profesional en un rango de fechas
    """
    total_minutes = 0
    current_date = start_date
    
    while current_date <= end_date:
        weekday = current_date.weekday()
        
        # Verificar excepciones
        exception = professional_schedule.exceptions.filter(
            date=current_date,
            is_active=True
        ).first()
        
        if exception:
            if exception.exception_type == 'special_hours':
                if exception.start_time and exception.end_time:
                    start_dt = datetime.combine(current_date, exception.start_time)
                    end_dt = datetime.combine(current_date, exception.end_time)
                    total_minutes += (end_dt - start_dt).total_seconds() / 60
        else:
            # Horario normal
            weekly_schedules = professional_schedule.weekly_schedules.filter(
                weekday=weekday,
                is_active=True
            )
            
            for weekly_schedule in weekly_schedules:
                start_dt = datetime.combine(current_date, weekly_schedule.start_time)
                end_dt = datetime.combine(current_date, weekly_schedule.end_time)
                day_minutes = (end_dt - start_dt).total_seconds() / 60
                
                # Restar tiempo de descansos
                for break_item in weekly_schedule.breaks.filter(is_active=True):
                    break_start = datetime.combine(current_date, break_item.start_time)
                    break_end = datetime.combine(current_date, break_item.end_time)
                    break_minutes = (break_end - break_start).total_seconds() / 60
                    day_minutes -= break_minutes
                
                total_minutes += day_minutes
        
        current_date += timedelta(days=1)
    
    return round(total_minutes / 60, 2)  # Retornar en horas


def get_default_schedule_template():
    """
    Obtener plantilla de horario por defecto
    """
    return {
        'timezone': 'America/Santiago',
        'min_booking_notice': 60,  # 1 hora
        'max_booking_advance': 10080,  # 1 semana
        'slot_duration': 30,  # 30 minutos
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
            },
            {
                'weekday': 1,  # Martes
                'start_time': '09:00',
                'end_time': '18:00',
                'breaks': [
                    {
                        'start_time': '12:00',
                        'end_time': '13:00',
                        'name': 'Almuerzo'
                    }
                ]
            },
            {
                'weekday': 2,  # Miércoles
                'start_time': '09:00',
                'end_time': '18:00',
                'breaks': [
                    {
                        'start_time': '12:00',
                        'end_time': '13:00',
                        'name': 'Almuerzo'
                    }
                ]
            },
            {
                'weekday': 3,  # Jueves
                'start_time': '09:00',
                'end_time': '18:00',
                'breaks': [
                    {
                        'start_time': '12:00',
                        'end_time': '13:00',
                        'name': 'Almuerzo'
                    }
                ]
            },
            {
                'weekday': 4,  # Viernes
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