from django.contrib.postgres.indexes import GinIndex
from django.db import migrations


class Migration(migrations.Migration):
    """GIN-индекс по data (jsonb_path_ops) для быстрых JSONB containment-запросов
    видимости нарядов для членов бригады (data__teamMembers__contains).
    Позиционные lookups (->>) индексом не используются и давали ~4.5 с на запрос."""

    dependencies = [
        ('permits', '0026_electricalworktype'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='workpermit',
            index=GinIndex(
                name='workpermit_data_gin',
                fields=['data'],
                opclasses=['jsonb_path_ops'],
            ),
        ),
    ]
