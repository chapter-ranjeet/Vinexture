from django.urls import path

from .views import CMSPageDetailView, CMSPageListCreateView

urlpatterns = [
    path('', CMSPageListCreateView.as_view(), name='cms-page-list-create'),
    path('<slug:slug>/', CMSPageDetailView.as_view(), name='cms-page-detail'),
]
