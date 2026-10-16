from django.db import migrations, models


class Migration(migrations.Migration):
    """Третий слот фотофиксации: «Фото в процессе работ»."""

    dependencies = [
        ('permits', '0028_workpermit_photo_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='workpermit',
            name='work_photo_during',
            field=models.FileField(blank=True, null=True, upload_to='work_photos/%Y/%m/', verbose_name='Фото в процессе работ'),
        ),
    ]
