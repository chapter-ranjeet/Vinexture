from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from applications.models import Application
from .models import Payment
from .serializers import AdminPaymentSerializer, PaymentSubmissionSerializer


class PaymentSubmissionView(generics.CreateAPIView):
    """Allows candidates to submit their payment transaction details."""
    serializer_class = PaymentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        payment = serializer.save()
        # Mark application as pending payment verification
        application = payment.application
        application.status = 'payment_pending'
        application.save(update_fields=['status', 'updated_at'])


class CandidatePaymentListView(generics.ListAPIView):
    """Allows candidates to view their own payments."""
    serializer_class = PaymentSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(application__user=self.request.user).order_by('-created_at')


class AdminPaymentListView(generics.ListAPIView):
    serializer_class = AdminPaymentSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = Payment.objects.select_related('application__user', 'application__internship').order_by('-created_at')
        query = self.request.query_params.get('search', '').strip()
        if query:
            queryset = queryset.filter(
                Q(reference__icontains=query)
                | Q(phone_number__icontains=query)
                | Q(application__application_number__icontains=query)
                | Q(application__user__email__icontains=query)
                | Q(application__user__username__icontains=query)
                | Q(application__full_name__icontains=query)
                | Q(application__internship__title__icontains=query)
            )
        status_param = self.request.query_params.get('status')
        if status_param in {choice[0] for choice in Payment.STATUS_CHOICES}:
            queryset = queryset.filter(status=status_param)
        return queryset


class AdminPaymentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminPaymentSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Payment.objects.select_related('application__user', 'application__internship')
