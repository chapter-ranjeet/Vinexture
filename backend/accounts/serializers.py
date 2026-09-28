from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name', 'role', 'phone', 'is_verified', 'is_staff']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'first_name', 'last_name', 'phone', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        username = validated_data.get('username')
        if not username:
            email = validated_data.get('email', '')
            base = email.split('@')[0] if email else 'user'
            candidate_username = base
            counter = 1
            while User.objects.filter(username=candidate_username).exists():
                candidate_username = f"{base}{counter}"
                counter += 1
            validated_data['username'] = candidate_username

        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

