from django.db.models import Q
from rest_framework import generics, permissions

from .models import Notification
from .serializers import AdminNotificationSerializer, NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class NotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    def perform_update(self, serializer):
        serializer.save(is_read=True)


class AdminNotificationListView(generics.ListCreateAPIView):
    serializer_class = AdminNotificationSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        queryset = Notification.objects.select_related("recipient")
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(message__icontains=search) | Q(recipient__email__icontains=search))
        return queryset
