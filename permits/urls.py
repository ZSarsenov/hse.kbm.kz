from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkPermitTemplateViewSet, WorkPermitViewSet, DepartmentViewSet, DangerousWorkTypeViewSet

router = DefaultRouter()
router.register(r'templates', WorkPermitTemplateViewSet, basename='template')
router.register(r'permits', WorkPermitViewSet, basename='permit')
router.register(r'departments', DepartmentViewSet)
router.register(r'work-types', DangerousWorkTypeViewSet)

urlpatterns = router.urls