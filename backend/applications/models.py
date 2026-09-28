from django.conf import settings
from django.db import models
from django.utils import timezone


class Application(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('payment_pending', 'Payment Pending Verification'),
        ('submitted', 'Submitted'),
        ('screening', 'Screening'),
        ('interview', 'Interview'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    MODE_CHOICES = [
        ('remote', 'Remote'),
        ('onsite', 'On-site'),
        ('hybrid', 'Hybrid'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    application_number = models.CharField(max_length=40, unique=True, blank=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications')
    internship = models.ForeignKey('internships.Internship', on_delete=models.CASCADE, related_name='applications', null=True, blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='draft')
    current_step = models.PositiveSmallIntegerField(default=1)
    is_draft = models.BooleanField(default=True)

    # 1. Personal Information
    full_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    country = models.CharField(max_length=60, default='India', blank=True)
    dob = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=30, blank=True)

    # 2. Education
    qualification = models.CharField(max_length=100, blank=True)
    college_university = models.CharField(max_length=200, blank=True)
    course = models.CharField(max_length=150, blank=True)
    specialization = models.CharField(max_length=150, blank=True)
    semester_year = models.CharField(max_length=50, blank=True)
    graduation_year = models.CharField(max_length=20, blank=True)
    cgpa = models.CharField(max_length=30, blank=True)

    # 3. Skills & Experience
    technical_skills = models.TextField(blank=True)
    other_skills = models.TextField(blank=True)
    projects = models.TextField(blank=True)
    experience = models.TextField(blank=True)
    certifications = models.TextField(blank=True)

    # 4. Documents
    resume = models.FileField(upload_to='applications/resumes/', blank=True, null=True)
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)

    # 5. Internship Preferences
    preferred_mode = models.CharField(max_length=30, choices=MODE_CHOICES, default='remote', blank=True)
    availability = models.CharField(max_length=100, blank=True)
    expected_start_date = models.DateField(null=True, blank=True)
    why_join = models.TextField(blank=True)
    learning_expectations = models.TextField(blank=True)

    # Legacy cover letter field preserved
    cover_letter = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def generate_application_number(self):
        year = timezone.now().year
        prefix = f"VIN-INT-{year}"
        # Determine next sequence
        seq = self.id or 1
        return f"{prefix}-{str(seq).zfill(6)}"

    def init_project_assignments(self):
        """Automatically provisions project assignments for accepted candidates."""
        if self.status == 'accepted' and self.internship:
            from internships.models import ProjectAssignment
            projects = self.internship.projects.all().order_by('order')
            now = timezone.now()
            start_d = now.date()

            for project in projects:
                if not self.project_assignments.filter(project=project).exists():
                    duration = project.default_days or 7
                    deadline = now + timezone.timedelta(days=duration)
                    ProjectAssignment.objects.create(
                        application=self,
                        project=project,
                        assigned_start_date=start_d,
                        assigned_deadline=deadline,
                        duration_days=duration,
                        status=ProjectAssignment.STATUS_IN_PROGRESS if project.order == 1 else ProjectAssignment.STATUS_PENDING,
                    )

    def save(self, *args, **kwargs):
        if not self.pk:
            super().save(*args, **kwargs)
            if not self.application_number:
                self.application_number = self.generate_application_number()
                Application.objects.filter(pk=self.pk).update(application_number=self.application_number)
            if self.status == 'accepted':
                self.init_project_assignments()
            return

        if not self.application_number:
            self.application_number = self.generate_application_number()

        super().save(*args, **kwargs)
        if self.status == 'accepted':
            self.init_project_assignments()

    def __str__(self):
        return f"{self.application_number or 'APP'} - {self.full_name or self.user.email} -> {self.internship.title if self.internship else 'General'}"

