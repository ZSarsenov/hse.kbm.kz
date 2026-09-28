import uuid
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


def _default_expires_at():
    # 10 минут на то, чтобы отсканировать QR и подписать в eGov Mobile
    return timezone.now() + timedelta(minutes=10)


class EgovQrSession(models.Model):
    """
    Одноразовая короткоживущая сессия QR-подписания через eGov Mobile.

    eGov Mobile не получает токен пользователя: UUID сессии даёт доступ только
    к одному шагу согласования (ApprovalStep), только к заранее сформированному
    XML и только на ограниченное время.
    """

    STATUS_PENDING = 'PENDING'    # QR показан, ждём подписи
    STATUS_SIGNED = 'SIGNED'      # eGov Mobile прислал подписанный XML, шаг согласован
    STATUS_EXPIRED = 'EXPIRED'    # истекло время
    STATUS_CHOICES = (
        (STATUS_PENDING, 'Ожидает подписи'),
        (STATUS_SIGNED, 'Подписано'),
        (STATUS_EXPIRED, 'Истекло'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    approval_step = models.ForeignKey(
        'permits.ApprovalStep',
        on_delete=models.CASCADE,
        related_name='egov_qr_sessions',
    )
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # Точный XML, который отдаём на подпись. При PUT сверяем, что подписан именно он.
    xml_to_sign = models.TextField()

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    # Последняя ошибка при приёме подписи (ИИН не совпал и т.п.) — показывается на сайте
    error_message = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=_default_expires_at)
    signed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Сессия QR-подписания eGov'
        verbose_name_plural = 'Сессии QR-подписания eGov'

    @property
    def is_valid(self):
        return self.status == self.STATUS_PENDING and timezone.now() < self.expires_at

    def __str__(self):
        return f'EgovQrSession {self.id} ({self.status})'
