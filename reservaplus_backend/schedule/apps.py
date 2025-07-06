from django.apps import AppConfig


class ScheduleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'schedule'
    verbose_name = 'Horarios de Profesionales'
    
    def ready(self):
        """
        Importar signals cuando la app esté lista
        """
        try:
            import schedule.signals
        except ImportError:
            pass
