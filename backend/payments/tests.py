from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from applications.models import Application

from .models import Payment


class AdminPaymentApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.staff = User.objects.create_user(
            email='staff@example.com',
            username='staff',
            password='password',
            is_staff=True,
        )
        self.candidate = User.objects.create_user(
            email='candidate@example.com',
            username='candidate',
            password='password',
        )
        application = Application.objects.create(user=self.candidate)
        self.payment = Payment.objects.create(
            application=application,
            amount=Decimal('125.00'),
            reference='PAY-001',
        )

    def test_payment_endpoints_are_staff_only(self):
        self.client.force_authenticate(self.candidate)
        response = self.client.get('/api/admin/payments/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_list_and_update_payment_status(self):
        self.client.force_authenticate(self.staff)
        response = self.client.get('/api/admin/payments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['reference'], 'PAY-001')

        response = self.client.patch(
            f'/api/admin/payments/{self.payment.pk}/',
            {'status': Payment.STATUS_REJECTED, 'rejection_reason': 'Reference could not be verified.'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.STATUS_REJECTED)

    def test_rejected_payment_requires_reason(self):
        self.client.force_authenticate(self.staff)
        response = self.client.patch(
            f'/api/admin/payments/{self.payment.pk}/',
            {'status': Payment.STATUS_REJECTED},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
