"""
Подписание шага согласования наряда через eGov Mobile (сканирование QR).

Поток:
  1. Сайт: POST start/<permit_id>/  -> создаём EgovQrSession, отдаём QR-картинку.
  2. Телефон: eGov Mobile сканирует QR "mobileSign:<base>/init/<id>/" и вызывает
     GET init/<id>/ (API №1) -> описание и ссылка на документ.
  3. Телефон: GET doc/<id>/ (API №2) -> XML на подпись; пользователь подписывает.
  4. Телефон: PUT doc/<id>/ -> подписанный XML. Проверяем так же, как в
     permits.views.WorkPermitViewSet.sign, и продвигаем согласование.
  5. Сайт: опрашивает GET status/<id>/ до SIGNED / EXPIRED / ошибки.

Пока settings.EGOV_QR_ENABLED не включён (или не задан EGOV_QR_ORG_BIN),
все эндпоинты, кроме config/, отвечают 404 — на работу сайта это не влияет.
"""
import base64
import logging
import xml.etree.ElementTree as ET
from datetime import timezone as dt_timezone
from io import BytesIO
from xml.sax.saxutils import escape

import qrcode
from django.conf import settings
from django.db import transaction
from django.http import Http404
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.signature import parse_xml_signature_info
from permits.models import ApprovalStep, WorkPermit
from permits.views import _advance_after_approval_step

from .models import EgovQrSession

logger = logging.getLogger(__name__)


def _is_enabled():
    return bool(getattr(settings, 'EGOV_QR_ENABLED', False) and getattr(settings, 'EGOV_QR_ORG_BIN', ''))


def _require_enabled():
    if not _is_enabled():
        raise Http404


def _base_url():
    return getattr(settings, 'EGOV_QR_BASE_URL', settings.HSE_BASE_URL).rstrip('/')


def _organisation_info():
    return {
        "nameRu": settings.EGOV_QR_ORG_NAME_RU,
        "nameKz": settings.EGOV_QR_ORG_NAME_KZ,
        "nameEn": settings.EGOV_QR_ORG_NAME_EN,
        "bin": settings.EGOV_QR_ORG_BIN,
    }


def _build_step_xml(permit):
    """Тот же формат, что фронтенд подписывает через NCALayer (handleSign в PermitDetail.tsx)."""
    return (
        f"<WorkPermit>"
        f"<ID>{escape(str(permit.permit_id))}</ID>"
        f"<Date>{timezone.now().isoformat()}</Date>"
        f"</WorkPermit>"
    )


def _signed_content_matches(signed_xml, expected_xml):
    """Подписанный XML должен содержать ровно тот документ, который мы выдали этой сессии."""
    try:
        signed_root = ET.fromstring(signed_xml)
        expected_root = ET.fromstring(expected_xml)
    except ET.ParseError:
        return False
    if signed_root.tag != expected_root.tag:
        return False
    for tag in ('ID', 'Date'):
        if signed_root.findtext(tag) != expected_root.findtext(tag):
            return False
    return True


def _expiry_iso(dt):
    dt = dt.astimezone(dt_timezone.utc)
    return dt.strftime('%Y-%m-%dT%H:%M:%S.') + f'{dt.microsecond // 1000:03d}Z'


def _get_session_or_404(session_id):
    try:
        return EgovQrSession.objects.select_related('approval_step__permit').get(pk=session_id)
    except EgovQrSession.DoesNotExist:
        raise Http404


