from django.urls import path

from .views import (
    CMSAnnouncementDetailView,
    CMSAnnouncementListCreateView,
    CMSFaqDetailView,
    CMSFaqListCreateView,
    CMSPageDetailView,
    CMSPageListCreateView,
    CMSSiteSettingView,
)

urlpatterns = [
    # Dedicated CMS routes
    path('cms/pages/', CMSPageListCreateView.as_view(), name='cms-pages-list-create'),
    path('cms/pages/<str:slug>/', CMSPageDetailView.as_view(), name='cms-pages-detail'),
    path('cms/announcements/', CMSAnnouncementListCreateView.as_view(), name='cms-announcements-list-create'),
    path('cms/announcements/<int:pk>/', CMSAnnouncementDetailView.as_view(), name='cms-announcements-detail'),
    path('cms/faqs/', CMSFaqListCreateView.as_view(), name='cms-faqs-list-create'),
    path('cms/faqs/<int:pk>/', CMSFaqDetailView.as_view(), name='cms-faqs-detail'),
    path('cms/settings/', CMSSiteSettingView.as_view(), name='cms-settings'),

    # Backward compatibility with root CMS routes
    path('', CMSPageListCreateView.as_view(), name='cms-page-list-create'),
    path('<slug:slug>/', CMSPageDetailView.as_view(), name='cms-page-detail'),
]

