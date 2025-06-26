# core/industry_templates.py - NUEVO ARCHIVO
"""
Plantillas de configuración por industria para ReservaPlus
"""

INDUSTRY_TEMPLATES = {
    'salon': {
        'name': 'Peluquería/Salón de Belleza',
        'terminology': {
            'professional': {
                'singular': 'Estilista',
                'plural': 'Estilistas'
            },
            'client': {
                'singular': 'Cliente',
                'plural': 'Clientes'
            },
            'appointment': {
                'singular': 'Cita',
                'plural': 'Citas'
            },
            'service': {
                'singular': 'Servicio',
                'plural': 'Servicios'
            }
        },
        'business_rules': {
            'allow_walk_ins': True,
            'cancellation_window_hours': 2,
            'requires_confirmation': False,
            'advance_booking_days': 30,
            'buffer_between_appointments': 15,
            'send_reminders': True,
            'reminder_hours_before': 24
        },
        'default_services': [
            {
                'name': 'Corte de Cabello',
                'category': 'Cabello',
                'duration_minutes': 45,
                'price': 15000,
                'buffer_time_after': 10
            },
            {
                'name': 'Peinado',
                'category': 'Cabello',
                'duration_minutes': 30,
                'price': 12000,
                'buffer_time_after': 5
            },
            {
                'name': 'Tinte y Color',
                'category': 'Color',
                'duration_minutes': 90,
                'price': 35000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'tuesday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'wednesday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'thursday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'friday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'saturday': {'open': '09:00', 'close': '15:00', 'is_open': True},
            'sunday': {'open': '10:00', 'close': '14:00', 'is_open': False}
        }
    },
    'clinic': {
        'name': 'Clínica/Consultorio Médico',
        'terminology': {
            'professional': {
                'singular': 'Doctor',
                'plural': 'Doctores'
            },
            'client': {
                'singular': 'Paciente',
                'plural': 'Pacientes'
            },
            'appointment': {
                'singular': 'Consulta',
                'plural': 'Consultas'
            },
            'service': {
                'singular': 'Procedimiento',
                'plural': 'Procedimientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': False,
            'cancellation_window_hours': 24,
            'requires_confirmation': True,
            'advance_booking_days': 60,
            'buffer_between_appointments': 10,
            'send_reminders': True,
            'reminder_hours_before': 48
        },
        'default_services': [
            {
                'name': 'Consulta General',
                'category': 'Consultas',
                'duration_minutes': 30,
                'price': 25000,
                'buffer_time_after': 10
            },
            {
                'name': 'Control Médico',
                'category': 'Controles',
                'duration_minutes': 20,
                'price': 15000,
                'buffer_time_after': 5
            },
            {
                'name': 'Procedimiento Menor',
                'category': 'Procedimientos',
                'duration_minutes': 45,
                'price': 40000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'tuesday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'wednesday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'thursday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'friday': {'open': '08:00', 'close': '17:00', 'is_open': True},
            'saturday': {'open': '08:00', 'close': '12:00', 'is_open': True},
            'sunday': {'open': '09:00', 'close': '12:00', 'is_open': False}
        }
    },
    'spa': {
        'name': 'Spa/Centro de Bienestar',
        'terminology': {
            'professional': {
                'singular': 'Terapeuta',
                'plural': 'Terapeutas'
            },
            'client': {
                'singular': 'Cliente',
                'plural': 'Clientes'
            },
            'appointment': {
                'singular': 'Sesión',
                'plural': 'Sesiones'
            },
            'service': {
                'singular': 'Tratamiento',
                'plural': 'Tratamientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': False,
            'cancellation_window_hours': 24,
            'requires_confirmation': True,
            'advance_booking_days': 45,
            'buffer_between_appointments': 30,
            'send_reminders': True,
            'reminder_hours_before': 24
        },
        'default_services': [
            {
                'name': 'Masaje Relajante',
                'category': 'Masajes',
                'duration_minutes': 60,
                'price': 30000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            },
            {
                'name': 'Facial Hidratante',
                'category': 'Faciales',
                'duration_minutes': 45,
                'price': 25000,
                'buffer_time_before': 5,
                'buffer_time_after': 10,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'tuesday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'wednesday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'thursday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'friday': {'open': '10:00', 'close': '20:00', 'is_open': True},
            'saturday': {'open': '09:00', 'close': '18:00', 'is_open': True},
            'sunday': {'open': '10:00', 'close': '16:00', 'is_open': True}
        }
    },
    'dental': {
        'name': 'Clínica Dental',
        'terminology': {
            'professional': {
                'singular': 'Dentista',
                'plural': 'Dentistas'
            },
            'client': {
                'singular': 'Paciente',
                'plural': 'Pacientes'
            },
            'appointment': {
                'singular': 'Cita Dental',
                'plural': 'Citas Dentales'
            },
            'service': {
                'singular': 'Tratamiento',
                'plural': 'Tratamientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': False,
            'cancellation_window_hours': 48,
            'requires_confirmation': True,
            'advance_booking_days': 90,
            'buffer_between_appointments': 15,
            'send_reminders': True,
            'reminder_hours_before': 48
        },
        'default_services': [
            {
                'name': 'Consulta Dental',
                'category': 'Consultas',
                'duration_minutes': 30,
                'price': 20000,
                'buffer_time_after': 10
            },
            {
                'name': 'Limpieza Dental',
                'category': 'Prevención',
                'duration_minutes': 45,
                'price': 35000,
                'buffer_time_after': 15
            },
            {
                'name': 'Empaste',
                'category': 'Restauración',
                'duration_minutes': 60,
                'price': 50000,
                'buffer_time_before': 10,
                'buffer_time_after': 15,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'tuesday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'wednesday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'thursday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'friday': {'open': '08:00', 'close': '18:00', 'is_open': True},
            'saturday': {'open': '08:00', 'close': '13:00', 'is_open': True},
            'sunday': {'open': '09:00', 'close': '12:00', 'is_open': False}
        }
    },
    'fitness': {
        'name': 'Entrenamiento Personal/Fitness',
        'terminology': {
            'professional': {
                'singular': 'Entrenador',
                'plural': 'Entrenadores'
            },
            'client': {
                'singular': 'Cliente',
                'plural': 'Clientes'
            },
            'appointment': {
                'singular': 'Sesión',
                'plural': 'Sesiones'
            },
            'service': {
                'singular': 'Entrenamiento',
                'plural': 'Entrenamientos'
            }
        },
        'business_rules': {
            'allow_walk_ins': True,
            'cancellation_window_hours': 4,
            'requires_confirmation': False,
            'advance_booking_days': 14,
            'buffer_between_appointments': 0,
            'send_reminders': True,
            'reminder_hours_before': 12
        },
        'default_services': [
            {
                'name': 'Entrenamiento Personal',
                'category': 'Entrenamiento',
                'duration_minutes': 60,
                'price': 25000,
                'buffer_time_after': 5
            },
            {
                'name': 'Evaluación Física',
                'category': 'Evaluación',
                'duration_minutes': 45,
                'price': 20000,
                'buffer_time_before': 10,
                'buffer_time_after': 10,
                'requires_preparation': True
            }
        ],
        'business_hours': {
            'monday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'tuesday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'wednesday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'thursday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'friday': {'open': '06:00', 'close': '22:00', 'is_open': True},
            'saturday': {'open': '07:00', 'close': '20:00', 'is_open': True},
            'sunday': {'open': '08:00', 'close': '18:00', 'is_open': True}
        }
    }
}
