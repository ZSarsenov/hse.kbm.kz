from django.db import models
from django.contrib.auth.models import AbstractUser


ROLE_CHOICES = (
    ('ADMIN', 'Администратор'),
    ('AUDITOR', 'Аудитор'),
    ('ISSUER', 'Выдающий наряд'),
    ('WORK_PRODUCER', 'Производитель работ'),
    ('ADMITTING', 'Допускающий'),
    ('COORDINATOR', 'Согласующий'),
    ('RESPONSIBLE', 'Ответс. руководитель работ'),
)

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='WORK_PRODUCER', verbose_name="Роль")
    company_name = models.CharField(max_length=50, default='АО Каражанбасмунай', blank=True, null=True, verbose_name="Компания")
    iin = models.CharField(max_length=12, unique=True, verbose_name='ИИН')
    bin = models.CharField(max_length=12, blank=True, null=True, default='950540000524',
                           verbose_name='БИН Организации',
                           help_text="Заполняется, если сотрудник использует ЭЦП юридического лица")
    tabel_number = models.CharField(max_length=20, unique=True, verbose_name='Табельный номер')
    position = models.CharField(max_length=255, verbose_name='Должность', blank=True)
    department = models.ForeignKey('permits.Department', on_delete=models.SET_NULL,
                                   null=True, blank=True, verbose_name='Департамент')
    surname = models.CharField(max_length=150, blank=True, verbose_name='Отчество')

    @property
    def is_admin(self):
        return self.role == 'ADMIN' or self.is_superuser

    def get_full_name(self):
        # Используем "или пустая строка", чтобы избежать ошибок
        parts = [
            self.last_name or '',
            self.first_name or '',
            self.surname or ''
        ]
        # filter(None, parts) уберет пустые строки, чтобы не было двойных пробелов
        full_name = " ".join(filter(None, parts))
        return full_name.strip()

    def __str__(self):
        if self.first_name and self.last_name:
            return f'{self.last_name} {self.first_name}'
        return self.username

