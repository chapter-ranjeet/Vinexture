from django.utils.text import slugify
from rest_framework import serializers

from .models import CMSPage


class CMSPageSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = CMSPage
        fields = ['id', 'title', 'slug', 'content', 'is_published', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data.setdefault('slug', slugify(validated_data['title']))
        return super().create(validated_data)
