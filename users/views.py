from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
# from .models import User
from .serializers import UserListSerializer
from django.db.models import Q
from django.contrib.auth import get_user_model
from permits.serializers import UserInfoSerializer

User = get_user_model()

class UserSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для поиска сотрудников по имени или фамилии
    URL: /api/v1/users/search/?q=Иванов
    """

    queryset = User.objects.filter(is_active=True) # Показываем только активных
    serializer_class = UserInfoSerializer
    permission_classes = [IsAuthenticated]

    # Включаем поиск
    filter_backends = [filters.SearchFilter]
    # По каким полям искать (Фамилия, Имя, ИИН, Отчество)
    search_fields = ['username', 'first_name', 'last_name', 'surname', 'iin']