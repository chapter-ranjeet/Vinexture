import os
from rest_framework import serializers

from internships.serializers import InternshipSerializer
from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    internship_title = serializers.CharField(source='internship.title', read_only=True)
    internship_data = InternshipSerializer(source='internship', read_only=True)
    resume_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    latest_payment = serializers.SerializerMethodField()

    class Meta:
        model = Application
        fields = [
            'id',
            'application_number',
            'user',
            'internship',
            'internship_title',
            'internship_data',
            'status',
            'current_step',
            'is_draft',
            # 1. Personal
            'full_name',
            'email',
            'phone',
            'country',
            'dob',
            'gender',
            # 2. Education
            'qualification',
            'college_university',
            'course',
            'specialization',
            'semester_year',
            'graduation_year',
            'cgpa',
            # 3. Skills & Experience
            'technical_skills',
            'other_skills',
            'projects',
            'experience',
            'certifications',
            # 4. Documents
            'resume',
            'resume_url',
            'github_url',
            'linkedin_url',
            'portfolio_url',
            # 5. Internship Preferences
            'preferred_mode',
            'availability',
            'expected_start_date',
            'why_join',
            'learning_expectations',
            'cover_letter',
            'latest_payment',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'application_number',
            'user',
            'status',
            'created_at',
            'updated_at',
            'internship_title',
            'internship_data',
            'latest_payment',
        ]

    def get_resume_url(self, obj):
        if getattr(obj, 'resume_url', None) and str(obj.resume_url).strip():
            return str(obj.resume_url).strip()
        if getattr(obj, 'resume', None):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['resume_url'] = self.get_resume_url(instance)
        return ret

    def get_latest_payment(self, obj):
        payment = obj.payments.order_by('-created_at').first()
        if not payment:
            return None
        receipt_url = None
        if payment.receipt:
            request = self.context.get('request')
            if request:
                receipt_url = request.build_absolute_uri(payment.receipt.url)
            else:
                receipt_url = payment.receipt.url
        return {
            'id': payment.id,
            'amount': str(payment.amount),
            'currency': payment.currency,
            'reference': payment.reference,
            'phone_number': payment.phone_number,
            'payment_method': payment.payment_method,
            'status': payment.status,
            'rejection_reason': payment.rejection_reason,
            'receipt_url': receipt_url,
            'created_at': payment.created_at,
        }

    def validate_resume(self, value):
        if value:
            # Check extension
            ext = os.path.splitext(value.name)[1].lower()
            if ext != '.pdf':
                raise serializers.ValidationError('Only PDF documents are allowed for resume upload.')
            # Check maximum size (10 MB)
            if hasattr(value, 'size') and value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError('Resume PDF must be less than 10MB.')
        return value

    def validate(self, attrs):
        internship = attrs.get('internship', getattr(self.instance, 'internship', None))
        request = self.context.get('request')

        # Deadline and availability validation
        if internship:
            if not internship.is_open:
                # If creating or moving beyond draft, strictly forbid
                is_submitting = not attrs.get('is_draft', getattr(self.instance, 'is_draft', True))
                if not self.instance or is_submitting:
                    raise serializers.ValidationError({
                        'internship': 'The application deadline for this internship has passed or it is no longer accepting applications.'
                    })

        # Prevent duplicate submitted applications for the same user & internship
        if request and request.user and request.user.is_authenticated and internship:
            existing = Application.objects.filter(user=request.user, internship=internship)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            existing_active = existing.filter(status__in=['submitted', 'screening', 'interview', 'accepted']).first()
            if existing_active:
                raise serializers.ValidationError({
                    'internship': f'You have already submitted an active application ({existing_active.application_number}) for this internship.'
                })

        return attrs


class AdminApplicationSerializer(ApplicationSerializer):
    """Staff serializer, with full applicant details and status change permissions."""

    applicant_email = serializers.EmailField(source='user.email', read_only=True)
    applicant_name = serializers.SerializerMethodField()

    class Meta(ApplicationSerializer.Meta):
        read_only_fields = ['id', 'application_number', 'created_at', 'updated_at']
        fields = ApplicationSerializer.Meta.fields + ['applicant_email', 'applicant_name']

    def get_applicant_name(self, obj):
        return obj.full_name or obj.user.get_full_name() or obj.user.username
