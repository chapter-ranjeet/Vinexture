from rest_framework import generics, permissions

from .models import CMSPage
from .serializers import CMSPageSerializer


class CMSPageListCreateView(generics.ListCreateAPIView):
    serializer_class = CMSPageSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return CMSPage.objects.all()
        return CMSPage.objects.filter(is_published=True)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CMSPageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CMSPageSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        if self.request.user.is_staff:
            return CMSPage.objects.all()
        return CMSPage.objects.filter(is_published=True)

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]
