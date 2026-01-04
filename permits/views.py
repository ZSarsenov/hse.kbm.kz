# permits/views.py
import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import WorkPermit, WorkPermitTemplate, Department, DangerousWorkType
from core.signature import parse_xml_signature_info
from .serializers import (PermitSerializer, WorkPermitTemplateSerializer, DepartamentSerializer,
                          DangerousWorkTypeSerializer)

from .kalkan import Kalkan # временно не используем способ подписания через Kalkan

logger = logging.getLogger(__name__)
class WorkPermitTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Шаблоны нарядов-допусков (только чтение).
    """
    queryset = WorkPermitTemplate.objects.all()
    serializer_class = WorkPermitTemplateSerializer
    permission_classes = [AllowAny]  # на время DEV можно открыть для всех


class WorkPermitViewSet(viewsets.ModelViewSet):
    queryset = WorkPermit.objects.all()
    serializer_class = PermitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return WorkPermit.objects.all()
        return WorkPermit.objects.filter(initiator=user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        permit = self.get_object()
        try:
            permit.submit()
            permit.save()
            return Response({'status': 'Наряд отправлен', 'current_status': permit.status})
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    # --- МЕТОД ПОДПИСАНИЯ ---
    @action(
        detail=True,
        methods=["post"],
        url_path="sign",
        permission_classes=[AllowAny],  # Или IsAuthenticated, зависит от логики
    )

    def sign(self, request, pk=None):
        """
        Принимает signed_xml от фронта (NCALayer signXml),
        вытаскивает данные подписанта из XML и возвращает их фронту для предпросмотра.
        """
        signed_xml = request.data.get('signed_xml')
        if not signed_xml:
            return Response(
                {"ok": False, "error": "Поле 'signed_xml' обязательно"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Проверяем, что наряд существует
        permit_exists = WorkPermit.objects.filter(pk=pk).exists()

        base_resp = {
            "ok": True,
            "permit_pk": str(pk),
            "permit_exists": permit_exists,
            # Для отладки можно вернуть длину, но сам XML лучше не гонять туда-сюда лишний раз
            "signed_xml_length": len(signed_xml),
        }

        try:
            # Парсим подпись через твой скрипт core/signature.py
            info = parse_xml_signature_info(signed_xml)

            # Если всё ок, формируем красивый ответ
            base_resp.update({
                "sign_info_ok": True,
                "sign_subject": info.get("subject"),
                "sign_issuer": info.get("issuer"),
                # Преобразуем даты в строки ISO, если они есть
                "sign_not_before": info["not_before"].isoformat() if info.get("not_before") else None,
                "sign_not_after": info["not_after"].isoformat() if info.get("not_after") else None,
                "sign_iin": info.get("iin"),
                "sign_bin": info.get("bin"),
                "sign_org_name": info.get("org_name"),
            })

        except ValueError as e:
            # XML валидный, но сертификат не найден или поврежден
            logger.warning(f"Ошибка валидации XML подписи: {e}")
            base_resp["sign_info_ok"] = False
            base_resp["sign_error"] = str(e)

        except Exception as e:
            # Любая другая ошибка (например, кривой base64)
            logger.error(f"Неожиданная ошибка при разборе подписи: {e}")
            base_resp["sign_info_ok"] = False
            base_resp["sign_error"] = f"Ошибка обработки: {str(e)}"

        return Response(base_resp, status=status.HTTP_200_OK)


class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Справочник департаментов (только чтение для API)
    """
    queryset = Department.objects.all()
    serializer_class = DepartamentSerializer
    permission_classes = [IsAuthenticated]

    # 👇 Добавляем возможность поиска
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']


class DangerousWorkTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Справочник опасных работ
    """
    queryset = DangerousWorkType.objects.all()
    serializer_class = DangerousWorkTypeSerializer
    permission_classes = [IsAuthenticated]

    # 👇 Добавляем возможность поиска
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']