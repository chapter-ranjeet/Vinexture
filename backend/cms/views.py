from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CMSAnnouncement, CMSFaq, CMSPage, CMSSiteSetting
from .serializers import (
    CMSAnnouncementSerializer,
    CMSFaqSerializer,
    CMSPageSerializer,
    CMSSiteSettingSerializer,
)


class CMSPageListCreateView(generics.ListCreateAPIView):
    serializer_class = CMSPageSerializer

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated and self.request.user.is_staff:
            return CMSPage.objects.all().order_by('-created_at')
        return CMSPage.objects.filter(is_published=True).order_by('title')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CMSPageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CMSPageSerializer

    def get_object(self):
        lookup = self.kwargs.get('slug', '')
        if str(lookup).isdigit():
            obj = CMSPage.objects.filter(id=int(lookup)).first()
            if obj:
                return obj
        return get_object_or_404(CMSPage, slug=lookup)

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated and self.request.user.is_staff:
            return CMSPage.objects.all()
        return CMSPage.objects.filter(is_published=True)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CMSAnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = CMSAnnouncementSerializer

    def get_queryset(self):
        if self.request.user and self.request.user.is_authenticated and self.request.user.is_staff:
            return CMSAnnouncement.objects.all().order_by('-created_at')
        return CMSAnnouncement.objects.filter(is_active=True).order_by('-created_at')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CMSAnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CMSAnnouncementSerializer
    queryset = CMSAnnouncement.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CMSFaqListCreateView(generics.ListCreateAPIView):
    serializer_class = CMSFaqSerializer

    def get_queryset(self):
        category = self.request.query_params.get('category')
        qs = CMSFaq.objects.all()
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.is_staff):
            qs = qs.filter(is_published=True)
        if category:
            qs = qs.filter(category=category)
        return qs.order_by('order', 'id')

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CMSFaqDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CMSFaqSerializer
    queryset = CMSFaq.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CMSSiteSettingView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    def get(self, request):
        settings_qs = CMSSiteSetting.objects.all()
        data = {s.key: s.value for s in settings_qs}
        return Response(data)

    def post(self, request):
        data = request.data
        if not isinstance(data, dict):
            return Response({'error': 'Expected JSON key-value object'}, status=status.HTTP_400_BAD_REQUEST)
        for key, value in data.items():
            CMSSiteSetting.objects.update_or_create(key=key, defaults={'value': str(value)})
        return Response({'status': 'settings_saved'})

