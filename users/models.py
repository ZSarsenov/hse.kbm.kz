from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):

    iin = models.CharField(max_length=12, unique=True, verbose_name='ИИН')
    tabel_number = models.CharField(max_length=20, unique=True, verbose_name='Табельный номер')
    position = models.CharField(max_length=255, verbose_name='Должность', blank=True)
    department = models.ForeignKey('permits.Department', on_delete=models.SET_NULL,
                                   null=True, blank=True, verbose_name='Департамент')

    def __str__(self):
        if self.first_name and self.last_name:
            return f'{self.last_name} {self.first_name}'
        return self.username

