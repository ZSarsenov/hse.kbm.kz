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


    STATUS_DRAFT = 'DRAFT'
    STATUS_PENDING = 'PENDING_APPROVAL'
    STATUS_APPROVED = 'APPROVED'
    STATUS_REJECTED = 'REJECTED'
    STATUS_CLOSED = 'CLOSED'

    # Статусы
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
    template = models.ForeignKey(WorkPermitTemplate, on_delete=models.PROTECT, verbose_name='Тип наряда')

    location = models.ForeignKey("Location", on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Место работ')
    valid_from = models.DateTimeField(null=True, blank=True, verbose_name='Начало работ')
    valid_to = models.DateTimeField(null=True, blank=True, verbose_name='Окончание работ')

    dangerous_works = models.ManyToManyField(
       'DangerousWorkType', verbose_name='Виды опасных работ', blank=True
    )

    # Вся остальная "портянка" данных (риски, состав бригады, LOTO) летит сюда
    data = models.JSONField(verbose_name='Данные формы', default=dict)

    # ------------------ ВРЕМЯ И АУДИТ ------------------
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата последнего изменения')

    scan_file = models.FileField(upload_to='permits_scans/%Y/%m/', verbose_name='Скан закрытого наряда',
                                 null=True, blank=True)

    # ------------------ FSM LOGIC ------------------
    # 1. Отправка на согласование
    @transition(field=status, source=[STATUS_DRAFT, STATUS_REJECTED], target=STATUS_PENDING)
    def submit(self):
        """
        Переводит наряд в статус согласования и генерирует цепочку подписей
        на основе данных JSON (self.data).
        """
        if not self.data:
            raise ValidationError("Нельзя отправить пустой наряд. Заполните данные.")

        # Очищаем старые шаги (на случай повторной отправки)
        self.approval_steps.all().delete()

        # Функция-помощник для получения ID из JSON-объекта роли
        # Фронтенд шлет: "producer": { "id": 5, "name": "..." }
        def get_user_id(role_key):
            role_data = self.data.get(role_key)
            if isinstance(role_data, dict):
                return role_data.get('id')
            return None

        # Формируем цепочку (Порядок важен!)
        steps_config = []

        # 1. Выдающий (Это всегда инициатор наряда)
        steps_config.append({
            'role': 'ISSUER',
            'user': self.initiator
        })

        # 2. Ответственный руководитель
        resp_id = get_user_id('responsible')
        if resp_id:
            steps_config.append({'role': 'RESPONSIBLE', 'user_id': resp_id})

        # 3. Допускающий (обязателен)
        admit_id = get_user_id('admitting')
        if admit_id:
            steps_config.append({'role': 'ADMITTING', 'user_id': admit_id})

        # 4. Производитель работ (обязателен)
        prod_id = get_user_id('producer')
        if prod_id:
            steps_config.append({'role': 'WORK_PRODUCER', 'user_id': prod_id})

        # 5. Согласующий (Нач. цеха)
        coord_id = get_user_id('supervisor')
        if coord_id:
            steps_config.append({'role': 'COORDINATOR', 'user_id': coord_id})

        # СОЗДАЕМ ЗАПИСИ В БД
        from django.contrib.auth import get_user_model
        User = get_user_model()

        for index, step_data in enumerate(steps_config):
            # Определяем пользователя (либо объект user, либо user_id)
            user = step_data.get('user')
            if not user and step_data.get('user_id'):
                try:
                    user = User.objects.get(pk=step_data['user_id'])
                except User.DoesNotExist:
                    print(f"Ошибка: Пользователь ID {step_data['user_id']} не найден.")
                    continue

            if user:
                ApprovalStep.objects.create(
                    permit=self,
                    approver=user,
                    role=step_data['role'],
                    step_order=index + 1,
                    # Первый шаг (Выдающий) сразу активен (PENDING)
                    # Остальные ждут очереди (WAITING)
                    status='PENDING' if index == 0 else 'WAITING'
                )

            # 👇 ДОБАВЛЯЕМ УВЕДОМЛЕНИЯ ВСЕМ УЧАСТНИКАМ
            if user and user != self.initiator:  # Инициатору не пишем, он и так знает
                Notification.objects.create(
                    user=user,
                    permit_id=self.id,
                    title="Вы назначены согласующим",
                    message=f"Вы включены в маршрут согласования наряда №{self.permit_id}. Ваша роль: {step_data.get('role', 'Участник')}."
                )

        print(f"Наряд {self.permit_id} отправлен. Создано {len(steps_config)} шагов.")

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

    @transition(field=status, source='APPROVED', target='CLOSED')
    def close_work(self):
        """
        Перевод наряда в статус 'Закрыт'.
        Вызывается, когда Допускающий прикрепляет скан и закрывает наряд.
        """
        pass

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

    # Место для хранения криптографической подписи NCALayer (PKCS#7)

    # Сюда кладем "сырой" XML (длинная строка) - это ДОКАЗАТЕЛЬСТВО
    signed_xml = models.TextField(verbose_name="Цифровая подпись (CMS/XML)", blank=True, null=True)
    # Сюда кладем краткую инфо (Subject DN) - для ОТОБРАЖЕНИЯ
    signer_details = models.JSONField(verbose_name='Детали подписанта', default=dict, blank=True,
                                   help_text="ФИО, ИИН, БИН из сертификата для быстрого просмотра")

    # Статус конкретного шага
    STATUS_CHOICES = (
        ('WAITING', 'Ожидает очереди'),
        ('PENDING', 'Ожидает подписи'),
        ('APPROVED', 'Подписан'),
        ('REJECTED', 'Отклонен'),
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING', verbose_name='Статус шага')
    signed_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата подписания')

    ROLE_CHOICES = (
        ('ISSUER', 'Выдающий наряд'),
        ('RESPONSIBLE', 'Ответственный руководитель'),
        ('ADMITTING', 'Допускающий'),
        ('WORK_PRODUCER', 'Производитель работ'),
        ('COORDINATOR', 'Согласующий'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ISSUER', verbose_name='Роль согласующего')
    rejection_reason = models.TextField(verbose_name='Причина отклонения', blank=True, null=True)


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


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Ссылка на наряд, чтобы при клике открывать его
    permit_id = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
