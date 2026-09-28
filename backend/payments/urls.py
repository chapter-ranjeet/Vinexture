from django.urls import path

from .views import (
    AdminPaymentDetailView,
    AdminPaymentListView,
    CandidatePaymentListView,
    PaymentSubmissionView,
)

urlpatterns = [
    path('payments/', CandidatePaymentListView.as_view(), name='payment-list'),
    path('payments/submit/', PaymentSubmissionView.as_view(), name='payment-submit'),
    path('admin/payments/', AdminPaymentListView.as_view(), name='admin-payment-list'),
    path('admin/payments/<int:pk>/', AdminPaymentDetailView.as_view(), name='admin-payment-detail'),
]
