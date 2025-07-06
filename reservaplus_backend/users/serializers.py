# users/serializers.py - CON PERFIL

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """
    Serializer para login
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer para el perfil del usuario
    """
    class Meta:
        model = UserProfile
        fields = [
            'avatar', 'birth_date', 'address', 'timezone', 'language',
            'email_notifications', 'sms_notifications', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo User con información del perfil
    """
    full_name = serializers.ReadOnlyField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization = serializers.CharField(read_only=True)
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'phone', 'role', 'is_professional', 
            'organization', 'organization_name', 'is_active_in_org',
            'date_joined', 'last_login', 'last_login_local', 'created_at', 'updated_at',
            'profile'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'last_login_local', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """
        Convertir organization UUID a string para consistencia y asegurar que existe el perfil
        """
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
        
        # Asegurar que el perfil existe
        if not hasattr(instance, 'profile'):
            UserProfile.objects.get_or_create(
                user=instance,
                defaults={
                    'timezone': 'America/Santiago',
                    'language': 'es'
                }
            )
            # Refrescar la instancia para incluir el perfil
            instance.refresh_from_db()
            representation['profile'] = UserProfileSerializer(instance.profile).data
        
        return representation


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para crear usuarios (incluye password)
    """
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name', 
            'phone', 'role', 'is_professional', 'organization',
            'password', 'confirm_password'
        ]
    
    def validate(self, data):
        """
        Validar que las contraseñas coincidan
        """
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return data
    
    def create(self, validated_data):
        """
        Crear usuario con contraseña encriptada
        El perfil se creará automáticamente mediante signals
        """
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualizar información del usuario y su perfil
    """
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'email', 'profile'
        ]
    
    def update(self, instance, validated_data):
        """
        Actualizar usuario y su perfil
        """
        profile_data = validated_data.pop('profile', None)
        
        # Actualizar campos del usuario
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar perfil si se proporcionaron datos
        if profile_data:
            profile = getattr(instance, 'profile', None)
            if profile:
                for attr, value in profile_data.items():
                    setattr(profile, attr, value)
                profile.save()
            else:
                # Crear perfil si no existe
                UserProfile.objects.create(user=instance, **profile_data)
        
        return instance