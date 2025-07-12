# appointments/views.py

from datetime import datetime, timedelta, time
from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Appointment, AppointmentHistory, RecurringAppointment
from .serializers import (
    AppointmentSerializer, AppointmentCreateSerializer, AppointmentUpdateSerializer,
    AppointmentHistorySerializer, RecurringAppointmentSerializer,
    AppointmentCalendarSerializer, AvailabilitySlotSerializer
)
from organizations.models import Professional, Service


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet principal para gestión de citas
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Usar diferentes serializers según la acción"""
        if self.action == 'create':
            return AppointmentCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AppointmentUpdateSerializer
        elif self.action == 'calendar':
            return AppointmentCalendarSerializer
        return AppointmentSerializer
    
    def get_queryset(self):
        """Filtrar citas por organización del usuario"""
        user = self.request.user
        if user.is_superuser:
            queryset = Appointment.objects.all()
        elif user.organization:
            queryset = Appointment.objects.filter(organization=user.organization)
        else:
            queryset = Appointment.objects.none()
        
        # Optimizar consultas
        return queryset.select_related(
            'organization', 'client', 'professional', 'service', 
            'created_by', 'cancelled_by'
        ).prefetch_related('history')
    
    def perform_create(self, serializer):
        """Crear cita con validaciones adicionales"""
        appointment = serializer.save()
        
        # Crear registro en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='created',
            new_values=serializer.data,
            changed_by=self.request.user,
            notes='Cita creada'
        )
    
    def perform_update(self, serializer):
        """Actualizar cita con historial"""
        # Guardar valores anteriores
        old_values = AppointmentSerializer(serializer.instance).data
        
        appointment = serializer.save()
        
        # Crear registro en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='updated',
            old_values=old_values,
            new_values=serializer.data,
            changed_by=self.request.user,
            notes='Cita actualizada'
        )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmar una cita"""
        appointment = self.get_object()
        
        if appointment.status != 'pending':
            return Response(
                {'error': 'Solo se pueden confirmar citas pendientes'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.confirm()
        
        # Registrar en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='confirmed',
            changed_by=request.user,
            notes='Cita confirmada'
        )
        
        return Response({
            'message': 'Cita confirmada exitosamente',
            'appointment': AppointmentSerializer(appointment).data
        })
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        """Marcar llegada del cliente"""
        appointment = self.get_object()
        
        if appointment.status not in ['pending', 'confirmed']:
            return Response(
                {'error': 'No se puede hacer check-in en esta cita'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.check_in()
        
        # Registrar en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='checked_in',
            changed_by=request.user,
            notes='Cliente llegó'
        )
        
        return Response({
            'message': 'Check-in realizado exitosamente',
            'appointment': AppointmentSerializer(appointment).data
        })
    
    @action(detail=True, methods=['post'])
    def start_service(self, request, pk=None):
        """Iniciar el servicio"""
        appointment = self.get_object()
        
        if appointment.status != 'checked_in':
            return Response(
                {'error': 'El cliente debe hacer check-in primero'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.start_service()
        
        # Registrar en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='started',
            changed_by=request.user,
            notes='Servicio iniciado'
        )
        
        return Response({
            'message': 'Servicio iniciado exitosamente',
            'appointment': AppointmentSerializer(appointment).data
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Completar una cita"""
        appointment = self.get_object()
        
        if appointment.status not in ['checked_in', 'in_progress']:
            return Response(
                {'error': 'No se puede completar esta cita'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.complete()
        
        # Registrar en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='completed',
            changed_by=request.user,
            notes='Cita completada'
        )
        
        return Response({
            'message': 'Cita completada exitosamente',
            'appointment': AppointmentSerializer(appointment).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar una cita"""
        appointment = self.get_object()
        
        if not appointment.can_be_cancelled:
            return Response(
                {'error': 'Esta cita no puede ser cancelada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        appointment.cancel(cancelled_by=request.user, reason=reason)
        
        # Registrar en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='cancelled',
            changed_by=request.user,
            notes=f'Cita cancelada. Razón: {reason}'
        )
        
        return Response({
            'message': 'Cita cancelada exitosamente',
            'appointment': AppointmentSerializer(appointment).data
        })
    
    @action(detail=True, methods=['post'])
    def no_show(self, request, pk=None):
        """Marcar como no show"""
        appointment = self.get_object()
        
        if not appointment.is_past:
            return Response(
                {'error': 'Solo se pueden marcar como no-show citas pasadas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        appointment.mark_no_show()
        
        # Registrar en historial
        AppointmentHistory.objects.create(
            appointment=appointment,
            action='no_show',
            changed_by=request.user,
            notes='Cliente no asistió'
        )
        
        return Response({
            'message': 'Cita marcada como no-show',
            'appointment': AppointmentSerializer(appointment).data
        })
    
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Vista de calendario con filtros"""
        queryset = self.get_queryset()
        
        # Filtros por fecha
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')
        
        if start_date and end_date:
            queryset = queryset.filter(
                start_datetime__date__range=[start_date, end_date]
            )
        
        # Filtros adicionales
        professional_id = request.query_params.get('professional_id')
        if professional_id:
            try:
                # Verificar si es un UUID válido
                import uuid
                uuid.UUID(professional_id)
                queryset = queryset.filter(professional_id=professional_id)
            except ValueError:
                # Si no es un UUID válido, no filtrar (o devolver error)
                pass
        
        service_id = request.query_params.get('service_id')
        if service_id:
            queryset = queryset.filter(service_id=service_id)
        
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        serializer = AppointmentCalendarSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Citas de hoy"""
        today = timezone.now().date()
        queryset = self.get_queryset().filter(start_datetime__date=today)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Próximas citas"""
        now = timezone.now()
        queryset = self.get_queryset().filter(
            start_datetime__gt=now
        ).order_by('start_datetime')[:10]
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AvailabilityView(APIView):
    """
    Vista para calcular disponibilidad de profesionales usando el sistema de horarios
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener slots disponibles para una fecha y servicio específicos
        
        Parámetros:
        - date: Fecha en formato YYYY-MM-DD
        - professional_id: ID del profesional (opcional)
        - service_id: ID del servicio
        - duration: Duración en minutos (opcional, se toma del servicio)
        """
        # Obtener parámetros
        date_str = request.query_params.get('date')
        professional_id = request.query_params.get('professional_id')
        service_id = request.query_params.get('service_id')
        duration = request.query_params.get('duration')
        
        if not date_str or not service_id:
            return Response(
                {'error': 'Se requieren los parámetros date y service_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener servicio
        try:
            service = Service.objects.get(
                id=service_id, 
                organization=request.user.organization
            )
        except Service.DoesNotExist:
            return Response(
                {'error': 'Servicio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Importar el servicio de disponibilidad
        from schedule.services import MultiProfessionalAvailabilityService
        
        # Obtener profesionales específicos si se especifica
        professional_ids = [professional_id] if professional_id else None
        
        # Calcular disponibilidad usando el nuevo servicio
        availability_by_professional = MultiProfessionalAvailabilityService.get_available_slots_for_service(
            service, target_date, professional_ids
        )
        
        # Consolidar todos los slots
        all_slots = []
        for prof_id, slots in availability_by_professional.items():
            all_slots.extend(slots)
        
        # Ordenar por hora
        all_slots.sort(key=lambda x: x['start_datetime'])
        
        # Formatear para compatibilidad con la API existente
        formatted_slots = []
        for slot in all_slots:
            formatted_slots.append({
                'start_time': slot['start_datetime'],
                'end_time': slot['end_datetime'],
                'duration_minutes': slot['duration_minutes'],
                'is_available': slot['is_available'],
                'professional_id': slot['professional_id'],
                'professional_name': slot['professional_name'],
                'service_id': str(service.id),
                'service_name': service.name,
                'conflict_reason': slot.get('conflict_reason')
            })
        
        return Response({
            'date': date_str,
            'service': {
                'id': str(service.id),
                'name': service.name,
                'duration_minutes': int(duration) if duration else service.total_duration_minutes
            },
            'slots': formatted_slots,
            'professionals_summary': {
                prof_id: {
                    'total_slots': len(slots),
                    'available_slots': len([s for s in slots if s['is_available']]),
                    'professional_name': slots[0]['professional_name'] if slots else None
                }
                for prof_id, slots in availability_by_professional.items()
            }
        })


class SmartAvailabilityView(APIView):
    """
    Vista avanzada para obtener disponibilidad inteligente
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener disponibilidad inteligente con múltiples opciones
        
        Parámetros:
        - service_id: ID del servicio (requerido)
        - professional_id: ID del profesional (opcional)
        - start_date: Fecha inicio búsqueda (opcional, default: hoy)
        - end_date: Fecha fin búsqueda (opcional, default: +30 días)
        - max_slots: Máximo slots a retornar (opcional, default: 20)
        - mode: Modo de búsqueda ('next_available', 'date_range', 'earliest')
        """
        service_id = request.query_params.get('service_id')
        professional_id = request.query_params.get('professional_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        max_slots = int(request.query_params.get('max_slots', 20))
        mode = request.query_params.get('mode', 'next_available')
        
        if not service_id:
            return Response(
                {'error': 'service_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener servicio
        try:
            service = Service.objects.get(
                id=service_id, 
                organization=request.user.organization
            )
        except Service.DoesNotExist:
            return Response(
                {'error': 'Servicio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Importar servicios
        from schedule.services import MultiProfessionalAvailabilityService, AvailabilityCalculationService
        
        # Determinar profesionales
        professional_ids = [professional_id] if professional_id else None
        
        if mode == 'earliest':
            # Buscar el slot más temprano disponible
            earliest_slot = MultiProfessionalAvailabilityService.get_earliest_available_slot(
                service, professional_ids, days_ahead=30
            )
            
            return Response({
                'mode': mode,
                'service': {
                    'id': str(service.id),
                    'name': service.name,
                    'duration_minutes': service.total_duration_minutes
                },
                'earliest_slot': earliest_slot
            })
        
        elif mode == 'date_range':
            # Búsqueda en rango de fechas
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date() if start_date_str else timezone.now().date()
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date() if end_date_str else start_date + timedelta(days=30)
            except ValueError:
                return Response(
                    {'error': 'Formato de fecha inválido. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener resumen de disponibilidad
            availability_summary = MultiProfessionalAvailabilityService.get_availability_summary(
                service, start_date, end_date, professional_ids
            )
            
            return Response({
                'mode': mode,
                'service': {
                    'id': str(service.id),
                    'name': service.name,
                    'duration_minutes': service.total_duration_minutes
                },
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                },
                'availability_summary': availability_summary
            })
        
        else:  # mode == 'next_available'
            # Obtener próximos slots disponibles
            if professional_id:
                try:
                    professional = Professional.objects.get(
                        id=professional_id,
                        organization=request.user.organization
                    )
                    availability_service = AvailabilityCalculationService(professional)
                    next_slots = availability_service.get_next_available_slots(
                        service, days_ahead=30, max_slots=max_slots
                    )
                except Professional.DoesNotExist:
                    return Response(
                        {'error': 'Profesional no encontrado'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # Buscar en todos los profesionales que pueden realizar el servicio
                next_slots = []
                professionals = service.professionals.filter(is_active=True)[:5]  # Limitar a 5 profesionales
                
                for professional in professionals:
                    availability_service = AvailabilityCalculationService(professional)
                    prof_slots = availability_service.get_next_available_slots(
                        service, days_ahead=30, max_slots=max_slots//len(professionals)
                    )
                    next_slots.extend(prof_slots)
                
                # Ordenar por fecha
                next_slots.sort(key=lambda x: x['start_datetime'])
                next_slots = next_slots[:max_slots]
            
            return Response({
                'mode': mode,
                'service': {
                    'id': str(service.id),
                    'name': service.name,
                    'duration_minutes': service.total_duration_minutes
                },
                'next_available_slots': next_slots
            })


class ConflictDetectionView(APIView):
    """
    Vista para detectar conflictos de horarios
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Detectar conflictos para una cita propuesta
        
        Body:
        {
            "professional_id": "uuid",
            "service_id": "uuid",
            "start_datetime": "2024-01-15T10:00:00Z",
            "exclude_appointment_id": "uuid" (opcional, para actualizaciones)
        }
        """
        professional_id = request.data.get('professional_id')
        service_id = request.data.get('service_id')
        start_datetime_str = request.data.get('start_datetime')
        exclude_appointment_id = request.data.get('exclude_appointment_id')
        
        if not all([professional_id, service_id, start_datetime_str]):
            return Response(
                {'error': 'professional_id, service_id y start_datetime son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_datetime = datetime.fromisoformat(start_datetime_str.replace('Z', '+00:00'))
        except ValueError:
            return Response(
                {'error': 'Formato de fecha inválido. Use ISO format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obtener objetos
        try:
            professional = Professional.objects.get(
                id=professional_id,
                organization=request.user.organization
            )
            service = Service.objects.get(
                id=service_id,
                organization=request.user.organization
            )
        except (Professional.DoesNotExist, Service.DoesNotExist):
            return Response(
                {'error': 'Profesional o servicio no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar disponibilidad
        from schedule.services import AvailabilityCalculationService
        
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
        
        return Response({
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts,
            'proposed_appointment': {
                'professional_id': professional_id,
                'professional_name': professional.name,
                'service_id': service_id,
                'service_name': service.name,
                'start_datetime': start_datetime.isoformat(),
                'end_datetime': end_datetime.isoformat(),
                'duration_minutes': service.total_duration_minutes
            }
        })


class AppointmentHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para ver historial de citas (solo lectura)
    """
    serializer_class = AppointmentHistorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar historial por organización"""
        user = self.request.user
        if user.organization:
            return AppointmentHistory.objects.filter(
                appointment__organization=user.organization
            ).select_related('appointment', 'changed_by')
        return AppointmentHistory.objects.none()


class RecurringAppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet para citas recurrentes
    """
    serializer_class = RecurringAppointmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrar por organización"""
        user = self.request.user
        if user.organization:
            return RecurringAppointment.objects.filter(
                organization=user.organization
            ).select_related('client', 'professional', 'service', 'created_by')
        return RecurringAppointment.objects.none()
    
    @action(detail=True, methods=['post'])
    def generate_appointments(self, request, pk=None):
        """Generar citas basadas en la recurrencia"""
        recurring = self.get_object()
        weeks_ahead = int(request.data.get('weeks_ahead', 4))
        
        # TODO: Implementar algoritmo de generación automática
        # recurring.generate_next_appointments(weeks_ahead)
        
        return Response({
            'message': f'Generando citas para las próximas {weeks_ahead} semanas',
            'recurring_appointment': self.get_serializer(recurring).data
        })