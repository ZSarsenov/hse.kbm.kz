from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User
from permits.models import Department

from import_export import resources, fields, widgets
from import_export.admin import ImportExportModelAdmin


# 2. Создаем "Ресурс" — он отвечает за логику импорта
class UserResource(resources.ModelResource):
    # Говорим: используй модель Department и бери из неё поле 'name'
    department = fields.Field(
        column_name='department',
        attribute='department',
        widget=widgets.ForeignKeyWidget(Department, field='name')
    )

    class Meta:
        model = User
        # Перечисляем поля, которые можно импортировать
        # Важно: import_id_fields указывает, по какому полю искать совпадения (чтобы не дублировать юзеров)
        import_id_fields = ('iin',)
        fields = ('username', 'first_name', 'last_name', 'surname', 'tabel_number', 'department', 'role', 'iin', 'bin',
                  'company_name', 'position',
                  'password')

    def before_save_instance(self, instance, *args, **kwargs):
        """
        Этот метод срабатывает перед тем, как пользователь сохранится в базу.
        Здесь мы перехватываем пароль и хешируем его.
        """
        if instance.password:
            # Проверяем, не является ли пароль уже хешем (чтобы не захешировать хеш при повторном импорте)
            # Стандартный хеш Django начинается с алгоритма, например pbkdf2_sha256
            if not instance.password.startswith('pbkdf2_sha256$'):
                instance.set_password(instance.password)


class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('username', 'email', 'iin', 'tabel_number', 'department', 'position', 'company_name', 'bin', 'role')


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = '__all__'


@admin.register(User)
class CustomUserAdmin(ImportExportModelAdmin, UserAdmin):
    resource_class = UserResource  # Подключаем наш ресурс с логикой паролей

    add_form = CustomUserCreationForm
    forms = CustomUserChangeForm
    model = User

    list_display = ('username', 'last_name', 'first_name', 'surname', 'role', 'iin', 'bin', 'tabel_number', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'surname', 'iin', 'tabel_number')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'department')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Персональная информация', {'fields': ('first_name', 'last_name', 'surname', 'email')}),
        ('Профиль сотрудника', {'fields': ('role', 'iin', 'bin', 'tabel_number', 'position', 'department')}),
        ('Права доступа', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'password1', 'password2', 'email', 'role', 'iin', 'bin', 'tabel_number',
                       'department', 'position', 'company_name'),
        }),
    )