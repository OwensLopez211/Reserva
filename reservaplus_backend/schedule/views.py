from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from core.authentication import JWTAuthentication
from organizations.models import Professional
from .models import (
    ProfessionalSchedule,
    WeeklySchedule,
    ScheduleBreak,
    ScheduleException,
    AvailabilitySlot
)
from .serializers import (
    ProfessionalScheduleSerializer,
    ProfessionalScheduleCreateSerializer,
    WeeklyScheduleSerializer,
    WeeklyScheduleCreateSerializer,
    ScheduleBreakSerializer,
    ScheduleExceptionSerializer,
    AvailabilitySlotSerializer,
    ScheduleSummarySerializer
)


class ProfessionalScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de horarios de profesionales
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return ProfessionalSchedule.objects.filter(
                professional__organization=user.organization
            ).select_related('professional')
        return ProfessionalSchedule.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ProfessionalScheduleCreateSerializer
        elif self.action == 'list':
            return ScheduleSummarySerializer
        return ProfessionalScheduleSerializer
    
    def perform_create(self, serializer):
        """
        Crear horario para un profesional de la organización
        """
        professional = serializer.validated_data['professional']
        
        # Verificar que el profesional pertenece a la organización
        if professional.organization != self.request.user.organization:
            raise ValidationError("El profesional no pertenece a tu organización")
        
        # Verificar que el profesional no tenga ya un horario
        if hasattr(professional, 'schedule'):
            raise ValidationError("El profesional ya tiene un horario configurado")
        
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Duplicar horario a otro profesional
        """
        source_schedule = self.get_object()
        target_professional_id = request.data.get('target_professional_id')
        
        if not target_professional_id:
            return Response(
                {'error': 'target_professional_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            target_professional = Professional.objects.get(
                id=target_professional_id,
                organization=request.user.organization
            )
        except Professional.DoesNotExist:
            return Response(
                {'error': 'Profesional no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar que el profesional objetivo no tenga ya un horario
        if hasattr(target_professional, 'schedule'):
            return Response(
                {'error': 'El profesional objetivo ya tiene un horario configurado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear nuevo horario
        new_schedule = ProfessionalSchedule.objects.create(
            professional=target_professional,
            timezone=source_schedule.timezone,
            min_booking_notice=source_schedule.min_booking_notice,
            max_booking_advance=source_schedule.max_booking_advance,
            slot_duration=source_schedule.slot_duration,
            is_active=source_schedule.is_active,
            accepts_bookings=source_schedule.accepts_bookings
        )
        
        # Duplicar horarios semanales
        for weekly_schedule in source_schedule.weekly_schedules.all():
            new_weekly = WeeklySchedule.objects.create(
                professional_schedule=new_schedule,
                weekday=weekly_schedule.weekday,
                start_time=weekly_schedule.start_time,
                end_time=weekly_schedule.end_time,
                is_active=weekly_schedule.is_active
            )
            
            # Duplicar breaks
            for break_item in weekly_schedule.breaks.all():
                ScheduleBreak.objects.create(
                    weekly_schedule=new_weekly,
                    start_time=break_item.start_time,
                    end_time=break_item.end_time,
                    name=break_item.name,
                    description=break_item.description,
                    is_active=break_item.is_active
                )
        
        return Response({
            'message': 'Horario duplicado exitosamente',
            'schedule': ProfessionalScheduleSerializer(new_schedule).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def toggle_bookings(self, request, pk=None):
        """
        Activar/desactivar aceptación de reservas
        """
        schedule = self.get_object()
        schedule.accepts_bookings = not schedule.accepts_bookings
        schedule.save()
        
        return Response({
            'message': f'Reservas {"activadas" if schedule.accepts_bookings else "desactivadas"}',
            'accepts_bookings': schedule.accepts_bookings
        })


class WeeklyScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de horarios semanales
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return WeeklySchedule.objects.filter(
                professional_schedule__professional__organization=user.organization
            ).select_related('professional_schedule__professional')
        return WeeklySchedule.objects.none()
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WeeklyScheduleCreateSerializer
        return WeeklyScheduleSerializer
    
    def perform_create(self, serializer):
        """
        Crear horario semanal
        """
        professional_schedule_id = self.request.data.get('professional_schedule')
        
        try:
            professional_schedule = ProfessionalSchedule.objects.get(
                id=professional_schedule_id,
                professional__organization=self.request.user.organization
            )
        except ProfessionalSchedule.DoesNotExist:
            raise ValidationError("Horario profesional no encontrado")
        
        serializer.save(professional_schedule=professional_schedule)


class ScheduleBreakViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de descansos
    """
    serializer_class = ScheduleBreakSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return ScheduleBreak.objects.filter(
                weekly_schedule__professional_schedule__professional__organization=user.organization
            ).select_related('weekly_schedule__professional_schedule__professional')
        return ScheduleBreak.objects.none()
    
    def perform_create(self, serializer):
        """
        Crear descanso
        """
        weekly_schedule_id = self.request.data.get('weekly_schedule')
        
        try:
            weekly_schedule = WeeklySchedule.objects.get(
                id=weekly_schedule_id,
                professional_schedule__professional__organization=self.request.user.organization
            )
        except WeeklySchedule.DoesNotExist:
            raise ValidationError("Horario semanal no encontrado")
        
        serializer.save(weekly_schedule=weekly_schedule)


class ScheduleExceptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de excepciones de horarios
    """
    serializer_class = ScheduleExceptionSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return ScheduleException.objects.filter(
                professional_schedule__professional__organization=user.organization
            ).select_related('professional_schedule__professional')
        return ScheduleException.objects.none()
    
    def perform_create(self, serializer):
        """
        Crear excepción de horario
        """
        professional_schedule_id = self.request.data.get('professional_schedule')
        
        try:
            professional_schedule = ProfessionalSchedule.objects.get(
                id=professional_schedule_id,
                professional__organization=self.request.user.organization
            )
        except ProfessionalSchedule.DoesNotExist:
            raise ValidationError("Horario profesional no encontrado")
        
        serializer.save(professional_schedule=professional_schedule)


class AvailabilitySlotViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para consulta de slots de disponibilidad
    """
    serializer_class = AvailabilitySlotSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.organization:
            return AvailabilitySlot.objects.filter(
                professional_schedule__professional__organization=user.organization
            ).select_related('professional_schedule__professional')
        return AvailabilitySlot.objects.none()
    
    @action(detail=False, methods=['get'])
    def by_professional(self, request):
        """
        Obtener slots de disponibilidad por profesional
        """
        professional_id = request.query_params.get('professional_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not professional_id:
            return Response(
                {'error': 'professional_id es requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            professional = Professional.objects.get(
                id=professional_id,
                organization=request.user.organization
            )
        except Professional.DoesNotExist:
            return Response(
                {'error': 'Profesional no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not hasattr(professional, 'schedule'):
            return Response(
                {'error': 'El profesional no tiene horarios configurados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(
            professional_schedule=professional.schedule
        )
        
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ScheduleOverviewView(APIView):
    """
    Vista para obtener resumen general de horarios
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """
        Obtener resumen de horarios de la organización
        """
        user = request.user
        if not user.organization:
            return Response(
                {'error': 'Usuario sin organización'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Contar estadísticas
        total_professionals = Professional.objects.filter(
            organization=user.organization
        ).count()
        
        professionals_with_schedule = ProfessionalSchedule.objects.filter(
            professional__organization=user.organization
        ).count()
        
        active_schedules = ProfessionalSchedule.objects.filter(
            professional__organization=user.organization,
            is_active=True
        ).count()
        
        accepting_bookings = ProfessionalSchedule.objects.filter(
            professional__organization=user.organization,
            accepts_bookings=True
        ).count()
        
        # Obtener horarios recientes
        recent_schedules = ProfessionalSchedule.objects.filter(
            professional__organization=user.organization
        ).select_related('professional').order_by('-updated_at')[:5]
        
        return Response({
            'summary': {
                'total_professionals': total_professionals,
                'professionals_with_schedule': professionals_with_schedule,
                'active_schedules': active_schedules,
                'accepting_bookings': accepting_bookings,
                'completion_rate': round(
                    (professionals_with_schedule / total_professionals * 100) if total_professionals > 0 else 0,
                    2
                )
            },
            'recent_schedules': ScheduleSummarySerializer(recent_schedules, many=True).data
        })


class ProfessionalScheduleDetailView(APIView):
    """
    Vista para obtener detalles completos del horario de un profesional
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, professional_id):
        """
        Obtener horario completo de un profesional
        """
        try:
            professional = Professional.objects.get(
                id=professional_id,
                organization=request.user.organization
            )
        except Professional.DoesNotExist:
            return Response(
                {'error': 'Profesional no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not hasattr(professional, 'schedule'):
            return Response(
                {'error': 'El profesional no tiene horarios configurados'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ProfessionalScheduleSerializer(professional.schedule)
        return Response(serializer.data)
    
    def post(self, request, professional_id):
        """
        Crear horario para un profesional
        """
        try:
            professional = Professional.objects.get(
                id=professional_id,
                organization=request.user.organization
            )
        except Professional.DoesNotExist:
            return Response(
                {'error': 'Profesional no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if hasattr(professional, 'schedule'):
            return Response(
                {'error': 'El profesional ya tiene un horario configurado'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = request.data.copy()
        data['professional'] = professional.id
        
        serializer = ProfessionalScheduleCreateSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                ProfessionalScheduleSerializer(serializer.instance).data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
