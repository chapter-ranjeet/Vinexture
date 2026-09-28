from rest_framework import serializers
from .models import Certificate


class CertificateSerializer(serializers.ModelSerializer):
    candidate_email = serializers.EmailField(source='candidate.email', read_only=True)
    candidate_name = serializers.SerializerMethodField()

    def get_candidate_name(self, obj):
        return obj.candidate.get_full_name() or obj.candidate.username

    class Meta:
        model = Certificate
        fields = ['id', 'candidate', 'candidate_email', 'candidate_name', 'application', 'verification_code', 'issued_date', 'status', 'title', 'created_at']
        read_only_fields = ['id', 'verification_code', 'issued_date', 'created_at']
