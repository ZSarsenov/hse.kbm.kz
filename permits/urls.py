from rest_framework.routers import DefaultRouter
from .views import WorkPermitTemplateViewSet

router = DefaultRouter()
router.register(r'templates', WorkPermitTemplateViewSet, basename='template')

urlpatterns = router.urls