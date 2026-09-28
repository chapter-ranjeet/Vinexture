from django.urls import path

from .views import AdminNotificationListView, NotificationListView, NotificationReadView

urlpatterns = [
    path("notifications/", NotificationListView.as_view(), name="notifications-list"),
    path("notifications/<int:pk>/read/", NotificationReadView.as_view(), name="notifications-read"),
    path("admin/notifications/", AdminNotificationListView.as_view(), name="admin-notifications"),
]
