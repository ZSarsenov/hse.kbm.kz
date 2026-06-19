"""
Кастомный backend аутентификации для нашего проекта.

Позволяет логиниться с username в любом регистре:
  Z_Sarsenov == z_sarsenov == Z_SARSENOV — все три варианта работают,
  если в БД хранится 'z_sarsenov' (или любой другой регистр).

Подключается через AUTHENTICATION_BACKENDS в config/settings.py:

    AUTHENTICATION_BACKENDS = [
        'users.auth_backends.CaseInsensitiveModelBackend',
    ]
"""
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model


class CaseInsensitiveModelBackend(ModelBackend):
    """ModelBackend, но username сравнивается через __iexact (без учёта регистра)."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        if username is None or password is None:
            return None
        try:
            user = UserModel.objects.get(username__iexact=username)
        except UserModel.DoesNotExist:
            # Защита от timing-атак: даже при несуществующем юзере
            # тратим время на хеширование пароля, чтобы по времени ответа
            # нельзя было определить, существует ли логин в системе.
            UserModel().set_password(password)
            return None
        except UserModel.MultipleObjectsReturned:
            # На всякий случай: если в БД оказались дубликаты по iexact,
            # отказываем в логине вместо случайного выбора одного из них.
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
