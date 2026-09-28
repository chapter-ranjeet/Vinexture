import uuid

from django.conf import settings
from django.db import models


class Certificate(models.Model):
    STATUS_CHOICES = [('issued', 'Issued'), ('revoked', 'Revoked')]

    candidate = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    application = models.ForeignKey('applications.Application', on_delete=models.SET_NULL, related_name='certificates', null=True, blank=True)
    verification_code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    issued_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='issued')
    title = models.CharField(max_length=200, default='VINEXTURE Certificate')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-issued_date', '-created_at']

    def __str__(self):
        return f'{self.title} - {self.candidate.email}'
