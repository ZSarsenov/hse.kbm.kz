from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserListSerializer
from django.db.models import Q


class UserSearchViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API для поиска сотрудников по имени или фамилии
    URL: /api/v1/users/search/?q=Иванов
    """

    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.all()
        query = self.request.query_params.get('q', None)

        if query:
            # Ищем по Фамилии ИЛИ Имени ИЛИ Логину
            queryset = queryset.filter(
                Q(last_name__icontains=query) |
                Q(first_name__icontains=query) |
                Q(username__icontains=query)
            )

        return queryset[:10]