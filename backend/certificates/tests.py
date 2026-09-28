from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Certificate


class CertificateApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.staff = User.objects.create_user(username='staff', email='staff@test.com', password='pass', is_staff=True)
        self.candidate = User.objects.create_user(username='candidate', email='candidate@test.com', password='pass')
        self.certificate = Certificate.objects.create(candidate=self.candidate, title='Internship completion')

    def test_public_verification_returns_issued_certificate(self):
        response = self.client.get(f'/api/certificates/verify/{self.certificate.verification_code}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['candidate_email'], self.candidate.email)

    def test_admin_endpoint_requires_staff(self):
        self.assertEqual(self.client.get('/api/admin/certificates/').status_code, 401)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(self.staff).access_token}')
        self.assertEqual(self.client.get('/api/admin/certificates/').status_code, 200)
