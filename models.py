"""
Модели Django для системы "Электронный Наряд-Допуск"
Поддерживает последовательное согласование документов с интеграцией ЭЦП NCalayer
"""

from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone


# ========== СПРАВОЧНИКИ И БАЗОВЫЕ МОДЕЛИ ==========

class Role(models.Model):
    """Роли пользователей в системе"""
    name = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name='Название роли',
        help_text='Например: Исполнитель работ, Допускающий, Руководитель работ'
    )
    description = models.TextField(
        blank=True, 
        verbose_name='Описание роли'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Роль'
        verbose_name_plural = 'Роли'
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(models.Model):
    """Подразделения/Отделы предприятия"""
    name = models.CharField(
        max_length=200, 
        unique=True,
        verbose_name='Название подразделения'
    )
    code = models.CharField(
        max_length=20, 
        blank=True,
        verbose_name='Код подразделения'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_departments',
        verbose_name='Родительское подразделение'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активно'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Подразделение'
        verbose_name_plural = 'Подразделения'
        ordering = ['name']

    def __str__(self):
        if self.parent:
            return f"{self.parent.name} / {self.name}"
        return self.name


class Position(models.Model):
    """Должности сотрудников"""
    name = models.CharField(
        max_length=200, 
        unique=True,
        verbose_name='Название должности'
    )
    code = models.CharField(
        max_length=20, 
        blank=True,
        verbose_name='Код должности'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Должность'
        verbose_name_plural = 'Должности'
        ordering = ['name']

    def __str__(self):
        return self.name


class UserProfile(models.Model):
    """Расширенный профиль пользователя"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='Пользователь'
    )
    tab_number = models.CharField(
        max_length=20, 
        unique=True,
        verbose_name='Табельный номер',
        help_text='Уникальный табельный номер сотрудника'
    )
    iin = models.CharField(
        max_length=12, 
        unique=True,
        verbose_name='ИИН',
        help_text='Индивидуальный идентификационный номер'
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        related_name='users',
        verbose_name='Роль'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        related_name='employees',
        verbose_name='Подразделение'
    )
    position = models.ForeignKey(
        Position,
        on_delete=models.SET_NULL,
        null=True,
        related_name='employees',
        verbose_name='Должность'
    )
    phone = models.CharField(
        max_length=20, 
        blank=True,
        verbose_name='Телефон'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Профиль пользователя'
        verbose_name_plural = 'Профили пользователей'
        ordering = ['tab_number']

    def __str__(self):
        full_name = self.user.get_full_name() or self.user.username
        return f"{full_name} ({self.tab_number})"

    @property
    def full_name(self):
        """Полное имя пользователя"""
        return self.user.get_full_name() or self.user.username


class WorkPermitType(models.Model):
    """Типы нарядов-допусков"""
    name = models.CharField(
        max_length=200, 
        unique=True,
        verbose_name='Название типа НД',
        help_text='Например: Огневые работы, Работы на высоте, Земляные работы'
    )
    code = models.CharField(
        max_length=20, 
        unique=True,
        verbose_name='Код типа'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    requires_special_approval = models.BooleanField(
        default=False,
        verbose_name='Требует особого согласования',
        help_text='Требуется ли дополнительное согласование для данного типа работ'
    )
    max_duration_hours = models.PositiveIntegerField(
        default=8,
        verbose_name='Максимальная продолжительность (часов)',
        help_text='Максимальная продолжительность работ по одному наряду'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Тип наряда-допуска'
        verbose_name_plural = 'Типы нарядов-допусков'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Status(models.Model):
    """Статусы нарядов-допусков"""
    DRAFT = 'DRAFT'
    APPROVAL = 'APPROVAL'
    APPROVED = 'APPROVED'
    ISSUED = 'ISSUED'
    IN_WORK = 'IN_WORK'
    SUSPENDED = 'SUSPENDED'
    COMPLETED = 'COMPLETED'
    CLOSED = 'CLOSED'
    CANCELLED = 'CANCELLED'
    
    STATUS_CHOICES = [
        (DRAFT, 'Черновик'),
        (APPROVAL, 'На согласовании'),
        (APPROVED, 'Согласован'),
        (ISSUED, 'Выдан'),
        (IN_WORK, 'В работе'),
        (SUSPENDED, 'Приостановлен'),
        (COMPLETED, 'Выполнен'),
        (CLOSED, 'Закрыт'),
        (CANCELLED, 'Отменен'),
    ]
    
    code = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        unique=True,
        verbose_name='Код статуса'
    )
    name = models.CharField(
        max_length=100, 
        unique=True,
        verbose_name='Название статуса'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )
    color = models.CharField(
        max_length=7,
        default='#000000',
        verbose_name='Цвет для отображения',
        help_text='HEX код цвета'
    )
    order = models.PositiveIntegerField(
        default=0,
        verbose_name='Порядок сортировки'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Статус наряда-допуска'
        verbose_name_plural = 'Статусы нарядов-допусков'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


# ========== ОСНОВНАЯ МОДЕЛЬ НАРЯДА-ДОПУСКА ==========

class WorkPermit(models.Model):
    """Наряд-допуск на проведение работ"""
    number = models.CharField(
        max_length=50, 
        unique=True,
        verbose_name='Номер НД',
        help_text='Уникальный номер наряда-допуска'
    )
    title = models.CharField(
        max_length=500,
        verbose_name='Наименование работ'
    )
    description = models.TextField(
        verbose_name='Описание работ',
        help_text='Подробное описание выполняемых работ'
    )
    type = models.ForeignKey(
        WorkPermitType,
        on_delete=models.PROTECT,
        related_name='work_permits',
        verbose_name='Тип НД'
    )
    status = models.ForeignKey(
        Status,
        on_delete=models.PROTECT,
        related_name='work_permits',
        verbose_name='Статус'
    )
    creator = models.ForeignKey(
        UserProfile,
        on_delete=models.PROTECT,
        related_name='created_permits',
        verbose_name='Создатель НД'
    )
    responsible_executor = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='responsible_permits',
        verbose_name='Ответственный исполнитель'
    )
    issuer = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_permits',
        verbose_name='Выдающий наряд'
    )
    admitter = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admitted_permits',
        verbose_name='Допускающий'
    )
    date_created = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    date_start = models.DateTimeField(
        verbose_name='Дата и время начала работ'
    )
    date_end = models.DateTimeField(
        verbose_name='Дата и время окончания работ'
    )
    date_actual_start = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Фактическое начало работ'
    )
    date_actual_end = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Фактическое окончание работ'
    )
    location = models.CharField(
        max_length=500,
        verbose_name='Место проведения работ'
    )
    equipment = models.TextField(
        blank=True,
        verbose_name='Оборудование',
        help_text='Перечень используемого оборудования'
    )
    safety_measures = models.TextField(
        blank=True,
        verbose_name='Меры безопасности',
        help_text='Необходимые меры безопасности при выполнении работ'
    )
    special_conditions = models.TextField(
        blank=True,
        verbose_name='Особые условия',
        help_text='Особые условия проведения работ'
    )
    workers_list = models.TextField(
        blank=True,
        verbose_name='Список работников',
        help_text='Список членов бригады'
    )
    is_extended = models.BooleanField(
        default=False,
        verbose_name='Продлен'
    )
    parent_permit = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='extensions',
        verbose_name='Родительский НД',
        help_text='Ссылка на основной НД при продлении'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Наряд-допуск'
        verbose_name_plural = 'Наряды-допуски'
        ordering = ['-date_created']
        indexes = [
            models.Index(fields=['-date_created']),
            models.Index(fields=['number']),
            models.Index(fields=['status']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"НД №{self.number} - {self.title}"

    def save(self, *args, **kwargs):
        """Переопределение метода save для автоматической генерации номера"""
        if not self.number:
            # Генерация номера НД по шаблону: ТИП-ГОД-ПОРЯДКОВЫЙ_НОМЕР
            year = timezone.now().year
            last_permit = WorkPermit.objects.filter(
                number__startswith=f"{self.type.code}-{year}"
            ).order_by('-number').first()
            
            if last_permit:
                last_number = int(last_permit.number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1
            
            self.number = f"{self.type.code}-{year}-{new_number:05d}"
        
        super().save(*args, **kwargs)

    @property
    def duration_hours(self):
        """Продолжительность работ в часах"""
        if self.date_start and self.date_end:
            delta = self.date_end - self.date_start
            return delta.total_seconds() / 3600
        return 0

    @property
    def is_overdue(self):
        """Проверка просрочки НД"""
        if self.status.code in ['CLOSED', 'CANCELLED', 'COMPLETED']:
            return False
        return timezone.now() > self.date_end

    @property
    def can_be_edited(self):
        """Проверка возможности редактирования"""
        return self.status.code in ['DRAFT', 'APPROVAL']


# ========== МОДЕЛЬ ПОСЛЕДОВАТЕЛЬНОГО СОГЛАСОВАНИЯ (WORKFLOW) ==========

class ApprovalStep(models.Model):
    """
    Этап согласования для конкретного НД.
    Реализует строгую последовательность подписания с интеграцией ЭЦП NCalayer.
    """
    ACTION_CHOICES = [
        ('PENDING', 'Ожидает'),
        ('SIGNED', 'Подписан'),
        ('REJECTED', 'Отклонен'),
        ('SKIPPED', 'Пропущен'),
        ('DELEGATED', 'Делегирован'),
    ]
    
    work_permit = models.ForeignKey(
        WorkPermit,
        on_delete=models.CASCADE,
        related_name='approval_steps',
        verbose_name='Наряд-допуск'
    )
    step_order = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Порядковый номер этапа',
        help_text='Определяет строгую последовательность согласования'
    )
    step_name = models.CharField(
        max_length=200,
        verbose_name='Название этапа',
        help_text='Например: Согласование руководителем работ'
    )
    required_signer = models.ForeignKey(
        UserProfile,
        on_delete=models.PROTECT,
        related_name='required_approvals',
        verbose_name='Требуемый подписант',
        help_text='Пользователь, который должен подписать на данном этапе'
    )
    actual_signer = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actual_approvals',
        verbose_name='Фактический подписант',
        help_text='Пользователь, который фактически подписал (может отличаться при делегировании)'
    )
    delegate_to = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='delegated_approvals',
        verbose_name='Делегировано',
        help_text='Кому делегировано право подписи'
    )
    is_completed = models.BooleanField(
        default=False,
        verbose_name='Завершен',
        help_text='Флаг завершения этапа'
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        default='PENDING',
        verbose_name='Действие'
    )
    signature_data = models.TextField(
        blank=True,
        verbose_name='Данные ЭЦП',
        help_text='Данные электронной цифровой подписи NCalayer в формате Base64 или JSON'
    )
    signature_certificate = models.TextField(
        blank=True,
        verbose_name='Сертификат ЭЦП',
        help_text='Сертификат подписи для верификации'
    )
    signature_timestamp = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Временная метка ЭЦП',
        help_text='Timestamp от сервера временных меток'
    )
    date_completed = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата завершения этапа'
    )
    comments = models.TextField(
        blank=True,
        verbose_name='Комментарии',
        help_text='Комментарии подписанта'
    )
    rejection_reason = models.TextField(
        blank=True,
        verbose_name='Причина отклонения',
        help_text='Обязательно при отклонении'
    )
    is_parallel = models.BooleanField(
        default=False,
        verbose_name='Параллельное согласование',
        help_text='Может выполняться параллельно с другими этапами того же порядка'
    )
    deadline = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Срок согласования'
    )
    reminder_sent = models.BooleanField(
        default=False,
        verbose_name='Напоминание отправлено'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания этапа'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )

    class Meta:
        verbose_name = 'Этап согласования'
        verbose_name_plural = 'Этапы согласования'
        ordering = ['work_permit', 'step_order']
        unique_together = [['work_permit', 'step_order']]
        indexes = [
            models.Index(fields=['work_permit', 'step_order']),
            models.Index(fields=['work_permit', 'is_completed']),
            models.Index(fields=['required_signer', 'is_completed']),
        ]

    def __str__(self):
        status = "✓" if self.is_completed else "○"
        return f"{status} Этап {self.step_order}: {self.step_name} - НД №{self.work_permit.number}"

    def save(self, *args, **kwargs):
        """Переопределение save для автоматической установки даты завершения"""
        if self.is_completed and not self.date_completed:
            self.date_completed = timezone.now()
        
        if self.action == 'REJECTED' and not self.rejection_reason:
            raise ValueError("Причина отклонения обязательна при отклонении этапа")
        
        super().save(*args, **kwargs)

    @property
    def can_be_signed(self):
        """
        Проверка возможности подписания этапа.
        Этап может быть подписан только если:
        1. Он еще не завершен
        2. Все предыдущие этапы завершены (кроме параллельных)
        """
        if self.is_completed:
            return False
        
        # Проверяем завершенность всех предыдущих этапов
        previous_steps = ApprovalStep.objects.filter(
            work_permit=self.work_permit,
            step_order__lt=self.step_order,
            is_parallel=False
        )
        
        return all(step.is_completed for step in previous_steps)

    @property
    def is_current(self):
        """Проверка, является ли этап текущим для подписания"""
        if self.is_completed:
            return False
        
        # Находим минимальный незавершенный этап
        min_uncompleted = ApprovalStep.objects.filter(
            work_permit=self.work_permit,
            is_completed=False
        ).aggregate(min_order=models.Min('step_order'))
        
        return self.step_order == min_uncompleted.get('min_order')

    @property
    def is_overdue(self):
        """Проверка просрочки этапа"""
        if self.is_completed or not self.deadline:
            return False
        return timezone.now() > self.deadline

    def sign(self, signer, signature_data, signature_certificate=None, comments=''):
        """
        Метод для подписания этапа с ЭЦП
        
        Args:
            signer: UserProfile подписанта
            signature_data: Данные ЭЦП
            signature_certificate: Сертификат ЭЦП
            comments: Комментарии подписанта
        """
        if not self.can_be_signed:
            raise ValueError("Этап не может быть подписан в данный момент")
        
        self.actual_signer = signer
        self.signature_data = signature_data
        self.signature_certificate = signature_certificate or ''
        self.signature_timestamp = str(timezone.now().timestamp())
        self.comments = comments
        self.action = 'SIGNED'
        self.is_completed = True
        self.date_completed = timezone.now()
        self.save()
        
        # Создаем уведомление для следующего подписанта
        next_step = ApprovalStep.objects.filter(
            work_permit=self.work_permit,
            step_order__gt=self.step_order
        ).first()
        
        if next_step:
            Notification.objects.create(
                recipient=next_step.required_signer,
                message_text=f"Требуется ваше согласование для НД №{self.work_permit.number}",
                related_wp=self.work_permit,
                notification_type='APPROVAL_REQUIRED'
            )

    def reject(self, signer, reason, signature_data=None):
        """
        Метод для отклонения этапа
        
        Args:
            signer: UserProfile отклоняющего
            reason: Причина отклонения
            signature_data: Данные ЭЦП (опционально)
        """
        if not self.can_be_signed:
            raise ValueError("Этап не может быть обработан в данный момент")
        
        self.actual_signer = signer
        self.rejection_reason = reason
        self.signature_data = signature_data or ''
        self.action = 'REJECTED'
        self.is_completed = True
        self.date_completed = timezone.now()
        self.save()
        
        # Меняем статус НД на "Отклонен"
        rejected_status = Status.objects.get(code='CANCELLED')
        self.work_permit.status = rejected_status
        self.work_permit.save()
        
        # Уведомляем создателя НД об отклонении
        Notification.objects.create(
            recipient=self.work_permit.creator,
            message_text=f"НД №{self.work_permit.number} отклонен на этапе: {self.step_name}. Причина: {reason}",
            related_wp=self.work_permit,
            notification_type='REJECTED'
        )


# ========== МОДЕЛЬ УВЕДОМЛЕНИЙ ==========

class Notification(models.Model):
    """Уведомления пользователям"""
    NOTIFICATION_TYPES = [
        ('INFO', 'Информация'),
        ('WARNING', 'Предупреждение'),
        ('ERROR', 'Ошибка'),
        ('SUCCESS', 'Успешно'),
        ('APPROVAL_REQUIRED', 'Требуется согласование'),
        ('APPROVED', 'Согласовано'),
        ('REJECTED', 'Отклонено'),
        ('DEADLINE', 'Приближается срок'),
        ('OVERDUE', 'Просрочено'),
    ]
    
    recipient = models.ForeignKey(
        UserProfile,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Получатель'
    )
    message_text = models.TextField(
        verbose_name='Текст сообщения'
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default='INFO',
        verbose_name='Тип уведомления'
    )
    related_wp = models.ForeignKey(
        WorkPermit,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Связанный НД'
    )
    related_step = models.ForeignKey(
        ApprovalStep,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        verbose_name='Связанный этап'
    )
    is_read = models.BooleanField(
        default=False,
        verbose_name='Прочитано'
    )
    date_sent = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата отправки'
    )
    date_read = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Дата прочтения'
    )
    is_email_sent = models.BooleanField(
        default=False,
        verbose_name='Email отправлен'
    )
    is_sms_sent = models.BooleanField(
        default=False,
        verbose_name='SMS отправлен'
    )
    priority = models.PositiveIntegerField(
        default=0,
        verbose_name='Приоритет',
        help_text='Чем выше число, тем выше приоритет'
    )

    class Meta:
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'
        ordering = ['-priority', '-date_sent']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['-date_sent']),
        ]

    def __str__(self):
        read_status = "✓" if self.is_read else "●"
        return f"{read_status} {self.recipient.tab_number}: {self.message_text[:50]}..."

    def mark_as_read(self):
        """Отметить уведомление как прочитанное"""
        if not self.is_read:
            self.is_read = True
            self.date_read = timezone.now()
            self.save()

    @classmethod
    def send_notification(cls, recipient, message, notification_type='INFO', related_wp=None, related_step=None):
        """
        Удобный метод для создания и отправки уведомления
        
        Args:
            recipient: UserProfile получателя
            message: Текст сообщения
            notification_type: Тип уведомления
            related_wp: Связанный наряд-допуск (опционально)
            related_step: Связанный этап согласования (опционально)
        
        Returns:
            Notification: Созданное уведомление
        """
        notification = cls.objects.create(
            recipient=recipient,
            message_text=message,
            notification_type=notification_type,
            related_wp=related_wp,
            related_step=related_step
        )
        
        # Здесь можно добавить логику отправки email или SMS
        # if notification.notification_type in ['APPROVAL_REQUIRED', 'REJECTED', 'OVERDUE']:
        #     send_email_notification(notification)
        #     send_sms_notification(notification)
        
        return notification


# ========== ДОПОЛНИТЕЛЬНЫЕ МОДЕЛИ ДЛЯ РАСШИРЕНИЯ ФУНКЦИОНАЛЬНОСТИ ==========

class WorkPermitAttachment(models.Model):
    """Вложения к наряду-допуску"""
    work_permit = models.ForeignKey(
        WorkPermit,
        on_delete=models.CASCADE,
        related_name='attachments',
        verbose_name='Наряд-допуск'
    )
    file = models.FileField(
        upload_to='work_permits/attachments/%Y/%m/',
        verbose_name='Файл'
    )
    file_name = models.CharField(
        max_length=255,
        verbose_name='Имя файла'
    )
    file_size = models.PositiveIntegerField(
        verbose_name='Размер файла (байт)'
    )
    uploaded_by = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_attachments',
        verbose_name='Загружен пользователем'
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата загрузки'
    )
    description = models.TextField(
        blank=True,
        verbose_name='Описание'
    )

    class Meta:
        verbose_name = 'Вложение к НД'
        verbose_name_plural = 'Вложения к НД'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} - НД №{self.work_permit.number}"


class WorkPermitHistory(models.Model):
    """История изменений наряда-допуска"""
    work_permit = models.ForeignKey(
        WorkPermit,
        on_delete=models.CASCADE,
        related_name='history',
        verbose_name='Наряд-допуск'
    )
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Пользователь'
    )
    action = models.CharField(
        max_length=100,
        verbose_name='Действие'
    )
    field_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Измененное поле'
    )
    old_value = models.TextField(
        blank=True,
        verbose_name='Старое значение'
    )
    new_value = models.TextField(
        blank=True,
        verbose_name='Новое значение'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Время изменения'
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name='IP адрес'
    )

    class Meta:
        verbose_name = 'История изменений НД'
        verbose_name_plural = 'История изменений НД'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} - НД №{self.work_permit.number} - {self.timestamp}"
