from django.contrib import admin

from .models import EgovQrSession


@admin.register(EgovQrSession)
class EgovQrSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'approval_step', 'created_by', 'status', 'created_at', 'expires_at', 'signed_at')
    list_filter = ('status',)
    readonly_fields = [f.name for f in EgovQrSession._meta.fields]
