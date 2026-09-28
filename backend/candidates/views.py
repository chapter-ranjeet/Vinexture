from rest_framework import generics, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import CandidateProfile
from .serializers import CandidateProfileSerializer


class CandidateProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self):
        profile, _ = CandidateProfile.objects.get_or_create(user=self.request.user)
        return profile


class CandidateProfileListCreateView(generics.ListAPIView):
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        if self.request.user.is_staff:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            candidate_users = User.objects.filter(is_staff=False)
            for u in candidate_users:
                CandidateProfile.objects.get_or_create(user=u)
            return CandidateProfile.objects.select_related('user').all().order_by('-created_at')
        return CandidateProfile.objects.filter(user=self.request.user)


class CandidateProfileAdminDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = CandidateProfileSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = CandidateProfile.objects.select_related('user').all()
