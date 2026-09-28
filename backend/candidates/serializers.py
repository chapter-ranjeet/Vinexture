from rest_framework import serializers

from .models import CandidateProfile


class CandidateProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    resume_url = serializers.SerializerMethodField()

    def get_name(self, obj):
        full_name = obj.user.get_full_name()
        return full_name if full_name else obj.user.username

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

    def get_resume_url(self, obj):
        if obj.resume:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resume.url)
            return obj.resume.url
        return None

    class Meta:
        model = CandidateProfile
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'name',
            'avatar',
            'avatar_url',
            'phone',
            'qualification',
            'college_university',
            'course',
            'specialization',
            'semester_year',
            'graduation_year',
            'cgpa',
            'age',
            'dob',
            'gender',
            'nationality',
            'technical_skills',
            'other_skills',
            'projects',
            'experience',
            'certifications',
            'github_url',
            'linkedin_url',
            'portfolio_url',
            'preferred_mode',
            'availability',
            'headline',
            'bio',
            'resume',
            'resume_url',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'email', 'username', 'created_at', 'updated_at', 'avatar_url', 'resume_url']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if not ret.get('phone') and hasattr(instance, 'user') and instance.user.phone:
            ret['phone'] = instance.user.phone
        return ret

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        raw_full_name = self.initial_data.get('name') or self.initial_data.get('full_name')
        if raw_full_name and isinstance(raw_full_name, str):
            parts = raw_full_name.strip().split(' ', 1)
            instance.user.first_name = parts[0]
            instance.user.last_name = parts[1] if len(parts) > 1 else ''
            instance.user.save(update_fields=['first_name', 'last_name'])
        elif user_data:
            user = instance.user
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            user.save()

        if 'phone' in validated_data and validated_data['phone']:
            instance.user.phone = validated_data['phone']
            instance.user.save(update_fields=['phone'])

        return super().update(instance, validated_data)
