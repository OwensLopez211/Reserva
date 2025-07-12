# onboarding/managers.py
"""
Manager principal para orquestar el proceso de onboarding
"""

import logging
from typing import Dict, List, Any, Tuple
from django.db import transaction
from django.utils import timezone

from organizations.models import Organization, Professional, Service
from plans.models import UserRegistration, OrganizationSubscription
from users.models import User

from .validators import OnboardingValidator
from .services import (
    UserCreationService,
    OrganizationCreationService,
    ProfessionalCreationService,
    ServiceCreationService,
    SubscriptionCreationService,
    OnboardingCleanupService
)
from .exceptions import OnboardingError, OnboardingValidationError

logger = logging.getLogger(__name__)


class OnboardingManager:
    """
    Manager principal que orquesta todo el proceso de onboarding
    """
    
    def __init__(self):
        self.cleanup_data = {
            'organization': None,
            'users': [],
            'professionals': [],
            'services': [],
            'subscription': None
        }
    
    def complete_onboarding(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Completar proceso de onboarding completo con rollback automático
        """
        logger.info("🚀 Starting onboarding process")
        
        try:
            # 1. Validar datos completos
            validated_data = OnboardingValidator.validate_complete_data(raw_data)
            registration = validated_data['registration']
            
            logger.info(f"✅ Data validation passed for {registration.email}")
            
            # 2. Ejecutar proceso de onboarding en transacción
            with transaction.atomic():
                result = self._execute_onboarding_steps(validated_data)
                
                # 3. Marcar onboarding como completado
                self._finalize_onboarding(registration, result['owner_user'])
                
                logger.info(f"🎉 Onboarding completed successfully for {result['organization'].name}")
                return self._format_success_response(result)
                
        except Exception as e:
            logger.error(f"❌ Onboarding failed: {str(e)}")
            
            # Rollback automático
            self._rollback_onboarding()
            
            # Re-raise con información estructurada
            if isinstance(e, OnboardingError):
                raise e
            else:
                raise OnboardingError(
                    f"Error durante el onboarding: {str(e)}",
                    error_code="ONBOARDING_FAILED"
                )
    
    def _execute_onboarding_steps(self, validated_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ejecutar los pasos del onboarding en orden
        """
        registration = validated_data['registration']
        organization_data = validated_data['organization']
        professionals_data = validated_data['professionals']
        services_data = validated_data['services']
        
        # Paso 1: Crear organización
        logger.info("📍 Step 1: Creating organization")
        organization = OrganizationCreationService.create_organization(organization_data)
        self.cleanup_data['organization'] = organization
        
        # Paso 2: Crear usuario owner
        logger.info("📍 Step 2: Creating owner user")
        owner_user = UserCreationService.create_owner_user(registration, organization)
        self.cleanup_data['users'].append(owner_user)
        
        # Paso 3: Crear usuarios del equipo
        logger.info("📍 Step 3: Creating team users")
        team_users = UserCreationService.create_team_users(professionals_data, organization)
        self.cleanup_data['users'].extend(team_users)
        
        # Paso 4: Crear profesionales
        logger.info("📍 Step 4: Creating professionals")
        professionals = ProfessionalCreationService.create_professionals(
            professionals_data, organization, team_users
        )
        self.cleanup_data['professionals'] = professionals
        
        # Paso 5: Crear servicios
        logger.info("📍 Step 5: Creating services")
        services = ServiceCreationService.create_services(
            services_data, organization, professionals
        )
        self.cleanup_data['services'] = services
        
        # Paso 6: Crear suscripción
        logger.info("📍 Step 6: Creating subscription")
        subscription = SubscriptionCreationService.create_subscription(
            organization, registration.selected_plan, team_users, professionals, services
        )
        self.cleanup_data['subscription'] = subscription
        
        return {
            'organization': organization,
            'owner_user': owner_user,
            'team_users': team_users,
            'professionals': professionals,
            'services': services,
            'subscription': subscription
        }
    
    def _finalize_onboarding(self, registration: UserRegistration, owner_user: User):
        """
        Finalizar el proceso de onboarding
        """
        logger.info("📍 Step 7: Finalizing onboarding")
        
        # Marcar organización como completada
        organization = self.cleanup_data['organization']
        organization.complete_onboarding()
        
        # Marcar registro como completado
        registration.mark_completed(owner_user)
        
        logger.info("✅ Onboarding finalized successfully")
    
    def _rollback_onboarding(self):
        """
        Rollback automático en caso de error
        """
        logger.warning("🔄 Rolling back onboarding due to error")
        
        try:
            OnboardingCleanupService.rollback_onboarding(
                organization=self.cleanup_data['organization'],
                users=self.cleanup_data['users'],
                professionals=self.cleanup_data['professionals'],
                services=self.cleanup_data['services'],
                subscription=self.cleanup_data['subscription']
            )
            logger.info("✅ Rollback completed successfully")
        except Exception as rollback_error:
            logger.error(f"❌ Rollback failed: {str(rollback_error)}")
            # No re-raise para no ocultar el error original
    
    def _format_success_response(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formatear respuesta exitosa
        """
        organization = result['organization']
        owner_user = result['owner_user']
        team_users = result['team_users']
        professionals = result['professionals']
        services = result['services']
        subscription = result['subscription']
        
        return {
            'message': 'Onboarding completado exitosamente',
            'data': {
                'organization': {
                    'id': str(organization.id),
                    'name': organization.name,
                    'industry_template': organization.industry_template,
                    'email': organization.email,
                    'phone': organization.phone,
                    'address': organization.address,
                    'city': organization.city,
                    'country': organization.country
                },
                'owner_user': {
                    'id': str(owner_user.id),
                    'email': owner_user.email,
                    'full_name': owner_user.full_name,
                    'role': owner_user.role
                },
                'subscription': {
                    'id': str(subscription.id),
                    'plan': subscription.plan.name,
                    'status': subscription.status,
                    'trial_start': subscription.trial_start,
                    'trial_end': subscription.trial_end,
                    'current_period_start': subscription.current_period_start,
                    'current_period_end': subscription.current_period_end
                },
                'team_members': [
                    {
                        'id': str(user.id),
                        'name': user.full_name,
                        'email': user.email,
                        'role': user.role,
                        'is_professional': user.is_professional
                    } for user in team_users
                ],
                'professionals': [
                    {
                        'id': str(professional.id),
                        'name': professional.name,
                        'email': professional.email,
                        'specialty': professional.specialty,
                        'color_code': professional.color_code
                    } for professional in professionals
                ],
                'services': [
                    {
                        'id': str(service.id),
                        'name': service.name,
                        'description': service.description,
                        'category': service.category,
                        'price': float(service.price),
                        'duration_minutes': service.duration_minutes,
                        'buffer_time_before': service.buffer_time_before,
                        'buffer_time_after': service.buffer_time_after,
                        'is_active': service.is_active,
                        'requires_preparation': service.requires_preparation
                    } for service in services
                ],
                'counters': {
                    'users': subscription.current_users_count,
                    'professionals': subscription.current_professionals_count,
                    'receptionists': subscription.current_receptionists_count,
                    'staff': subscription.current_staff_count,
                    'services': subscription.current_services_count
                }
            }
        }
    
    @staticmethod
    def validate_onboarding_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validar datos de onboarding sin ejecutar el proceso
        """
        try:
            validated_data = OnboardingValidator.validate_complete_data(data)
            return {
                'valid': True,
                'registration': {
                    'email': validated_data['registration'].email,
                    'plan': validated_data['registration'].selected_plan.name,
                    'expires_at': validated_data['registration'].expires_at
                }
            }
        except OnboardingError as e:
            return {
                'valid': False,
                'error': e.to_dict()
            }
        except Exception as e:
            return {
                'valid': False,
                'error': {
                    'error': str(e),
                    'error_code': 'VALIDATION_ERROR'
                }
            } 