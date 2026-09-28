from rest_framework import serializers

from .models import Interview


class AdminInterviewSerializer(serializers.ModelSerializer):
    application_label = serializers.SerializerMethodField()
    applicant_name = serializers.SerializerMethodField()
    applicant_email = serializers.EmailField(source='application.user.email', read_only=True)
    internship_title = serializers.CharField(source='application.internship.title', read_only=True, allow_null=True)

    class Meta:
        model = Interview
        fields = [
            'id', 'application', 'application_label', 'applicant_name', 'applicant_email',
            'internship_title', 'scheduled_at', 'meeting_link', 'location', 'status',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'application_label', 'applicant_name', 'applicant_email',
            'internship_title', 'created_at', 'updated_at',
        ]

    def get_application_label(self, obj):
        return f'APP-{obj.application_id:05d}'

    def get_applicant_name(self, obj):
        user = obj.application.user
        return user.get_full_name() or user.username or user.email
