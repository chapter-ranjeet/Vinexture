from django.urls import path

from .views import AnalyticsEventDetailView, AnalyticsEventListCreateView

urlpatterns = [
    path('analytics/', AnalyticsEventListCreateView.as_view(), name='analytics-event-list'),
    path('analytics/<int:pk>/', AnalyticsEventDetailView.as_view(), name='analytics-event-detail'),
]
