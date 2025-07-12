# users/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Signal para crear automáticamente el perfil del usuario cuando se crea un nuevo usuario
    """
    if created:
        UserProfile.objects.create(
            user=instance,
            timezone='America/Santiago',  # Zona horaria por defecto para Chile
            language='es'  # Idioma por defecto español
        )
        print(f"✅ Perfil creado automáticamente para usuario: {instance.username}")


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Signal para guardar el perfil del usuario cuando se actualiza el usuario
    """
    # Verificar que el perfil existe antes de intentar guardarlo
    if hasattr(instance, 'profile'):
        instance.profile.save()
    elif not kwargs.get('created', False):
        # Si el usuario ya existe pero no tiene perfil, crearlo
        UserProfile.objects.get_or_create(
            user=instance,
            defaults={
                'timezone': 'America/Santiago',
                'language': 'es'
            }
        )
        print(f"✅ Perfil creado para usuario existente: {instance.username}") 