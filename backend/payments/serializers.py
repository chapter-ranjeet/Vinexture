from rest_framework import serializers

from applications.models import Application
from .models import Payment


class PaymentSubmissionSerializer(serializers.ModelSerializer):
    """Candidate payment submission serializer."""
    receipt_url = serializers.SerializerMethodField()

    def get_receipt_url(self, obj):
        if obj.receipt:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt.url)
            return obj.receipt.url
        return None

    class Meta:
        model = Payment
        fields = [
            'id',
            'application',
            'amount',
            'reference',
            'phone_number',
            'country',
            'currency',
            'payment_method',
            'receipt',
            'receipt_url',
            'status',
            'rejection_reason',
            'created_at',
        ]
        read_only_fields = ['id', 'amount', 'currency', 'status', 'rejection_reason', 'created_at', 'receipt_url']

    def validate_reference(self, value):
        val = value.strip()
        if not val or len(val) < 4:
            raise serializers.ValidationError('Please provide a valid Transaction ID / Reference.')
        return val

    def validate_phone_number(self, value):
        val = value.strip()
        if not val or len(val) < 6:
            raise serializers.ValidationError('Please provide a valid payment phone number.')
        return val

    def validate(self, attrs):
        request = self.context.get('request')
        application = attrs.get('application')
        if not application:
            raise serializers.ValidationError({'application': 'Application is required.'})

        # Ensure the candidate owns the application
        if request and request.user and application.user != request.user:
            raise serializers.ValidationError({'application': 'You can only submit payment for your own application.'})

        # Check deadline
        if application.internship and not application.internship.is_open:
            raise serializers.ValidationError({
                'application': 'The deadline for this internship has passed. Payments cannot be accepted.'
            })

        # Automatically determine fee & currency based on country
        country = attrs.get('country', application.country or 'India').strip()
        internship = application.internship

        if country.lower() == 'nepal':
            attrs['amount'] = internship.nepal_application_fee if internship else 99.00
            attrs['currency'] = 'NPR'
            attrs['payment_method'] = attrs.get('payment_method') or 'esewa_qr'
        else:
            attrs['amount'] = internship.application_fee if internship else 99.00
            attrs['currency'] = 'INR'
            attrs['payment_method'] = attrs.get('payment_method') or 'upi_qr'

        return attrs


class AdminPaymentSerializer(serializers.ModelSerializer):
    applicant_email = serializers.EmailField(source='application.user.email', read_only=True)
    applicant_name = serializers.CharField(source='application.full_name', read_only=True)
    application_number = serializers.CharField(source='application.application_number', read_only=True)
    application_status = serializers.CharField(source='application.status', read_only=True)
    internship_title = serializers.CharField(source='application.internship.title', read_only=True, allow_null=True)
    receipt_url = serializers.SerializerMethodField()

    def get_receipt_url(self, obj):
        if obj.receipt:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.receipt.url)
            return obj.receipt.url
        return None

    class Meta:
        model = Payment
        fields = [
            'id',
            'application',
            'application_number',
            'applicant_email',
            'applicant_name',
            'application_status',
            'internship_title',
            'amount',
            'currency',
            'phone_number',
            'country',
            'payment_method',
            'reference',
            'receipt',
            'receipt_url',
            'status',
            'rejection_reason',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'application',
            'application_number',
            'applicant_email',
            'applicant_name',
            'application_status',
            'internship_title',
            'amount',
            'currency',
            'receipt_url',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):
        status = attrs.get('status', self.instance.status if self.instance else Payment.STATUS_PENDING)
        reason = attrs.get('rejection_reason', self.instance.rejection_reason if self.instance else '')
        if status == Payment.STATUS_REJECTED and not reason.strip():
            raise serializers.ValidationError({'rejection_reason': 'A rejection reason is required for rejected payments.'})
        if status != Payment.STATUS_REJECTED and reason.strip():
            raise serializers.ValidationError({'rejection_reason': 'Only rejected payments can have a rejection reason.'})
        return attrs

    def update(self, instance, validated_data):
        payment = super().update(instance, validated_data)
        # Automatic application progression upon verification
        if payment.status == Payment.STATUS_VERIFIED:
            app = payment.application
            if app.status in ['draft', 'payment_pending']:
                app.status = 'submitted'
                app.is_draft = False
                app.save(update_fields=['status', 'is_draft', 'updated_at'])
        elif payment.status == Payment.STATUS_REJECTED:
            app = payment.application
            if app.status == 'payment_pending':
                app.status = 'draft'
                app.save(update_fields=['status', 'updated_at'])
        return payment
