from django.apps import apps
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from analytics.models import AnalyticsEvent
from applications.models import Application
from candidates.models import CandidateProfile
from internships.models import Internship

from .serializers import RecentActivitySerializer


def _model_for(app_label, model_name):
    try:
        return apps.get_model(app_label, model_name)
    except LookupError:
        return None


def _first_field(model, names):
    field_names = {field.name for field in model._meta.get_fields()}
    return next((name for name in names if name in field_names), None)


class AdminOverviewView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        user_model = get_user_model()
        status_counts = {
            item['status']: item['count']
            for item in Application.objects.values('status').annotate(count=Count('id'))
        }
        status_counts = {
            status: status_counts.get(status, 0)
            for status, _ in Application.STATUS_CHOICES
        }
        published_internships = Internship.objects.filter(published=True).count()
        applications = Application.objects.count()

        data = {
            'users': user_model.objects.count(),
            'candidates': CandidateProfile.objects.count(),
            'published_internships': published_internships,
            'internships': published_internships,
            'applications': applications,
            'pending_applications': sum(
                status_counts.get(status, 0)
                for status in ('submitted', 'screening')
            ),
            'applications_by_status': status_counts,
            'recent_activity': RecentActivitySerializer(
                AnalyticsEvent.objects.order_by('-created_at')[:10],
                many=True,
            ).data,
        }

        interview_model = _model_for('interviews', 'Interview')
        if interview_model:
            date_field = _first_field(
                interview_model,
                ('scheduled_at', 'starts_at', 'start_time', 'interview_date', 'date'),
            )
            interviews = interview_model.objects.all()
            if date_field:
                interviews = interviews.filter(**{f'{date_field}__gte': timezone.now()})
            data['upcoming_interviews'] = interviews.count()

        selection_model = _model_for('selections', 'Selection')
        if selection_model:
            data['selected_candidates'] = selection_model.objects.count()

        certificate_model = _model_for('certificates', 'Certificate')
        if certificate_model:
            data['certificates'] = certificate_model.objects.count()

        return Response(data)
