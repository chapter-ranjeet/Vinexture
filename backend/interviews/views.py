from django.db.models import Q
from rest_framework import generics, permissions

from .models import Interview
from .serializers import AdminInterviewSerializer


class AdminInterviewListCreateView(generics.ListCreateAPIView):
    serializer_class = AdminInterviewSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = Interview.objects.select_related(
            'application__user', 'application__internship'
        ).order_by('scheduled_at')
        query = self.request.query_params.get('search', '').strip()
        if query:
            queryset = queryset.filter(
                Q(application__user__email__icontains=query)
                | Q(application__user__first_name__icontains=query)
                | Q(application__user__last_name__icontains=query)
                | Q(application__internship__title__icontains=query)
                | Q(location__icontains=query)
            )
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset


class AdminInterviewDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = AdminInterviewSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = Interview.objects.select_related(
        'application__user', 'application__internship'
    ).all()
