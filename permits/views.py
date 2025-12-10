# permits/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone  # <--- ВАЖНО: Добавлен импорт времени
from .models import WorkPermit, WorkPermitTemplate, ApprovalStep
from .serializers import PermitSerializer, WorkPermitTemplateSerializer
from .kalkan import Kalkan  # Наша обертка


class WorkPermitTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkPermitTemplate.objects.all()
    serializer_class = WorkPermitTemplateSerializer
    permission_classes = [IsAuthenticated]


class WorkPermitViewSet(viewsets.ModelViewSet):
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
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def sign(self, request, pk=None):
        print("\n=== [DEBUG] ЗАПРОС НА ПОДПИСЬ ПОЛУЧЕН ===")
        signed_xml = request.data.get('xml')

        if not signed_xml:
            return Response({'error': 'XML data is required'}, status=400)

        # 1. Проверяем подпись через библиотеку Kalkan
        try:
            kalkan = Kalkan()
            result = kalkan.verify_xml(signed_xml)
        except Exception as e:
            print(f"❌ Ошибка библиотеки Kalkan: {e}")
            return Response({'error': f'Kalkan error: {str(e)}'}, status=500)

        if result['valid']:
            # 2. ПАРСИНГ ДАННЫХ
            signer_info_str = result['signer']
            print(f"📄 Данные сертификата: {signer_info_str}")

            info_dict = {}
            parts = [x.strip() for x in signer_info_str.split(',')]
            for part in parts:
                if '=' in part:
                    key, value = part.split('=', 1)
                    info_dict[key] = value

            # Извлекаем данные
            signer_cn = info_dict.get('CN', 'Неизвестно').replace('"', '')
            serial_number = info_dict.get('SERIALNUMBER', '')
            signer_iin = serial_number.replace('IIN', '')

            # БИН и Организация
            org_unit = info_dict.get('OU', '')
            signer_bin = ''
            if 'BIN' in org_unit:
                signer_bin = org_unit.replace('BIN', '')

            signer_org = info_dict.get('O', '').replace('"', '')

            print("-" * 30)
            print(f"✅ УСПЕШНАЯ РАСШИФРОВКА!")
            print(f"👤 ФИО: {signer_cn}")
            print(f"🆔 ИИН: {signer_iin}")
            if signer_bin:
                print(f"🏢 БИН: {signer_bin}")
                print(f"🏭 Компания: {signer_org}")
            print("-" * 30)

            # --- ВРЕМЕННО ОТКЛЮЧАЕМ ПРОВЕРКИ И СОХРАНЕНИЕ В БД ДЛЯ ТЕСТА ---

            # if request.user.iin != signer_iin: ... (Это включим позже)
            # step.save() ... (Это включим позже)

            # Просто возвращаем данные на фронт, чтобы увидеть их в alert
            return Response({
                'status': 'Verified',
                'signer_fio': signer_cn,
                'signer_iin': signer_iin,
                'signer_bin': signer_bin,
                'organization': signer_org
            })
        else:
            print(f"❌ Подпись НЕВЕРНА. Детали: {result.get('error')}")
            return Response({'error': 'Invalid Signature', 'details': result.get('error')}, status=400)

    # def sign(self, request, pk=None):
    #     permit = self.get_object()
    #     signed_xml = request.data.get('xml')
    #
    #     if not signed_xml:
    #         return Response({'error': 'XML data is required'}, status=400)
    #
    #     # 1. Проверка через Kalkan
    #     try:
    #         kalkan = Kalkan()
    #         result = kalkan.verify_xml(signed_xml)
    #     except Exception as e:
    #         return Response({'error': f'Kalkan error: {str(e)}'}, status=500)
    #
    #     if result['valid']:
    #         # 2. ПАРСИНГ ДАННЫХ СЕРТИФИКАТА
    #         signer_info_str = result['signer']
    #
    #         # Превращаем строку "KEY=Value, KEY2=Value2" в словарь
    #         info_dict = {}
    #         # Разделяем по запятой, но аккуратно (в названиях компаний тоже могут быть запятые,
    #         # но пока используем простой сплит, так как структура Kalkan обычно стабильна)
    #         parts = [x.strip() for x in signer_info_str.split(',')]
    #         for part in parts:
    #             if '=' in part:
    #                 key, value = part.split('=', 1)
    #                 info_dict[key] = value
    #                 print('Zhasks!!!!!!!!!!!!!!!!!!')
    #                 print(info_dict)
    #
    #         # Извлекаем данные
    #         signer_cn = info_dict.get('CN', 'Неизвестно')  # ФИО
    #
    #         # Извлекаем ИИН (обычно SERIALNUMBER=IIN123...)
    #         serial_number = info_dict.get('SERIALNUMBER', '')
    #         signer_iin = serial_number.replace('IIN', '')
    #
    #         # Извлекаем БИН (обычно в OU=BIN... или просто в OU)
    #         # В твоем логе было: OU=BIN950540000524
    #         org_unit = info_dict.get('OU', '')
    #         signer_bin = org_unit.replace('BIN', '') if 'BIN' in org_unit else org_unit
    #
    #         # Извлекаем Организацию
    #         signer_org = info_dict.get('O', '').strip('"')  # Убираем лишние кавычки
    #
    #         print(f"✍️ ПОДПИСАЛ: {signer_cn}")
    #         print(f"🆔 ИИН: {signer_iin}")
    #         print(f"🏢 БИН: {signer_bin}")
    #         print(f"🏭 Компания: {signer_org}")
    #
    #         # 3. ПРОВЕРКА БЕЗОПАСНОСТИ (Сравниваем ИИН подписанта с ИИН текущего юзера)
    #         # Это критически важно! Чтобы Иванов не подписал за Петрова.
    #         if request.user.iin != signer_iin:
    #             return Response({
    #                 'error': f'Ошибка безопасности! Ваш ИИН ({request.user.iin}) не совпадает с ИИН ЭЦП ({signer_iin}).'
    #             }, status=403)
    #
    #         # 4. СОХРАНЕНИЕ В БД
    #         try:
    #             # Находим текущий шаг согласования
    #             step = permit.approval_records.filter(
    #                 approver=request.user,
    #                 status='PENDING'
    #             ).first()
    #
    #             if step:
    #                 step.status = 'SIGNED'
    #                 # Сохраняем всю "сырую" строку сертификата как доказательство
    #                 step.signature_data = signer_info_str
    #                 # Можно добавить поля в ApprovalStep для БИН и Компании, если нужно отдельно,
    #                 # но пока сохраним всё в signature_data или комментарий.
    #                 step.signed_at = timezone.now()
    #                 step.save()
    #
    #                 # Логика перехода статуса наряда (если все подписали -> APPROVED)
    #                 # permit.check_approval_completion() # <-- Это напишем позже
    #
    #                 return Response({
    #                     'status': 'Подпись принята',
    #                     'signer': signer_cn,
    #                     'iin': signer_iin,
    #                     'bin': signer_bin,
    #                     'company': signer_org
    #                 })
    #             else:
    #                 return Response({'error': 'Нет активных шагов согласования'}, status=403)
    #
    #         except Exception as e:
    #             return Response({'error': f'DB Error: {str(e)}'}, status=500)
    #     else:
    #         return Response({'error': 'Invalid Signature', 'details': result['error']}, status=400)