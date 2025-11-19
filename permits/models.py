from django.db import models


class WorkPermitTemplate(models.Model):
    """
    Модель для описания типа наряда-допуска (например, "Работы на высоте", "Горячие работы").
    """

    name = models.CharField(max_length=100, unique=True, verbose_name='Название шаблона')
    description = models.CharField(blank=True, verbose_name='Описание')

    # Позже сюда добавим JSONField для хранения структуры полей наряда.

    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Шаблон наряда'
        verbose_name_plural = 'Шаблоны нарядов'

    def __str__(self):
        return self.name
