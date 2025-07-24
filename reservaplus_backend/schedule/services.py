# schedule/services.py

from datetime import datetime, timedelta, time, date
from typing import List, Dict, Optional, Tuple
from django.utils import timezone
from django.db.models import Q
from .models import (
    ProfessionalSchedule, 
    WeeklySchedule, 
    ScheduleBreak, 
    ScheduleException
)
from organizations.models import Professional, Service
from appointments.models import Appointment


class AvailabilityCalculationService:
    """
    Servicio para calcular disponibilidad de profesionales basado en horarios
    """
    
    def __init__(self, professional: Professional):
        self.professional = professional
        self.schedule = getattr(professional, 'schedule', None)
        
    def get_available_slots(
        self,
        target_date: date,
        service: Service,
        slot_duration_minutes: Optional[int] = None
    ) -> List[Dict]:
        """
        Calcular slots disponibles para un día específico
        
        Args:
            target_date: Fecha objetivo
            service: Servicio a agendar
            slot_duration_minutes: Duración del slot en minutos (opcional)
            
        Returns:
            Lista de diccionarios con información de slots disponibles
        """
        if not self.schedule:
            return []
        
        # Obtener duración del servicio
        duration_minutes = slot_duration_minutes or service.total_duration_minutes
        
        # Obtener horarios de trabajo para el día
        working_hours = self._get_working_hours_for_date(target_date)
        if not working_hours:
            return []
        
        # Obtener descansos para el día
        breaks = self._get_breaks_for_date(target_date)
        
        # Obtener citas existentes
        existing_appointments = self._get_existing_appointments(target_date)
        
        # Generar slots disponibles
        available_slots = []
        
        for work_period in working_hours:
            slots = self._generate_slots_for_period(
                target_date,
                work_period['start_time'],
                work_period['end_time'],
                duration_minutes,
                breaks,
                existing_appointments
            )
            available_slots.extend(slots)
        
        return available_slots
    
    def is_available_at_time(
        self,
        target_datetime: datetime,
        service: Service
    ) -> Tuple[bool, str]:
        """
        Verificar si el profesional está disponible en un momento específico
        
        Args:
            target_datetime: Fecha y hora objetivo
            service: Servicio a agendar
            
        Returns:
            Tupla (is_available, reason)
        """
        if not self.schedule:
            return False, "El profesional no tiene horarios configurados"
        
        # Verificar si acepta reservas
        if not self.schedule.accepts_bookings:
            return False, "El profesional no acepta reservas actualmente"
        
        # Asegurar que target_datetime sea timezone-aware
        if timezone.is_naive(target_datetime):
            target_datetime = timezone.make_aware(target_datetime)
        
        # Verificar tiempo mínimo de anticipación
        min_notice = timedelta(minutes=self.schedule.min_booking_notice)
        current_time = timezone.now()
        
        # Handle naive vs timezone-aware datetime comparison
        if timezone.is_naive(target_datetime) and timezone.is_aware(current_time):
            current_time = timezone.make_naive(current_time)
        elif timezone.is_aware(target_datetime) and timezone.is_naive(current_time):
            current_time = timezone.make_aware(current_time)
            
        if target_datetime < current_time + min_notice:
            return False, f"Se requiere al menos {self.schedule.min_booking_notice} minutos de anticipación"
        
        # Verificar tiempo máximo de anticipación
        max_advance = timedelta(minutes=self.schedule.max_booking_advance)
        if target_datetime > current_time + max_advance:
            return False, f"No se puede reservar con más de {self.schedule.max_booking_advance} minutos de anticipación"
        
        # Convert to professional's timezone for proper time comparison
        import pytz
        professional_tz = pytz.timezone(self.schedule.timezone)
        target_datetime_local = target_datetime.astimezone(professional_tz)
        
        target_date = target_datetime_local.date()
        target_time = target_datetime_local.time()
        
        print(f"DEBUG AvailabilityService: target_datetime (original) = {target_datetime}")
        print(f"DEBUG AvailabilityService: target_datetime_local = {target_datetime_local}")
        print(f"DEBUG AvailabilityService: target_date = {target_date}")
        print(f"DEBUG AvailabilityService: target_time = {target_time}")
        print(f"DEBUG AvailabilityService: professional timezone = {self.schedule.timezone}")
        
        # Verificar excepciones de horario
        exception = self._get_schedule_exception(target_date)
        if exception:
            if exception.exception_type == 'unavailable':
                return False, f"No disponible: {exception.reason}"
            elif exception.exception_type == 'special_hours':
                if not (exception.start_time <= target_time <= exception.end_time):
                    return False, "Fuera del horario especial"
        
        # Verificar horario de trabajo
        if not exception or exception.exception_type != 'special_hours':
            working_hours = self._get_working_hours_for_date(target_date)
            print(f"DEBUG AvailabilityService: working_hours = {working_hours}")
            if not self._is_time_in_working_hours(target_time, working_hours):
                print(f"DEBUG AvailabilityService: Time {target_time} is NOT in working hours {working_hours}")
                return False, "Fuera del horario de trabajo"
            else:
                print(f"DEBUG AvailabilityService: Time {target_time} is in working hours {working_hours}")
        
        # Verificar descansos
        if self._is_time_in_break(target_time, target_date):
            return False, "En horario de descanso"
        
        # Verificar solapamiento con citas existentes
        end_datetime = target_datetime + timedelta(minutes=service.total_duration_minutes)
        existing_appointments = self._get_existing_appointments(target_date)
        
        for appointment in existing_appointments:
            if (target_datetime < appointment.end_datetime and 
                end_datetime > appointment.start_datetime):
                return False, "Ya hay una cita programada en este horario"
        
        return True, "Disponible"
    
    def get_next_available_slots(
        self,
        service: Service,
        days_ahead: int = 30,
        max_slots: int = 20
    ) -> List[Dict]:
        """
        Obtener los próximos slots disponibles
        
        Args:
            service: Servicio a agendar
            days_ahead: Días hacia adelante a buscar
            max_slots: Máximo número de slots a retornar
            
        Returns:
            Lista de slots disponibles ordenados por fecha
        """
        all_slots = []
        current_date = timezone.now().date()
        end_date = current_date + timedelta(days=days_ahead)
        
        while current_date <= end_date and len(all_slots) < max_slots:
            daily_slots = self.get_available_slots(current_date, service)
            all_slots.extend(daily_slots)
            current_date += timedelta(days=1)
        
        # Ordenar por fecha y hora
        all_slots.sort(key=lambda x: x['start_datetime'])
        
        return all_slots[:max_slots]
    
    def _get_working_hours_for_date(self, target_date: date) -> List[Dict]:
        """
        Obtener horarios de trabajo para una fecha específica
        """
        weekday = target_date.weekday()
        
        # Verificar excepción de horario
        exception = self._get_schedule_exception(target_date)
        if exception:
            if exception.exception_type == 'unavailable':
                return []
            elif exception.exception_type == 'special_hours':
                return [{
                    'start_time': exception.start_time,
                    'end_time': exception.end_time
                }]
        
        # Obtener horarios semanales normales
        weekly_schedules = self.schedule.weekly_schedules.filter(
            weekday=weekday,
            is_active=True
        )
        
        working_hours = []
        for schedule in weekly_schedules:
            working_hours.append({
                'start_time': schedule.start_time,
                'end_time': schedule.end_time
            })
        
        return working_hours
    
    def _get_breaks_for_date(self, target_date: date) -> List[Dict]:
        """
        Obtener descansos para una fecha específica
        """
        weekday = target_date.weekday()
        
        # Si hay excepción de horario, no aplicar descansos normales
        exception = self._get_schedule_exception(target_date)
        if exception and exception.exception_type in ['unavailable', 'special_hours']:
            return []
        
        breaks = []
        weekly_schedules = self.schedule.weekly_schedules.filter(
            weekday=weekday,
            is_active=True
        )
        
        for schedule in weekly_schedules:
            for break_item in schedule.breaks.filter(is_active=True):
                breaks.append({
                    'start_time': break_item.start_time,
                    'end_time': break_item.end_time,
                    'name': break_item.name
                })
        
        return breaks
    
    def _get_existing_appointments(self, target_date: date) -> List[Appointment]:
        """
        Obtener citas existentes para una fecha
        """
        return Appointment.objects.filter(
            professional=self.professional,
            start_datetime__date=target_date,
            status__in=['pending', 'confirmed', 'checked_in', 'in_progress']
        ).order_by('start_datetime')
    
    def _get_schedule_exception(self, target_date: date) -> Optional['ScheduleException']:
        """
        Obtener excepción de horario para una fecha
        """
        try:
            return self.schedule.exceptions.get(
                date=target_date,
                is_active=True
            )
        except ScheduleException.DoesNotExist:
            return None
    
    def _is_time_in_working_hours(self, target_time: time, working_hours: List[Dict]) -> bool:
        """
        Verificar si una hora está dentro de los horarios de trabajo
        """
        for period in working_hours:
            if period['start_time'] <= target_time <= period['end_time']:
                return True
        return False
    
    def _is_time_in_break(self, target_time: time, target_date: date) -> bool:
        """
        Verificar si una hora está en un descanso
        """
        breaks = self._get_breaks_for_date(target_date)
        for break_item in breaks:
            if break_item['start_time'] <= target_time <= break_item['end_time']:
                return True
        return False
    
    def _generate_slots_for_period(
        self,
        target_date: date,
        start_time: time,
        end_time: time,
        duration_minutes: int,
        breaks: List[Dict],
        existing_appointments: List[Appointment]
    ) -> List[Dict]:
        """
        Generar slots para un período de tiempo específico
        """
        slots = []
        
        # Convertir a datetime para trabajar con intervalos
        current_datetime = datetime.combine(target_date, start_time)
        end_datetime = datetime.combine(target_date, end_time)
        
        # Asegurar que sean timezone-aware
        if timezone.is_naive(current_datetime):
            current_datetime = timezone.make_aware(current_datetime)
        if timezone.is_naive(end_datetime):
            end_datetime = timezone.make_aware(end_datetime)
        
        slot_interval = timedelta(minutes=self.schedule.slot_duration)
        service_duration = timedelta(minutes=duration_minutes)
        
        while current_datetime + service_duration <= end_datetime:
            slot_end_datetime = current_datetime + service_duration
            
            # Verificar si el slot está libre
            is_available = True
            conflict_reason = None
            
            # Verificar descansos
            for break_item in breaks:
                break_start = datetime.combine(target_date, break_item['start_time'])
                break_end = datetime.combine(target_date, break_item['end_time'])
                
                # Asegurar que sean timezone-aware
                if timezone.is_naive(break_start):
                    break_start = timezone.make_aware(break_start)
                if timezone.is_naive(break_end):
                    break_end = timezone.make_aware(break_end)
                
                if (current_datetime < break_end and slot_end_datetime > break_start):
                    is_available = False
                    conflict_reason = f"Conflicto con descanso: {break_item['name']}"
                    break
            
            # Verificar citas existentes
            if is_available:
                for appointment in existing_appointments:
                    if (current_datetime < appointment.end_datetime and 
                        slot_end_datetime > appointment.start_datetime):
                        is_available = False
                        conflict_reason = f"Conflicto con cita: {appointment.client.full_name}"
                        break
            
            # Agregar slot
            slots.append({
                'start_datetime': current_datetime,
                'end_datetime': slot_end_datetime,
                'start_time': current_datetime.time(),
                'end_time': slot_end_datetime.time(),
                'duration_minutes': duration_minutes,
                'is_available': is_available,
                'conflict_reason': conflict_reason,
                'professional_id': str(self.professional.id),
                'professional_name': self.professional.name
            })
            
            # Avanzar al siguiente slot
            current_datetime += slot_interval
        
        return slots


