# onboarding/services.py
"""
Servicios específicos para cada entidad del onboarding
"""

import logging
from typing import Dict, List, Any, Optional
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta

from organizations.models import Organization, Professional, Service
from plans.models import UserRegistration, OrganizationSubscription, Plan
from core.industry_templates import INDUSTRY_TEMPLATES
from .exceptions import OnboardingError, OnboardingValidationError

User = get_user_model()
logger = logging.getLogger(__name__)


class UserCreationService:
    """
    Servicio para crear usuarios durante el onboarding
    """
    
    @staticmethod
    def create_owner_user(registration: UserRegistration, organization: Organization) -> User:
        """
        Crear usuario propietario de la organización
        """
        try:
            user_data = registration.registration_data
            
            user = User.objects.create_user(
                username=user_data.get('email', registration.email),
                email=registration.email,
                password=user_data.get('password', ''),
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                role='owner',
                organization=organization,
                is_active_in_org=True
            )
            
            logger.info(f"Owner user created: {user.email} (ID: {user.id})")
            return user
            
        except Exception as e:
            logger.error(f"Error creating owner user: {str(e)}")
            raise OnboardingError(
                f"Error al crear usuario propietario: {str(e)}",
                error_code="USER_CREATION_FAILED"
            )
    
    @staticmethod
    def create_team_users(team_data: List[Dict[str, Any]], organization: Organization) -> List[User]:
        """
        Crear usuarios del equipo
        """
        created_users = []
        
        try:
            for i, member_data in enumerate(team_data):
                # Verificar si el usuario ya existe
                if User.objects.filter(email=member_data['email']).exists():
                    logger.warning(f"User with email {member_data['email']} already exists, skipping...")
                    continue
                
                member_role = member_data.get('role', 'staff')
                
                # Dividir el nombre en first_name y last_name
                name_parts = member_data.get('name', '').split()
                first_name = name_parts[0] if name_parts else ''
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
                
                team_user = User.objects.create_user(
                    username=member_data['email'],
                    email=member_data['email'],
                    first_name=first_name,
                    last_name=last_name,
                    role=member_role,
                    organization=organization,
                    phone=member_data.get('phone', ''),
                    is_professional=member_data.get('is_professional', member_role == 'professional'),
                    is_active_in_org=True
                )
                
                created_users.append(team_user)
                logger.info(f"Team user created: {team_user.email} with role {member_role}")
            
            return created_users
            
        except Exception as e:
            logger.error(f"Error creating team users: {str(e)}")
            raise OnboardingError(
                f"Error al crear usuarios del equipo: {str(e)}",
                error_code="TEAM_USERS_CREATION_FAILED"
            )


class OrganizationCreationService:
    """
    Servicio para crear organizaciones
    """
    
    @staticmethod
    def create_organization(org_data: Dict[str, Any]) -> Organization:
        """
        Crear organización con configuración específica de industria
        """
        try:
            # Obtener configuración de industria
            industry_settings = OrganizationCreationService._get_industry_settings(
                org_data['industry_template']
            )
            
            organization = Organization.objects.create(
                name=org_data['name'],
                industry_template=org_data['industry_template'],
                email=org_data['email'],
                phone=org_data['phone'],
                address=org_data.get('address', ''),
                city=org_data.get('city', ''),
                country=org_data.get('country', 'Chile'),
                settings=industry_settings
            )
            
            logger.info(f"Organization created: {organization.name} (ID: {organization.id})")
            return organization
            
        except Exception as e:
            logger.error(f"Error creating organization: {str(e)}")
            raise OnboardingError(
                f"Error al crear organización: {str(e)}",
                error_code="ORGANIZATION_CREATION_FAILED"
            )
    
    @staticmethod
    def _get_industry_settings(industry_template: str) -> Dict[str, Any]:
        """
        Obtener configuraciones específicas de la industria
        """
        template = INDUSTRY_TEMPLATES.get(industry_template, INDUSTRY_TEMPLATES['salon'])
        return {
            'business_rules': template.get('business_rules', {}),
            'business_hours': template.get('business_hours', {}),
            'terminology': template.get('terminology', {})
        }


class ProfessionalCreationService:
    """
    Servicio para crear profesionales
    """
    
    @staticmethod
    def create_professionals(
        professionals_data: List[Dict[str, Any]], 
        organization: Organization,
        team_users: List[User]
    ) -> List[Professional]:
        """
        Crear perfiles de profesionales
        """
        created_professionals = []
        
        try:
            # Crear un mapeo de emails a usuarios
            user_email_map = {user.email: user for user in team_users}
            
            for i, professional_data in enumerate(professionals_data):
                # Buscar el usuario correspondiente
                user = user_email_map.get(professional_data['email'])
                
                # Solo crear Professional si el rol requiere servicios
                member_role = professional_data.get('role', 'staff')
                should_create_professional = (
                    member_role in ['professional', 'staff'] or 
                    professional_data.get('is_professional', False)
                )
                
                if should_create_professional:
                    professional = Professional.objects.create(
                        organization=organization,
                        user=user,
                        name=professional_data['name'],
                        email=professional_data['email'],
                        phone=professional_data.get('phone', ''),
                        specialty=professional_data.get('specialty', ''),
                        color_code=professional_data.get('color_code', '#4CAF50'),
                        is_active=professional_data.get('is_active', True),
                        accepts_walk_ins=professional_data.get('accepts_walk_ins', True)
                    )
                    
                    created_professionals.append(professional)
                    logger.info(f"Professional created: {professional.name} (ID: {professional.id})")
            
            return created_professionals
            
        except Exception as e:
            logger.error(f"Error creating professionals: {str(e)}")
            raise OnboardingError(
                f"Error al crear profesionales: {str(e)}",
                error_code="PROFESSIONALS_CREATION_FAILED"
            )


