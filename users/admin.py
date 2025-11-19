from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'last_name', 'first_name', 'iin', 'tabel_number', 'is_staff')
    search_fields = ('username', 'first_name', 'last_name', 'iin', 'tabel_number')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'department')
    fieldsets = UserAdmin.add_fieldsets + (
        ('Профиль сотрудника', {'fields': ('iin', 'tabel_number', 'position', 'department')}),
    )
