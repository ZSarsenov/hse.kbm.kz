from rest_framework import viewsets
from .models import WorkPermitTemplate
from .serializers import WorkPermitTemplateSerializer
from rest_framework.permissions import IsAuthenticated


class WorkPermitTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для предоставления списка доступных шаблонов нарядов.
    ReadOnlyModelViewSet - только чтение (GET), нельзя создавать или удалять.
    Шаблоны меняют только администраторы через админку.
    """

    queryset = WorkPermitTemplate.objects.all()
    serializer_class = WorkPermitTemplateSerializer

    # Очень важно! Вся система должна быть доступна только авторизованным пользователям.
    permission_classes = [IsAuthenticated]
