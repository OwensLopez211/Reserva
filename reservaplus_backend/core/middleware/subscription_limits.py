# core/middleware/subscription_limits.py

import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from plans.models import OrganizationSubscription

logger = logging.getLogger(__name__)


class SubscriptionLimitsMiddleware(MiddlewareMixin):
    """
    Middleware para validar límites de suscripción automáticamente
    """
    
    # URLs públicas que deben excluirse de la validación de suscripción
    EXCLUDED_PATTERNS = [
        '/api/auth/',  # Autenticación
        '/api/plans/',  # Planes (debe ser público)
        '/api/signup/',  # Registro
        '/api/registration/',  # Estado de registro
        '/public/',  # Reservas públicas
        '/admin/',  # Admin de Django
        '/health/',  # Health checks
    ]
    
    # URLs que requieren validación de límites - INCLUYENDO ONBOARDING
    VALIDATION_PATTERNS = {
        'professionals': [
            '/api/organizations/professionals/',
            '/api/organizations/professionals',  # Sin slash final
            'professionals/',  # Relativo
            'professionals',   # Relativo sin slash
        ],
        'services': [
            '/api/organizations/services/',
            '/api/organizations/services',
            'services/',
            'services',
        ],
        'clients': [
            '/api/organizations/clients/',
            '/api/organizations/clients',
            'clients/',
            'clients',
        ],
        'appointments': [
            '/api/appointments/appointments/',
            '/api/appointments/appointments',
            '/api/appointments/',
            '/api/appointments',
            'appointments/',
            'appointments',
        ],
        # NUEVO: Validar onboarding porque crea múltiples entidades
        'onboarding': [
            '/api/onboarding/complete/',
            '/api/onboarding/complete',
            'onboarding/complete/',
            'onboarding/complete',
        ]
    }
    
    def process_request(self, request):
        """
        Validar límites antes de procesar la request
        """
        # SIEMPRE hacer log para debugging
        print(f"\n[MIDDLEWARE DEBUG] {request.method} {request.path_info}")
        logger.debug(f"[MIDDLEWARE] Processing request: {request.method} {request.path_info}")
        
        # Verificar si la URL está en la lista de excluidas
        path = request.path_info
        for pattern in self.EXCLUDED_PATTERNS:
            if path.startswith(pattern):
                print(f"[OK] URL {path} is excluded from validation (pattern: {pattern})")
                return None
        
        # Solo validar en métodos POST (creación) - otros métodos pueden pasar libremente
        if request.method not in ['POST', 'PUT', 'PATCH']:
            print(f"[SKIP] Method {request.method} doesn't require validation, skipping")
            return None
        
        print(f"[OK] POST request detected")
        
        # Solo validar si el usuario está autenticado
        if not hasattr(request, 'user'):
            print("❌ No user attribute on request")
            return None
            
        if not request.user.is_authenticated:
            print(f"❌ User not authenticated: {request.user}")
            return None
        
        print(f"✅ User authenticated: {request.user.email}")
        
        # Solo validar si el usuario tiene organización
        if not hasattr(request.user, 'organization'):
            print("❌ User has no organization attribute")
            return None
            
        if not request.user.organization:
            print("❌ User organization is None")
            return None
        
        print(f"✅ User organization: {request.user.organization.name}")
        
        # Obtener suscripción activa
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=request.user.organization
            )
            print(f"✅ Found subscription: {subscription.plan.name}")
            print(f"📊 Current counts - Prof: {subscription.current_professionals_count}/{subscription.plan.max_professionals}, Serv: {subscription.current_services_count}/{subscription.plan.max_services}")
        except OrganizationSubscription.DoesNotExist:
            print("❌ No subscription found")
            return JsonResponse({
                'error': 'No se encontró suscripción activa',
                'code': 'NO_SUBSCRIPTION'
            }, status=403)
        
        # Verificar si la suscripción está activa
        if not subscription.is_active:
            print(f"❌ Subscription inactive: {subscription.status}")
            return JsonResponse({
                'error': 'Suscripción inactiva',
                'code': 'INACTIVE_SUBSCRIPTION'
            }, status=403)
        
        print(f"✅ Subscription active")
        
        # Validar límites según la URL
        limit_error = self._validate_limits(request, subscription)
        if limit_error:
            print("🚫 BLOCKING REQUEST DUE TO LIMITS")
            return limit_error
        
        print("✅ All validations passed")
        return None
    
    def _validate_limits(self, request, subscription):
        """
        Validar límites específicos según la URL
        """
        path = request.path_info
        logger.debug(f"Validating limits for path: {path}")
        
        # NUEVA: Validación especial para onboarding (verifica múltiples límites)
        if any(pattern in path for pattern in self.VALIDATION_PATTERNS['onboarding']):
            logger.debug("Validating onboarding limits (professionals + services)")
            
            # Parsear datos del onboarding para contar profesionales y servicios
            try:
                import json
                if hasattr(request, '_body') and request._body:
                    data = json.loads(request._body.decode('utf-8'))
                    professionals_count = len(data.get('professionals', []))
                    services_count = len(data.get('services', []))
                    
                    logger.debug(f"Onboarding data: {professionals_count} professionals, {services_count} services")
                    
                    # Verificar límite de profesionales
                    if subscription.current_professionals_count + professionals_count > subscription.plan.max_professionals:
                        logger.warning(f"Onboarding would exceed professional limit: {subscription.current_professionals_count} + {professionals_count} > {subscription.plan.max_professionals}")
                        return JsonResponse({
                            'error': f'El onboarding excedería el límite de {subscription.plan.max_professionals} profesionales para tu plan {subscription.plan.name}',
                            'code': 'ONBOARDING_PROFESSIONALS_LIMIT_EXCEEDED',
                            'limit': subscription.plan.max_professionals,
                            'current': subscription.current_professionals_count,
                            'requested': professionals_count,
                            'upgrade_required': True
                        }, status=400)  # 400 porque es error de validación del request
                    
                    # Verificar límite de servicios
                    if subscription.current_services_count + services_count > subscription.plan.max_services:
                        logger.warning(f"Onboarding would exceed service limit: {subscription.current_services_count} + {services_count} > {subscription.plan.max_services}")
                        return JsonResponse({
                            'error': f'El onboarding excedería el límite de {subscription.plan.max_services} servicios para tu plan {subscription.plan.name}',
                            'code': 'ONBOARDING_SERVICES_LIMIT_EXCEEDED',
                            'limit': subscription.plan.max_services,
                            'current': subscription.current_services_count,
                            'requested': services_count,
                            'upgrade_required': True
                        }, status=400)  # 400 porque es error de validación del request
                        
            except (json.JSONDecodeError, AttributeError) as e:
                logger.warning(f"Could not parse onboarding data: {e}")
        
        # Validar límite de profesionales - MÁS FLEXIBLE
        if any(pattern in path for pattern in self.VALIDATION_PATTERNS['professionals']):
            logger.debug(f"Validating professionals limit: {subscription.current_professionals_count}/{subscription.plan.max_professionals}")
            if not subscription.can_add_professional():
                logger.warning("Professional limit exceeded")
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_professionals} profesionales para tu plan {subscription.plan.name}',
                    'code': 'PROFESSIONALS_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_professionals,
                    'current': subscription.current_professionals_count,
                    'upgrade_required': True
                }, status=403)
        
        # Validar límite de servicios - MÁS FLEXIBLE
        if any(pattern in path for pattern in self.VALIDATION_PATTERNS['services']):
            logger.debug(f"Validating services limit: {subscription.current_services_count}/{subscription.plan.max_services}")
            if not subscription.can_add_service():
                logger.warning("Service limit exceeded")
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_services} servicios para tu plan {subscription.plan.name}',
                    'code': 'SERVICES_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_services,
                    'current': subscription.current_services_count,
                    'upgrade_required': True
                }, status=403)
        
        # Validar límite de clientes - MÁS FLEXIBLE  
        if any(pattern in path for pattern in self.VALIDATION_PATTERNS['clients']):
            logger.debug(f"Validating clients limit: {subscription.current_clients_count}/{subscription.plan.max_clients}")
            if not subscription.can_add_client():
                logger.warning("Client limit exceeded")
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_clients} clientes para tu plan {subscription.plan.name}',
                    'code': 'CLIENTS_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_clients,
                    'current': subscription.current_clients_count,
                    'upgrade_required': True
                }, status=403)
        
        # Validar límite de citas mensuales - MÁS FLEXIBLE
        if any(pattern in path for pattern in self.VALIDATION_PATTERNS['appointments']):
            logger.debug(f"Validating appointments limit: {subscription.current_month_appointments_count}/{subscription.plan.max_monthly_appointments}")
            if not subscription.can_create_appointment():
                logger.warning("Appointment limit exceeded")
                return JsonResponse({
                    'error': f'Has alcanzado el límite de {subscription.plan.max_monthly_appointments} citas mensuales para tu plan {subscription.plan.name}',
                    'code': 'MONTHLY_APPOINTMENTS_LIMIT_EXCEEDED',
                    'limit': subscription.plan.max_monthly_appointments,
                    'current': subscription.current_month_appointments_count,
                    'upgrade_required': True
                }, status=403)
        
        return None