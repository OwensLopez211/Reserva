# onboarding/views.py
"""
Vistas refactorizadas para el proceso de onboarding
"""

import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.http import JsonResponse
from django.utils import timezone

from .managers import OnboardingManager
from .exceptions import OnboardingError, OnboardingValidationError, OnboardingLimitError, OnboardingTokenError

logger = logging.getLogger(__name__)


class OnboardingCompleteView(APIView):
    """
    Vista refactorizada para completar el proceso de onboarding
    """
    permission_classes = [AllowAny]  # Usa token temporal, no requiere autenticación
    
    def post(self, request):
        """
        Completar onboarding con todos los datos usando el OnboardingManager
        """
        try:
            logger.info(f"🔍 Received onboarding data from {request.META.get('REMOTE_ADDR', 'unknown')}")
            
            # Usar el manager para completar el onboarding con progress tracking
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


class OnboardingValidateView(APIView):
    """
    Vista para validar datos de onboarding sin ejecutar el proceso
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        Validar datos de onboarding
        """
        try:
            logger.info("🔍 Validating onboarding data")
            
            result = OnboardingManager.validate_onboarding_data(request.data)
            
            if result['valid']:
                return Response(result, status=status.HTTP_200_OK)
            else:
                return Response(result, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"💥 Validation error: {str(e)}")
            return Response({
                'valid': False,
                'error': {
                    'error': str(e),
                    'error_code': 'VALIDATION_FAILED'
                }
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OnboardingHealthCheckView(APIView):
    """
    Vista para verificar el estado del servicio de onboarding
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Health check del servicio de onboarding
        """
        try:
            # Verificar que todas las dependencias estén disponibles
            from django.db import connection
            from plans.models import Plan
            from organizations.models import Organization
            
            # Test basic database connectivity
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            
            # Test that we can query basic models
            Plan.objects.count()
            Organization.objects.count()
            
            return Response({
                'status': 'healthy',
                'service': 'onboarding',
                'version': '2.0',
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"💥 Health check failed: {str(e)}")
            return Response({
                'status': 'unhealthy',
                'service': 'onboarding',
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE) 