from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import User


# 1. Создаем форму для СОЗДАНИЯ пользователя, привязанную к нашей модели
class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        # Указываем поля, которые нужны при создании (включая наши кастомные)
        fields = ('username', 'email', 'iin', 'tabel_number', 'department', 'position', 'company_name', 'bin')

# 2. Создаем форму для РЕДАКТИРОВАНИЯ пользователя
class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = '__all__'


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # 3. Подключаем наши новые формы к админке
    add_form = CustomUserCreationForm
    forms = CustomUserChangeForm
    model = User

    # 4. Настраиваем отображение списка
    list_display = ('username', 'email', 'last_name', 'first_name', 'iin', 'bin', 'tabel_number', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'iin', 'tabel_number')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'department')

    # 5. ЯВНО прописываем fieldsets (для страницы редактирования).
    fieldsets = (
    (None, {'fields': ('username', 'password')}),
    ('Персональная информация', {'fields': ('first_name', 'last_name', 'email')}),
    ('Профиль сотрудника', {'fields': ('iin', 'bin', 'tabel_number', 'position', 'department')}),
    ('Права доступа', {
        'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
    }),
    ('Важные даты', {'fields': ('last_login', 'date_joined')}),
    )

    # 6. ЯВНО прописываем add_fieldsets (для страницы создания)
    add_fieldsets = (
    (None, {
        'classes': ('wide',),
        'fields': ('username', 'password1', 'password2', 'email', 'iin', 'bin', 'tabel_number', 'department', 'position', 'company_name'),
    }),
    )



