# users/views.py - CORREGIDO

from django.contrib.auth import authenticate, login, logout
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import UserSerializer, LoginSerializer, UserCreateSerializer


class LoginView(APIView):
    """
    Vista para autenticación de usuarios
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            
            user = authenticate(request, username=username, password=password)
            if user:
                login(request, user)
                return Response({
                    'message': 'Login exitoso',
                    'user': UserSerializer(user).data
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Credenciales inválidas'
                }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Vista para cerrar sesión
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        logout(request)
        return Response({
            'message': 'Logout exitoso'
        }, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    Vista para obtener información del usuario actual
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """
        Usar diferentes serializers según la acción
        """
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        """
        Filtrar usuarios por organización del usuario actual
        """
        user = self.request.user
        if user.is_superuser:
            return User.objects.all()
        elif user.organization:
            return User.objects.filter(organization=user.organization)
        else:
            return User.objects.filter(id=user.id)
    
    def perform_create(self, serializer):
        """
        Asignar la organización del usuario al crear
        """
        if not self.request.user.is_superuser and self.request.user.organization:
            serializer.save(organization=self.request.user.organization)
        else:
            serializer.save()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Endpoint para obtener información del usuario actual
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)