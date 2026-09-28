from django.contrib import admin

from .models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'category', 'published', 'created_at')
    list_filter = ('published', 'category')
    search_fields = ('title', 'content')
    prepopulated_fields = {'slug': ('title',)}
