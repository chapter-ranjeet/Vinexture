import re
from datetime import datetime, time, timedelta
from django.utils import timezone
from rest_framework import serializers

from .models import Internship, Project, ProjectAssignment, ProjectSubmissionAudit


def validate_github_repo_url(value):
    val = (value or '').strip()
    if not val:
        raise serializers.ValidationError('GitHub repository URL cannot be empty.')
    pattern = r'^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+.*$'
    if not re.match(pattern, val, re.IGNORECASE):
        raise serializers.ValidationError('Please provide a valid GitHub repository URL (e.g. https://github.com/username/repository).')
    return val


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = [
            'id',
            'internship',
            'title',
            'description',
            'instructions',
            'order',
            'default_days',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_order(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError('Project order must be between 1 and 5.')
        return value

    def validate(self, attrs):
        internship = attrs.get('internship', getattr(self.instance, 'internship', None))
        order = attrs.get('order', getattr(self.instance, 'order', None))

        if internship:
            # Check maximum 5 projects constraint
            existing = Project.objects.filter(internship=internship)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.count() >= 5 and not self.instance:
                raise serializers.ValidationError('An internship cannot have more than 5 projects.')
            if existing.filter(order=order).exists():
                raise serializers.ValidationError({'order': f'A project with order {order} already exists for this internship.'})

        return attrs


class InternshipSerializer(serializers.ModelSerializer):
    is_open = serializers.BooleanField(read_only=True)
    india_payment_qr_url = serializers.SerializerMethodField()
    nepal_payment_qr_url = serializers.SerializerMethodField()
    project_count = serializers.SerializerMethodField()

    class Meta:
        model = Internship
        fields = [
            'id',
            'title',
            'slug',
            'description',
            'duration',
            'internship_type',
            'category',
            'skills_required',
            'eligibility',
            'available_seats',
            'start_date',
            'starts_on',
            'application_deadline',
            'status',
            'location',
            'is_remote',
            'published',
            'is_open',
            'project_count',
            'application_fee',
            'nepal_application_fee',
            'currency',
            'india_payment_qr',
            'nepal_payment_qr',
            'india_payment_qr_url',
            'nepal_payment_qr_url',
            'payment_instructions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_open', 'project_count']

    def get_project_count(self, obj):
        return obj.projects.count()

    def get_india_payment_qr_url(self, obj):
        if obj.india_payment_qr:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.india_payment_qr.url)
            return obj.india_payment_qr.url
        return None

    def get_nepal_payment_qr_url(self, obj):
        if obj.nepal_payment_qr:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.nepal_payment_qr.url)
            return obj.nepal_payment_qr.url
        return None


