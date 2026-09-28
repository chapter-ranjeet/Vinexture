from django.urls import path
from .views import AdminCertificateDetailView, AdminCertificateListCreateView, CertificateVerificationView

urlpatterns = [
    path('admin/certificates/', AdminCertificateListCreateView.as_view(), name='admin-certificate-list'),
    path('admin/certificates/<int:pk>/', AdminCertificateDetailView.as_view(), name='admin-certificate-detail'),
    path('certificates/verify/<uuid:verification_code>/', CertificateVerificationView.as_view(), name='certificate-verify'),
]
