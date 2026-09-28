from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Internship(models.Model):
    TYPE_CHOICES = [
        ('remote', 'Remote'),
        ('onsite', 'On-site'),
        ('hybrid', 'Hybrid'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('closed', 'Closed'),
    ]

    # Details
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField()
    duration = models.CharField(max_length=80, blank=True, default='3 Months')
    internship_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='remote')
    category = models.CharField(max_length=100, blank=True, default='Technology')
    skills_required = models.TextField(blank=True)
    eligibility = models.TextField(blank=True)
    available_seats = models.PositiveIntegerField(default=10, blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    application_deadline = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published')

    # Backwards compatibility fields
    location = models.CharField(max_length=120, blank=True)
    is_remote = models.BooleanField(default=True)
    starts_on = models.DateField(null=True, blank=True)
    published = models.BooleanField(default=True)

    # Payment & QR configuration
    application_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('99.00'))
    nepal_application_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('99.00'))
    currency = models.CharField(max_length=10, default='INR')
    india_payment_qr = models.ImageField(upload_to='qr_codes/india/', blank=True, null=True)
    nepal_payment_qr = models.ImageField(upload_to='qr_codes/nepal/', blank=True, null=True)
    payment_instructions = models.TextField(
        blank=True,
        default='Scan the QR code to pay the application fee. Enter the Transaction ID and payment phone number to proceed.'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title) or 'internship'
            slug = base_slug
            counter = 1
            while Internship.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f'{base_slug}-{counter}'
                counter += 1
            self.slug = slug

        # Synchronize backward compatible fields
        self.published = (self.status == 'published')
        self.is_remote = (self.internship_type == 'remote')
        if self.start_date and not self.starts_on:
            self.starts_on = self.start_date
        elif self.starts_on and not self.start_date:
            self.start_date = self.starts_on

        super().save(*args, **kwargs)

    @property
    def is_open(self):
        if self.status != 'published':
            return False
        if self.application_deadline and timezone.now() > self.application_deadline:
            return False
        return True

    def __str__(self):
        return self.title


class Project(models.Model):
    """Configurable project template belonging to an Internship (up to 5 per internship)."""
    internship = models.ForeignKey(
        'internships.Internship',
        on_delete=models.CASCADE,
        related_name='projects',
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    instructions = models.TextField(blank=True)
    order = models.PositiveSmallIntegerField(default=1)  # 1 to 5
    default_days = models.PositiveIntegerField(default=7, help_text="Suggested project duration in days")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        constraints = [
            models.UniqueConstraint(fields=['internship', 'order'], name='unique_project_order_per_internship'),
            models.CheckConstraint(
                condition=models.Q(order__gte=1) & models.Q(order__lte=5),
                name='project_order_range_1_to_5',
            ),
        ]

    def __str__(self):
        return f"{self.internship.title} - Project {self.order}: {self.title}"


class ProjectAssignment(models.Model):
    """Assigned project with custom duration/deadline assigned by admin for an accepted intern."""
    STATUS_PENDING = 'pending'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_SUBMITTED = 'submitted'
    STATUS_REVIEWED = 'reviewed'
    STATUS_COMPLETED = 'completed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_SUBMITTED, 'Submitted'),
        (STATUS_REVIEWED, 'Reviewed'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='project_assignments',
    )
    project = models.ForeignKey(
        'internships.Project',
        on_delete=models.CASCADE,
        related_name='assignments',
    )
    assigned_start_date = models.DateField(null=True, blank=True)
    assigned_deadline = models.DateTimeField(null=True, blank=True)
    duration_days = models.PositiveIntegerField(default=7, help_text="Duration in days assigned by admin")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    github_url = models.URLField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    admin_feedback = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['project__order', 'id']
        constraints = [
            models.UniqueConstraint(fields=['application', 'project'], name='unique_project_assignment_per_application'),
        ]

    @property
    def is_overdue(self):
        if self.status in [self.STATUS_SUBMITTED, self.STATUS_REVIEWED, self.STATUS_COMPLETED]:
            return False
        if self.assigned_deadline and timezone.now() > self.assigned_deadline:
            return True
        return False

    def __str__(self):
        return f"App {self.application.application_number} -> {self.project.title} ({self.status})"


class ProjectSubmissionAudit(models.Model):
    """Audit history of project submissions and review status changes."""
    assignment = models.ForeignKey(
        'internships.ProjectAssignment',
        on_delete=models.CASCADE,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=60)
    previous_status = models.CharField(max_length=30, blank=True)
    new_status = models.CharField(max_length=30, blank=True)
    github_url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    actor_email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.assignment.id} - {self.action} at {self.created_at}"
