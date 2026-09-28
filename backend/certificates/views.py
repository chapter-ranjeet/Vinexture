from django.db.models import Q
from rest_framework import generics, permissions
from .models import Certificate
from .serializers import CertificateSerializer


class AdminCertificateListCreateView(generics.ListCreateAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = Certificate.objects.select_related('candidate', 'application')
        query = self.request.query_params.get('search', '').strip()
        if query:
            queryset = queryset.filter(Q(candidate__email__icontains=query) | Q(candidate__first_name__icontains=query) | Q(candidate__last_name__icontains=query) | Q(verification_code__icontains=query))
        status = self.request.query_params.get('status')
        if status in dict(Certificate.STATUS_CHOICES):
            queryset = queryset.filter(status=status)
        return queryset


class AdminCertificateDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Certificate.objects.select_related('candidate', 'application')


class CertificateVerificationView(generics.RetrieveAPIView):
    serializer_class = CertificateSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'verification_code'
    queryset = Certificate.objects.select_related('candidate', 'application').filter(status='issued')
