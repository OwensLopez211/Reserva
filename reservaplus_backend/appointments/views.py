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
            queryset = queryset.filter(professional_id=professional_id)
        
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
    Vista para calcular disponibilidad de profesionales
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
        
        # Duración del servicio
        service_duration = int(duration) if duration else service.total_duration_minutes
        
        # Obtener profesionales que pueden realizar el servicio
        professionals_query = service.professionals.filter(is_active=True)
        if professional_id:
            professionals_query = professionals_query.filter(id=professional_id)
        
        professionals = list(professionals_query)
        
        if not professionals:
            return Response(
                {'error': 'No hay profesionales disponibles para este servicio'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calcular disponibilidad para cada profesional
        availability_slots = []
        
        for professional in professionals:
            slots = self._calculate_availability_for_professional(
                professional, target_date, service_duration, service
            )
            availability_slots.extend(slots)
        
        # Ordenar por hora
        availability_slots.sort(key=lambda x: x['start_time'])
        
        return Response({
            'date': date_str,
            'service': {
                'id': str(service.id),
                'name': service.name,
                'duration_minutes': service_duration
            },
            'slots': availability_slots
        })
    
    def _calculate_availability_for_professional(self, professional, date, duration_minutes, service):
        """
        Calcular slots disponibles para un profesional específico
        """
        # Horario de trabajo (simplificado - asumimos 9:00 a 18:00)
        # TODO: Implementar horarios personalizados por profesional
        work_start = time(9, 0)
        work_end = time(18, 0)
        
        # Obtener citas existentes del profesional para la fecha
        existing_appointments = Appointment.objects.filter(
            professional=professional,
            start_datetime__date=date,
            status__in=['pending', 'confirmed', 'checked_in', 'in_progress']
        ).order_by('start_datetime')
        
        # Generar slots cada 15 minutos
        slots = []
        current_time = datetime.combine(date, work_start)
        end_time = datetime.combine(date, work_end)
        
        while current_time + timedelta(minutes=duration_minutes) <= end_time:
            slot_end = current_time + timedelta(minutes=duration_minutes)
            
            # Verificar si el slot está libre
            is_available = True
            for appointment in existing_appointments:
                if (current_time < appointment.end_datetime and 
                    slot_end > appointment.start_datetime):
                    is_available = False
                    break
            
            slots.append({
                'start_time': current_time,
                'end_time': slot_end,
                'duration_minutes': duration_minutes,
                'is_available': is_available,
                'professional_id': str(professional.id),
                'professional_name': professional.name,
                'service_id': str(service.id),
                'service_name': service.name
            })
            
            # Avanzar 15 minutos
            current_time += timedelta(minutes=15)
        
        return slots


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