# permits/views.py
import logging
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q

from .models import WorkPermit, WorkPermitTemplate, Department, DangerousWorkType, ApprovalStep, Notification
from core.signature import parse_xml_signature_info
from .serializers import (PermitSerializer, WorkPermitTemplateSerializer, DepartamentSerializer,
                          DangerousWorkTypeSerializer, NotificationSerializer)

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
        return WorkPermit.objects.filter(Q(initiator=user) | Q(approval_steps__approver=user)
        ).distinct()

    # API ДЛЯ "МОИ ЗАДАЧИ" (Колокольчик/Меню)
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """
        Возвращает только те наряды, которые СЕЙЧАС ждут подписи текущего юзера.
        """
        user = request.user
        # Ищем шаги, где approver = Я и статус = PENDING
        my_pending_steps = ApprovalStep.objects.filter(approver=user, status='PENDING')

        # Получаем ID нарядов из этих шагов
        permit_ids = my_pending_steps.values_list('permit_id', flat=True)

        permits = WorkPermit.objects.filter(id__in=permit_ids)
        serializer = self.get_serializer(permits, many=True)
        return Response(serializer.data)

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
        permission_classes=[IsAuthenticated],)  # 👈 ВАЖНО: Только авторизованные!
    def sign(self, request, pk=None):
        permit = self.get_object()
        user = request.user
        signed_xml = request.data.get('signed_xml')

        if not signed_xml:
            return Response({"ok": False, "error": "Нет данных подписи"}, status=400)

        # ---------------------------------------------------------------
        # 1. АВТО-ЗАПУСК СОГЛАСОВАНИЯ (ДЛЯ ЧЕРНОВИКА)
        # ---------------------------------------------------------------
        if permit.status == 'DRAFT':
            # Если статус DRAFT, вызываем transition submit(), который меняет статус
            # на PENDING_APPROVAL и создает шаги.
            try:
                permit.submit()  # <--- Transition метод (из models.py)
                permit.save()
            except Exception as e:
                return Response({"ok": False, "error": f"Ошибка запуска согласования: {e}"}, status=400)

        # ---------------------------------------------------------------
        # 2. ПОИСК ТЕКУЩЕГО ШАГА
        # ---------------------------------------------------------------
        try:
            current_step = ApprovalStep.objects.get(
                permit=permit,
                approver=user,
                status='PENDING'
            )
        except ApprovalStep.DoesNotExist:
            return Response(
                {"ok": False, "error": "Вы не можете подписать этот наряд (нет активного шага)."},
                status=status.HTTP_403_FORBIDDEN
            )

        # ---------------------------------------------------------------
        # 3. ПРОВЕРКА ЭЦП
        # ---------------------------------------------------------------
        try:
            cert_info = parse_xml_signature_info(signed_xml)
        except Exception as e:
            return Response({"ok": False, "error": f"Ошибка чтения ЭЦП: {str(e)}"}, status=400)

        # Проверка ИИН
        sign_iin = cert_info.get('iin')
        if not sign_iin or sign_iin != user.iin:
            return Response(
                {"ok": False, "error": f"ИИН в ЭЦП ({sign_iin}) не совпадает с вашим ({user.iin})."},
                status=400
            )

        # Проверка БИН
        sign_bin = cert_info.get('bin')
        user_bin = user.bin
        target_bin = user_bin if user_bin else '950540000524'

        if not sign_bin:
            return Response({"ok": False, "error": "Нужна ЭЦП юридического лица (GOST) с БИН."}, status=400)

        if sign_bin != target_bin:
            return Response({"ok": False, "error": f"БИН организации не совпадает ({sign_bin} != {target_bin})."},
                            status=400)

        # ---------------------------------------------------------------
        # 4. СОХРАНЕНИЕ ПОДПИСИ ТЕКУЩЕГО ШАГА
        # ---------------------------------------------------------------
        current_step.status = 'APPROVED'
        current_step.signed_xml = signed_xml
        # Сохраняем дату текстом для истории
        current_step.signed_at = timezone.now()
        current_step.signer_details = {
            "iin": cert_info.get('iin'),
            "bin": cert_info.get('bin'),
            "fio": cert_info.get('subject'), # Или распарсить CN из subject
            "org_name": cert_info.get('org_name'),
            "date": timezone.now().isoformat()
        }
        current_step.save()

        # ---------------------------------------------------------------
        # 5. ПЕРЕХОД ХОДА ИЛИ ФИНАЛИЗАЦИЯ
        # ---------------------------------------------------------------
        next_step = ApprovalStep.objects.filter(
            permit=permit,
            step_order__gt=current_step.step_order
        ).order_by('step_order').first()

        if next_step:
            next_step.status = 'PENDING'
            next_step.save()

            # 👇 СОЗДАЕМ УВЕДОМЛЕНИЕ СЛЕДУЮЩЕМУ
            Notification.objects.create(
                user=next_step.approver,
                permit_id=permit.id,
                title="Требуется согласование",
                message=f"Наряд №{permit.permit_id} ожидает вашей подписи ({next_step.get_role_display()})."
            )
            # 👇 НОВОЕ: Уведомляем ИНИЦИАТОРА (что процесс идет)
            if permit.initiator != user:  # Чтобы не спамить себе же
                Notification.objects.create(
                    user=permit.initiator,
                    permit_id=permit.id,
                    title="Наряд подписан",
                    message=f"Пользователь {user.get_full_name()} подписал наряд №{permit.permit_id}. Передан следующему: {next_step.approver.get_full_name()}."
                )

            print(f"🔔 Уведомление отправлено пользователю {next_step.approver.get_full_name()}")

        else:
            permit.approve_final()

            # Уведомляем инициатора, что все готово
            Notification.objects.create(
                user=permit.initiator,
                permit_id=permit.id,
                title="Наряд утвержден",
                message=f"Ваш наряд №{permit.permit_id} полностью согласован всеми участниками!"
            )

        permit.save()

        return Response({
            "ok": True,
            "status": "Наряд успешно подписан",
            "next_step": next_step.role if next_step else "Согласование завершено"
        })

    # --- МЕТОД ОТКЛОНЕНИЯ ---
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """
        Отклонение наряда текущим согласующим.
        """
        permit = self.get_object()
        user = request.user
        reason = request.data.get('reason')

        if not reason:
            return Response({"ok": False, "error": "Необходимо указать причину отклонения."}, status=400)

        # 1. Ищем шаг, который сейчас ждет подписи от этого пользователя
        try:
            step = ApprovalStep.objects.get(permit=permit, approver=user, status='PENDING')
        except ApprovalStep.DoesNotExist:
            return Response(
                {"ok": False, "error": "Вы не можете отклонить этот наряд (нет активного шага согласования)."},
                status=403
            )

        # 2. Отмечаем шаг как ОТКЛОНЕННЫЙ
        step.status = 'REJECTED'
        step.signed_at = timezone.now()
        # СОХРАНЯЕМ ПРИЧИНУ ОТКАЗА
        step.rejection_reason = reason
        step.save()

        # 3. Переводим весь наряд в статус REJECTED
        try:
            permit.reject()  # Вызывает transition из models.py
            permit.save()
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=400)

        # 4. Уведомляем создателя
        Notification.objects.create(
            user=permit.initiator,
            permit_id=permit.id,
            title="Наряд отклонен ❌",
            message=f"Пользователь {user.get_full_name()} отклонил ваш наряд. Причина: {reason}"
        )

        return Response({"ok": True, "status": "Наряд отклонен"})

    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        user = request.user
        # Находим шаги, где я - approver И статус - PENDING
        my_steps = ApprovalStep.objects.filter(approver=user, status='PENDING')
        permit_ids = my_steps.values_list('permit_id', flat=True)
        permits = WorkPermit.objects.filter(id__in=permit_ids)
        serializer = self.get_serializer(permits, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def duplicate(self, request, pk=None):
        """
        Создание копии наряда (черновика) на основе существующего.
        """
        original = self.get_object()

        # 1. Копируем JSON данные
        new_data = original.data.copy()

        # 2. Очищаем чувствительные данные в JSON (подписи, даты утверждения)
        # Оставляем список работников, риски и описание работ.
        # Но убираем старые даты начала/конца, так как это новый наряд.
        new_data['dateStart'] = ""
        new_data['dateEnd'] = ""
        new_data['riskApprovedBy'] = ""  # Сбрасываем подписи
        # Также можно очистить расширения (extensions), если они были
        new_data['extensions'] = []

        # 3. Создаем новый объект наряда
        new_permit = WorkPermit.objects.create(
            initiator=request.user,  # Создателем копии становится тот, кто нажал кнопку
            status='DRAFT',  # Статус всегда Черновик
            template_type=original.template_type,
            category=original.category,
            location_name=original.location_name,
            # valid_from и valid_to оставляем пустыми, их надо задать заново
            data=new_data
        )

        return Response({"ok": True, "id": new_permit.id, "message": "Наряд скопирован"})


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


# 👇 НОВЫЙ VIEWSET ДЛЯ УВЕДОМЛЕНИЙ (Колокольчик)
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        # Показываем только уведомления текущего юзера
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        return Response({'status': 'ok'})