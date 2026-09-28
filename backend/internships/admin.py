from django.contrib import admin

from .models import Internship


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ('title', 'location', 'is_remote', 'published', 'starts_on')
    list_filter = ('published', 'is_remote')
    search_fields = ('title', 'description', 'location')
    prepopulated_fields = {'slug': ('title',)}
