from django.urls import path

from .views import AdminInterviewDetailView, AdminInterviewListCreateView

urlpatterns = [
    path('admin/interviews/', AdminInterviewListCreateView.as_view(), name='admin-interview-list'),
    path('admin/interviews/<int:pk>/', AdminInterviewDetailView.as_view(), name='admin-interview-detail'),
]
