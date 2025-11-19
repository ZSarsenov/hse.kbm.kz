from django.contrib import admin
from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'action', 'user_link', 'short_details')
    list_filter = ('action', 'timestamp')
    search_fields = ('user__username', 'user__iin', 'action', 'details')
    readonly_fields = ('timestamp', 'user', 'action', 'details')

    # Запретить добавление записей вручную через админку (логи создаются только кодом)
    def has_add_permission(self, request):
        return False

    # Запретить удаление записей (чтобы не зачистили следы)
    def has_delete_permission(self, request, obj=None):
        return False

    # Хелпер для кликабельной ссылки на юзера
    def user_link(self, obj):
        return obj.user

    user_link.short_description = 'Пользователь'

    # Хелпер для сокращения длинных деталей
    def short_details(self, obj):
        return (obj.details[:50] + '...') if obj.details and len(obj.details) > 50 else obj.details

    short_details.short_description = 'Детали'