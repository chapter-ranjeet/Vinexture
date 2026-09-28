from rest_framework import generics, permissions

from .models import AnalyticsEvent
from .serializers import AnalyticsEventSerializer


class AnalyticsEventListCreateView(generics.ListCreateAPIView):
    queryset = AnalyticsEvent.objects.all().order_by('-created_at')
    serializer_class = AnalyticsEventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class AnalyticsEventDetailView(generics.RetrieveDestroyAPIView):
    queryset = AnalyticsEvent.objects.all()
    serializer_class = AnalyticsEventSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
