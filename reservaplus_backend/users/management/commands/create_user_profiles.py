from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = 'Crear perfiles para usuarios existentes que no tengan uno'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué usuarios necesitan perfil sin crearlos',
        )
        parser.add_argument(
            '--organization',
            type=str,
            help='Crear perfiles solo para usuarios de una organización específica (UUID)',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        organization_id = options.get('organization')
        
        self.stdout.write(
            self.style.SUCCESS('🔍 Buscando usuarios sin perfil...')
        )
        
        # Filtrar usuarios
        queryset = User.objects.all()
        
        if organization_id:
            queryset = queryset.filter(organization__id=organization_id)
            self.stdout.write(f"   📋 Filtrando por organización: {organization_id}")
        
        # Encontrar usuarios sin perfil
        users_without_profile = []
        total_users = 0
        
        for user in queryset:
            total_users += 1
            if not hasattr(user, 'profile'):
                users_without_profile.append(user)
        
        self.stdout.write(
            f"   📊 Total de usuarios: {total_users}"
        )
        self.stdout.write(
            f"   ❌ Usuarios sin perfil: {len(users_without_profile)}"
        )
        
        if not users_without_profile:
            self.stdout.write(
                self.style.SUCCESS('✅ Todos los usuarios ya tienen perfil')
            )
            return
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\n🔍 MODO DRY-RUN - Usuarios que necesitan perfil:')
            )
            for user in users_without_profile:
                org_name = user.organization.name if user.organization else 'Sin organización'
                self.stdout.write(f"   - {user.username} ({user.email}) - {org_name}")
            return
        
        # Crear perfiles
        created_count = 0
        failed_count = 0
        
        self.stdout.write(
            self.style.SUCCESS('\n🚀 Creando perfiles...')
        )
        
        for user in users_without_profile:
            try:
                profile = UserProfile.objects.create(
                    user=user,
                    timezone='America/Santiago',
                    language='es',
                    email_notifications=True,
                    sms_notifications=False
                )
                
                created_count += 1
                org_name = user.organization.name if user.organization else 'Sin organización'
                self.stdout.write(
                    f"   ✅ Perfil creado para: {user.username} - {org_name}"
                )
                
            except Exception as e:
                failed_count += 1
                self.stdout.write(
                    self.style.ERROR(f"   ❌ Error creando perfil para {user.username}: {str(e)}")
                )
        
        # Resumen final
        self.stdout.write(
            self.style.SUCCESS(f'\n📋 Resumen:')
        )
        self.stdout.write(f"   ✅ Perfiles creados exitosamente: {created_count}")
        
        if failed_count > 0:
            self.stdout.write(
                self.style.ERROR(f"   ❌ Errores: {failed_count}")
            )
        
        self.stdout.write(
            self.style.SUCCESS('🎉 ¡Proceso completado!')
        ) 