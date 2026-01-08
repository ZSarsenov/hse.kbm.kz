from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSearchViewSet


router = DefaultRouter()

router.register(r'users', UserSearchViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]