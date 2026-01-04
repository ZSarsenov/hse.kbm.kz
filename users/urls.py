from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserSearchViewSet


router = DefaultRouter()
router.register(r'search-users', UserSearchViewSet, basename='user-search')

urlpatterns = [
    path('', include(router.urls)),
]