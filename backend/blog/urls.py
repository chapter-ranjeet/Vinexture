from django.urls import path

from .views import BlogPostDetailView, BlogPostListCreateView

urlpatterns = [
    path('posts/', BlogPostListCreateView.as_view(), name='blog-post-list'),
    path('posts/<slug:slug>/', BlogPostDetailView.as_view(), name='blog-post-detail'),
]
