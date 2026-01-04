import base64
import datetime
import xml.etree.ElementTree as ET

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509.oid import NameOID


XMLDSIG_NS = "http://www.w3.org/2000/09/xmldsig#"
NS = {"ds": XMLDSIG_NS}


def parse_xml_signature_info(signed_xml: str) -> dict:
    """
    Разбирает подписанный XML (ответ NCALayer signXml) и вытаскивает информацию
    о сертификате подписанта.

    Возвращает dict:
      {
        "subject": "... полный DN ...",
        "issuer": "...",
        "not_before": datetime,
        "not_after": datetime,
        "iin": "931005300182" или None,
        "bin": "950540000524" или None,
        "org_name": "Акционерное общество \"Каражанбасмунай\"" или None,
      }

    Если что-то критично не найдено — кидает ValueError.
    """
    # --- XML парсинг ---
    try:
        root = ET.fromstring(signed_xml)
    except ET.ParseError as e:
        raise ValueError(f"Некорректный XML: {e}") from e

    cert_el = root.find(".//ds:X509Certificate", NS)
    if cert_el is None or not (cert_el.text and cert_el.text.strip()):
        raise ValueError("Не найден ds:X509Certificate в XML подписи")

    cert_b64 = "".join(cert_el.text.split())
    try:
        cert_der = base64.b64decode(cert_b64)
    except Exception as e:
        raise ValueError(f"Не удалось декодировать Base64 сертификата: {e}") from e

    # --- X.509 сертификат ---
    try:
        cert = x509.load_der_x509_certificate(cert_der, default_backend())
    except Exception as e:
        raise ValueError(f"Не удалось распарсить сертификат X.509: {e}") from e

    subject_dn = cert.subject
    issuer_dn = cert.issuer

    subject = subject_dn.rfc4514_string()
    issuer = issuer_dn.rfc4514_string()
    not_before = cert.not_valid_before
    not_after = cert.not_valid_after

    # --- Достаём SERIALNUMBER (для IIN/BIN) ---
    try:
        serial_attrs = subject_dn.get_attributes_for_oid(NameOID.SERIAL_NUMBER)
        serial = serial_attrs[0].value if serial_attrs else ""
    except Exception:
        serial = ""

    iin = None
    bin_ = None

    if serial:
        serial_u = serial.upper().replace(" ", "")
        if serial_u.startswith("IIN"):
            iin = serial_u[3:]
        elif serial_u.startswith("BIN"):
            bin_ = serial_u[3:]

    # --- Достаём OU (organizationalUnit) и пытаемся найти там BIN ---
    try:
        ou_attrs = subject_dn.get_attributes_for_oid(NameOID.ORGANIZATIONAL_UNIT_NAME)
    except Exception:
        ou_attrs = []

    for ou in ou_attrs:
        val_u = ou.value.upper().replace(" ", "")
        # Пример: "BIN950540000524"
        if "BIN" in val_u and bin_ is None:
            # вытащим подряд идущие цифры
            digits = "".join(ch for ch in val_u if ch.isdigit())
            if len(digits) == 12:
                bin_ = digits

    # --- Наименование организации (O=...) ---
    org_name = None
    try:
        org_attrs = subject_dn.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)
        if org_attrs:
            org_name = org_attrs[0].value
    except Exception:
        org_name = None

    return {
        "subject": subject,
        "issuer": issuer,
        "not_before": not_before,
        "not_after": not_after,
        "iin": iin,
        "bin": bin_,
        "org_name": org_name,
    }
