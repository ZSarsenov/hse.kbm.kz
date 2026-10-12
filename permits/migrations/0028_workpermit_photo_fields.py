from django.db import migrations, models


class Migration(migrations.Migration):
    """Фотофиксация работ: пути к файлам в БД, файлы на диске (media/work_photos)."""

    dependencies = [
        ('permits', '0027_workpermit_data_gin'),
    ]

    operations = [
        migrations.AddField(
            model_name='workpermit',
            name='work_photo_before',
            field=models.FileField(blank=True, null=True, upload_to='work_photos/%Y/%m/', verbose_name='Фото до начала работ'),
        ),
        migrations.AddField(
            model_name='workpermit',
            name='work_photo_after',
            field=models.FileField(blank=True, null=True, upload_to='work_photos/%Y/%m/', verbose_name='Фото после окончания работ'),
        ),
    ]
