from django.contrib import admin
from .models import WorkPermitTemplate

@admin.register(WorkPermitTemplate)
class WorkPermitTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('is_active',)

    # Поля, которые отображаются на форме редактирования
    fieldsets = (
        (None, {'fields': ('name', 'description', 'is_active')}),
    )

