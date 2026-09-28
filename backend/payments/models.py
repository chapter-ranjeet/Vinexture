from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models


class Payment(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_VERIFIED = 'verified'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_VERIFIED, 'Verified'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    application = models.ForeignKey(
        'applications.Application',
        on_delete=models.CASCADE,
        related_name='payments',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=255)  # Stores Transaction ID / Reference
    phone_number = models.CharField(max_length=30, blank=True)
    country = models.CharField(max_length=50, default='India', blank=True)
    currency = models.CharField(max_length=10, default='INR', blank=True)
    payment_method = models.CharField(max_length=30, default='upi_qr', blank=True)
    receipt = models.FileField(upload_to='payment_receipts/', blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_PENDING)
    rejection_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=Decimal('0.00')),
                name='payment_amount_positive',
            ),
        ]

    def clean(self):
        super().clean()
        if self.status == self.STATUS_REJECTED and not self.rejection_reason.strip():
            raise ValidationError({'rejection_reason': 'A rejection reason is required for rejected payments.'})
        if self.status != self.STATUS_REJECTED and self.rejection_reason.strip():
            raise ValidationError({'rejection_reason': 'Only rejected payments can have a rejection reason.'})

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # When payment status is updated to verified, transition application to submitted
        if self.status == self.STATUS_VERIFIED and self.application:
            app = self.application
            if app.status in ['draft', 'payment_pending']:
                app.status = 'submitted'
                app.is_draft = False
                app.save(update_fields=['status', 'is_draft', 'updated_at'])

    def __str__(self):
        return f'{self.reference} ({self.status}) - {self.phone_number}'