class AdminInternshipSerializer(InternshipSerializer):
    """Staff serializer; includes nested configured projects for easy authoring."""
    projects = ProjectSerializer(many=True, read_only=True)

    class Meta(InternshipSerializer.Meta):
        fields = InternshipSerializer.Meta.fields + ['projects']
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_open', 'projects']

    def validate_available_seats(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Available seats cannot be negative.')
        return value

    def validate_application_fee(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Application fee cannot be negative.')
        return value

    def validate_nepal_application_fee(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Nepal application fee cannot be negative.')
        return value

    def validate_india_payment_qr(self, value):
        if value:
            if hasattr(value, 'size') and value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('India QR image size must be under 5MB.')
        return value

    def validate_nepal_payment_qr(self, value):
        if value:
            if hasattr(value, 'size') and value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('Nepal QR image size must be under 5MB.')
        return value


class ProjectAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for Accepted Candidates viewing and submitting their assigned projects."""
    project_order = serializers.IntegerField(source='project.order', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_description = serializers.CharField(source='project.description', read_only=True)
    project_instructions = serializers.CharField(source='project.instructions', read_only=True)
    internship_title = serializers.CharField(source='application.internship.title', read_only=True)
    application_number = serializers.CharField(source='application.application_number', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectAssignment
        fields = [
            'id',
            'application',
            'application_number',
            'project',
            'project_order',
            'project_title',
            'project_description',
            'project_instructions',
            'internship_title',
            'assigned_start_date',
            'assigned_deadline',
            'duration_days',
            'status',
            'github_url',
            'submitted_at',
            'admin_feedback',
            'reviewed_at',
            'is_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'application',
            'application_number',
            'project',
            'project_order',
            'project_title',
            'project_description',
            'project_instructions',
            'internship_title',
            'assigned_start_date',
            'assigned_deadline',
            'duration_days',
            'status',
            'submitted_at',
            'admin_feedback',
            'reviewed_at',
            'is_overdue',
            'created_at',
            'updated_at',
        ]

    def validate_github_url(self, value):
        return validate_github_repo_url(value)

    def validate(self, attrs):
        instance = self.instance
        if not instance:
            return attrs

        # Check deadline enforcement
        if instance.assigned_deadline and timezone.now() > instance.assigned_deadline:
            raise serializers.ValidationError('The assigned deadline for this project has passed. Project submissions are closed.')

        # Ensure application is accepted
        if instance.application.status != 'accepted':
            raise serializers.ValidationError('Only accepted interns can submit projects.')

        return attrs


class AdminProjectAssignmentSerializer(serializers.ModelSerializer):
    """Staff serializer for assigning deadlines, reviewing submissions, and setting completion."""
    project_order = serializers.IntegerField(source='project.order', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_description = serializers.CharField(source='project.description', read_only=True)
    project_instructions = serializers.CharField(source='project.instructions', read_only=True)
    applicant_name = serializers.CharField(source='application.full_name', read_only=True)
    applicant_email = serializers.EmailField(source='application.user.email', read_only=True)
    application_number = serializers.CharField(source='application.application_number', read_only=True)
    internship_title = serializers.CharField(source='application.internship.title', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectAssignment
        fields = [
            'id',
            'application',
            'application_number',
            'applicant_name',
            'applicant_email',
            'project',
            'project_order',
            'project_title',
            'project_description',
            'project_instructions',
            'internship_title',
            'assigned_start_date',
            'assigned_deadline',
            'duration_days',
            'status',
            'github_url',
            'submitted_at',
            'admin_feedback',
            'reviewed_at',
            'is_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'application',
            'application_number',
            'applicant_name',
            'applicant_email',
            'project',
            'project_order',
            'project_title',
            'project_description',
            'project_instructions',
            'internship_title',
            'is_overdue',
            'created_at',
            'updated_at',
        ]

    def update(self, instance, validated_data):
        prev_status = instance.status
        duration = validated_data.get('duration_days', instance.duration_days)
        start_date = validated_data.get('assigned_start_date', instance.assigned_start_date)

        # If admin changed duration or start_date without explicitly overriding deadline, compute it
        if ('duration_days' in validated_data or 'assigned_start_date' in validated_data) and 'assigned_deadline' not in validated_data:
            base_start = start_date or timezone.now().date()
            deadline_dt = datetime.combine(base_start + timedelta(days=duration), time(23, 59, 59))
            validated_data['assigned_deadline'] = timezone.make_aware(deadline_dt)

        new_status = validated_data.get('status', prev_status)
        if new_status in ['reviewed', 'completed'] and not instance.reviewed_at:
            validated_data['reviewed_at'] = timezone.now()

        assignment = super().update(instance, validated_data)

        # Create audit log
        request = self.context.get('request')
        actor = request.user.email if request and request.user else 'admin'
        action = f"status_changed_to_{new_status}" if new_status != prev_status else "assignment_updated"

        ProjectSubmissionAudit.objects.create(
            assignment=assignment,
            action=action,
            previous_status=prev_status,
            new_status=new_status,
            github_url=assignment.github_url,
            notes=assignment.admin_feedback,
            actor_email=actor,
        )

        return assignment
