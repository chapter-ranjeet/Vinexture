from django.urls import path

from .views import (
    AdminApplicationProjectAssignView,
    AdminInternshipDetailView,
    AdminInternshipListCreateView,
    AdminProjectAssignmentDetailView,
    AdminProjectAssignmentListView,
    AdminProjectDetailView,
    AdminProjectListCreateView,
    CandidateProjectAssignmentListView,
    CandidateProjectSubmitView,
    InternshipDetailView,
    InternshipListCreateView,
)

urlpatterns = [
    # Internship Public & Staff endpoints
    path('internships/', InternshipListCreateView.as_view(), name='internship-list'),
    path('internships/<slug:slug>/', InternshipDetailView.as_view(), name='internship-detail'),
    path('admin/internships/', AdminInternshipListCreateView.as_view(), name='admin-internship-list'),
    path('admin/internships/<slug:slug>/', AdminInternshipDetailView.as_view(), name='admin-internship-detail'),

    # Admin Project Configuration (Up to 5 Projects per Internship)
    path('admin/internships/<int:internship_id>/projects/', AdminProjectListCreateView.as_view(), name='admin-internship-project-list'),
    path('admin/projects/', AdminProjectListCreateView.as_view(), name='admin-project-list'),
    path('admin/projects/<int:pk>/', AdminProjectDetailView.as_view(), name='admin-project-detail'),

    # Candidate Project Portal (Only for Accepted Interns)
    path('projects/my-projects/', CandidateProjectAssignmentListView.as_view(), name='candidate-my-projects'),
    path('projects/assignments/<int:pk>/submit/', CandidateProjectSubmitView.as_view(), name='candidate-project-submit'),

    # Admin Assigned Projects & Deadlines
    path('admin/assignments/', AdminProjectAssignmentListView.as_view(), name='admin-assignment-list'),
    path('admin/assignments/<int:pk>/', AdminProjectAssignmentDetailView.as_view(), name='admin-assignment-detail'),
    path('admin/applications/<int:app_id>/assign-projects/', AdminApplicationProjectAssignView.as_view(), name='admin-application-assign-projects'),
]
