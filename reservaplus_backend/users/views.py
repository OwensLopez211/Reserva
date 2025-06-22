# users/views.py - LOGOUT CORREGIDO

from django.contrib.auth import authenticate
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from core.authentication import generate_access_token, generate_refresh_token, verify_refresh_token
from .models import User
from .serializers import UserSerializer, LoginSerializer, UserCreateSerializer


class LoginView(APIView):
    """
    Vista para autenticación JWT
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(request, username=username, password=password)
            if user:
                # Generar tokens JWT
                access_token = generate_access_token(user)
                refresh_token = generate_refresh_token(user)
                
                print(f"Login exitoso para {user.username}")
                print(f"Access token generado: {access_token[:50]}...")
                
                return Response({
                    'message': 'Login exitoso',
                    'user': UserSerializer(user).data,
                    'access_token': access_token,
                    'refresh_token': refresh_token,
                    'token_type': 'Bearer'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Credenciales inválidas'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RefreshTokenView(APIView):
    """
    Vista para renovar access token usando refresh token
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.data.get('refresh_token')
        
        if not refresh_token:
            return Response({
                'error': 'Refresh token requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = verify_refresh_token(refresh_token)
        if user:
            new_access_token = generate_access_token(user)
            return Response({
                'access_token': new_access_token,
                'token_type': 'Bearer'
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'error': 'Refresh token inválido o expirado'
            }, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """
    Vista para cerrar sesión (JWT no requiere logout del servidor, pero permitimos sin auth)
    """
    permission_classes = [AllowAny]  # CAMBIADO: AllowAny para evitar 403
    
    def post(self, request):
        print(f"Logout solicitado")
        return Response({
            'message': 'Logout exitoso. Elimina el token del cliente.'
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    Vista para obtener información del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # FIX: Verificar que request.user no sea None
        if hasattr(request, 'user') and request.user:
            print(f"CurrentUserView JWT - Usuario: {request.user.username}")
            print(f"CurrentUserView JWT - Autenticado: {request.user.is_authenticated}")
        else:
            print("CurrentUserView JWT - request.user es None")
        
        if not request.user.is_authenticated:
            return Response({
                'error': 'Usuario no autenticado'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        user = self.request.user
        print(f"UserViewSet JWT - Usuario: {user}, Autenticado: {user.is_authenticated}")
        
        if user.is_superuser:
            return User.objects.all()
        elif user.organization:
            return User.objects.filter(organization=user.organization)
        else:
            return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        if not self.request.user.is_superuser and self.request.user.organization:
            serializer.save(organization=self.request.user.organization)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        print(f"UserViewSet.me JWT - Usuario: {request.user}")
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)