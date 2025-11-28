from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError # Для ошибок валидации
from django_fsm import FSMField, transition


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


class WorkPermit(models.Model):
    """
    Основная модель наряда-допуска.
    Хранит данные наряда и его текущее состояние (статус).
    """

    # Статусы
    STATUS_DRAFT = 'DRAFT'
    STATUS_PENDING = 'PENDING_APPROVAL'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CLOSED = 'CLOSED'

    STATUS_CHOICES = (
        ('DRAFT', 'Черновик'),
        ('PENDING_APPROVAL', 'Ожидает согласования'),
        ('APPROVED', 'Согласован'),
        ('REJECTED', 'Отклонен'),
        ('CLOSED', 'Закрыт'),
    )

    status = FSMField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', verbose_name='Статус наряда', protected=True)

    permit_id = models.CharField(max_length=50, unique=True, verbose_name='Номер наряда')

    # Ссылка на инициатора (работник, который создал наряд)
    initiator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT,
                                  related_name='initiated_permits', verbose_name='Инициатор')
    template = models.ForeignKey('WorkPermitTemplate', on_delete=models.PROTECT, verbose_name='Тип наряда')

    dangerous_works = models.ManyToManyField(
       'DangerousWorkType', verbose_name='Виды опасных работ', blank=True
    )

    # Данные формы (JSON). Сюда будем писать всё: место, время, бригаду и т.д.
    data = models.JSONField(verbose_name='Данные формы', default=dict)

    # ------------------ ВРЕМЯ И АУДИТ ------------------
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата последнего изменения')

    # ------------------ FSM LOGIC ------------------
    # 1. Отправка на согласование
    @transition(field=status, source=[STATUS_DRAFT, STATUS_REJECTED], target=STATUS_PENDING)
    def submit(self):
        """
        Проверяет заполнение и переводит в статус Ожидания.
        """
        # Пример бизнес-валидации: нельзя отправить, если не выбраны опасные работы
        # (Это пример, в реальности зависит от ТС)
        if not self.data:
            raise ValidationError("Нельзя отправить пустой наряд. Заполните данные.")

        # Здесь в будущем: Генерация цепочки ApprovalRecord
        print(f"Наряд {self.permit_id} успешно отправлен на согласование.")

    # 2. Финальное утверждение
    @transition(field=status, source=STATUS_PENDING, target=STATUS_APPROVED)
    def approve_final(self):
        print(f"Наряд {self.permit_id} утвержден.")

    # 3. Отклонение (возврат)
    @transition(field=status, source=STATUS_PENDING, target=STATUS_REJECTED)
    def reject(self):
        print(f"Наряд {self.permit_id} отклонен и возвращен инициатору.")

    # 4. Закрытие
    @transition(field=status, source=STATUS_APPROVED, target=STATUS_CLOSED)
    def close_permit(self):
        print(f"Наряд {self.permit_id} закрыт.")



    class Meta:
        verbose_name = 'Наряд Допуск'
        verbose_name_plural = 'Наряды Допуска'
        ordering = ('-created_at',)

    def __str__(self):
        return f'{self.permit_id} ({self.status})'


class ApprovalStep(models.Model):
    """
    Запись о том, кто и на каком этапе должен согласовать/подписать наряд.
    Это также наш immutable audit trail для подписей.
    """

    permit = models.ForeignKey(WorkPermit, on_delete=models.CASCADE, # Если наряд удален, удаляем и шаги
                               related_name='approval_steps')

    approver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, verbose_name='Согласующий')

    # Последовательность шага
    step_order = models.PositiveSmallIntegerField(verbose_name='Порядок шага')

    # Статус конкретного шага
    STATUS_CHOICES = (
        ('PENDING', 'Ожидает подписи'),
        ('SIGNED', 'Подписан'),
        ('REJECTED', 'Отклонен'),
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING', verbose_name='Статус шага')
    signed_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата подписания')

    # Место для хранения криптографической подписи NCALayer (PKCS#7)
    signature_data = models.TextField(blank=True, verbose_name='Данные ЭЦП')

    class Meta:
        verbose_name = 'Шаг согласования'
        verbose_name_plural = 'Шаги согласования'
        # Один наряд не может иметь два одинаковых номера шага
        unique_together = ('permit', 'step_order')
        ordering = ('step_order',)

    def __str__(self):
        return f"Step {self.step_order} for {self.permit.permit_id}"


class Department(models.Model):
    """
    Модуль 'Департаменты' (цеха, отделы, службы) [cite: 504]
    """

    name = models.CharField(max_length=255, unique=True, verbose_name='Название департамента')

    class Meta:
        verbose_name = 'Департамент'
        verbose_name_plural = "Департаменты"

    def __str__(self):
        return self.name


class Location(models.Model):
    """
    Модуль 'Локации' (месторождения, участки, объекты) [cite: 506]
    """

    name = models.CharField(max_length=255, verbose_name='Название локации')
    # По требованиям ТС, храним геоданные [cite: 506]
    latitude = models.DecimalField(max_digits=17, decimal_places=15, null=True, blank=True, verbose_name='Широта')
    longitude = models.DecimalField(max_digits=17, decimal_places=15, null=True, blank=True, verbose_name='Долгота')

    # Ссылка на департамент для иерархии
    department = models.ForeignKey('Department', on_delete=models.SET_NULL,
                                    null=True, blank=True, verbose_name='Привязка к департаменту')

    class Meta:
        verbose_name = 'Локация'
        verbose_name_plural = 'Локации'
        unique_together = ('name', 'department')  # Локация уникальна в рамках департамента

    def __str__(self):
        return self.name


class DangerousWorkType(models.Model):
    """
    Модуль 'Виды опасных работ' [cite: 509]
    """
    name = models.CharField(max_length=255, unique=True, verbose_name='Вид опасных работ')
    # Требуется функция 'редактирования цветов рамок, изображений для идентификации' [cite: 511]
    color_code = models.CharField(max_length=7, default="#FF0000", verbose_name='Цвет рамки (HEX)')

    class Meta:
        verbose_name = 'Вид опасных работ'
        verbose_name_plural = 'Виды опасных работ'

    def __str__(self):
        return self.name