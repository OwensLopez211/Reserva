# appointments/middleware.py

import json
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.urls import resolve
from django.utils import timezone
from datetime import datetime


class AvailabilityValidationMiddleware(MiddlewareMixin):
    """
    Middleware para validar disponibilidad en endpoints de creación/actualización de citas
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Endpoints que requieren validación de disponibilidad
        self.validation_endpoints = [
            'appointment-list',  # POST /api/appointments/
            'appointment-detail',  # PUT/PATCH /api/appointments/{id}/
        ]
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Procesar la vista antes de ejecutarla
        """
        # Solo procesar requests POST, PUT, PATCH
        if request.method not in ['POST', 'PUT', 'PATCH']:
            return None
        
        # Verificar si es un endpoint que requiere validación
        try:
            resolved_view = resolve(request.path_info)
            if resolved_view.url_name not in self.validation_endpoints:
                return None
        except Exception:
            return None
        
        # Solo procesar si es una cita
        if 'appointments' not in request.path_info:
            return None
        
        # Obtener datos del request
        try:
            if hasattr(request, 'data'):
                data = request.data
            else:
                data = json.loads(request.body.decode('utf-8')) if request.body else {}
        except (json.JSONDecodeError, UnicodeDecodeError):
            return None
        
        # Verificar si tiene los campos necesarios para validación
        required_fields = ['professional', 'service', 'start_datetime']
        if not all(field in data for field in required_fields):
            return None
        
        # Realizar validación de disponibilidad
        try:
            validation_result = self._validate_availability(
                request,
                data['professional'],
                data['service'],
                data['start_datetime'],
                data.get('exclude_appointment_id')
            )
            
            if not validation_result['is_available']:
                return JsonResponse({
                    'error': 'Horario no disponible',
                    'details': validation_result['conflicts'],
                    'suggested_slots': validation_result.get('suggested_slots', [])
                }, status=400)
        
        except Exception as e:
            # Si hay error en la validación, permitir que continúe
            # para que las validaciones del modelo se ejecuten
            pass
        
        return None
    
    def _validate_availability(self, request, professional_id, service_id, start_datetime_str, exclude_appointment_id=None):
        """
        Validar disponibilidad para una cita
        """
        from organizations.models import Professional, Service
        from schedule.services import AvailabilityCalculationService
        from appointments.models import Appointment
        from datetime import timedelta
        
        try:
            # Obtener objetos
            professional = Professional.objects.get(
                id=professional_id,
                organization=request.user.organization
            )
            service = Service.objects.get(
                id=service_id,
                organization=request.user.organization
            )
            
            # Parsear fecha
            start_datetime = datetime.fromisoformat(start_datetime_str.replace('Z', '+00:00'))
            
            # Usar el servicio de disponibilidad
            availability_service = AvailabilityCalculationService(professional)
            is_available, reason = availability_service.is_available_at_time(start_datetime, service)
            
            conflicts = []
            
            if not is_available:
                conflicts.append({
                    'type': 'schedule_conflict',
                    'reason': reason,
                    'severity': 'high'
                })
            
            # Verificar solapamiento con citas existentes
            end_datetime = start_datetime + timedelta(minutes=service.total_duration_minutes)
            overlapping_appointments = Appointment.objects.filter(
                professional=professional,
                start_datetime__lt=end_datetime,
                end_datetime__gt=start_datetime,
                status__in=['pending', 'confirmed', 'checked_in', 'in_progress']
            )
            
            if exclude_appointment_id:
                overlapping_appointments = overlapping_appointments.exclude(id=exclude_appointment_id)
            
            for appointment in overlapping_appointments:
                conflicts.append({
                    'type': 'appointment_conflict',
                    'reason': f'Conflicto con cita de {appointment.client.full_name}',
                    'severity': 'high',
                    'conflicting_appointment': {
                        'id': str(appointment.id),
                        'client_name': appointment.client.full_name,
                        'service_name': appointment.service.name,
                        'start_datetime': appointment.start_datetime.isoformat(),
                        'end_datetime': appointment.end_datetime.isoformat()
                    }
                })
            
            # Sugerir slots alternativos si hay conflictos
            suggested_slots = []
            if conflicts:
                try:
                    next_slots = availability_service.get_next_available_slots(
                        service, days_ahead=7, max_slots=3
                    )
                    suggested_slots = [
                        {
                            'start_datetime': slot['start_datetime'].isoformat(),
                            'end_datetime': slot['end_datetime'].isoformat(),
                            'professional_id': slot['professional_id'],
                            'professional_name': slot['professional_name']
                        }
                        for slot in next_slots
                    ]
                except Exception:
                    pass
            
            return {
                'is_available': len(conflicts) == 0,
                'conflicts': conflicts,
                'suggested_slots': suggested_slots
            }
            
        except Exception as e:
            # En caso de error, permitir que continúe
            return {
                'is_available': True,
                'conflicts': [],
                'error': str(e)
            }


class AppointmentAuditMiddleware(MiddlewareMixin):
    """
    Middleware para auditar cambios en citas
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def process_response(self, request, response):
        """
        Procesar respuesta para auditar cambios
        """
        # Solo auditar operaciones exitosas en citas
        if (response.status_code in [200, 201] and 
            'appointments' in request.path_info and 
            request.method in ['POST', 'PUT', 'PATCH', 'DELETE']):
            
            try:
                self._audit_appointment_change(request, response)
            except Exception:
                # No interrumpir la respuesta por errores de auditoría
                pass
        
        return response
    
    def _audit_appointment_change(self, request, response):
        """
        Auditar cambio en cita
        """
        from appointments.models import AppointmentHistory
        
        # Obtener información del cambio
        action_mapping = {
            'POST': 'created',
            'PUT': 'updated',
            'PATCH': 'updated',
            'DELETE': 'deleted'
        }
        
        action = action_mapping.get(request.method, 'unknown')
        
        # Obtener ID de la cita desde la URL o respuesta
        appointment_id = None
        
        if hasattr(request, 'resolver_match') and request.resolver_match:
            appointment_id = request.resolver_match.kwargs.get('pk')
        
        if not appointment_id and response.status_code == 201:
            # Para creaciones, obtener ID de la respuesta
            try:
                response_data = json.loads(response.content.decode('utf-8'))
                appointment_id = response_data.get('id')
            except Exception:
                pass
        
        if appointment_id and hasattr(request, 'user') and request.user.is_authenticated:
            # Crear entrada en historial
            AppointmentHistory.objects.create(
                appointment_id=appointment_id,
                action=f'middleware_{action}',
                changed_by=request.user,
                notes=f'Cambio detectado por middleware: {action}'
            )