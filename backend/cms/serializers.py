from django.utils.text import slugify
from rest_framework import serializers

from .models import CMSAnnouncement, CMSFaq, CMSPage, CMSSiteSetting


class CMSPageSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(required=False)

    class Meta:
        model = CMSPage
        fields = ['id', 'title', 'slug', 'excerpt', 'content', 'is_published', 'created_at', 'updated_at']

    def create(self, validated_data):
        if not validated_data.get('slug'):
            base_slug = slugify(validated_data.get('title', 'page')) or 'page'
            slug = base_slug
            counter = 1
            while CMSPage.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            validated_data['slug'] = slug
        return super().create(validated_data)


class CMSAnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMSAnnouncement
        fields = [
            'id',
            'title',
            'message',
            'badge',
            'link_url',
            'banner_type',
            'is_active',
            'created_at',
            'updated_at',
        ]


class CMSFaqSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMSFaq
        fields = [
            'id',
            'question',
            'answer',
            'category',
            'order',
            'is_published',
            'created_at',
        ]


class CMSSiteSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = CMSSiteSetting
        fields = ['id', 'key', 'value', 'label', 'description', 'updated_at']

