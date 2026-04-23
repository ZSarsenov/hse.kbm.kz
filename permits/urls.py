from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (WorkPermitTemplateViewSet, WorkPermitViewSet, DepartmentViewSet, DangerousWorkTypeViewSet,
                    NotificationViewSet, AIAssistantView, verify_permit_public)

router = DefaultRouter()
router.register(r'templates', WorkPermitTemplateViewSet, basename='template')
router.register(r'permits', WorkPermitViewSet, basename='permit')
router.register(r'departments', DepartmentViewSet)
router.register(r'work-types', DangerousWorkTypeViewSet)
router.register(r'notifications', NotificationViewSet, basename='notifications')

urlpatterns = router.urls + [
    path('ai-chat/', AIAssistantView.as_view(), name='ai-chat'),
    path('verify/<uuid:token>/', verify_permit_public, name='verify-permit'),
]