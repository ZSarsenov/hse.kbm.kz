from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    company_name = models.CharField(max_length=50, default='АО Каражанбасмунай', blank=True, null=True)
    iin = models.CharField(max_length=12, unique=True, verbose_name='ИИН')
    bin = models.CharField(max_length=12, blank=True, null=True, default='950540000524',
                           verbose_name='БИН Организации',
                           help_text="Заполняется, если сотрудник использует ЭЦП юридического лица")
    tabel_number = models.CharField(max_length=20, unique=True, verbose_name='Табельный номер')
    position = models.CharField(max_length=255, verbose_name='Должность', blank=True)
    department = models.ForeignKey('permits.Department', on_delete=models.SET_NULL,
                                   null=True, blank=True, verbose_name='Департамент')

    def __str__(self):
        if self.first_name and self.last_name:
            return f'{self.last_name} {self.first_name}'
        return self.username

