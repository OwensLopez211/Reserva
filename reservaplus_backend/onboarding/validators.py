# onboarding/validators.py
"""
Validadores centralizados para el proceso de onboarding
"""

import re
from typing import Dict, List, Any
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from plans.models import UserRegistration, Plan
from organizations.models import Organization
from .exceptions import OnboardingValidationError, OnboardingTokenError, OnboardingLimitError

User = get_user_model()


class OnboardingValidator:
    """
    Clase principal para validar datos del onboarding
    """
    
    @staticmethod
    def validate_registration_token(token: str) -> UserRegistration:
        """
        Validar token de registro temporal
        """
        if not token:
            raise OnboardingTokenError(
                "Token de registro requerido",
                error_code="TOKEN_REQUIRED"
            )
        
        try:
            registration = UserRegistration.objects.get(
                temp_token=token,
                is_completed=False,
                is_expired=False
            )
            
            if not registration.is_valid:
                raise OnboardingTokenError(
                    "Token de registro expirado",
                    error_code="TOKEN_EXPIRED",
                    details={'expires_at': registration.expires_at}
                )
            
            return registration
            
        except UserRegistration.DoesNotExist:
            raise OnboardingTokenError(
                "Token de registro inválido",
                error_code="TOKEN_INVALID"
            )
    
    @staticmethod
    def validate_organization_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validar datos de organización
        """
        required_fields = ['name', 'industry_template', 'email', 'phone']
        missing_fields = []
        
        for field in required_fields:
            if not data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            raise OnboardingValidationError(
                f"Campos requeridos faltantes: {', '.join(missing_fields)}",
                error_code="ORGANIZATION_MISSING_FIELDS",
                details={'missing_fields': missing_fields}
            )
        
        # Validar formato de email
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, data['email']):
            raise OnboardingValidationError(
                "Formato de email inválido",
                error_code="INVALID_EMAIL_FORMAT",
                details={'email': data['email']}
            )
        
        # Validar que no exista una organización con el mismo email
        if Organization.objects.filter(email=data['email']).exists():
            raise OnboardingValidationError(
                "Ya existe una organización con este email",
                error_code="ORGANIZATION_EMAIL_EXISTS",
                details={'email': data['email']}
            )
        
        return data
    
    @staticmethod
    def validate_professionals_data(data: List[Dict[str, Any]], plan: Plan) -> List[Dict[str, Any]]:
        """
        Validar datos de profesionales
        """
        if not data:
            raise OnboardingValidationError(
                "Debe incluir al menos un profesional",
                error_code="NO_PROFESSIONALS"
            )
        
        # Validar límites del plan
        if len(data) > plan.max_professionals:
            raise OnboardingLimitError(
                f"El plan {plan.name} permite máximo {plan.max_professionals} profesionales",
                error_code="PROFESSIONALS_LIMIT_EXCEEDED",
                details={
                    'max_allowed': plan.max_professionals,
                    'requested': len(data),
                    'plan_name': plan.name
                }
            )
        
        # Validar cada profesional
        emails = []
        for i, professional in enumerate(data):
            # Campos requeridos
            if not professional.get('name'):
                raise OnboardingValidationError(
                    f"Nombre del profesional {i+1} es requerido",
                    error_code="PROFESSIONAL_NAME_REQUIRED",
                    details={'professional_index': i}
                )
            
            if not professional.get('email'):
                raise OnboardingValidationError(
                    f"Email del profesional {i+1} es requerido",
                    error_code="PROFESSIONAL_EMAIL_REQUIRED",
                    details={'professional_index': i}
                )
            
            # Validar formato de email
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, professional['email']):
                raise OnboardingValidationError(
                    f"Formato de email inválido para profesional {i+1}",
                    error_code="PROFESSIONAL_INVALID_EMAIL",
                    details={'professional_index': i, 'email': professional['email']}
                )
            
            # Verificar emails duplicados
            if professional['email'] in emails:
                raise OnboardingValidationError(
                    f"Email duplicado: {professional['email']}",
                    error_code="PROFESSIONAL_DUPLICATE_EMAIL",
                    details={'email': professional['email']}
                )
            
            emails.append(professional['email'])
            
            # Verificar que el email no exista ya en el sistema
            if User.objects.filter(email=professional['email']).exists():
                raise OnboardingValidationError(
                    f"El email {professional['email']} ya está registrado en el sistema",
                    error_code="PROFESSIONAL_EMAIL_EXISTS",
                    details={'email': professional['email']}
                )
        
        return data
    
    @staticmethod
    def validate_services_data(data: List[Dict[str, Any]], plan: Plan) -> List[Dict[str, Any]]:
        """
        Validar datos de servicios
        """
        if not data:
            raise OnboardingValidationError(
                "Debe incluir al menos un servicio",
                error_code="NO_SERVICES"
            )
        
        # Validar límites del plan
        if len(data) > plan.max_services:
            raise OnboardingLimitError(
                f"El plan {plan.name} permite máximo {plan.max_services} servicios",
                error_code="SERVICES_LIMIT_EXCEEDED",
                details={
                    'max_allowed': plan.max_services,
                    'requested': len(data),
                    'plan_name': plan.name
                }
            )
        
        # Validar cada servicio
        for i, service in enumerate(data):
            # Campos requeridos
            if not service.get('name'):
                raise OnboardingValidationError(
                    f"Nombre del servicio {i+1} es requerido",
                    error_code="SERVICE_NAME_REQUIRED",
                    details={'service_index': i}
                )
            
            # Validar precio
            price = service.get('price')
            if not price or price <= 0:
                raise OnboardingValidationError(
                    f"Precio del servicio {i+1} debe ser mayor a 0",
                    error_code="SERVICE_INVALID_PRICE",
                    details={'service_index': i, 'price': price}
                )
            
            # Validar duración
            duration = service.get('duration_minutes')
            if not duration or duration <= 0:
                raise OnboardingValidationError(
                    f"Duración del servicio {i+1} debe ser mayor a 0",
                    error_code="SERVICE_INVALID_DURATION",
                    details={'service_index': i, 'duration_minutes': duration}
                )
            
            # Validar rangos razonables
            if duration > 480:  # 8 horas
                raise OnboardingValidationError(
                    f"Duración del servicio {i+1} no puede exceder 8 horas",
                    error_code="SERVICE_DURATION_TOO_LONG",
                    details={'service_index': i, 'duration_minutes': duration}
                )
            
            if price > 1000000:  # 1 millón
                raise OnboardingValidationError(
                    f"Precio del servicio {i+1} parece excesivo",
                    error_code="SERVICE_PRICE_TOO_HIGH",
                    details={'service_index': i, 'price': price}
                )
        
        return data
    
    @staticmethod
    def validate_complete_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validar datos completos del onboarding
        """
        # Validar token
        registration = OnboardingValidator.validate_registration_token(
            data.get('registration_token')
        )
        
        # Validar organización
        organization_data = OnboardingValidator.validate_organization_data(
            data.get('organization', {})
        )
        
        # Validar profesionales
        professionals_data = OnboardingValidator.validate_professionals_data(
            data.get('professionals', []),
            registration.selected_plan
        )
        
        # Validar servicios
        services_data = OnboardingValidator.validate_services_data(
            data.get('services', []),
            registration.selected_plan
        )
        
        return {
            'registration': registration,
            'organization': organization_data,
            'professionals': professionals_data,
            'services': services_data
        } 