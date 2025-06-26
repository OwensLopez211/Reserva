# core/middleware/subscription_counter.py

import logging
from django.utils.deprecation import MiddlewareMixin
from plans.models import OrganizationSubscription

logger = logging.getLogger(__name__)


class SubscriptionCounterMiddleware(MiddlewareMixin):
    """
    Middleware para actualizar contadores de suscripción automáticamente
    """
    
    def process_response(self, request, response):
        """
        Actualizar contadores después de operaciones exitosas
        """
        logger.debug(f"Processing response: {request.method} {request.path_info} - Status: {response.status_code}")
        
        # Solo procesar respuestas exitosas de creación/eliminación
        if response.status_code not in [201, 204]:
            logger.debug("Response status not 201 or 204, skipping counter update")
            return response
        
        # Solo procesar si el usuario está autenticado y tiene organización
        if (not hasattr(request, 'user') or 
            not request.user.is_authenticated or 
            not hasattr(request.user, 'organization') or 
            not request.user.organization):
            logger.debug("User not authenticated or has no organization, skipping counter update")
            return response
        
        try:
            subscription = OrganizationSubscription.objects.get(
                organization=request.user.organization
            )
            logger.debug(f"Found subscription for counter update: {subscription.plan.name}")
            
            path = request.path_info
            
            # Incrementar contadores en POST exitoso
            if request.method == 'POST' and response.status_code == 201:
                logger.debug(f"Incrementing counters for path: {path}")
                
                if '/professionals/' in path:
                    old_count = subscription.current_professionals_count
                    subscription.increment_professionals_count()
                    logger.debug(f"Professionals count: {old_count} -> {subscription.current_professionals_count}")
                    
                elif '/services/' in path:
                    old_count = subscription.current_services_count
                    subscription.increment_services_count()
                    logger.debug(f"Services count: {old_count} -> {subscription.current_services_count}")
                    
                elif '/clients/' in path:
                    old_count = subscription.current_clients_count
                    subscription.current_clients_count += 1
                    subscription.save(update_fields=['current_clients_count'])
                    logger.debug(f"Clients count: {old_count} -> {subscription.current_clients_count}")
                    
                elif '/appointments/' in path:
                    old_count = subscription.current_month_appointments_count
                    subscription.current_month_appointments_count += 1
                    subscription.save(update_fields=['current_month_appointments_count'])
                    logger.debug(f"Appointments count: {old_count} -> {subscription.current_month_appointments_count}")
            
            # Decrementar contadores en DELETE exitoso
            elif request.method == 'DELETE' and response.status_code == 204:
                logger.debug(f"Decrementing counters for path: {path}")
                
                if '/professionals/' in path:
                    old_count = subscription.current_professionals_count
                    subscription.decrement_professionals_count()
                    logger.debug(f"Professionals count: {old_count} -> {subscription.current_professionals_count}")
                    
                elif '/services/' in path:
                    old_count = subscription.current_services_count
                    subscription.decrement_services_count()
                    logger.debug(f"Services count: {old_count} -> {subscription.current_services_count}")
                    
                elif '/clients/' in path:
                    if subscription.current_clients_count > 0:
                        old_count = subscription.current_clients_count
                        subscription.current_clients_count -= 1
                        subscription.save(update_fields=['current_clients_count'])
                        logger.debug(f"Clients count: {old_count} -> {subscription.current_clients_count}")
                        
                elif '/appointments/' in path:
                    if subscription.current_month_appointments_count > 0:
                        old_count = subscription.current_month_appointments_count
                        subscription.current_month_appointments_count -= 1
                        subscription.save(update_fields=['current_month_appointments_count'])
                        logger.debug(f"Appointments count: {old_count} -> {subscription.current_month_appointments_count}")
        
        except OrganizationSubscription.DoesNotExist:
            logger.warning("No subscription found for counter update")
            pass
        
        return response