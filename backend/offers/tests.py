from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from applications.models import Application
from internships.models import Internship
from .models import Offer


class OfferApiTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.staff = User.objects.create_user(username='staff', email='staff@test.com', password='pass', is_staff=True)
        self.user = User.objects.create_user(username='candidate', email='candidate@test.com', password='pass')
        internship = Internship.objects.create(title='Python', slug='python', description='x')
        self.application = Application.objects.create(user=self.user, internship=internship)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(self.staff).access_token}')

    def test_staff_can_create_and_list_offer(self):
        response = self.client.post('/api/admin/offers/', {'application': self.application.id, 'compensation': '₹20,000', 'status': 'sent'}, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.client.get('/api/admin/offers/').status_code, 200)

    def test_non_staff_is_denied(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(self.user).access_token}')
        self.assertEqual(self.client.get('/api/admin/offers/').status_code, 403)
