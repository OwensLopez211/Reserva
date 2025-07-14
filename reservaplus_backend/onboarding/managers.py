# onboarding/managers.py
"""
Manager principal para orquestar el proceso de onboarding
"""

import logging
from typing import Dict, List, Any, Tuple, Optional
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
from .progress_service import OnboardingProgressService
from .logging_service import onboarding_logger, error_tracker
from .exceptions import OnboardingError, OnboardingValidationError

logger = logging.getLogger(__name__)


class OnboardingManager:
    """
    Manager principal que orquesta todo el proceso de onboarding
    Integrado con sistema de progreso paso a paso
    """
    
    def __init__(self, user_registration: Optional[UserRegistration] = None):
        self.cleanup_data = {
            'organization': None,
            'users': [],
            'professionals': [],
            'services': [],
            'subscription': None
        }
        self.user_registration = user_registration
        self.progress_service = OnboardingProgressService() if user_registration else None
        self.session_id = None
    
    def complete_onboarding(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Completar proceso de onboarding completo con rollback automático
        Integrado con sistema de progreso paso a paso
        """
        logger.info("🚀 Starting onboarding process")
        
        try:
            # 1. Validar datos completos
            validated_data = OnboardingValidator.validate_complete_data(raw_data)
            registration = validated_data['registration']
            
            # Initialize progress tracking if we have a registration
            if self.progress_service and registration:
                self.session_id = self.progress_service.start_new_session(registration)
                onboarding_logger.log_onboarding_start(
                    user_email=registration.email,
                    plan_name=registration.selected_plan.name,
                    session_id=self.session_id
                )
            
            logger.info(f"✅ Data validation passed for {registration.email}")
            
            # 2. Ejecutar proceso de onboarding en transacción
            with transaction.atomic():
                result = self._execute_onboarding_steps(validated_data)
                
                # 3. Marcar onboarding como completado
                self._finalize_onboarding(registration, result['owner_user'])
                
                # Log completion
                if self.progress_service:
                    onboarding_logger.log_onboarding_completed(
                        user_email=registration.email,
                        session_id=self.session_id
                    )
                
                logger.info(f"🎉 Onboarding completed successfully for {result['organization'].name}")
                return self._format_success_response(result)
                
        except Exception as e:
            logger.error(f"❌ Onboarding failed: {str(e)}")
            
            # Log error
            if self.user_registration:
                error_tracker.track_error(
                    error=e,
                    context={'onboarding_step': 'complete_onboarding'},
                    user_email=self.user_registration.email,
                    session_id=self.session_id
                )
            
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
        Ejecutar los pasos del onboarding en orden con seguimiento de progreso
        """
        registration = validated_data['registration']
        organization_data = validated_data['organization']
        professionals_data = validated_data['professionals']
        services_data = validated_data['services']
        
        # Paso 1: Crear organización
        self._log_step_start('organization_info', 'Información de la Organización', registration)
        organization = OrganizationCreationService.create_organization(organization_data)
        self.cleanup_data['organization'] = organization
        self._log_step_completed('organization_info', 'Información de la Organización', registration)
        
        # Paso 2: Crear usuario owner
        self._log_step_start('owner_account', 'Cuenta del Propietario', registration)
        owner_user = UserCreationService.create_owner_user(registration, organization)
        self.cleanup_data['users'].append(owner_user)
        self._log_step_completed('owner_account', 'Cuenta del Propietario', registration)
        
        # Paso 3: Crear usuarios del equipo (opcional)
        if professionals_data:
            self._log_step_start('team_members', 'Miembros del Equipo', registration)
            team_users = UserCreationService.create_team_users(professionals_data, organization)
            self.cleanup_data['users'].extend(team_users)
            self._log_step_completed('team_members', 'Miembros del Equipo', registration)
        else:
            team_users = []
            self._log_step_skipped('team_members', 'No team members provided', registration)
        
        # Paso 4: Crear profesionales
        self._log_step_start('professionals', 'Profesionales', registration)
        professionals = ProfessionalCreationService.create_professionals(
            professionals_data, organization, team_users
        )
        self.cleanup_data['professionals'] = professionals
        self._log_step_completed('professionals', 'Profesionales', registration)
        
        # Paso 5: Crear servicios
        self._log_step_start('services', 'Servicios', registration)
        services = ServiceCreationService.create_services(
            services_data, organization, professionals
        )
        self.cleanup_data['services'] = services
        self._log_step_completed('services', 'Servicios', registration)
        
        # Paso 6: Crear suscripción
        self._log_step_start('billing_setup', 'Configuración de Facturación', registration)
        subscription = SubscriptionCreationService.create_subscription(
            organization, registration.selected_plan, team_users, professionals, services
        )
        self.cleanup_data['subscription'] = subscription
        self._log_step_completed('billing_setup', 'Configuración de Facturación', registration)
        
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
        Finalizar el proceso de onboarding con logging
        """
        self._log_step_start('finalization', 'Finalización', registration)
        
        # Marcar organización como completada
        organization = self.cleanup_data['organization']
        organization.complete_onboarding()
        
        # Marcar registro como completado
        registration.mark_completed(owner_user)
        
        self._log_step_completed('finalization', 'Finalización', registration)
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
    
    # ==================== STEP-BY-STEP ONBOARDING METHODS ====================
    
    def process_step(self, step_key: str, step_data: Dict[str, Any], token: str) -> Dict[str, Any]:
        """
        Procesar un paso individual del onboarding
        """
        try:
            if not self.progress_service:
                raise OnboardingError("Progress service not initialized", error_code="PROGRESS_SERVICE_ERROR")
            
            # Validar token y obtener registro
            registration = self.progress_service.validate_token(token)
            
            # Procesar el paso
            result = self.progress_service.complete_step(registration, step_key, step_data)
            
            onboarding_logger.log_step_completed(
                user_email=registration.email,
                step_key=step_key,
                step_title=result.get('step_title', step_key),
                session_id=self.session_id
            )
            
            return {
                'success': True,
                'step_key': step_key,
                'progress': result.get('overall_progress', 0),
                'next_step': result.get('next_step'),
                'is_completed': result.get('is_onboarding_completed', False),
                'message': f"Paso {step_key} completado exitosamente"
            }
            
        except Exception as e:
            error_tracker.track_error(
                error=e,
                context={'step_key': step_key, 'step_data_keys': list(step_data.keys())},
                user_email=getattr(self.user_registration, 'email', None),
                step_key=step_key,
                session_id=self.session_id
            )
            
            if isinstance(e, OnboardingError):
                raise e
            else:
                raise OnboardingError(
                    f"Error procesando paso {step_key}: {str(e)}",
                    error_code="STEP_PROCESSING_ERROR"
                )
    
    def skip_step(self, step_key: str, token: str, reason: str = "user_choice") -> Dict[str, Any]:
        """
        Saltar un paso del onboarding
        """
        try:
            if not self.progress_service:
                raise OnboardingError("Progress service not initialized", error_code="PROGRESS_SERVICE_ERROR")
            
            # Validar token y obtener registro
            registration = self.progress_service.validate_token(token)
            
            # Saltar el paso
            result = self.progress_service.skip_step(registration, step_key, reason)
            
            onboarding_logger.log_step_skipped(
                user_email=registration.email,
                step_key=step_key,
                reason=reason,
                session_id=self.session_id
            )
            
            return {
                'success': True,
                'step_key': step_key,
                'skipped': True,
                'reason': reason,
                'progress': result.get('overall_progress', 0),
                'next_step': result.get('next_step'),
                'message': f"Paso {step_key} omitido"
            }
            
        except Exception as e:
            error_tracker.track_error(
                error=e,
                context={'step_key': step_key, 'skip_reason': reason},
                user_email=getattr(self.user_registration, 'email', None),
                step_key=step_key,
                session_id=self.session_id
            )
            
            if isinstance(e, OnboardingError):
                raise e
            else:
                raise OnboardingError(
                    f"Error saltando paso {step_key}: {str(e)}",
                    error_code="STEP_SKIP_ERROR"
                )
    
    def get_progress(self, token: str) -> Dict[str, Any]:
        """
        Obtener el progreso actual del onboarding
        """
        try:
            if not self.progress_service:
                raise OnboardingError("Progress service not initialized", error_code="PROGRESS_SERVICE_ERROR")
            
            # Validar token y obtener registro
            registration = self.progress_service.validate_token(token)
            
            # Obtener progreso
            progress_data = self.progress_service.get_user_progress(registration)
            
            return {
                'success': True,
                'progress': progress_data
            }
            
        except Exception as e:
            error_tracker.track_error(
                error=e,
                context={'action': 'get_progress'},
                user_email=getattr(self.user_registration, 'email', None),
                session_id=self.session_id
            )
            
            if isinstance(e, OnboardingError):
                raise e
            else:
                raise OnboardingError(
                    f"Error obteniendo progreso: {str(e)}",
                    error_code="PROGRESS_FETCH_ERROR"
                )
    
    def reset_progress(self, token: str) -> Dict[str, Any]:
        """
        Reiniciar el progreso del onboarding
        """
        try:
            if not self.progress_service:
                raise OnboardingError("Progress service not initialized", error_code="PROGRESS_SERVICE_ERROR")
            
            # Validar token y obtener registro
            registration = self.progress_service.validate_token(token)
            
            # Reiniciar progreso
            self.progress_service.reset_progress(registration)
            
            onboarding_logger.log_onboarding_start(
                user_email=registration.email,
                plan_name=registration.selected_plan.name,
                session_id=self.session_id,
                metadata={'action': 'reset'}
            )
            
            return {
                'success': True,
                'message': 'Progreso de onboarding reiniciado',
                'progress': 0
            }
            
        except Exception as e:
            error_tracker.track_error(
                error=e,
                context={'action': 'reset_progress'},
                user_email=getattr(self.user_registration, 'email', None),
                session_id=self.session_id
            )
            
            if isinstance(e, OnboardingError):
                raise e
            else:
                raise OnboardingError(
                    f"Error reiniciando progreso: {str(e)}",
                    error_code="PROGRESS_RESET_ERROR"
                )
    
    # ==================== HELPER METHODS ====================
    
    def _log_step_start(self, step_key: str, step_title: str, registration: UserRegistration):
        """Helper para logging del inicio de paso"""
        logger.info(f"📍 Step: {step_title}")
        if self.progress_service:
            onboarding_logger.log_step_start(
                user_email=registration.email,
                step_key=step_key,
                step_title=step_title,
                session_id=self.session_id
            )
    
    def _log_step_completed(self, step_key: str, step_title: str, registration: UserRegistration):
        """Helper para logging de paso completado"""
        if self.progress_service:
            onboarding_logger.log_step_completed(
                user_email=registration.email,
                step_key=step_key,
                step_title=step_title,
                session_id=self.session_id
            )
    
    def _log_step_skipped(self, step_key: str, reason: str, registration: UserRegistration):
        """Helper para logging de paso omitido"""
        if self.progress_service:
            onboarding_logger.log_step_skipped(
                user_email=registration.email,
                step_key=step_key,
                reason=reason,
                session_id=self.session_id
            ) 