# ---------------------------------------------------------------------------
# Эндпоинты для фронтенда сайта (требуют авторизации)
# ---------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def egov_qr_config(request):
    """GET config/ — показывать ли кнопку «Подписать через eGov Mobile»."""
    return Response({"enabled": _is_enabled()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_egov_qr_session(request, permit_id):
    """
    POST start/<permit_id>/  (тело или query: role)

    Выбор шага повторяет логику permits.views.WorkPermitViewSet.sign.
    """
    _require_enabled()

    try:
        permit = WorkPermit.objects.get(pk=permit_id)
    except WorkPermit.DoesNotExist:
        return Response({"ok": False, "error": "Наряд не найден"}, status=404)

    if permit.status == 'DRAFT':
        return Response(
            {"ok": False, "error": "Сначала нажмите «Отправить на согласование» на странице наряда."},
            status=400,
        )

    user = request.user
    if not user.iin:
        return Response({"ok": False, "error": "Для подписания нужен ИИН в профиле."}, status=400)

    requested_role = request.data.get('role') or request.query_params.get('role')
    pending_steps = ApprovalStep.objects.filter(permit=permit, approver=user, status='PENDING')
    if not pending_steps.exists():
        return Response(
            {"ok": False, "error": "Вы не можете подписать этот наряд (нет активного шага)."},
            status=403,
        )

    if requested_role:
        step = pending_steps.filter(role=requested_role).first()
        if step is None:
            return Response(
                {"ok": False, "error": f"Роль '{requested_role}' не найдена среди ваших активных шагов."},
                status=400,
            )
    elif pending_steps.count() == 1:
        step = pending_steps.first()
    else:
        return Response(
            {"ok": False, "error": "У вас несколько активных ролей для подписания. Укажите параметр 'role'."},
            status=400,
        )

    egov_session = EgovQrSession.objects.create(
        approval_step=step,
        created_by=user,
        xml_to_sign=_build_step_xml(permit),
    )

    qr = qrcode.QRCode(box_size=8, border=2)
    qr.add_data(f"mobileSign:{_base_url()}/api/v1/egov_qr/init/{egov_session.id}/")
    qr.make(fit=True)
    buf = BytesIO()
    qr.make_image(fill_color="black", back_color="white").save(buf, format='PNG')

    return Response({
        "ok": True,
        "session_id": str(egov_session.id),
        "qr_code_base64": base64.b64encode(buf.getvalue()).decode('ascii'),
        "expires_at": egov_session.expires_at.isoformat(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_egov_qr_session(request, session_id):
    """GET status/<session_id>/ — сайт опрашивает, пока пользователь подписывает на телефоне."""
    _require_enabled()
    egov_session = _get_session_or_404(session_id)

    if egov_session.created_by_id != request.user.id:
        return Response({"ok": False, "error": "Нет доступа к этой сессии"}, status=403)

    if egov_session.status == EgovQrSession.STATUS_PENDING and timezone.now() >= egov_session.expires_at:
        egov_session.status = EgovQrSession.STATUS_EXPIRED
        egov_session.save(update_fields=['status'])

    return Response({
        "ok": True,
        "status": egov_session.status,
        "error": egov_session.error_message,
    })


# ---------------------------------------------------------------------------
# Публичные эндпоинты для eGov Mobile (API №1 и API №2)
# Без авторизации: доступ даёт только знание UUID сессии (показан в QR
# залогиненному пользователю), сессия живёт 10 минут и одноразовая.
# ---------------------------------------------------------------------------

class EgovQrInitView(APIView):
    """API №1 — GET init/<session_id>/"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, session_id):
        _require_enabled()
        egov_session = _get_session_or_404(session_id)
        if not egov_session.is_valid:
            return Response({"message": "Срок действия QR-кода истёк"}, status=410)

        step = egov_session.approval_step
        return Response({
            "description": f"Наряд-допуск №{step.permit.permit_id} — {step.get_role_display()}",
            "expiry_date": _expiry_iso(egov_session.expires_at),
            "organisation": _organisation_info(),
            "document": {
                "uri": f"{_base_url()}/api/v1/egov_qr/doc/{egov_session.id}/",
                "auth_type": "None",
            },
        })


class EgovQrDocView(APIView):
    """API №2 — GET (выдать XML на подпись) / PUT (принять подписанный XML) doc/<session_id>/"""
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, session_id):
        _require_enabled()
        egov_session = _get_session_or_404(session_id)
        if not egov_session.is_valid:
            return Response({"message": "Срок действия QR-кода истёк"}, status=410)

        step = egov_session.approval_step
        permit = step.permit
        return Response({
            "signMethod": "XML",
            "version": 1,
            "documentsToSign": [{
                "id": step.id,
                "nameRu": f"Наряд-допуск №{permit.permit_id}",
                "nameKz": f"№{permit.permit_id} рұқсат-наряды",
                "nameEn": f"Work permit №{permit.permit_id}",
                "documentXml": egov_session.xml_to_sign,
            }],
        })

    def put(self, request, session_id):
        _require_enabled()

        try:
            documents = request.data.get('documentsToSign') or []
            signed_xml = documents[0]['documentXml']
        except (AttributeError, IndexError, KeyError, TypeError):
            return Response({"message": "Некорректный формат ответа (нет documentXml)"}, status=400)
        if not isinstance(signed_xml, str) or not signed_xml:
            return Response({"message": "Некорректный формат ответа (нет documentXml)"}, status=400)

        with transaction.atomic():
            # Блокировка: повторный/параллельный PUT не должен согласовать шаг дважды
            try:
                egov_session = EgovQrSession.objects.select_for_update().get(pk=session_id)
            except EgovQrSession.DoesNotExist:
                raise Http404
            if not egov_session.is_valid:
                return Response({"message": "Срок действия QR-кода истёк"}, status=410)

            step = ApprovalStep.objects.select_for_update().get(pk=egov_session.approval_step_id)
            permit = step.permit
            user = egov_session.created_by

            def fail(message, http_status=400):
                egov_session.error_message = message
                egov_session.save(update_fields=['error_message'])
                logger.warning("eGov QR %s: %s", egov_session.id, message)
                return Response({"message": message}, status=http_status)

            # Шаг мог измениться, пока QR был на экране (отклонён, подписан через NCALayer и т.п.)
            if step.status != 'PENDING' or step.approver_id != user.id or permit.status == 'DRAFT':
                return fail("Этот шаг согласования уже неактивен. Обновите страницу наряда.", 409)

            if not _signed_content_matches(signed_xml, egov_session.xml_to_sign):
                return fail("Подписанный документ не совпадает с выданным на подпись.")

            # ---- Те же проверки ЭЦП, что в permits.views.WorkPermitViewSet.sign ----
            try:
                cert_info = parse_xml_signature_info(signed_xml)
            except Exception as e:
                return fail(f"Ошибка чтения ЭЦП: {e}")

            sign_iin = cert_info.get('iin')
            if not sign_iin or sign_iin != user.iin:
                return fail(f"ИИН в ЭЦП ({sign_iin}) не совпадает с вашим ({user.iin}).", 403)

            sign_bin = cert_info.get('bin')
            target_bin = user.bin if user.bin else '000000000000'
            if not sign_bin:
                return fail("Нужна ЭЦП юридического лица (GOST) с БИН.")
            if sign_bin != target_bin:
                return fail(f"БИН организации не совпадает ({sign_bin} != {target_bin}).")

            not_after = cert_info.get('not_after')
            if not_after and not_after < timezone.now().replace(tzinfo=None):
                return fail("Срок действия сертификата ЭЦП истёк.")

            # ---- Сохранение подписи шага (как в sign) ----
            now = timezone.now()
            step.status = 'APPROVED'
            step.signed_xml = signed_xml
            step.signed_at = now
            step.signer_details = {
                "iin": cert_info.get('iin'),
                "bin": cert_info.get('bin'),
                "fio": cert_info.get('subject'),
                "org_name": cert_info.get('org_name'),
                "date": now.isoformat(),
                "via": "egov_mobile_qr",
            }
            step.save()

            _advance_after_approval_step(permit, step, user)
            permit.save()

            egov_session.status = EgovQrSession.STATUS_SIGNED
            egov_session.signed_at = now
            egov_session.error_message = ''
            egov_session.save(update_fields=['status', 'signed_at', 'error_message'])

        return Response({"message": "success"}, status=200)
