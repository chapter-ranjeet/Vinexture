from datetime import date, timedelta
from rest_framework import serializers
from django.utils import timezone
from .models import Offer
from applications.models import Application


class OfferSerializer(serializers.ModelSerializer):
    applicant_email = serializers.EmailField(source='application.user.email', read_only=True)
    applicant_name = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    verification_url = serializers.SerializerMethodField()
    can_accept = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    application_status = serializers.CharField(source='application.status', read_only=True)

    def get_applicant_name(self, obj):
        return obj.candidate_name or obj.application.user.get_full_name() or obj.application.user.username

    def get_pdf_url(self, obj):
        request = self.context.get('request')
        if obj.pdf_file:
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return f"/api/offers/{obj.id}/pdf/"

    def get_verification_url(self, obj):
        request = self.context.get('request')
        path = f"/offers/verify/{obj.verification_code}"
        if request:
            # Point to frontend origin if available or host
            return request.build_absolute_uri(path)
        return path

    def get_can_accept(self, obj):
        obj.check_expiration()
        return obj.status == 'issued' and (
            not obj.acceptance_deadline or timezone.now().date() <= obj.acceptance_deadline
        )

    def get_is_expired(self, obj):
        return obj.check_expiration() or obj.status == 'expired'

    class Meta:
        model = Offer
        fields = [
            'id',
            'application',
            'application_status',
            'applicant_email',
            'applicant_name',
            'candidate_name',
            'candidate_email',
            'internship_title',
            'duration',
            'mode',
            'start_date',
            'end_date',
            'stipend',
            'offer_letter_number',
            'verification_code',
            'status',
            'issue_date',
            'acceptance_deadline',
            'accepted_at',
            'revoked_at',
            'revocation_reason',
            'pdf_url',
            'verification_url',
            'can_accept',
            'is_expired',
            'compensation',
            'details',
            'expires_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'offer_letter_number',
            'verification_code',
            'accepted_at',
            'revoked_at',
            'pdf_url',
            'verification_url',
            'can_accept',
            'is_expired',
            'created_at',
            'updated_at',
        ]


class OfferCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = [
            'application',
            'candidate_name',
            'candidate_email',
            'internship_title',
            'duration',
            'mode',
            'start_date',
            'end_date',
            'stipend',
            'issue_date',
            'acceptance_deadline',
            'status',
        ]

    def validate_application(self, application):
        if application.status != 'accepted':
            raise serializers.ValidationError(
                f"Offer letters can only be generated for SELECTED / ACCEPTED candidates. Current status: '{application.status}'."
            )
        # Check if an offer already exists
        if hasattr(application, 'offer') and application.offer:
            raise serializers.ValidationError(
                f"An offer letter ({application.offer.offer_letter_number}) already exists for this application."
            )
        return application

    def create(self, validated_data):
        app = validated_data['application']
        user = app.user
        internship = app.internship

        # Auto-populate if missing
        if not validated_data.get('candidate_name'):
            validated_data['candidate_name'] = app.full_name or user.get_full_name() or user.username
        if not validated_data.get('candidate_email'):
            validated_data['candidate_email'] = app.email or user.email
        if not validated_data.get('internship_title'):
            validated_data['internship_title'] = internship.title if internship else 'Software Development'
        if not validated_data.get('duration'):
            duration_val = getattr(internship, 'duration', '') if internship else ''
            validated_data['duration'] = duration_val or '4 Weeks'
        if not validated_data.get('mode'):
            mode_val = app.preferred_mode or (getattr(internship, 'mode', '') if internship else '')
            validated_data['mode'] = (mode_val.title() if mode_val else 'Remote')
        if not validated_data.get('stipend'):
            stipend_val = getattr(internship, 'stipend', '') if internship else ''
            validated_data['stipend'] = stipend_val or 'Unpaid'

        # Set default start_date (e.g. next Monday) if not specified
        today = timezone.now().date()
        if not validated_data.get('start_date'):
            days_ahead = 7 - today.weekday()
            if days_ahead <= 0:
                days_ahead += 7
            default_start = today + timedelta(days=days_ahead)
            validated_data['start_date'] = default_start
            if not validated_data.get('end_date'):
                validated_data['end_date'] = default_start + timedelta(weeks=4)

        # Status: if set to 'issued', issue_date = today, deadline = today + 2 days
        initial_status = validated_data.get('status', 'draft')
        if initial_status == 'issued':
            if not validated_data.get('issue_date'):
                validated_data['issue_date'] = today
            if not validated_data.get('acceptance_deadline'):
                validated_data['acceptance_deadline'] = today + timedelta(days=2)

        offer = Offer.objects.create(**validated_data)
        # Generate the PDF immediately
        try:
            offer.generate_pdf(force=True)
        except Exception as e:
            # Don't fail creation if pdf generation has a transient issue
            pass
        return offer


class OfferVerificationSerializer(serializers.ModelSerializer):
    is_valid = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    def get_is_valid(self, obj):
        obj.check_expiration()
        return obj.status in ['issued', 'accepted']

    def get_status_label(self, obj):
        return obj.get_status_display()

    class Meta:
        model = Offer
        fields = [
            'offer_letter_number',
            'verification_code',
            'candidate_name',
            'candidate_email',
            'internship_title',
            'duration',
            'mode',
            'start_date',
            'end_date',
            'stipend',
            'issue_date',
            'acceptance_deadline',
            'accepted_at',
            'status',
            'status_label',
            'is_valid',
        ]
