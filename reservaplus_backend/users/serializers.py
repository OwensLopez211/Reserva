# users/serializers.py - CORREGIDO

from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    """
    Serializer para login
    """
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo User
    """
    full_name = serializers.ReadOnlyField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization = serializers.CharField(read_only=True)  
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'full_name', 'phone', 'role', 'is_professional', 
            'organization', 'organization_name', 'is_active_in_org',
            'date_joined', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        """
        Convertir organization UUID a string para consistencia
        """
        representation = super().to_representation(instance)
        if instance.organization:
            representation['organization'] = str(instance.organization.id)
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
        """
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user