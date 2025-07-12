# onboarding/exceptions.py
"""
Excepciones personalizadas para el proceso de onboarding
"""

class OnboardingError(Exception):
    """Excepción base para errores de onboarding"""
    def __init__(self, message, error_code=None, details=None):
        super().__init__(message)
        self.error_code = error_code
        self.details = details or {}
        
    def to_dict(self):
        return {
            'error': str(self),
            'error_code': self.error_code,
            'details': self.details
        }


class OnboardingValidationError(OnboardingError):
    """Error de validación durante el onboarding"""
    pass


class OnboardingLimitError(OnboardingError):
    """Error por exceder límites del plan"""
    pass


class OnboardingTokenError(OnboardingError):
    """Error relacionado con el token de registro"""
    pass


class OnboardingDuplicateError(OnboardingError):
    """Error por datos duplicados"""
    pass


class OnboardingConfigurationError(OnboardingError):
    """Error de configuración del onboarding"""
    pass


class OnboardingRollbackError(OnboardingError):
    """Error durante el rollback del onboarding"""
    pass 