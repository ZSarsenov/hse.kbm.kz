from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WorkPermitTemplate, WorkPermit
from .serializers import WorkPermitTemplateSerializer



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

class WorkPermitViewSet(viewsets.ModelViewSet):
    serializer_class = WorkPermitTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Показываем пользователю только его наряды (или все, если он админ)
        user = self.request.user
        if user.is_superuser:
            return WorkPermit.objects.all()
        return WorkPermit.objects.filter(initiator=user)

    # --- КНОПКА "ОТПРАВИТЬ" (SUBMIT) ---
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        permit = self.get_object() # Получаем наряд по ID
        try:
            permit.submit() # <-- Вызываем FSM метод
            permit.save()  # <-- Сохраняем изменение статуса в БД
            return Response({'status': 'Наряд отправлен', 'current_status': permit.status})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # --- КНОПКА "ОТКЛОНИТЬ" (REJECT) ---
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        permit = self.get_object()
        # В будущем добавим проверку: может ли этот юзер отклонять?
        try:
            permit.reject()
            permit.save()
            return Response({'status': 'Наряд отклонен', 'current_status': permit.status})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)