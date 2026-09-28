import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone


class Offer(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('issued', 'Issued'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('revoked', 'Revoked'),
        # Legacy status preserved
        ('sent', 'Sent (Legacy)'),
        ('declined', 'Declined (Legacy)'),
    ]

    MODE_CHOICES = [
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
        ('onsite', 'On-site'),
    ]

    application = models.OneToOneField(
        'applications.Application', on_delete=models.CASCADE, related_name='offer'
    )
    offer_letter_number = models.CharField(max_length=60, unique=True, blank=True)
    verification_code = models.CharField(max_length=64, unique=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='draft')

    # Populated fields
    candidate_name = models.CharField(max_length=150, blank=True)
    candidate_email = models.EmailField(blank=True)
    internship_title = models.CharField(max_length=200, blank=True)
    duration = models.CharField(max_length=80, default='4 Weeks', blank=True)
    mode = models.CharField(max_length=30, default='Remote', blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    stipend = models.CharField(max_length=100, default='Unpaid', blank=True)

    # Offer timeline
    issue_date = models.DateField(null=True, blank=True)
    acceptance_deadline = models.DateField(null=True, blank=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revocation_reason = models.TextField(blank=True)

    # Generated PDF
    pdf_file = models.FileField(upload_to='offer_letters/', null=True, blank=True)

    # Legacy fields preserved
    compensation = models.CharField(max_length=255, blank=True)
    details = models.TextField(blank=True)
    expires_at = models.DateField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.offer_letter_number or 'Offer'} - {self.candidate_name or self.application.user.email} ({self.status})"

    @classmethod
    def generate_next_offer_number(cls):
        year = timezone.now().year
        prefix = f"VIN-OL-{year}-"
        # Find highest sequence
        latest = cls.objects.filter(offer_letter_number__startswith=prefix).order_by('-offer_letter_number').first()
        if latest and latest.offer_letter_number:
            try:
                seq_str = latest.offer_letter_number.split('-')[-1]
                seq = int(seq_str) + 1
            except (ValueError, IndexError):
                seq = cls.objects.filter(offer_letter_number__startswith=prefix).count() + 1
        else:
            seq = 1
        return f"{prefix}{seq:06d}"

    @classmethod
    def generate_verification_code(cls):
        year = timezone.now().year
        unique_token = uuid.uuid4().hex[:10].upper()
        return f"VIN-VRF-{year}-{unique_token}"

    def check_expiration(self):
        """Automatically updates status to expired if acceptance deadline has passed."""
        if self.status == 'issued' and self.acceptance_deadline:
            if timezone.now().date() > self.acceptance_deadline:
                self.status = 'expired'
                if self.pk:
                    self.save(update_fields=['status', 'updated_at'])
                return True
        return False

    def generate_pdf(self, force=False):
        """Generates or regenerates the single-page A4 PDF and saves it to pdf_file."""
        from django.core.files.base import ContentFile
        from .pdf_generator import generate_offer_letter_pdf

        if self.pdf_file and not force:
            return self.pdf_file

        pdf_bytes = generate_offer_letter_pdf(self)
        filename = f"Offer_Letter_{self.offer_letter_number or self.id}.pdf"
        self.pdf_file.save(filename, ContentFile(pdf_bytes), save=False)
        self.save(update_fields=['pdf_file', 'updated_at'])
        return self.pdf_file

    def save(self, *args, **kwargs):
        if not self.offer_letter_number:
            self.offer_letter_number = self.generate_next_offer_number()
        if not self.verification_code:
            self.verification_code = self.generate_verification_code()

        # If acceptance_deadline is not set and issue_date is set, set to 2 days after issue
        if self.issue_date and not self.acceptance_deadline:
            self.acceptance_deadline = self.issue_date + timedelta(days=2)

        # Sync legacy compensation & expires_at
        if self.stipend and not self.compensation:
            self.compensation = self.stipend
        if self.acceptance_deadline and not self.expires_at:
            self.expires_at = self.acceptance_deadline

        super().save(*args, **kwargs)
