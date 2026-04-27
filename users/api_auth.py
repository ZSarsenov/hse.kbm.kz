from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .models import User

class CustomUserToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):

        # 1. Проверяем логин/пароль стандартным способом
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # 2. Получаем или создаем токен
        token, created = Token.objects.get_or_create(user=user)

        # 3. Формируем ответ с твоими кастомными полями
        # Проверяем, есть ли связанные объекты (если вдруг department пустой)
        dept_name = "Не указано"
        if user.department:
            dept_name = user.department

        return Response({
            'token': token.key,
            'id': user.pk,
            'username': user.username,
            'name': f"{user.last_name} {user.first_name}".strip() or user.username,
            'email': user.email,
            'role': user.role,
            'company': user.company_name,
            'department': str(user.department) if user.department else "Не указано",
            'position': user.position,
            'is_admin': user.is_admin,
        })