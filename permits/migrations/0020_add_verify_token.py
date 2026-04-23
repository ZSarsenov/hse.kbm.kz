import uuid
from django.db import migrations, models


def gen_uuid(apps, schema_editor):
    WorkPermit = apps.get_model('permits', 'WorkPermit')
    for permit in WorkPermit.objects.all():
        permit.verify_token = uuid.uuid4()
        permit.save(update_fields=['verify_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('permits', '0019_add_producer_closed_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='workpermit',
            name='verify_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, null=True),
        ),
        migrations.RunPython(gen_uuid, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='workpermit',
            name='verify_token',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True, verbose_name='Токен верификации QR'),
        ),
    ]
