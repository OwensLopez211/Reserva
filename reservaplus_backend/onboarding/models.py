# onboarding/models.py

import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()


class OnboardingStep(models.Model):
    """
    Define each step in the onboarding process with metadata and validation
    """
    STEP_TYPES = [
        ('organization', 'Organization Setup'),
        ('team', 'Team Setup'),
        ('professional', 'Professional Setup'),
        ('service', 'Service Setup'),
        ('billing', 'Billing Setup'),
        ('finalization', 'Finalization'),
    ]
    
    VALIDATION_TYPES = [
        ('required', 'Required'),
        ('optional', 'Optional'),
        ('conditional', 'Conditional'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Step identification
    step_key = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name="Step Key",
        help_text="Unique identifier for this step"
    )
    step_number = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        verbose_name="Step Number"
    )
    
    # Step metadata
    title = models.CharField(max_length=100, verbose_name="Step Title")
    description = models.TextField(verbose_name="Step Description")
    step_type = models.CharField(
        max_length=20,
        choices=STEP_TYPES,
        verbose_name="Step Type"
    )
    
    # Validation and requirements
    validation_type = models.CharField(
        max_length=15,
        choices=VALIDATION_TYPES,
        default='required',
        verbose_name="Validation Type"
    )
    required_fields = models.JSONField(
        default=list,
        verbose_name="Required Fields",
        help_text="List of required fields for this step"
    )
    validation_rules = models.JSONField(
        default=dict,
        verbose_name="Validation Rules",
        help_text="Custom validation rules for this step"
    )
    
    # Dependencies and conditions
    depends_on_steps = models.JSONField(
        default=list,
        verbose_name="Depends on Steps",
        help_text="List of step keys that must be completed before this step"
    )
    conditional_logic = models.JSONField(
        default=dict,
        verbose_name="Conditional Logic",
        help_text="Logic to determine if this step should be shown"
    )
    
    # UI/UX configuration
    estimated_duration_minutes = models.PositiveIntegerField(
        default=5,
        verbose_name="Estimated Duration (minutes)"
    )
    ui_config = models.JSONField(
        default=dict,
        verbose_name="UI Configuration",
        help_text="Frontend configuration for this step"
    )
    help_text = models.TextField(
        blank=True,
        verbose_name="Help Text",
        help_text="Additional help text for users"
    )
    
    # Status and ordering
    is_active = models.BooleanField(default=True, verbose_name="Is Active")
    is_skippable = models.BooleanField(default=False, verbose_name="Is Skippable")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Display Order")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'onboarding_step'
        ordering = ['display_order', 'step_number']
        verbose_name = 'Onboarding Step'
        verbose_name_plural = 'Onboarding Steps'
        
    def __str__(self):
        return f"Step {self.step_number}: {self.title}"
    
    def is_accessible_for_registration(self, registration):
        """
        Check if this step is accessible for a given user registration
        """
        # Check if all dependent steps are completed
        if self.depends_on_steps:
            completed_steps = registration.completed_steps or []
            for dep_step in self.depends_on_steps:
                if dep_step not in completed_steps:
                    return False
        
        # Check conditional logic if any
        if self.conditional_logic:
            # This would implement custom conditional logic
            # For now, we'll keep it simple
            pass
            
        return True
    
    def validate_step_data(self, data):
        """
        Validate the data provided for this step
        """
        errors = []
        
        # Check required fields
        for field in self.required_fields:
            if field not in data or not data[field]:
                errors.append(f"Field '{field}' is required for step '{self.step_key}'")
        
        # Apply custom validation rules
        for rule_key, rule_config in self.validation_rules.items():
            # Implement custom validation logic here
            pass
            
        return errors


