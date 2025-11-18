# core/models.py
from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    """
    Модель для 'Audit Trail'.
    Фиксирует все бизнес-значимые действия в системе.
    """
    # Кто совершил действие? (FK на нашу новую модель User)
    # models.SET_NULL: Если пользователя удалят, запись в логе останется,
    # но поле user будет 'NULL'.
    # null=True: Позволяет системе (System) совершать действия.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    action = models.CharField(max_length=255, verbose_name='Действие')
    # Пример: 'USER_LOGIN', 'PERMIT_CREATE', 'PERMIT_SIGN_SUCCESS', 'PERMIT_SIGN_FAIL'

    details = models.TextField(verbose_name='Детали', blank=True, null=True)
    # Пример: 'Пользователь вошел с IP 1.2.3.4' или 'Ошибка подписи: Сертификат отозван'

    # GenericForeignKey: Позволяет этой модели ссылаться
    # на *любую* другую модель (на Permit, на User, на Template).
    # Это продвинутая техника, но для логов она идеальна.
    # Мы не будем реализовывать ее прямо сейчас, чтобы не усложнять,
    # но мы заложим ее в будущем.
    # TODO: Add GenericForeignKey (content_type, object_id)

    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='Время')

    class Meta:
        verbose_name = 'Запись аудита'
        verbose_name_plural = 'Журнал аудита'
        ordering = ('-timestamp',)  # Сортировка: новые вверху

    def __str__(self):
        return f'{self.timestamp} - {self.action} - by {self.user}'




