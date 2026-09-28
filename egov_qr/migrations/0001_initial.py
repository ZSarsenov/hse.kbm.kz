import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models

import egov_qr.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('permits', '0026_electricalworktype'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='EgovQrSession',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('xml_to_sign', models.TextField()),
                ('status', models.CharField(choices=[('PENDING', 'Ожидает подписи'), ('SIGNED', 'Подписано'), ('EXPIRED', 'Истекло')], default='PENDING', max_length=10)),
                ('error_message', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(default=egov_qr.models._default_expires_at)),
                ('signed_at', models.DateTimeField(blank=True, null=True)),
                ('approval_step', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='egov_qr_sessions', to='permits.approvalstep')),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Сессия QR-подписания eGov',
                'verbose_name_plural': 'Сессии QR-подписания eGov',
            },
        ),
    ]
