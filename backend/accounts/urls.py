from django.urls import path

from .views import ChangePasswordView, HealthView, RegisterView, UserProfileView

urlpatterns = [
    path('health/', HealthView.as_view(), name='accounts-health'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
