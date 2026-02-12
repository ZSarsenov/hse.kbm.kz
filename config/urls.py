from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from users.api_auth import CustomUserToken

from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    # Твои основные пути
    path('api/v1/', include('permits.urls')),
    # Путь для входа
    path('api/v1/api-token-auth/', CustomUserToken.as_view()),
    # Поиск пользователей
    path('api/v1/', include('users.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)