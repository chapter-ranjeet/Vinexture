from rest_framework import serializers

from analytics.models import AnalyticsEvent


class RecentActivitySerializer(serializers.ModelSerializer):
    label = serializers.CharField(source='event_name', read_only=True)

    class Meta:
        model = AnalyticsEvent
        fields = ('label', 'event_name', 'user_email', 'metadata', 'created_at')
