from django.contrib import admin
from django.urls import include, path
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


def api_home(request):
    return JsonResponse(
        {
            'service': 'VINEXTURE API',
            'status': 'ok',
            'endpoints': {
                'admin': '/admin/',
                'health': '/api/auth/health/',
                'token': '/api/token/',
                'cms': '/api/',
            },
        }
    )


from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', api_home, name='api-home'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('blog.urls')),
    path('api/', include('internships.urls')),
    path('api/', include('applications.urls')),
    path('api/', include('offers.urls')),
    path('api/', include('certificates.urls')),
    path('api/', include('interviews.urls')),
    path('api/', include('payments.urls')),
    path('api/', include('notifications.urls')),
    path('api/', include('analytics.urls')),
    path('api/', include('admin_overview.urls')),
    path('api/', include('candidates.urls')),
    path('api/', include('cms.urls')),
]

from django.views.static import serve
from django.urls import re_path

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

