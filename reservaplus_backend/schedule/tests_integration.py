# schedule/tests_integration.py

from datetime import datetime, time, date, timedelta
from django.test import TestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from organizations.models import Organization, Professional, Service, Client
from users.models import User
from appointments.models import Appointment
from schedule.models import (
    ProfessionalSchedule, 
    WeeklySchedule, 
    ScheduleBreak, 
    ScheduleException
)
from schedule.services import AvailabilityCalculationService, MultiProfessionalAvailabilityService


class ScheduleAppointmentIntegrationTests(TestCase):
    """
    Tests de integración entre el sistema de horarios y citas
    """
    
    def setUp(self):
        """Configurar datos de prueba"""
        # Crear organización
        self.organization = Organization.objects.create(
            name="Test Salon",
            industry_template="salon"
        )
        
        # Crear usuario
        self.user = User.objects.create_user(
            username="testuser",
            password="testpass123",
            email="test@test.com",
            organization=self.organization,
            role="owner"
        )
        
        # Crear profesional
        self.professional = Professional.objects.create(
            organization=self.organization,
            name="María González",
            email="maria@test.com",
            specialty="Corte y Peinado"
        )
        
        # Crear servicio
        self.service = Service.objects.create(
            organization=self.organization,
            name="Corte de Cabello",
            duration_minutes=60,
            price=25000,
            category="Cabello"
        )
        self.service.professionals.add(self.professional)
        
        # Crear cliente
        self.client = Client.objects.create(
            organization=self.organization,
            first_name="Juan",
            last_name="Pérez",
            email="juan@test.com",
            phone="123456789"
        )
        
        # Crear horario del profesional
        self.schedule = ProfessionalSchedule.objects.create(
            professional=self.professional,
            min_booking_notice=60,  # 1 hora
            max_booking_advance=10080,  # 1 semana
            slot_duration=30
        )
        
        # Crear horario semanal (Lunes a Viernes, 9:00 - 17:00)
        for weekday in range(5):  # 0-4 (Lunes a Viernes)
            weekly_schedule = WeeklySchedule.objects.create(
                professional_schedule=self.schedule,
                weekday=weekday,
                start_time=time(9, 0),
                end_time=time(17, 0)
            )
            
            # Agregar descanso de almuerzo (12:00 - 13:00)
            ScheduleBreak.objects.create(
                weekly_schedule=weekly_schedule,
                start_time=time(12, 0),
                end_time=time(13, 0),
                name="Almuerzo"
            )
    
    def test_availability_calculation_basic(self):
        """Test básico de cálculo de disponibilidad"""
        # Obtener fecha de mañana (debería ser un día laboral)
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:  # 0-4 son lunes-viernes
            tomorrow += timedelta(days=1)
        
        availability_service = AvailabilityCalculationService(self.professional)
        slots = availability_service.get_available_slots(tomorrow, self.service)
        
        # Debería haber slots disponibles
        self.assertGreater(len(slots), 0)
        
        # Verificar que hay slots disponibles
        available_slots = [slot for slot in slots if slot['is_available']]
        self.assertGreater(len(available_slots), 0)
    
    def test_availability_calculation_with_break(self):
        """Test de disponibilidad considerando descansos"""
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        availability_service = AvailabilityCalculationService(self.professional)
        slots = availability_service.get_available_slots(tomorrow, self.service)
        
        # Verificar que no hay slots disponibles durante el almuerzo (12:00-13:00)
        lunch_slots = [
            slot for slot in slots 
            if (slot['start_time'] >= time(12, 0) and slot['end_time'] <= time(13, 0))
        ]
        
        # Todos los slots de almuerzo deberían estar marcados como no disponibles
        for slot in lunch_slots:
            self.assertFalse(slot['is_available'])
    
    def test_availability_with_existing_appointment(self):
        """Test de disponibilidad con cita existente"""
        # Crear cita para mañana a las 10:00
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        appointment_datetime = datetime.combine(tomorrow, time(10, 0))
        appointment_datetime = timezone.make_aware(appointment_datetime)
        
        Appointment.objects.create(
            organization=self.organization,
            professional=self.professional,
            service=self.service,
            client=self.client,
            start_datetime=appointment_datetime,
            end_datetime=appointment_datetime + timedelta(minutes=60),
            duration_minutes=60,
            price=25000,
            created_by=self.user
        )
        
        # Verificar disponibilidad
        availability_service = AvailabilityCalculationService(self.professional)
        slots = availability_service.get_available_slots(tomorrow, self.service)
        
        # Buscar slots que se solapan con la cita (10:00-11:00)
        conflicting_slots = [
            slot for slot in slots 
            if (slot['start_datetime'] < appointment_datetime + timedelta(minutes=60) and
                slot['end_datetime'] > appointment_datetime)
        ]
        
        # Estos slots deberían estar marcados como no disponibles
        for slot in conflicting_slots:
            self.assertFalse(slot['is_available'])
    
    def test_appointment_validation_with_schedule(self):
        """Test de validación de cita con horario"""
        # Intentar crear cita fuera del horario laboral
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        # Crear cita a las 20:00 (fuera del horario)
        appointment_datetime = datetime.combine(tomorrow, time(20, 0))
        appointment_datetime = timezone.make_aware(appointment_datetime)
        
        appointment = Appointment(
            organization=self.organization,
            professional=self.professional,
            service=self.service,
            client=self.client,
            start_datetime=appointment_datetime,
            duration_minutes=60,
            price=25000,
            created_by=self.user
        )
        
        # Debería fallar la validación
        with self.assertRaises(ValidationError):
            appointment.full_clean()
    
    def test_schedule_exception_unavailable(self):
        """Test de excepción de horario - no disponible"""
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        # Crear excepción para mañana (día libre)
        ScheduleException.objects.create(
            professional_schedule=self.schedule,
            date=tomorrow,
            exception_type='vacation',
            reason='Vacaciones'
        )
        
        # Verificar que no hay disponibilidad
        availability_service = AvailabilityCalculationService(self.professional)
        slots = availability_service.get_available_slots(tomorrow, self.service)
        
        # No debería haber slots disponibles
        self.assertEqual(len(slots), 0)
    
    def test_schedule_exception_special_hours(self):
        """Test de excepción de horario - horario especial"""
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        # Crear excepción para horario especial (14:00 - 16:00)
        ScheduleException.objects.create(
            professional_schedule=self.schedule,
            date=tomorrow,
            exception_type='special_hours',
            start_time=time(14, 0),
            end_time=time(16, 0),
            reason='Horario especial'
        )
        
        # Verificar disponibilidad
        availability_service = AvailabilityCalculationService(self.professional)
        slots = availability_service.get_available_slots(tomorrow, self.service)
        
        # Solo debería haber slots disponibles entre 14:00 y 16:00
        available_slots = [slot for slot in slots if slot['is_available']]
        
        for slot in available_slots:
            self.assertGreaterEqual(slot['start_time'], time(14, 0))
            self.assertLessEqual(slot['end_time'], time(16, 0))
    
    def test_multi_professional_availability(self):
        """Test de disponibilidad multi-profesional"""
        # Crear segundo profesional
        professional2 = Professional.objects.create(
            organization=self.organization,
            name="Ana López",
            email="ana@test.com",
            specialty="Coloración"
        )
        self.service.professionals.add(professional2)
        
        # Crear horario para segundo profesional
        schedule2 = ProfessionalSchedule.objects.create(
            professional=professional2,
            min_booking_notice=60,
            max_booking_advance=10080,
            slot_duration=30
        )
        
        # Horario diferente (10:00 - 18:00)
        for weekday in range(5):
            WeeklySchedule.objects.create(
                professional_schedule=schedule2,
                weekday=weekday,
                start_time=time(10, 0),
                end_time=time(18, 0)
            )
        
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        # Obtener disponibilidad para ambos profesionales
        availability = MultiProfessionalAvailabilityService.get_available_slots_for_service(
            self.service, tomorrow
        )
        
        # Debería haber disponibilidad para ambos profesionales
        self.assertEqual(len(availability), 2)
        
        # Verificar que ambos profesionales tienen slots
        prof1_slots = availability[str(self.professional.id)]
        prof2_slots = availability[str(professional2.id)]
        
        self.assertGreater(len(prof1_slots), 0)
        self.assertGreater(len(prof2_slots), 0)
    
    def test_earliest_available_slot(self):
        """Test de búsqueda del slot más temprano"""
        # Crear cita para mañana temprano
        tomorrow = timezone.now().date() + timedelta(days=1)
        
        # Mientras no sea lunes-viernes, agregar días
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        # Ocupar slot temprano (9:00-10:00)
        early_appointment = datetime.combine(tomorrow, time(9, 0))
        early_appointment = timezone.make_aware(early_appointment)
        
        Appointment.objects.create(
            organization=self.organization,
            professional=self.professional,
            service=self.service,
            client=self.client,
            start_datetime=early_appointment,
            end_datetime=early_appointment + timedelta(minutes=60),
            duration_minutes=60,
            price=25000,
            created_by=self.user
        )
        
        # Buscar slot más temprano
        earliest_slot = MultiProfessionalAvailabilityService.get_earliest_available_slot(
            self.service, days_ahead=7
        )
        
        self.assertIsNotNone(earliest_slot)
        self.assertTrue(earliest_slot['is_available'])
        # Debería ser después de las 10:00 (ya que 9:00-10:00 está ocupado)
        self.assertGreaterEqual(earliest_slot['start_time'], time(10, 0))
    
    def test_availability_summary(self):
        """Test de resumen de disponibilidad"""
        start_date = timezone.now().date() + timedelta(days=1)
        end_date = start_date + timedelta(days=7)
        
        summary = MultiProfessionalAvailabilityService.get_availability_summary(
            self.service, start_date, end_date
        )
        
        # Verificar estructura del resumen
        self.assertIn('total_days', summary)
        self.assertIn('available_days', summary)
        self.assertIn('total_slots', summary)
        self.assertIn('available_slots', summary)
        self.assertIn('professionals_summary', summary)
        self.assertIn('daily_availability', summary)
        
        # Verificar que hay datos
        self.assertGreater(summary['total_days'], 0)
        self.assertGreaterEqual(summary['available_days'], 0)
        self.assertGreaterEqual(summary['total_slots'], 0)
        self.assertGreaterEqual(summary['available_slots'], 0)