class ServiceCreationService:
    """
    Servicio para crear servicios
    """
    
    @staticmethod
    def create_services(
        services_data: List[Dict[str, Any]], 
        organization: Organization,
        professionals: List[Professional]
    ) -> List[Service]:
        """
        Crear servicios de la organización
        """
        created_services = []
        
        try:
            for i, service_data in enumerate(services_data):
                service = Service.objects.create(
                    organization=organization,
                    name=service_data['name'],
                    description=service_data.get('description', ''),
                    category=service_data.get('category', ''),
                    duration_minutes=service_data['duration_minutes'],
                    price=service_data['price'],
                    buffer_time_before=service_data.get('buffer_time_before', 0),
                    buffer_time_after=service_data.get('buffer_time_after', 10),
                    is_active=service_data.get('is_active', True),
                    requires_preparation=service_data.get('requires_preparation', False)
                )
                
                # Asignar profesionales al servicio
                if professionals:
                    service.professionals.set(professionals)
                
                created_services.append(service)
                logger.info(f"Service created: {service.name} (ID: {service.id})")
            
            return created_services
            
        except Exception as e:
            logger.error(f"Error creating services: {str(e)}")
            raise OnboardingError(
                f"Error al crear servicios: {str(e)}",
                error_code="SERVICES_CREATION_FAILED"
            )


class SubscriptionCreationService:
    """
    Servicio para crear y gestionar suscripciones
    """
    
    @staticmethod
    def create_subscription(
        organization: Organization, 
        plan: Plan,
        team_users: List[User],
        professionals: List[Professional],
        services: List[Service]
    ) -> OrganizationSubscription:
        """
        Crear suscripción y configurar contadores iniciales
        """
        try:
            subscription = OrganizationSubscription.objects.create(
                organization=organization,
                plan=plan,
                status='trial',
                trial_start=timezone.now(),
                trial_end=timezone.now() + timedelta(days=14),
                current_period_start=timezone.now(),
                current_period_end=timezone.now() + timedelta(days=14),
            )
            
            # Configurar contadores iniciales
            SubscriptionCreationService._update_counters(
                subscription, team_users, professionals, services
            )
            
            logger.info(f"Subscription created: {plan.name} for {organization.name}")
            return subscription
            
        except Exception as e:
            logger.error(f"Error creating subscription: {str(e)}")
            raise OnboardingError(
                f"Error al crear suscripción: {str(e)}",
                error_code="SUBSCRIPTION_CREATION_FAILED"
            )
    
    @staticmethod
    def _update_counters(
        subscription: OrganizationSubscription,
        team_users: List[User],
        professionals: List[Professional],
        services: List[Service]
    ):
        """
        Actualizar contadores de la suscripción
        """
        # Contar usuarios por rol
        professionals_count = len([u for u in team_users if u.role == 'professional'])
        receptionists_count = len([u for u in team_users if u.role == 'reception'])
        staff_count = len([u for u in team_users if u.role == 'staff'])
        
        # Actualizar contadores (incluyendo el owner)
        subscription.current_users_count = len(team_users) + 1  # +1 para el owner
        subscription.current_professionals_count = professionals_count
        subscription.current_receptionists_count = receptionists_count
        subscription.current_staff_count = staff_count
        subscription.current_services_count = len(services)
        
        subscription.save(update_fields=[
            'current_users_count',
            'current_professionals_count',
            'current_receptionists_count',
            'current_staff_count',
            'current_services_count'
        ])
        
        logger.info(f"Subscription counters updated: {subscription.current_users_count} users, "
                   f"{subscription.current_professionals_count} professionals, "
                   f"{subscription.current_services_count} services")


class OnboardingCleanupService:
    """
    Servicio para limpiar datos en caso de error (rollback)
    """
    
    @staticmethod
    def rollback_onboarding(
        organization: Optional[Organization] = None,
        users: Optional[List[User]] = None,
        professionals: Optional[List[Professional]] = None,
        services: Optional[List[Service]] = None,
        subscription: Optional[OrganizationSubscription] = None
    ):
        """
        Limpiar datos creados durante el onboarding en caso de error
        """
        try:
            # Limpiar en orden inverso a la creación
            if services:
                for service in services:
                    service.delete()
                logger.info(f"Cleaned up {len(services)} services")
            
            if professionals:
                for professional in professionals:
                    professional.delete()
                logger.info(f"Cleaned up {len(professionals)} professionals")
            
            if subscription:
                subscription.delete()
                logger.info("Cleaned up subscription")
            
            if users:
                for user in users:
                    user.delete()
                logger.info(f"Cleaned up {len(users)} users")
            
            if organization:
                organization.delete()
                logger.info("Cleaned up organization")
                
        except Exception as e:
            logger.error(f"Error during rollback: {str(e)}")
            raise OnboardingError(
                f"Error durante la limpieza de datos: {str(e)}",
                error_code="ROLLBACK_FAILED"
            ) 