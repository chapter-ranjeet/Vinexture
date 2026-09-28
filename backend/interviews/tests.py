from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from applications.models import Application
from interviews.models import Interview
from internships.models import Internship


class InterviewAdminApiTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email='staff@example.com', username='staff', password='password', is_staff=True
        )
        self.candidate = User.objects.create_user(
            email='candidate@example.com', username='candidate', password='password'
        )
        internship = Internship.objects.create(
            title='Product intern', description='Build products', location='Remote'
        )
        self.application = Application.objects.create(user=self.candidate, internship=internship)
        self.url = reverse('admin-interview-list')

    def test_staff_can_create_list_and_update_interview(self):
        self.client.force_authenticate(self.staff)
        scheduled_at = timezone.now() + timedelta(days=2)
        response = self.client.post(self.url, {
            'application': self.application.id,
            'scheduled_at': scheduled_at.isoformat(),
            'meeting_link': 'https://meet.example.com/interview',
            'status': 'scheduled',
            'notes': 'Prepare portfolio review',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        interview = Interview.objects.get()
        self.assertEqual(response.data['applicant_email'], 'candidate@example.com')
        self.assertEqual(response.data['application_label'], f'APP-{self.application.id:05d}')

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 1)

        response = self.client.patch(
            reverse('admin-interview-detail', args=[interview.id]),
            {'status': 'completed', 'location': 'VINEXTURE HQ'},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        interview.refresh_from_db()
        self.assertEqual(interview.status, 'completed')
        self.assertEqual(interview.location, 'VINEXTURE HQ')

    def test_non_staff_cannot_access_interviews(self):
        self.client.force_authenticate(self.candidate)
        self.assertEqual(self.client.get(self.url).status_code, 403)
        self.assertEqual(self.client.post(self.url, {}, format='json').status_code, 403)