class OnboardingProgress(models.Model):
    """
    Track detailed progress for each user registration through onboarding steps
    """
    STEP_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('skipped', 'Skipped'),
        ('failed', 'Failed'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relations
    user_registration = models.ForeignKey(
        'plans.UserRegistration',
        on_delete=models.CASCADE,
        related_name='progress_steps'
    )
    step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.CASCADE,
        related_name='progress_records'
    )
    
    # Progress tracking
    status = models.CharField(
        max_length=15,
        choices=STEP_STATUS_CHOICES,
        default='not_started'
    )
    completion_percentage = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name="Completion Percentage"
    )
    
    # Step data and validation
    step_data = models.JSONField(
        default=dict,
        verbose_name="Step Data",
        help_text="Data collected for this step"
    )
    validation_errors = models.JSONField(
        default=list,
        verbose_name="Validation Errors",
        help_text="Current validation errors for this step"
    )
    
    # Timing information
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Duration in Seconds"
    )
    
    # Error tracking
    error_count = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True, verbose_name="Last Error")
    last_error_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'onboarding_progress'
        unique_together = ['user_registration', 'step']
        ordering = ['step__display_order', 'step__step_number']
        verbose_name = 'Onboarding Progress'
        verbose_name_plural = 'Onboarding Progress Records'
        
    def __str__(self):
        return f"{self.user_registration.email} - {self.step.title} ({self.status})"
    
    def start_step(self):
        """Mark step as started"""
        if self.status == 'not_started':
            self.status = 'in_progress'
            self.started_at = timezone.now()
            self.save(update_fields=['status', 'started_at'])
    
    def complete_step(self, step_data=None):
        """Mark step as completed"""
        self.status = 'completed'
        self.completion_percentage = 100
        self.completed_at = timezone.now()
        
        if step_data:
            self.step_data = step_data
            
        if self.started_at:
            duration = timezone.now() - self.started_at
            self.duration_seconds = int(duration.total_seconds())
            
        self.save(update_fields=[
            'status', 'completion_percentage', 'completed_at', 
            'step_data', 'duration_seconds'
        ])
    
    def skip_step(self, reason=""):
        """Mark step as skipped"""
        if self.step.is_skippable:
            self.status = 'skipped'
            self.completion_percentage = 100  # Consider skipped as completed
            self.completed_at = timezone.now()
            
            if reason:
                self.step_data['skip_reason'] = reason
                
            self.save(update_fields=[
                'status', 'completion_percentage', 'completed_at', 'step_data'
            ])
            return True
        return False
    
    def fail_step(self, error_message):
        """Mark step as failed"""
        self.status = 'failed'
        self.error_count += 1
        self.last_error = error_message
        self.last_error_at = timezone.now()
        
        self.save(update_fields=[
            'status', 'error_count', 'last_error', 'last_error_at'
        ])
    
    def update_progress(self, percentage, data=None):
        """Update step progress"""
        self.completion_percentage = min(max(percentage, 0), 100)
        
        if data:
            self.step_data.update(data)
            
        if self.status == 'not_started':
            self.start_step()
        elif self.completion_percentage == 100 and self.status != 'completed':
            self.complete_step()
        else:
            self.status = 'in_progress'
            
        self.save(update_fields=['completion_percentage', 'step_data', 'status'])
    
    def validate_data(self):
        """Validate current step data"""
        errors = self.step.validate_step_data(self.step_data)
        self.validation_errors = errors
        self.save(update_fields=['validation_errors'])
        return len(errors) == 0
    
    @property
    def is_valid(self):
        """Check if current step data is valid"""
        return len(self.validation_errors) == 0
    
    @property
    def is_completed_or_skipped(self):
        """Check if step is completed or skipped"""
        return self.status in ['completed', 'skipped']


class OnboardingSession(models.Model):
    """
    Track onboarding sessions for analytics and debugging
    """
    SESSION_STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
        ('expired', 'Expired'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relations
    user_registration = models.ForeignKey(
        'plans.UserRegistration',
        on_delete=models.CASCADE,
        related_name='onboarding_sessions'
    )
    
    # Session tracking
    session_key = models.CharField(max_length=255, unique=True)
    status = models.CharField(
        max_length=15,
        choices=SESSION_STATUS_CHOICES,
        default='active'
    )
    
    # Progress summary
    current_step = models.ForeignKey(
        OnboardingStep,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='current_sessions'
    )
    completed_steps_count = models.PositiveIntegerField(default=0)
    total_steps_count = models.PositiveIntegerField(default=0)
    overall_progress_percentage = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Session metadata
    user_agent = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    referrer = models.URLField(blank=True)
    
    # Timing
    session_started_at = models.DateTimeField(auto_now_add=True)
    last_activity_at = models.DateTimeField(auto_now=True)
    session_ended_at = models.DateTimeField(null=True, blank=True)
    total_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    
    # Error tracking
    error_count = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    
    class Meta:
        db_table = 'onboarding_session'
        ordering = ['-session_started_at']
        verbose_name = 'Onboarding Session'
        verbose_name_plural = 'Onboarding Sessions'
        
    def __str__(self):
        return f"Session: {self.user_registration.email} ({self.status})"
    
    def update_progress(self):
        """Update session progress based on completed steps"""
        progress_steps = self.user_registration.progress_steps.all()
        completed_count = progress_steps.filter(
            status__in=['completed', 'skipped']
        ).count()
        total_count = progress_steps.count()
        
        self.completed_steps_count = completed_count
        self.total_steps_count = total_count
        
        if total_count > 0:
            self.overall_progress_percentage = int((completed_count / total_count) * 100)
        else:
            self.overall_progress_percentage = 0
            
        # Update current step
        current_step = progress_steps.filter(
            status='in_progress'
        ).first()
        
        if not current_step:
            # Find next available step
            current_step = progress_steps.filter(
                status='not_started'
            ).first()
            
        self.current_step = current_step.step if current_step else None
        
        self.save(update_fields=[
            'completed_steps_count', 'total_steps_count', 
            'overall_progress_percentage', 'current_step'
        ])
    
    def end_session(self, status='completed'):
        """End the onboarding session"""
        self.status = status
        self.session_ended_at = timezone.now()
        
        if self.session_started_at:
            duration = self.session_ended_at - self.session_started_at
            self.total_duration_seconds = int(duration.total_seconds())
            
        self.save(update_fields=[
            'status', 'session_ended_at', 'total_duration_seconds'
        ])
    
    def record_error(self, error_message):
        """Record an error in this session"""
        self.error_count += 1
        self.last_error = error_message
        self.save(update_fields=['error_count', 'last_error'])