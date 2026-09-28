from django.urls import path
from .views import (
    AdminEligibleApplicationsView,
    AdminOfferDetailView,
    AdminOfferIssueView,
    AdminOfferListCreateView,
    AdminOfferRevokeView,
    CandidateAcceptOfferView,
    CandidateMyOffersView,
    OfferPdfDownloadView,
    OfferVerificationView,
)

urlpatterns = [
    # Admin endpoints
    path('admin/offers/', AdminOfferListCreateView.as_view(), name='admin-offer-list'),
    path('admin/offers/eligible-applications/', AdminEligibleApplicationsView.as_view(), name='admin-eligible-applications'),
    path('admin/offers/<int:pk>/', AdminOfferDetailView.as_view(), name='admin-offer-detail'),
    path('admin/offers/<int:pk>/issue/', AdminOfferIssueView.as_view(), name='admin-offer-issue'),
    path('admin/offers/<int:pk>/revoke/', AdminOfferRevokeView.as_view(), name='admin-offer-revoke'),
    path('admin/offers/<int:pk>/pdf/', OfferPdfDownloadView.as_view(), name='admin-offer-pdf'),

    # Candidate Portal endpoints
    path('offers/my/', CandidateMyOffersView.as_view(), name='candidate-my-offers'),
    path('offers/<int:pk>/accept/', CandidateAcceptOfferView.as_view(), name='candidate-accept-offer'),
    path('offers/<int:pk>/pdf/', OfferPdfDownloadView.as_view(), name='candidate-offer-pdf'),

    # Public Verification endpoint
    path('offers/verify/<str:code>/', OfferVerificationView.as_view(), name='offer-verify'),
]
