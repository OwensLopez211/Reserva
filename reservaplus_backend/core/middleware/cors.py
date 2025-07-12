# reservaplus_backend/core/middleware/cors.py

class CorsMiddleware:
    """
    Middleware personalizado para manejar CORS
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Permitir orígenes específicos
        allowed_origins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ]
        
        origin = request.META.get('HTTP_ORIGIN')
        if origin in allowed_origins:
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        
        # Manejar requests OPTIONS (preflight)
        if request.method == 'OPTIONS':
            response.status_code = 200
            
        return response