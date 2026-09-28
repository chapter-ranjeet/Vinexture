from django.db import models


class AnalyticsEvent(models.Model):
    event_name = models.CharField(max_length=120)
    user_email = models.EmailField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.event_name
