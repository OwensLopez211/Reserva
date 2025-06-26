# core/middleware/subscription_limits.py

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from plans.models import OrganizationSubscription


class SubscriptionLimitsMiddleware(MiddlewareMixin):
    """
    Middleware para validar límites de suscripción automáticamente
    """
    
    # URLs que requieren validación de límites
    VALIDATION_PATTERNS = {
        'professionals': [
            '/api/organizations/professionals/',
        ],
        'services': [
            '/api/organizations/services/',
        ],
        'clients': [
            '/api/organizations/clients/',
        ],
        'appointments': [
            '/api/appointments/appointments/',
        ]
    }
    
    def process_request(self, request):
        """
        Validar límites antes de procesar la request
        """
        # Solo validar en métodos POST (creación)
        if request.method != 'POST':
            return None
        
        # Solo validar si el usuario está autenticado
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
        
        # Solo validar si el usuario tiene organización
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return None
        
        # Obtener suscripción activa
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=request.user.organization
            )
        except OrganizationSubscription.DoesNotExist:
            return JsonResponse({
                'error': 'No se encontró suscripción activa',
                'code': 'NO_SUBSCRIPTION'
            }, status=403)
        
        # Verificar si la suscripción está activa
        if not subscription.is_active:
            return JsonResponse({
                'error': 'Suscripción inactiva',
                'code': 'INACTIVE_SUBSCRIPTION'
            }, status=403)
        
        # Validar límites según la URL
        limit_error = self._validate_limits(request, subscription)
        if limit_error:
            return limit_error
        
        return None
    
    def _validate_limits(self, request, subscription):
        """
        Validar límites específicos según la URL
        """
        path = request.path_info
        
        # Validar límite de profesionales
        if any(pattern in path for pattern in self.VALIDATION_PATTERNS['professionals']):
            if not subscription.can_add_professional():
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_professionals} profesionales para tu plan {subscription.plan.name}',
                    'code': 'PROFESSIONALS_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_professionals,
                    'current': subscription.current_professionals_count,
                    'upgrade_required': True
                }, status=403)
        
        # Validar límite de servicios
        elif any(pattern in path for pattern in self.VALIDATION_PATTERNS['services']):
            if not subscription.can_add_service():
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_services} servicios para tu plan {subscription.plan.name}',
                    'code': 'SERVICES_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_services,
                    'current': subscription.current_services_count,
                    'upgrade_required': True
                }, status=403)
        
        # Validar límite de clientes
        elif any(pattern in path for pattern in self.VALIDATION_PATTERNS['clients']):
            if not subscription.can_add_client():
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_clients} clientes para tu plan {subscription.plan.name}',
                    'code': 'CLIENTS_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_clients,
                    'current': subscription.current_clients_count,
                    'upgrade_required': True
                }, status=403)
        
        # Validar límite de citas mensuales
        elif any(pattern in path for pattern in self.VALIDATION_PATTERNS['appointments']):
            if not subscription.can_create_appointment():
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_monthly_appointments} citas mensuales para tu plan {subscription.plan.name}',
                    'code': 'MONTHLY_APPOINTMENTS_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_monthly_appointments,
                    'current': subscription.current_month_appointments_count,
                    'upgrade_required': True
                }, status=403)
        
        return None