class MultiProfessionalAvailabilityService:
    """
    Servicio para calcular disponibilidad de múltiples profesionales
    """
    
    @staticmethod
    def get_available_slots_for_service(
        service: Service,
        target_date: date,
        professional_ids: Optional[List[str]] = None
    ) -> Dict[str, List[Dict]]:
        """
        Obtener slots disponibles para un servicio específico
        
        Args:
            service: Servicio a agendar
            target_date: Fecha objetivo
            professional_ids: IDs de profesionales específicos (opcional)
            
        Returns:
            Diccionario con professional_id como clave y lista de slots como valor
        """
        # Obtener profesionales que pueden realizar el servicio
        # Filtrar por is_active y que tengan horarios con accepts_bookings=True
        professionals_query = service.professionals.filter(
            is_active=True,
            schedule__accepts_bookings=True,
            schedule__is_active=True
        )
        
        if professional_ids:
            professionals_query = professionals_query.filter(id__in=professional_ids)
        
        professionals = list(professionals_query)
        availability_by_professional = {}
        
        for professional in professionals:
            availability_service = AvailabilityCalculationService(professional)
            slots = availability_service.get_available_slots(target_date, service)
            availability_by_professional[str(professional.id)] = slots
        
        return availability_by_professional
    
    @staticmethod
    def get_earliest_available_slot(
        service: Service,
        professional_ids: Optional[List[str]] = None,
        days_ahead: int = 30
    ) -> Optional[Dict]:
        """
        Obtener el slot más temprano disponible para un servicio
        
        Args:
            service: Servicio a agendar
            professional_ids: IDs de profesionales específicos (opcional)
            days_ahead: Días hacia adelante a buscar
            
        Returns:
            Slot más temprano disponible o None si no hay disponibilidad
        """
        current_date = timezone.now().date()
        end_date = current_date + timedelta(days=days_ahead)
        
        while current_date <= end_date:
            availability = MultiProfessionalAvailabilityService.get_available_slots_for_service(
                service, current_date, professional_ids
            )
            
            # Encontrar el slot más temprano del día
            earliest_slot = None
            earliest_time = None
            
            for professional_id, slots in availability.items():
                for slot in slots:
                    if slot['is_available']:
                        if earliest_time is None or slot['start_datetime'] < earliest_time:
                            earliest_time = slot['start_datetime']
                            earliest_slot = slot
            
            if earliest_slot:
                return earliest_slot
            
            current_date += timedelta(days=1)
        
        return None
    
    @staticmethod
    def get_availability_summary(
        service: Service,
        start_date: date,
        end_date: date,
        professional_ids: Optional[List[str]] = None
    ) -> Dict:
        """
        Obtener resumen de disponibilidad para un período
        
        Args:
            service: Servicio a agendar
            start_date: Fecha de inicio
            end_date: Fecha de fin
            professional_ids: IDs de profesionales específicos (opcional)
            
        Returns:
            Resumen de disponibilidad
        """
        summary = {
            'total_days': (end_date - start_date).days + 1,
            'available_days': 0,
            'total_slots': 0,
            'available_slots': 0,
            'professionals_summary': {},
            'daily_availability': {}
        }
        
        current_date = start_date
        
        while current_date <= end_date:
            availability = MultiProfessionalAvailabilityService.get_available_slots_for_service(
                service, current_date, professional_ids
            )
            
            day_total_slots = 0
            day_available_slots = 0
            day_has_availability = False
            
            for professional_id, slots in availability.items():
                prof_total = len(slots)
                prof_available = len([s for s in slots if s['is_available']])
                
                day_total_slots += prof_total
                day_available_slots += prof_available
                
                if prof_available > 0:
                    day_has_availability = True
                
                # Actualizar resumen por profesional
                if professional_id not in summary['professionals_summary']:
                    summary['professionals_summary'][professional_id] = {
                        'total_slots': 0,
                        'available_slots': 0,
                        'available_days': 0
                    }
                
                summary['professionals_summary'][professional_id]['total_slots'] += prof_total
                summary['professionals_summary'][professional_id]['available_slots'] += prof_available
                
                if prof_available > 0:
                    summary['professionals_summary'][professional_id]['available_days'] += 1
            
            summary['daily_availability'][current_date.isoformat()] = {
                'total_slots': day_total_slots,
                'available_slots': day_available_slots,
                'has_availability': day_has_availability
            }
            
            summary['total_slots'] += day_total_slots
            summary['available_slots'] += day_available_slots
            
            if day_has_availability:
                summary['available_days'] += 1
            
            current_date += timedelta(days=1)
        
        return summary