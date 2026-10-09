from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from users.api_auth import CustomUserToken
from permits.views import KmgPermitsExportView

from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    # Твои основные пути
    path('api/v1/', include('permits.urls')),
    # Путь для входа
    path('api/v1/api-token-auth/', CustomUserToken.as_view()),
    # Поиск пользователей
    path('api/v1/', include('users.urls')),
    # Внешняя интеграция: выгрузка данных (read-only, token)
    path('api/v1/integration/kmg/permits/', KmgPermitsExportView.as_view()),
    # Подписание через eGov Mobile (QR); выключено, пока EGOV_QR_ENABLED != True
    path('api/v1/egov_qr/', include('egov_qr.urls')),
]

# В режиме разработки Django сам обслуживает статические и медиа файлы
if settings.DEBUG:
    # Автоматически находит статические файлы из всех приложений (включая админку)
    urlpatterns += staticfiles_urlpatterns()
    # Медиа файлы (загруженные пользователями)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)