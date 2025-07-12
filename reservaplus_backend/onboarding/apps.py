# onboarding/apps.py
"""
Configuración del módulo de onboarding
"""

from django.apps import AppConfig


class OnboardingConfig(AppConfig):
    """
    Configuración para el módulo de onboarding
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'onboarding'
    verbose_name = 'Onboarding'
    
    def ready(self):
        """
        Configuración adicional cuando la app está lista
        """
        import logging
        
        # Configurar logging para el módulo
        logger = logging.getLogger('onboarding')
        logger.setLevel(logging.INFO)
        
        # Log de inicialización
        logger.info("📋 Onboarding module initialized") 