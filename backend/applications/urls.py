from django.urls import path

from .views import (
    ActiveDraftView,
    AdminApplicationDetailView,
    AdminApplicationListCreateView,
    ApplicationDetailView,
    ApplicationListCreateView,
    CandidatePrefillView,
)

urlpatterns = [
    path('admin/applications/', AdminApplicationListCreateView.as_view(), name='admin-application-list'),
    path('admin/applications/<int:pk>/', AdminApplicationDetailView.as_view(), name='admin-application-detail'),
    path('applications/', ApplicationListCreateView.as_view(), name='application-list'),
    path('applications/draft/', ActiveDraftView.as_view(), name='application-draft'),
    path('applications/prefill/', CandidatePrefillView.as_view(), name='application-prefill'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
]
