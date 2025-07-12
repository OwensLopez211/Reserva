# Onboarding Module
# Módulo dedicado para el proceso de onboarding de ReservaPlus

# Importaciones movidas a nivel de uso para evitar importación circular
# Los imports se harán directamente en los archivos que los necesiten:
# from onboarding.managers import OnboardingManager
# from onboarding.services import UserCreationService, etc.
# from onboarding.exceptions import OnboardingError, etc.
# from onboarding.validators import OnboardingValidator

# Esto previene errores de "Apps aren't loaded yet" al cargar la aplicación 