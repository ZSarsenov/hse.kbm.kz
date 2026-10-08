from datetime import datetime, timedelta
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from permits.models import ApprovalStep, WorkPermit, WorkPermitTemplate
from users.models import User

from .models import EgovQrSession

ENABLED = dict(EGOV_QR_ENABLED=True, EGOV_QR_ORG_BIN='123456789012', EGOV_QR_BASE_URL='https://example.kz')


def _cert_info(iin='900101300111', bin_='000000000000'):
    return {
        'subject': 'CN=TEST', 'issuer': 'CN=CA', 'iin': iin, 'bin': bin_, 'org_name': 'ORG',
        'not_before': datetime(2020, 1, 1), 'not_after': datetime(2099, 1, 1),
    }


def _signed(xml):
    # eGov Mobile возвращает исходный документ с вложенным ds:Signature
    return xml.replace('</WorkPermit>', '<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#"/></WorkPermit>')


@override_settings(**ENABLED)
class EgovQrFlowTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='signer', password='x', iin='900101300111', tabel_number='T1')
        other = User.objects.create_user(username='next', password='x', iin='900101300222', tabel_number='T2')
        template = WorkPermitTemplate.objects.create(name='Test template')
        self.permit = WorkPermit.objects.create(
            permit_id='TEST-1', initiator=self.user, template=template, status='PENDING_APPROVAL',
        )
        self.step = ApprovalStep.objects.create(
            permit=self.permit, approver=self.user, step_order=1, role='ISSUER', status='PENDING',
        )
        self.next_step = ApprovalStep.objects.create(
            permit=self.permit, approver=other, step_order=2, role='ADMITTING', status='WAITING',
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.anon = APIClient()

    def _start(self):
        res = self.client.post(f'/api/v1/egov_qr/start/{self.permit.id}/', {'role': 'ISSUER'}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        return EgovQrSession.objects.get(pk=res.data['session_id'])

    def _put(self, session, xml):
        return self.anon.put(
            f'/api/v1/egov_qr/doc/{session.id}/',
            {'signMethod': 'XML', 'documentsToSign': [{'id': self.step.id, 'documentXml': xml}]},
            format='json',
        )

    def test_full_flow_approves_step(self):
        session = self._start()

        init = self.anon.get(f'/api/v1/egov_qr/init/{session.id}/')
        self.assertEqual(init.status_code, 200)
        self.assertEqual(init.data['document']['uri'], f'https://example.kz/api/v1/egov_qr/doc/{session.id}/')

        doc = self.anon.get(f'/api/v1/egov_qr/doc/{session.id}/')
        self.assertEqual(doc.data['documentsToSign'][0]['documentXml'], session.xml_to_sign)

        with mock.patch('egov_qr.views.parse_xml_signature_info', return_value=_cert_info()):
            res = self._put(session, _signed(session.xml_to_sign))
        self.assertEqual(res.status_code, 200, res.data)

        self.step.refresh_from_db()
        self.next_step.refresh_from_db()
        self.assertEqual(self.step.status, 'APPROVED')
        self.assertEqual(self.step.signer_details['via'], 'egov_mobile_qr')
        self.assertEqual(self.next_step.status, 'PENDING')

        status_res = self.client.get(f'/api/v1/egov_qr/status/{session.id}/')
        self.assertEqual(status_res.data['status'], 'SIGNED')

    def test_second_put_is_rejected(self):
        session = self._start()
        with mock.patch('egov_qr.views.parse_xml_signature_info', return_value=_cert_info()):
            self.assertEqual(self._put(session, _signed(session.xml_to_sign)).status_code, 200)
            self.assertEqual(self._put(session, _signed(session.xml_to_sign)).status_code, 410)

    def test_other_document_is_rejected(self):
        session = self._start()
        foreign = '<WorkPermit><ID>TEST-1</ID><Date>2020-01-01T00:00:00</Date></WorkPermit>'
        with mock.patch('egov_qr.views.parse_xml_signature_info', return_value=_cert_info()):
            res = self._put(session, _signed(foreign))
        self.assertEqual(res.status_code, 400)
        self.step.refresh_from_db()
        self.assertEqual(self.step.status, 'PENDING')

    def test_wrong_iin_is_rejected_and_reported(self):
        session = self._start()
        with mock.patch('egov_qr.views.parse_xml_signature_info', return_value=_cert_info(iin='111111111111')):
            res = self._put(session, _signed(session.xml_to_sign))
        self.assertEqual(res.status_code, 403)
        self.step.refresh_from_db()
        self.assertEqual(self.step.status, 'PENDING')
        status_res = self.client.get(f'/api/v1/egov_qr/status/{session.id}/')
        self.assertEqual(status_res.data['status'], 'PENDING')
        self.assertIn('ИИН', status_res.data['error'])

    def test_expired_session(self):
        session = self._start()
        EgovQrSession.objects.filter(pk=session.pk).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.anon.get(f'/api/v1/egov_qr/init/{session.id}/').status_code, 410)
        self.assertEqual(self.client.get(f'/api/v1/egov_qr/status/{session.id}/').data['status'], 'EXPIRED')

    def test_user_without_pending_step_cannot_start(self):
        self.step.status = 'APPROVED'
        self.step.save()
        res = self.client.post(f'/api/v1/egov_qr/start/{self.permit.id}/', {'role': 'ISSUER'}, format='json')
        self.assertEqual(res.status_code, 403)

    def test_personal_certificate_without_bin_is_accepted(self):
        # Личная ЭЦП из eGov Mobile: сертификат физлица, БИН нет
        session = self._start()
        with mock.patch('egov_qr.views.parse_xml_signature_info', return_value=_cert_info(bin_=None)):
            res = self._put(session, _signed(session.xml_to_sign))
        self.assertEqual(res.status_code, 200, res.data)
        self.step.refresh_from_db()
        self.assertEqual(self.step.status, 'APPROVED')
        self.assertEqual(self.step.signer_details['cert_type'], 'personal')

    def test_other_organisation_certificate_is_rejected(self):
        session = self._start()
        with mock.patch('egov_qr.views.parse_xml_signature_info', return_value=_cert_info(bin_='111111111111')):
            res = self._put(session, _signed(session.xml_to_sign))
        self.assertEqual(res.status_code, 400)
        self.step.refresh_from_db()
        self.assertEqual(self.step.status, 'PENDING')

    def test_start_returns_cross_sign_links(self):
        res = self.client.post(f'/api/v1/egov_qr/start/{self.permit.id}/', {'role': 'ISSUER'}, format='json')
        init_url = f'https://example.kz/api/v1/egov_qr/init/{res.data["session_id"]}/'
        self.assertEqual(
            res.data['mobile_link_ios'],
            f'https://mgovsign.page.link/?link={init_url}&isi=1476128386&ibi=kz.egov.mobile',
        )
        self.assertEqual(
            res.data['mobile_link_android'],
            f'https://mgovsign.page.link/?link={init_url}&apn=kz.mobile.mgov',
        )

    def test_electrical_graphic_roles_cannot_use_qr(self):
        # В ELECTRICAL_NEW Допускающий и Производитель подписывают графически — QR для них запрещён
        self.permit.data = {'category': 'ELECTRICAL_NEW'}
        self.permit.save()
        self.step.role = 'ADMITTING'
        self.step.save()
        res = self.client.post(f'/api/v1/egov_qr/start/{self.permit.id}/', {'role': 'ADMITTING'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertFalse(EgovQrSession.objects.exists())

    def test_electrical_issuer_can_use_qr(self):
        self.permit.data = {'category': 'ELECTRICAL_NEW'}
        self.permit.save()
        session = self._start()
        with mock.patch('egov_qr.views.parse_xml_signature_info', return_value=_cert_info()):
            res = self._put(session, _signed(session.xml_to_sign))
        self.assertEqual(res.status_code, 200, res.data)


class EgovQrDisabledTests(TestCase):
    """По умолчанию функция выключена: публичные эндпоинты не отвечают."""

    def test_disabled_by_default(self):
        user = User.objects.create_user(username='u', password='x', iin='900101300333', tabel_number='T3')
        client = APIClient()
        client.force_authenticate(user)
        self.assertEqual(client.get('/api/v1/egov_qr/config/').data, {'enabled': False})
        self.assertEqual(client.post('/api/v1/egov_qr/start/1/').status_code, 404)
        self.assertEqual(APIClient().get('/api/v1/egov_qr/init/00000000-0000-0000-0000-000000000000/').status_code, 404)
