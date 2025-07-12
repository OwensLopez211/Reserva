# core/views.py - VISTA REFACTORIZADA PARA USAR EL MÓDULO DE ONBOARDING
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
import logging

# Importar el nuevo módulo de onboarding
from onboarding.managers import OnboardingManager
from onboarding.exceptions import OnboardingError, OnboardingValidationError, OnboardingLimitError, OnboardingTokenError

logger = logging.getLogger(__name__)


class OnboardingCompleteView(APIView):
    """
    Vista refactorizada para completar todo el proceso de onboarding
    Mantiene compatibilidad con el frontend actual
    """
    permission_classes = [AllowAny]  # Usa token temporal, no requiere autenticación
    
    def post(self, request):
        """
        Completar onboarding con todos los datos usando el OnboardingManager refactorizado
        """
        try:
            logger.info(f"🔍 Received onboarding data from {request.META.get('REMOTE_ADDR', 'unknown')}")
            
            # Usar el manager refactorizado para completar el onboarding
            manager = OnboardingManager()
            result = manager.complete_onboarding(request.data)
            
            return Response(result, status=status.HTTP_201_CREATED)
            
        except OnboardingValidationError as e:
            logger.warning(f"⚠️ Validation error: {e}")
            return Response(
                e.to_dict(),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except OnboardingLimitError as e:
            logger.warning(f"⚠️ Limit error: {e}")
            return Response(
                e.to_dict(),
                status=status.HTTP_400_BAD_REQUEST
            )
        
        except OnboardingTokenError as e:
            logger.warning(f"⚠️ Token error: {e}")
            return Response(
                e.to_dict(),
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        except OnboardingError as e:
            logger.error(f"❌ Onboarding error: {e}")
            return Response(
                e.to_dict(),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
                
        except Exception as e:
            logger.error(f"💥 Unexpected error: {str(e)}")
            return Response({
                'error': 'Error interno del servidor',
                'error_code': 'INTERNAL_ERROR',
                'details': {'message': str(e)}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)