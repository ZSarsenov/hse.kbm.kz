# permits/views.py
from django.http import HttpResponse
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os
from openai import OpenAI
import logging
import time
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
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
        try:
            original = self.get_object()

            # 1. Копируем JSON данные
            # Если data нет, используем пустой dict, чтобы не упало
            new_data = (original.data or {}).copy()

            # 2. Очищаем данные
            new_data['dateStart'] = ""
            new_data['dateEnd'] = ""
            new_data['riskApprovedBy'] = ""
            new_data['extensions'] = []

            # 3. Генерируем новый permit_id (как в сериализаторе)
            new_permit_id = f"{time.strftime('%Y')}-{int(time.time())}"

            # 4. Создаем новый объект
            new_permit = WorkPermit.objects.create(
                initiator=request.user,
                permit_id=new_permit_id,  # 👈 ОБЯЗАТЕЛЬНОЕ ПОЛЕ
                status='DRAFT',
                template=original.template,  # Не забываем сам шаблон (объект)

                # category=original.category,
                location=original.location,  # Копируем объект локации

                data=new_data
            )

            return Response({"ok": True, "id": new_permit.id, "message": "Наряд скопирован"})

        except Exception as e:
            print(f"Ошибка при дублировании: {e}")  # Выведет ошибку в консоль сервера
            return Response({"ok": False, "error": str(e)}, status=400)

    # --- МЕТОД СКАЧИВАНИЯ ---
    # 👇 НОВЫЙ МЕТОД ГЕНЕРАЦИИ PDF
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """
        Генерация PDF с использованием шрифта Times New Roman (кириллица).
        """
        # Импорты лучше держать в начале файла, но можно и тут
        from django.http import HttpResponse
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        import os

        try:
            permit = self.get_object()

            response = HttpResponse(content_type='application/pdf')
            filename = f"Permit_{permit.pk}.pdf"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'

            p = canvas.Canvas(response, pagesize=A4)
            width, height = A4

            # --- 1. НАСТРОЙКА ШРИФТА (Times New Roman) ---

            # Указываем точный путь к файлу, который вы загрузили
            font_path = '/home/sadmin/web/prod/static/fonts/times.ttf'  # 👈 ИЗМЕНИЛИ ПУТЬ

            # Имя, под которым шрифт будет известен внутри PDF
            font_name = 'TimesNewRoman'  # 👈 ДАЛИ ИМЯ

            if os.path.exists(font_path):
                try:
                    # Регистрируем шрифт
                    pdfmetrics.registerFont(TTFont(font_name, font_path))
                    current_font = font_name
                except Exception as e:
                    print(f"Ошибка регистрации шрифта: {e}")
                    current_font = "Helvetica"
            else:
                print(f"⚠️ Файл шрифта не найден по пути: {font_path}")
                current_font = "Helvetica"  # Если файл не найден, будут квадраты, но не ошибка

            # --- 2. РИСОВАНИЕ ---

            y = height - 50
            x = 50

            # Заголовок (Жирный шрифт, размер 16)
            p.setFont(current_font, 16)
            p.drawString(x, y, f"Наряд-допуск № {permit.pk}")
            y -= 30

            # Основной текст (Обычный шрифт, размер 12)
            p.setFont(current_font, 12)

            def draw_line(label, value):
                nonlocal y
                # Рисуем строку
                p.drawString(x, y, f"{label}: {value}")
                y -= 20

            # Статус
            draw_line("Статус", permit.get_status_display())

            # Инициатор
            initiator = permit.initiator.get_full_name() if permit.initiator else "Неизвестно"
            draw_line("Инициатор", initiator)

            # Место работ
            loc_name = permit.location.name if permit.location else "Не указано"
            draw_line("Место работ", loc_name)

            # Период
            valid_from = permit.valid_from.strftime('%d.%m.%Y %H:%M') if permit.valid_from else "..."
            valid_to = permit.valid_to.strftime('%d.%m.%Y %H:%M') if permit.valid_to else "..."
            draw_line("Период", f"{valid_from} - {valid_to}")

            y -= 10
            p.drawString(x, y, "Описание работ:")
            y -= 20

            # Описание
            content = "Нет описания"
            if permit.data and 'content' in permit.data:
                content = permit.data['content']

            # Простая обрезка длинного текста (чтобы не улетел за край)
            # В будущем заменим на перенос строк
            max_len = 75
            if len(content) > max_len:
                p.drawString(x, y, content[:max_len])
                y -= 15
                p.drawString(x, y, content[max_len:max_len * 2] + "...")
            else:
                p.drawString(x, y, content)

            y -= 40

            # --- 3. ЛИСТ СОГЛАСОВАНИЯ ---
            p.setFont(current_font, 14)
            p.drawString(x, y, "Лист согласования:")
            y -= 25

            p.setFont(current_font, 10)  # Шрифт поменьше для списка

            steps = permit.approval_steps.all().order_by('step_order')
            for step in steps:
                role = step.get_role_display()
                approver = step.approver.get_full_name() if step.approver else "—"

                status_label = "ОЖИДАНИЕ"
                if step.status == 'APPROVED':
                    status_label = "ПОДПИСАНО"
                elif step.status == 'REJECTED':
                    status_label = "ОТКАЗАНО"
                elif step.status == 'PENDING':
                    status_label = "НА ПОДПИСАНИИ"

                date_str = ""
                if step.signed_at:
                    date_str = step.signed_at.strftime('%d.%m.%Y %H:%M')

                line = f"{step.step_order}. {role}: {approver} — {status_label} {date_str}"

                # Если место на странице кончилось
                if y < 50:
                    p.showPage()  # Новая страница
                    p.setFont(current_font, 10)
                    y = height - 50

                p.drawString(x, y, line)
                y -= 15

            p.showPage()
            p.save()
            return response

        except Exception as e:
            print(f"🔥 PDF ERROR: {e}")
            return HttpResponse(f"Ошибка генерации PDF: {e}", status=500)




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


class AIAssistantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_question = request.data.get('question', '')

        if not user_question:
            return Response({"error": "Вопрос не может быть пустым"}, status=400)

        # 👇 Вставьте сюда ваш ключ от DeepSeek
        deepseek_api_key = settings.DEEPSEEK_API_KEY

        if not deepseek_api_key:
            return Response({"answer": "Ошибка: API ключ DeepSeek не настроен."}, status=200)

        # 👇 НАСТРОЙКА КЛИЕНТА ПОД DEEPSEEK
        client = OpenAI(
            api_key=deepseek_api_key,
            base_url="https://api.deepseek.com"  # Это перенаправляет запросы на сервера DeepSeek
        )

        # Инструкция, чтобы он не болтал лишнего
        system_prompt = """
        Ты — умный ассистент по технике безопасности (HSE) в нефтяной компании АО «Каражанбасмунай».
        Твоя задача — помогать персоналу грамотно заполнять наряды-допуски и оценивать риски.

        Правила:
        1. Отвечай ТОЛЬКО на вопросы, касающиеся безопасности, нарядов, рисков, СИЗ и промышленных работ.
        2. Если вопрос не по теме (погода, стихи, код), вежливо откажись: "Я консультирую только по вопросам производственной безопасности."
        3. Будь краток и давай четкие инструкции. Используй списки.
        4. Если спрашивают про меры безопасности, перечисли конкретные действия (оградить, отключить, проверить газоанализатором).
        """

        try:
            response = client.chat.completions.create(
                model="deepseek-chat",  # 👈 Используем их модель (V3)
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_question}
                ],
                temperature=0.3,  # Низкая температура для точности
                max_tokens=500
            )

            ai_answer = response.choices[0].message.content
            return Response({"answer": ai_answer})

        except Exception as e:
            print(f"DeepSeek Error: {e}")
            return Response({"answer": "Извините, сервис ИИ временно недоступен. Попробуйте позже."}, status=200)