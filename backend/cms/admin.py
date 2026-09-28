from django.contrib import admin

from .models import CMSAnnouncement, CMSFaq, CMSPage, CMSSiteSetting


@admin.register(CMSPage)
class CMSPageAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'is_published', 'created_at', 'updated_at')
    prepopulated_fields = {'slug': ('title',)}
    list_filter = ('is_published',)
    search_fields = ('title', 'content')


@admin.register(CMSAnnouncement)
class CMSAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'badge', 'banner_type', 'is_active', 'created_at')
    list_filter = ('banner_type', 'is_active')
    search_fields = ('title', 'message')


@admin.register(CMSFaq)
class CMSFaqAdmin(admin.ModelAdmin):
    list_display = ('question', 'category', 'order', 'is_published')
    list_filter = ('category', 'is_published')
    search_fields = ('question', 'answer')


@admin.register(CMSSiteSetting)
class CMSSiteSettingAdmin(admin.ModelAdmin):
    list_display = ('key', 'label', 'value', 'updated_at')
    search_fields = ('key', 'value', 'description')

