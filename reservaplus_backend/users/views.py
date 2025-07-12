# users/views.py - LOGOUT CORREGIDO

from django.contrib.auth import authenticate
from django.db import models
from django.utils import timezone
import pytz
from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from core.authentication import generate_access_token, generate_refresh_token, verify_refresh_token, JWTAuthentication
from .models import User, UserProfile
from .serializers import UserSerializer, LoginSerializer, UserCreateSerializer, UserUpdateSerializer, UserProfileSerializer


def get_chile_local_time():
    """
    Obtiene la hora actual en zona horaria de Chile como string formateado
    """
    chile_tz = pytz.timezone('America/Santiago')
    utc_now = timezone.now()
    chile_now = utc_now.astimezone(chile_tz)
    return chile_now.strftime('%Y-%m-%d %H:%M:%S')


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
                # ACTUALIZAR LAST_LOGIN - Django maneja el estándar, nosotros el local
                user.last_login = timezone.now()  # Django estándar (UTC)
                user.last_login_local = get_chile_local_time()  # Nuestro campo local
                user.save(update_fields=['last_login', 'last_login_local'])
                
                # Generar tokens JWT
                access_token = generate_access_token(user)
                refresh_token = generate_refresh_token(user)
                
                print(f"Login exitoso para {user.username}")
                print(f"Last login UTC: {user.last_login}")
                print(f"Last login Chile: {user.last_login_local}")
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
            # ACTUALIZAR LAST_LOGIN también al renovar token
            user.last_login = timezone.now()  # Django estándar (UTC)
            user.last_login_local = get_chile_local_time()  # Nuestro campo local
            user.save(update_fields=['last_login', 'last_login_local'])
            
            new_access_token = generate_access_token(user)
            print(f"Token renovado para {user.username}")
            print(f"Last login UTC: {user.last_login}")
            print(f"Last login Chile: {user.last_login_local}")
            
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


# ============================================
# NUEVAS VISTAS PARA GESTIÓN DE USUARIOS CON LIMITACIONES DE PLAN
# ============================================

class UserPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class OrganizationUserListView(generics.ListAPIView):
    """
    Vista para listar todos los usuarios de la organización con limitaciones de plan
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    pagination_class = UserPagination
    
    def get_queryset(self):
        organization = self.request.user.organization
        queryset = User.objects.filter(organization=organization).select_related('organization')
        
        # Filtros opcionales
        role = self.request.query_params.get('role', None)
        status_filter = self.request.query_params.get('status', None)
        search = self.request.query_params.get('search', None)
        
        if role and role != 'all':
            queryset = queryset.filter(role=role)
            
        if status_filter:
            if status_filter == 'active':
                queryset = queryset.filter(is_active=True, is_active_in_org=True)
            elif status_filter == 'inactive':
                queryset = queryset.filter(is_active=False, is_active_in_org=False)
                
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(username__icontains=search)
            )
            
        return queryset.order_by('first_name', 'last_name')
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Agregar información adicional sobre límites del plan
        organization = request.user.organization
        subscription = getattr(organization, 'subscription', None)
        
        if subscription:
            # Contar usuarios reales por rol
            users = organization.users.filter(is_active_in_org=True)
            professionals_count = users.filter(role='professional').count()
            receptionists_count = users.filter(role='reception').count()
            staff_count = users.filter(role='staff').count()
            
            response.data['plan_info'] = {
                'plan_name': subscription.plan.name,
                'limits': {
                    'total_users': {
                        'current': subscription.current_users_count,
                        'max': subscription.plan.max_users,
                        'can_add': subscription.can_add_user()
                    },
                    'professionals': {
                        'current': subscription.current_professionals_count,
                        'max': subscription.plan.max_professionals,
                        'can_add': subscription.can_add_professional()
                    },
                    'receptionists': {
                        'current': subscription.current_receptionists_count,
                        'max': subscription.plan.max_receptionists,
                        'can_add': subscription.can_add_receptionist()
                    },
                    'staff': {
                        'current': subscription.current_staff_count,
                        'max': subscription.plan.max_staff,
                        'can_add': subscription.can_add_staff()
                    }
                },
                'real_counts': {
                    'professionals': professionals_count,
                    'receptionists': receptionists_count,
                    'staff': staff_count,
                    'total_active': users.count()
                }
            }
        
        return response


class OrganizationUserCreateView(generics.CreateAPIView):
    """
    Vista para crear un nuevo usuario en la organización con validación de límites
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserCreateSerializer
    
    def perform_create(self, serializer):
        organization = self.request.user.organization
        subscription = getattr(organization, 'subscription', None)
        
        # Verificar límites del plan
        if not subscription:
            raise ValidationError("La organización no tiene una suscripción activa")
            
        if not subscription.can_add_user():
            raise ValidationError(
                f"Has alcanzado el límite de usuarios para tu plan ({subscription.plan.max_users}). "
                f"Actualmente tienes {subscription.current_users_count} usuarios."
            )
        
        # Obtener rol del nuevo usuario
        role = serializer.validated_data.get('role')
        
        # Verificar límites específicos por rol
        if role == 'professional' and not subscription.can_add_professional():
            raise ValidationError(
                f"Has alcanzado el límite de profesionales para tu plan ({subscription.plan.max_professionals}). "
                f"Actualmente tienes {subscription.current_professionals_count} profesionales."
            )
        elif role == 'reception' and not subscription.can_add_receptionist():
            raise ValidationError(
                f"Has alcanzado el límite de recepcionistas para tu plan ({subscription.plan.max_receptionists}). "
                f"Actualmente tienes {subscription.current_receptionists_count} recepcionistas."
            )
        elif role == 'staff' and not subscription.can_add_staff():
            raise ValidationError(
                f"Has alcanzado el límite de staff para tu plan ({subscription.plan.max_staff}). "
                f"Actualmente tienes {subscription.current_staff_count} staff."
            )
        
        # Crear el usuario
        user = serializer.save(organization=organization)
        
        # Establecer que requiere cambio de contraseña
        user.requires_password_change = True
        user.save()
        
        # Crear perfil profesional automáticamente si es necesario
        if user.is_professional or user.role == 'professional':
            from organizations.models import Professional
            
            # Verificar si ya existe un perfil profesional (por seguridad)
            if not hasattr(user, 'professional_profile') or not user.professional_profile:
                professional = Professional.objects.create(
                    organization=organization,
                    user=user,
                    name=f"{user.first_name} {user.last_name}".strip(),
                    email=user.email,
                    phone=user.phone or '',
                    specialty='',  # Se puede configurar después
                    bio='',  # Se puede configurar después
                    color_code='#4CAF50',  # Color por defecto
                    is_active=True,
                    accepts_walk_ins=True
                )
                
                # Crear horario básico para el profesional
                from schedule.models import ProfessionalSchedule
                ProfessionalSchedule.objects.create(
                    professional=professional,
                    timezone='America/Santiago',
                    min_booking_notice=60,  # 1 hora
                    max_booking_advance=10080,  # 1 semana
                    slot_duration=30,  # 30 minutos
                    is_active=True,
                    accepts_bookings=True
                )
        
        # Incrementar contadores específicos
        subscription.increment_users_count()
        
        if user.role == 'professional':
            subscription.increment_professionals_count()
        elif user.role == 'reception':
            subscription.increment_receptionists_count()
        elif user.role == 'staff':
            subscription.increment_staff_count()
    
    def create(self, request, *args, **kwargs):
        """
        Crear usuario con validaciones personalizadas y retornar contraseña generada
        """
        # Validaciones personalizadas antes de usar el serializer
        errors = {}
        
        # Validar username sin acentos ni caracteres especiales
        username = request.data.get('username', '')
        if username:
            import re
            import unicodedata
            
            # Normalizar y verificar que no hay acentos
            normalized = unicodedata.normalize('NFD', username)
            ascii_username = ''.join(c for c in normalized if unicodedata.category(c) != 'Mn')
            
            if normalized != ascii_username:
                errors['username'] = ['El nombre de usuario no puede contener acentos.']
            elif not re.match(r'^[a-zA-Z0-9._-]+$', username):
                errors['username'] = ['El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos.']
            elif len(username) < 3:
                errors['username'] = ['El nombre de usuario debe tener al menos 3 caracteres.']
        
        # Validar otros campos
        if not request.data.get('first_name', '').strip():
            errors['first_name'] = ['El nombre es obligatorio.']
        
        if not request.data.get('last_name', '').strip():
            errors['last_name'] = ['El apellido es obligatorio.']
        
        email = request.data.get('email', '')
        if email:
            import re
            if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
                errors['email'] = ['El formato del email no es válido.']
            else:
                # Verificar que el email no exista en toda la plataforma
                if User.objects.filter(email=email).exists():
                    errors['email'] = ['Este email ya está registrado en la plataforma.']
        
        # Si hay errores de validación personalizados, retornarlos
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Continuar con la validación normal del serializer
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as e:
            # Formatear errores del serializer para que coincidan con nuestro formato
            formatted_errors = {}
            if hasattr(e, 'detail'):
                for field, messages in e.detail.items():
                    if isinstance(messages, list):
                        formatted_errors[field] = messages
                    else:
                        formatted_errors[field] = [str(messages)]
            return Response(formatted_errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear el usuario
        try:
            self.perform_create(serializer)
        except ValidationError as e:
            # Manejar errores de límites de plan
            return Response({'non_field_errors': [str(e)]}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener la contraseña generada
        temp_password = getattr(serializer.instance, 'temp_password', None)
        
        # Preparar respuesta
        response_data = UserSerializer(serializer.instance).data
        
        if temp_password:
            response_data['temp_password'] = temp_password
            response_data['message'] = 'Usuario creado exitosamente. Se ha generado una contraseña temporal.'
        
        headers = self.get_success_headers(serializer.data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)


class OrganizationUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vista para ver, editar o eliminar un usuario específico
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    lookup_field = 'id'
    
    def get_queryset(self):
        return User.objects.filter(organization=self.request.user.organization)
    
    def perform_update(self, serializer):
        user = self.get_object()
        old_role = user.role
        new_role = serializer.validated_data.get('role', old_role)
        
        # Verificar email único si cambió
        new_email = serializer.validated_data.get('email')
        if new_email and new_email != user.email:
            if User.objects.filter(email=new_email).exclude(id=user.id).exists():
                raise ValidationError({'email': ['Este email ya está registrado en la plataforma.']})
        
        # Si cambió el rol, verificar límites antes de actualizar
        subscription = getattr(self.request.user.organization, 'subscription', None)
        if subscription and old_role != new_role:
            # Verificar si el nuevo rol excede límites
            if new_role == 'professional' and not subscription.can_add_professional():
                raise ValidationError(
                    f"Has alcanzado el límite de profesionales para tu plan ({subscription.plan.max_professionals}). "
                    f"Actualmente tienes {subscription.current_professionals_count} profesionales."
                )
            elif new_role == 'reception' and not subscription.can_add_receptionist():
                raise ValidationError(
                    f"Has alcanzado el límite de recepcionistas para tu plan ({subscription.plan.max_receptionists}). "
                    f"Actualmente tienes {subscription.current_receptionists_count} recepcionistas."
                )
            elif new_role == 'staff' and not subscription.can_add_staff():
                raise ValidationError(
                    f"Has alcanzado el límite de staff para tu plan ({subscription.plan.max_staff}). "
                    f"Actualmente tienes {subscription.current_staff_count} staff."
                )
        
        # Obtener valores anteriores
        old_is_professional = user.is_professional
        
        # Actualizar usuario
        updated_user = serializer.save()
        
        # Crear perfil profesional si es necesario
        if (updated_user.is_professional or updated_user.role == 'professional') and not old_is_professional:
            from organizations.models import Professional
            
            # Verificar si ya existe un perfil profesional (por seguridad)
            if not hasattr(updated_user, 'professional_profile') or not updated_user.professional_profile:
                professional = Professional.objects.create(
                    organization=self.request.user.organization,
                    user=updated_user,
                    name=f"{updated_user.first_name} {updated_user.last_name}".strip(),
                    email=updated_user.email,
                    phone=updated_user.phone or '',
                    specialty='',  # Se puede configurar después
                    bio='',  # Se puede configurar después
                    color_code='#4CAF50',  # Color por defecto
                    is_active=True,
                    accepts_walk_ins=True
                )
                
                # Crear horario básico para el profesional
                from schedule.models import ProfessionalSchedule
                ProfessionalSchedule.objects.create(
                    professional=professional,
                    timezone='America/Santiago',
                    min_booking_notice=60,  # 1 hora
                    max_booking_advance=10080,  # 1 semana
                    slot_duration=30,  # 30 minutos
                    is_active=True,
                    accepts_bookings=True
                )
        
        # Eliminar perfil profesional si ya no es profesional
        elif not (updated_user.is_professional or updated_user.role == 'professional') and old_is_professional:
            if hasattr(updated_user, 'professional_profile') and updated_user.professional_profile:
                professional = updated_user.professional_profile
                
                # Eliminar relación con servicios
                professional.services.clear()
                
                # Eliminar el perfil profesional
                professional.delete()
        
        # Actualizar contadores si cambió el rol
        if subscription and old_role != updated_user.role:
            # Decrementar contador del rol anterior
            if old_role == 'professional':
                subscription.decrement_professionals_count()
            elif old_role == 'reception':
                subscription.decrement_receptionists_count()
            elif old_role == 'staff':
                subscription.decrement_staff_count()
            
            # Incrementar contador del nuevo rol
            if updated_user.role == 'professional':
                subscription.increment_professionals_count()
            elif updated_user.role == 'reception':
                subscription.increment_receptionists_count()
            elif updated_user.role == 'staff':
                subscription.increment_staff_count()
    
    def perform_destroy(self, instance):
        # No permitir eliminar al propietario
        if instance.role == 'owner':
            raise ValidationError("No se puede eliminar al propietario de la organización")
        
        # Cascada: Eliminar profesional relacionado si existe
        if hasattr(instance, 'professional_profile') and instance.professional_profile:
            professional = instance.professional_profile
            
            # Eliminar relación con servicios
            professional.services.clear()
            
            # Eliminar el perfil profesional (esto también eliminará citas por CASCADE)
            professional.delete()
        
        # Cascada: Manejar citas creadas por este usuario
        # Las citas donde este usuario es created_by se eliminarán automáticamente por CASCADE
        # Las citas donde este usuario es cancelled_by se mantendrán pero con cancelled_by=NULL por SET_NULL
        
        # Cascada: Manejar historial de citas (se elimina automáticamente por CASCADE)
        
        # Cascada: Manejar citas recurrentes creadas por este usuario (se elimina automáticamente por CASCADE)
        
        # Cascada: Eliminar perfil de usuario si existe
        if hasattr(instance, 'profile') and instance.profile:
            instance.profile.delete()
        
        # Decrementar contadores
        subscription = getattr(self.request.user.organization, 'subscription', None)
        if subscription:
            subscription.decrement_users_count()
            
            # Decrementar contador específico del rol
            if instance.role == 'professional':
                subscription.decrement_professionals_count()
            elif instance.role == 'reception':
                subscription.decrement_receptionists_count()
            elif instance.role == 'staff':
                subscription.decrement_staff_count()
        
        # Finalmente eliminar el usuario
        # Esto activará todas las cascadas automáticas de Django
        instance.delete()


class UserToggleStatusView(APIView):
    """
    Vista para activar/desactivar un usuario
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(
                id=user_id, 
                organization=request.user.organization
            )
        except User.DoesNotExist:
            return Response(
                {"error": "Usuario no encontrado"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # No permitir desactivar al propietario
        if user.role == 'owner':
            return Response(
                {"error": "No se puede desactivar al propietario"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cambiar estado
        user.is_active_in_org = not user.is_active_in_org
        user.is_active = user.is_active_in_org  # Sincronizar ambos campos
        user.save()
        
        return Response({
            "success": True,
            "user_id": str(user.id),
            "new_status": "active" if user.is_active_in_org else "inactive",
            "message": f"Usuario {'activado' if user.is_active_in_org else 'desactivado'} correctamente"
        })


class CheckEmailView(APIView):
    """
    Vista para verificar si un email ya existe en la plataforma
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        email = request.query_params.get('email', '')
        
        if not email:
            return Response({'error': 'Email es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el email ya existe
        exists = User.objects.filter(email=email).exists()
        
        return Response({
            'exists': exists,
            'email': email
        })


class UserRolesView(APIView):
    """
    Vista para obtener información sobre los roles disponibles
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        roles = [
            {
                'id': 'owner',
                'name': 'Propietario',
                'description': 'Es quien configura la cuenta de la empresa, solo puede haber un único usuario con este rol. Este usuario no puede ser eliminado.',
                'color': 'purple',
                'permissions': [
                    'Toda la plataforma y sus funcionalidades',
                    'Gestión completa del equipo',
                    'Configuración de la empresa',
                    'Acceso a todos los reportes'
                ],
                'editable': False
            },
            {
                'id': 'admin',
                'name': 'Administrador general',
                'description': 'Tiene permisos sobre todo el local y profesionales, puede tener permisos sobre uno o más locales.',
                'color': 'indigo',
                'permissions': [
                    'Gestión de profesionales y servicios',
                    'Acceso a agenda y reservas',
                    'Reportes y estadísticas',
                    'Configuración de horarios'
                ],
                'editable': True
            },
            {
                'id': 'professional',
                'name': 'Profesional',
                'description': 'Este usuario está pensado para un profesional, quien podrá gestionar su agenda o la de su equipo.',
                'color': 'emerald',
                'permissions': [
                    'Gestión de su propia agenda',
                    'Acceso a sus clientes',
                    'Modificar su horario',
                    'Ver sus estadísticas'
                ],
                'editable': True
            },
            {
                'id': 'reception',
                'name': 'Recepcionista',
                'description': 'Este rol tiene permisos sobre local y profesionales asignados. Puede tener permisos sobre uno o más locales.',
                'color': 'orange',
                'permissions': [
                    'Base de datos de clientes',
                    'Agenda general',
                    'Gestión de citas',
                    'Atención al cliente'
                ],
                'editable': True
            },
            {
                'id': 'staff',
                'name': 'Staff',
                'description': 'Este usuario está pensado para un profesional, quien podrá gestionar su agenda o la de su equipo.',
                'color': 'blue',
                'permissions': [
                    'Agenda limitada',
                    'Acceso a clientes asignados',
                    'Ver calendario general',
                    'Gestión básica'
                ],
                'editable': True
            }
        ]
        
        return Response(roles)


# ============================================
# NUEVAS VISTAS PARA GESTIÓN DE PERFILES
# ============================================

class UserProfileView(APIView):
    """
    Vista para gestionar el perfil del usuario actual
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Obtener perfil del usuario actual
        """
        user = request.user
        
        # Asegurar que el perfil existe
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'timezone': 'America/Santiago',
                'language': 'es'
            }
        )
        
        if created:
            print(f"✅ Perfil creado para usuario existente: {user.username}")
        
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)
    
    def put(self, request):
        """
        Actualizar perfil del usuario actual
        """
        user = request.user
        
        # Asegurar que el perfil existe
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'timezone': 'America/Santiago',
                'language': 'es'
            }
        )
        
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Perfil actualizado correctamente',
                'profile': serializer.data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def patch(self, request):
        """
        Actualización parcial del perfil
        """
        return self.put(request)


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    """
    Vista para ver y actualizar perfil de cualquier usuario de la organización
    (solo para owners y admins)
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    lookup_field = 'user_id'
    
    def get_queryset(self):
        # Solo owners y admins pueden ver perfiles de otros usuarios
        if self.request.user.role in ['owner', 'admin']:
            return UserProfile.objects.filter(user__organization=self.request.user.organization)
        else:
            return UserProfile.objects.filter(user=self.request.user)
    
    def get_object(self):
        user_id = self.kwargs.get('user_id')
        
        try:
            user = User.objects.get(
                id=user_id,
                organization=self.request.user.organization
            )
        except User.DoesNotExist:
            raise ValidationError("Usuario no encontrado")
        
        # Verificar permisos
        if self.request.user.role not in ['owner', 'admin'] and user != self.request.user:
            raise ValidationError("No tienes permisos para ver este perfil")
        
        # Asegurar que el perfil existe
        profile, created = UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'timezone': 'America/Santiago',
                'language': 'es'
            }
        )
        
        return profile


class CurrentUserUpdateView(generics.UpdateAPIView):
    """
    Vista para que el usuario actual actualice su información básica y perfil
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserUpdateSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        """
        Actualizar información del usuario y su perfil
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            user = serializer.save()
            
            return Response({
                'message': 'Información actualizada correctamente',
                'user': UserSerializer(user).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrganizationProfessionalsView(generics.ListAPIView):
    """
    Vista para obtener todos los profesionales de la organización
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_queryset(self):
        organization = self.request.user.organization
        if not organization:
            return User.objects.none()
        
        # Filtrar usuarios que son profesionales en la organización
        return User.objects.filter(
            organization=organization,
            is_professional=True,
            is_active_in_org=True
        ).order_by('first_name', 'last_name')