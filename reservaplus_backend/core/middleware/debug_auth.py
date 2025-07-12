# core/middleware/debug_auth.py - MIDDLEWARE TEMPORAL PARA DEBUG

import logging

logger = logging.getLogger(__name__)

class DebugAuthMiddleware:
    """
    Middleware temporal para debuggear problemas de autenticación
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log información de autenticación
        if request.path.startswith('/api/'):
            logger.info(f"API Request: {request.method} {request.path}")
            logger.info(f"User authenticated: {request.user.is_authenticated}")
            logger.info(f"User: {request.user}")
            logger.info(f"Session key: {request.session.session_key}")
            logger.info(f"Session data: {dict(request.session)}")
            logger.info(f"Cookies: {request.COOKIES}")
            logger.info(f"Headers: {dict(request.headers)}")
            logger.info("=" * 50)

        response = self.get_response(request)
        
        # Log información de respuesta
        if request.path.startswith('/api/'):
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {dict(response.items())}")
            logger.info("=" * 50)
        
        return response