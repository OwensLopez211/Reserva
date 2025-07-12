# appointments/tests_public_booking.py

import json
from datetime import datetime, time, date, timedelta
from django.test import TestCase, Client as TestClient
from django.utils import timezone
from django.urls import reverse
from organizations.models import Organization, Professional, Service, Client
from users.models import User
from appointments.models import Appointment
from schedule.models import ProfessionalSchedule, WeeklySchedule
from appointments.client_auth import ClientAuthService


class PublicBookingTests(TestCase):
    """
    Tests para el sistema de booking público
    """
    
    def setUp(self):
        """Configurar datos de prueba"""
        # Cliente de prueba
        self.client = TestClient()
        
        # Crear organización
        self.organization = Organization.objects.create(
            name="Salón de Belleza Test",
            slug="salon-test",
            description="Salón de prueba",
            industry_template="salon",
            email="salon@test.com",
            phone="+56912345678",
            address="Av. Principal 123, Santiago",
            city="Santiago",
            is_active=True
        )
        
        # Crear usuario owner
        self.owner = User.objects.create_user(
            username="owner",
            password="testpass123",
            email="owner@test.com",
            organization=self.organization,
            role="owner"
        )
        
        # Crear profesional
        self.professional = Professional.objects.create(
            organization=self.organization,
            name="María González",
            email="maria@test.com",
            specialty="Estilista",
            bio="Especialista en cortes y peinados",
            is_active=True
        )
        
        # Crear servicio
        self.service = Service.objects.create(
            organization=self.organization,
            name="Corte de Cabello",
            description="Corte moderno y lavado",
            duration_minutes=60,
            price=25000,
            category="Cabello",
            is_active=True
        )
        self.service.professionals.add(self.professional)
        
        # Crear horario del profesional
        self.schedule = ProfessionalSchedule.objects.create(
            professional=self.professional,
            min_booking_notice=60,
            max_booking_advance=10080,
            slot_duration=30,
            accepts_bookings=True
        )
        
        # Horario semanal (Lunes a Viernes 9:00-17:00)
        for weekday in range(5):
            WeeklySchedule.objects.create(
                professional_schedule=self.schedule,
                weekday=weekday,
                start_time=time(9, 0),
                end_time=time(17, 0),
                is_active=True
            )
    
    def test_get_organization_public_info(self):
        """Test obtener información pública de organización"""
        url = f'/public/booking/org/{self.organization.slug}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verificar estructura de respuesta
        self.assertIn('organization', data)
        self.assertIn('professionals', data)
        self.assertIn('services_by_category', data)
        self.assertIn('booking_settings', data)
        
        # Verificar datos de organización
        org_data = data['organization']
        self.assertEqual(org_data['name'], self.organization.name)
        self.assertEqual(org_data['slug'], self.organization.slug)
        
        # Verificar profesionales
        self.assertEqual(len(data['professionals']), 1)
        prof_data = data['professionals'][0]
        self.assertEqual(prof_data['name'], self.professional.name)
        
        # Verificar servicios
        self.assertIn('Cabello', data['services_by_category'])
    
    def test_get_public_availability(self):
        """Test obtener disponibilidad pública"""
        # Fecha de mañana (día laboral)
        tomorrow = timezone.now().date() + timedelta(days=1)
        while tomorrow.weekday() > 4:  # Asegurar que sea lunes-viernes
            tomorrow += timedelta(days=1)
        
        url = f'/public/booking/org/{self.organization.slug}/availability/'
        response = self.client.get(url, {
            'service_id': str(self.service.id),
            'date': tomorrow.isoformat(),
            'days_ahead': 3
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verificar estructura
        self.assertIn('organization_slug', data)
        self.assertIn('service', data)
        self.assertIn('availability', data)
        
        # Verificar que hay disponibilidad
        availability = data['availability']
        self.assertGreater(len(availability), 0)
        
        # Verificar que hay slots disponibles
        first_day = list(availability.values())[0]
        self.assertGreater(first_day['total_slots'], 0)
    
    def test_guest_booking_success(self):
        """Test booking exitoso como cliente guest"""
        # Fecha y hora para la cita
        tomorrow = timezone.now().date() + timedelta(days=1)
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        appointment_datetime = datetime.combine(tomorrow, time(10, 0))
        appointment_datetime = timezone.make_aware(appointment_datetime)
        
        url = f'/public/booking/org/{self.organization.slug}/book/'
        booking_data = {
            'booking_type': 'guest',
            'service_id': str(self.service.id),
            'professional_id': str(self.professional.id),
            'start_datetime': appointment_datetime.isoformat(),
            'client_data': {
                'first_name': 'Juan',
                'last_name': 'Pérez',
                'email': 'juan@test.com',
                'phone': '+56912345678',
                'notes': 'Primera visita'
            },
            'emergency_contact': 'María: +56987654321',
            'marketing_consent': True
        }
        
        response = self.client.post(
            url,
            data=json.dumps(booking_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        
        # Verificar respuesta
        self.assertTrue(data['success'])
        self.assertIn('appointment', data)
        self.assertIn('client', data)
        self.assertIn('guest_token', data)
        
        # Verificar que se creó la cita
        appointment = Appointment.objects.get(id=data['appointment']['id'])
        self.assertEqual(appointment.client.client_type, 'guest')
        self.assertEqual(appointment.status, 'pending')
        
        # Verificar que se creó el cliente guest
        guest_client = appointment.client
        self.assertTrue(guest_client.is_guest)
        self.assertIsNotNone(guest_client.guest_token)
        self.assertEqual(guest_client.first_name, 'Juan')
    
    def test_registered_client_booking_success(self):
        """Test booking exitoso como cliente registrado"""
        tomorrow = timezone.now().date() + timedelta(days=1)
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        appointment_datetime = datetime.combine(tomorrow, time(11, 0))
        appointment_datetime = timezone.make_aware(appointment_datetime)
        
        url = f'/public/booking/org/{self.organization.slug}/book/'
        booking_data = {
            'booking_type': 'registered',
            'service_id': str(self.service.id),
            'professional_id': str(self.professional.id),
            'start_datetime': appointment_datetime.isoformat(),
            'client_data': {
                'first_name': 'Ana',
                'last_name': 'López',
                'email': 'ana@test.com',
                'phone': '+56912345679',
                'notes': 'Cliente registrado'
            },
            'password': 'password123',
            'marketing_consent': False
        }
        
        response = self.client.post(
            url,
            data=json.dumps(booking_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 201)
        data = response.json()
        
        # Verificar respuesta
        self.assertTrue(data['success'])
        self.assertIn('verification_token', data)
        
        # Verificar que se creó el cliente registrado
        appointment = Appointment.objects.get(id=data['appointment']['id'])
        registered_client = appointment.client
        self.assertEqual(registered_client.client_type, 'registered')
        self.assertFalse(registered_client.email_verified)
        self.assertIsNotNone(registered_client.verification_token)
    
    def test_booking_conflict_detection(self):
        """Test detección de conflictos en booking"""
        # Crear cita existente
        tomorrow = timezone.now().date() + timedelta(days=1)
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        existing_datetime = datetime.combine(tomorrow, time(10, 0))
        existing_datetime = timezone.make_aware(existing_datetime)
        
        existing_client = Client.objects.create(
            organization=self.organization,
            first_name="Cliente",
            last_name="Existente",
            email="existente@test.com",
            phone="+56900000000"
        )
        
        Appointment.objects.create(
            organization=self.organization,
            professional=self.professional,
            service=self.service,
            client=existing_client,
            start_datetime=existing_datetime,
            end_datetime=existing_datetime + timedelta(minutes=60),
            duration_minutes=60,
            price=25000,
            created_by=self.owner
        )
        
        # Intentar reservar en el mismo horario
        url = f'/public/booking/org/{self.organization.slug}/book/'
        booking_data = {
            'booking_type': 'guest',
            'service_id': str(self.service.id),
            'professional_id': str(self.professional.id),
            'start_datetime': existing_datetime.isoformat(),
            'client_data': {
                'first_name': 'Nuevo',
                'last_name': 'Cliente',
                'email': 'nuevo@test.com',
                'phone': '+56911111111'
            }
        }
        
        response = self.client.post(
            url,
            data=json.dumps(booking_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertIn('no disponible', data['error'].lower())
    
    def test_client_login(self):
        """Test login de cliente registrado"""
        # Crear cliente registrado
        client = Client.create_registered_client(
            organization=self.organization,
            first_name="Test",
            last_name="Client",
            email="testclient@test.com",
            phone="+56912345679",
            password="password123"
        )
        
        url = f'/public/booking/org/{self.organization.slug}/auth/login/'
        login_data = {
            'email': 'testclient@test.com',
            'password': 'password123'
        }
        
        response = self.client.post(
            url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        self.assertIn('token', data)
        self.assertIn('client', data)
        self.assertEqual(data['client']['email'], client.email)
    
    def test_client_verify_email(self):
        """Test verificación de email de cliente"""
        # Crear cliente registrado
        client = Client.create_registered_client(
            organization=self.organization,
            first_name="Test",
            last_name="Client",
            email="verify@test.com",
            phone="+56912345679",
            password="password123"
        )
        
        url = f'/public/booking/org/{self.organization.slug}/auth/verify-email/'
        verify_data = {
            'email': client.email,
            'verification_token': client.verification_token
        }
        
        response = self.client.post(
            url,
            data=json.dumps(verify_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        
        # Verificar que el email fue marcado como verificado
        client.refresh_from_db()
        self.assertTrue(client.email_verified)
        self.assertIsNone(client.verification_token)
    
    def test_guest_appointment_status(self):
        """Test consultar estado de cita guest"""
        # Crear cita guest
        tomorrow = timezone.now().date() + timedelta(days=1)
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        appointment_datetime = datetime.combine(tomorrow, time(14, 0))
        appointment_datetime = timezone.make_aware(appointment_datetime)
        
        guest_client = Client.create_guest_client(
            organization=self.organization,
            first_name="Guest",
            last_name="User",
            email="guest@test.com",
            phone="+56900000001"
        )
        
        appointment = Appointment.objects.create(
            organization=self.organization,
            professional=self.professional,
            service=self.service,
            client=guest_client,
            start_datetime=appointment_datetime,
            end_datetime=appointment_datetime + timedelta(minutes=60),
            duration_minutes=60,
            price=25000,
            created_by=self.owner
        )
        
        url = f'/public/booking/org/{self.organization.slug}/appointments/{appointment.id}/'
        response = self.client.get(url, {
            'guest_token': guest_client.guest_token
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertIn('appointment', data)
        self.assertIn('client', data)
        self.assertEqual(data['appointment']['id'], str(appointment.id))
    
    def test_guest_appointment_cancel(self):
        """Test cancelar cita guest"""
        # Crear cita guest
        tomorrow = timezone.now().date() + timedelta(days=1)
        while tomorrow.weekday() > 4:
            tomorrow += timedelta(days=1)
        
        appointment_datetime = datetime.combine(tomorrow, time(15, 0))
        appointment_datetime = timezone.make_aware(appointment_datetime)
        
        guest_client = Client.create_guest_client(
            organization=self.organization,
            first_name="Cancel",
            last_name="Test",
            email="cancel@test.com",
            phone="+56900000002"
        )
        
        appointment = Appointment.objects.create(
            organization=self.organization,
            professional=self.professional,
            service=self.service,
            client=guest_client,
            start_datetime=appointment_datetime,
            end_datetime=appointment_datetime + timedelta(minutes=60),
            duration_minutes=60,
            price=25000,
            created_by=self.owner
        )
        
        url = f'/public/booking/org/{self.organization.slug}/appointments/{appointment.id}/cancel/'
        cancel_data = {
            'guest_token': guest_client.guest_token,
            'reason': 'No puedo asistir'
        }
        
        response = self.client.post(
            url,
            data=json.dumps(cancel_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        self.assertTrue(data['success'])
        
        # Verificar que la cita fue cancelada
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, 'cancelled')
        self.assertIsNotNone(appointment.cancelled_at)
    
    def test_booking_validation_errors(self):
        """Test validaciones de booking"""
        url = f'/public/booking/org/{self.organization.slug}/book/'
        
        # Test datos incompletos
        incomplete_data = {
            'booking_type': 'guest',
            'service_id': str(self.service.id),
            # Falta professional_id y otros campos
        }
        
        response = self.client.post(
            url,
            data=json.dumps(incomplete_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
        
        # Test horario fuera del rango de trabajo
        weekend_date = timezone.now().date() + timedelta(days=1)
        while weekend_date.weekday() < 5:  # Buscar fin de semana
            weekend_date += timedelta(days=1)
        
        weekend_datetime = datetime.combine(weekend_date, time(10, 0))
        weekend_datetime = timezone.make_aware(weekend_datetime)
        
        weekend_data = {
            'booking_type': 'guest',
            'service_id': str(self.service.id),
            'professional_id': str(self.professional.id),
            'start_datetime': weekend_datetime.isoformat(),
            'client_data': {
                'first_name': 'Test',
                'last_name': 'Weekend',
                'email': 'weekend@test.com',
                'phone': '+56900000003'
            }
        }
        
        response = self.client.post(
            url,
            data=json.dumps(weekend_data),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400)
    
    def test_organization_not_found(self):
        """Test organización no encontrada"""
        url = '/public/booking/org/nonexistent-org/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, 404)
        data = response.json()
        self.assertIn('error', data)