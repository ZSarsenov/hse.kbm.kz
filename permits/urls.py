from rest_framework.routers import DefaultRouter
from .views import WorkPermitTemplateViewSet, WorkPermitViewSet

router = DefaultRouter()
router.register(r'templates', WorkPermitTemplateViewSet, basename='template')
router.register(r'permits', WorkPermitViewSet, basename='permit')

urlpatterns = router.urls