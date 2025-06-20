# core/authentication.py

import jwt
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions


User = get_user_model()


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Autenticación JWT personalizada para ReservaPlus
    """
    
    def authenticate(self, request):
        """
        Autenticar usuario basado en token JWT
        """
        auth_header = authentication.get_authorization_header(request).split()
        
        if not auth_header or auth_header[0].lower() != b'bearer':
            return None
            
        if len(auth_header) == 1:
            msg = 'Token de autorización inválido. No se proporcionaron credenciales.'
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth_header) > 2:
            msg = 'Token de autorización inválido. El token no debe contener espacios.'
            raise exceptions.AuthenticationFailed(msg)
            
        try:
            token = auth_header[1].decode('utf-8')
        except UnicodeError:
            msg = 'Token de autorización inválido. El token contiene caracteres inválidos.'
            raise exceptions.AuthenticationFailed(msg)
            
        return self.authenticate_credentials(token)
    
    def authenticate_credentials(self, token):
        """
        Autenticar las credenciales del token
        """
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
        except jwt.ExpiredSignatureError:
            msg = 'Token expirado.'
            raise exceptions.AuthenticationFailed(msg)
        except jwt.InvalidTokenError:
            msg = 'Token inválido.'
            raise exceptions.AuthenticationFailed(msg)
            
        try:
            user = User.objects.get(id=payload['user_id'])
        except User.DoesNotExist:
            msg = 'Usuario no encontrado.'
            raise exceptions.AuthenticationFailed(msg)
            
        if not user.is_active:
            msg = 'Cuenta de usuario deshabilitada.'
            raise exceptions.AuthenticationFailed(msg)
            
        return (user, token)


def generate_access_token(user):
    """
    Generar token de acceso JWT
    """
    payload = {
        'user_id': str(user.id),
        'exp': datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_LIFETIME),
        'iat': datetime.utcnow(),
        'token_type': 'access'
    }
    
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def generate_refresh_token(user):
    """
    Generar token de actualización JWT
    """
    payload = {
        'user_id': str(user.id),
        'exp': datetime.utcnow() + timedelta(minutes=settings.JWT_REFRESH_TOKEN_LIFETIME),
        'iat': datetime.utcnow(),
        'token_type': 'refresh'
    }
    
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def verify_refresh_token(token):
    """
    Verificar token de actualización
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        if payload['token_type'] != 'refresh':
            raise jwt.InvalidTokenError('Token type is not refresh')
            
        user = User.objects.get(id=payload['user_id'])
        return user
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, User.DoesNotExist):
        return None