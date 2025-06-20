# core/industry_templates.py

INDUSTRY_TEMPLATES = {
    'salon': {
        'name': 'Peluquería/Salón de Belleza',
        'terminology': {
            'professional': {'singular': 'Estilista', 'plural': 'Estilistas'},
            'client': {'singular': 'Cliente', 'plural': 'Clientes'},
            'appointment': {'singular': 'Cita', 'plural': 'Citas'},
            'service': {'singular': 'Servicio', 'plural': 'Servicios'},
        },
        'business_rules': {
            'allow_walk_ins': True,
            'multi_service_booking': True,
            'requires_confirmation': False,
            'buffer_time_minutes': 10,
            'min_advance_booking_hours': 1,
            'max_advance_booking_days': 30,
            'cancellation_window_hours': 2,
        },
        'default_services': [
            {'name': 'Corte de Cabello', 'duration': 45, 'category': 'Cortes', 'price': 15000},
            {'name': 'Color de Cabello', 'duration': 120, 'category': 'Color', 'price': 35000},
            {'name': 'Peinado', 'duration': 30, 'category': 'Peinados', 'price': 12000},
            {'name': 'Tratamiento Capilar', 'duration': 60, 'category': 'Tratamientos', 'price': 25000},
        ],
        'working_hours': {
            'monday': {'start': '09:00', 'end': '19:00'},
            'tuesday': {'start': '09:00', 'end': '19:00'},
            'wednesday': {'start': '09:00', 'end': '19:00'},
            'thursday': {'start': '09:00', 'end': '19:00'},
            'friday': {'start': '09:00', 'end': '19:00'},
            'saturday': {'start': '09:00', 'end': '17:00'},
            'sunday': {'closed': True},
        }
    },
    
    'clinic': {
        'name': 'Clínica/Consultorio Médico',
        'terminology': {
            'professional': {'singular': 'Doctor', 'plural': 'Doctores'},
            'client': {'singular': 'Paciente', 'plural': 'Pacientes'},
            'appointment': {'singular': 'Consulta', 'plural': 'Consultas'},
            'service': {'singular': 'Atención', 'plural': 'Atenciones'},
        },
        'business_rules': {
            'allow_walk_ins': False,
            'multi_service_booking': False,
            'requires_confirmation': True,
            'buffer_time_minutes': 5,
            'min_advance_booking_hours': 2,
            'max_advance_booking_days': 60,
            'cancellation_window_hours': 24,
        },
        'default_services': [
            {'name': 'Consulta General', 'duration': 30, 'category': 'Consultas', 'price': 25000},
            {'name': 'Control', 'duration': 20, 'category': 'Controles', 'price': 15000},
            {'name': 'Procedimiento Menor', 'duration': 60, 'category': 'Procedimientos', 'price': 45000},
            {'name': 'Examen Médico', 'duration': 45, 'category': 'Exámenes', 'price': 35000},
        ],
        'working_hours': {
            'monday': {'start': '08:00', 'end': '18:00'},
            'tuesday': {'start': '08:00', 'end': '18:00'},
            'wednesday': {'start': '08:00', 'end': '18:00'},
            'thursday': {'start': '08:00', 'end': '18:00'},
            'friday': {'start': '08:00', 'end': '17:00'},
            'saturday': {'start': '09:00', 'end': '13:00'},
            'sunday': {'closed': True},
        }
    },
    
    'fitness': {
        'name': 'Entrenamiento Personal/Fitness',
        'terminology': {
            'professional': {'singular': 'Entrenador', 'plural': 'Entrenadores'},
            'client': {'singular': 'Miembro', 'plural': 'Miembros'},
            'appointment': {'singular': 'Sesión', 'plural': 'Sesiones'},
            'service': {'singular': 'Entrenamiento', 'plural': 'Entrenamientos'},
        },
        'business_rules': {
            'allow_walk_ins': True,
            'multi_service_booking': False,
            'requires_confirmation': False,
            'buffer_time_minutes': 15,
            'min_advance_booking_hours': 1,
            'max_advance_booking_days': 14,
            'cancellation_window_hours': 4,
        },
        'default_services': [
            {'name': 'Entrenamiento Personal', 'duration': 60, 'category': 'Individual', 'price': 20000},
            {'name': 'Clase Grupal', 'duration': 45, 'category': 'Grupal', 'price': 8000},
            {'name': 'Evaluación Física', 'duration': 90, 'category': 'Evaluación', 'price': 30000},
            {'name': 'Consulta Nutricional', 'duration': 45, 'category': 'Nutrición', 'price': 25000},
        ],
        'working_hours': {
            'monday': {'start': '06:00', 'end': '22:00'},
            'tuesday': {'start': '06:00', 'end': '22:00'},
            'wednesday': {'start': '06:00', 'end': '22:00'},
            'thursday': {'start': '06:00', 'end': '22:00'},
            'friday': {'start': '06:00', 'end': '22:00'},
            'saturday': {'start': '08:00', 'end': '18:00'},
            'sunday': {'start': '08:00', 'end': '16:00'},
        }
    },
    
    'spa': {
        'name': 'Spa/Centro de Bienestar',
        'terminology': {
            'professional': {'singular': 'Terapeuta', 'plural': 'Terapeutas'},
            'client': {'singular': 'Cliente', 'plural': 'Clientes'},
            'appointment': {'singular': 'Sesión', 'plural': 'Sesiones'},
            'service': {'singular': 'Tratamiento', 'plural': 'Tratamientos'},
        },
        'business_rules': {
            'allow_walk_ins': False,
            'multi_service_booking': True,
            'requires_confirmation': True,
            'buffer_time_minutes': 15,
            'min_advance_booking_hours': 4,
            'max_advance_booking_days': 45,
            'cancellation_window_hours': 12,
        },
        'default_services': [
            {'name': 'Masaje Relajante', 'duration': 60, 'category': 'Masajes', 'price': 35000},
            {'name': 'Facial Básico', 'duration': 75, 'category': 'Faciales', 'price': 40000},
            {'name': 'Manicure', 'duration': 45, 'category': 'Uñas', 'price': 18000},
            {'name': 'Pedicure', 'duration': 60, 'category': 'Uñas', 'price': 22000},
        ],
        'working_hours': {
            'monday': {'start': '09:00', 'end': '20:00'},
            'tuesday': {'start': '09:00', 'end': '20:00'},
            'wednesday': {'start': '09:00', 'end': '20:00'},
            'thursday': {'start': '09:00', 'end': '20:00'},
            'friday': {'start': '09:00', 'end': '20:00'},
            'saturday': {'start': '09:00', 'end': '18:00'},
            'sunday': {'start': '10:00', 'end': '17:00'},
        }
    }
}


def get_industry_config(industry_type):
    """
    Obtener configuración para un tipo de industria específico
    """
    return INDUSTRY_TEMPLATES.get(industry_type, INDUSTRY_TEMPLATES['salon'])


def get_all_industries():
    """
    Obtener lista de todas las industrias disponibles
    """
    return [(key, value['name']) for key, value in INDUSTRY_TEMPLATES.items()]