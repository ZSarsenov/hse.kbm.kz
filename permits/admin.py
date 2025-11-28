from django.contrib import admin
from .models import WorkPermitTemplate, WorkPermit, ApprovalStep, Department, Location, DangerousWorkType

@admin.register(WorkPermitTemplate)
class WorkPermitTemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'created_at')
    search_fields = ('name', 'description')
    list_filter = ('is_active',)

    # Поля, которые отображаются на форме редактирования
    fieldsets = (
        (None, {'fields': ('name', 'description', 'is_active')}),
    )

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'department', 'latitude', 'longitude')
    list_filter = ('department',)
    search_fields = ('name',)

@admin.register(DangerousWorkType)
class DangerousWorkTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'color_code')
    search_fields = ('name',)


@admin.register(WorkPermit)
class WorkPermitAdmin(admin.ModelAdmin):
    """
    Админка для Основного Наряда
    """
    list_display = ('permit_id', 'template', 'initiator', 'status', 'created_at')
    list_filter = ('status', 'template', 'created_at')
    search_fields = ('permit_id', 'initiator__username', 'initiator__iin')

    readonly_fields = ('status', 'created_at', 'updated_at')

    fieldsets = (
        ('Основная информация', {
            'fields': ('permit_id', 'template', 'initiator', 'status')
        }),
        ('Детали работ', {
            'fields': ('dangerous_works', 'data')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at'),
        }),
    )

@admin.register(ApprovalStep)
class ApprovalStepAdmin(admin.ModelAdmin):
    list_display = ('permit', 'step_order', 'approver', 'status')