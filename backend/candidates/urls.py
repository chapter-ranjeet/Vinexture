from django.urls import path

from .views import CandidateProfileAdminDetailView, CandidateProfileListCreateView, CandidateProfileView

urlpatterns = [
    path('candidates/', CandidateProfileListCreateView.as_view(), name='candidate-list'),
    path('candidates/me/', CandidateProfileView.as_view(), name='candidate-me'),
    path('candidates/<int:pk>/', CandidateProfileAdminDetailView.as_view(), name='candidate-admin-detail'),
]
