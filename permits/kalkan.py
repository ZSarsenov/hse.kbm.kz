import ctypes
import os
import glob
from ctypes import c_char_p, c_int, c_ulong, byref, POINTER

# Константы
KC_SIGN_CMS = 0x00000002
KC_IN_BASE64 = 0x00000010
KC_OUT_BASE64 = 0x00000800
KC_USE_NOTHING = 0x00000401
KC_CERT_CA = 0x00000201
KCR_OK = 0x00000000


class Kalkan:
    _lib = None
    _initialized = False

    def __init__(self, lib_path: str = "libkalkancryptwr-64.so"):
        """
        Загружает libkalkancryptwr-64.so один раз на весь процесс.

        - Если KC_Init есть в библиотеке — вызываем его и проверяем код возврата.
        - Если KC_Init НЕТ — не считаем это фатальной ошибкой, просто пишем предупреждение.
        """
        if Kalkan._lib is None:
            try:
                Kalkan._lib = ctypes.CDLL(lib_path)
                print(f"✅ KalkanCrypt библиотека загружена: {lib_path}")
            except OSError as e:
                raise RuntimeError(f"Не удалось загрузить {lib_path}: {e}")

        # Инициализируем один раз
        if not Kalkan._initialized:
            if hasattr(Kalkan._lib, 'KC_Init'):
                try:
                    Kalkan._lib.KC_Init.restype = c_int
                except Exception:
                    # На всякий случай, если restype нельзя назначить, просто пропустим
                    pass

                rc = Kalkan._lib.KC_Init()
                print(f"ℹ KC_Init → {rc}")
                if rc != KCR_OK:
                    raise RuntimeError(f"KC_Init вернул ошибку: {rc}")
            else:
                # ВАЖНО: больше НЕ падаем, просто предупреждаем
                print("⚠ KC_Init не найден в библиотеке, продолжаем без явной инициализации.")

            Kalkan._initialized = True


    def _load_library(self):
        if Kalkan._lib:
            return

        print("--- [DEBUG] Загрузка библиотек (v2.0.2) ---")

        # Строгий порядок загрузки для v2.0.2
        libs_to_preload = [
            "/opt/kalkancrypt/lib/libiconv.so",
            "libpcsclite.so.1",
            "/opt/kalkancrypt/lib/libkalkancrypto.so",  # Движок
            "/opt/kalkancrypt/lib/libxmlsec1.so",
            "/opt/kalkancrypt/lib/libxmlsec1-openssl.so",
            "/opt/kalkancrypt/lib/libltdl.so"
        ]

        for lib_path in libs_to_preload:
            try:
                ctypes.CDLL(lib_path, mode=ctypes.RTLD_GLOBAL)
            except OSError as e:
                print(f"⚠️ Пропуск {lib_path}: {e}")

        # Загружаем Обертку v2.0.2
        lib_name = "/opt/kalkancrypt/lib/libkalkancryptwr-64.so"
        try:
            Kalkan._lib = ctypes.CDLL(lib_name)
            print(f"🚀 УСПЕХ: {lib_name} загружена!")
        except OSError as e:
            raise OSError(f"Не удалось загрузить {lib_name}: {e}")

        # Настройка аргументов
        try:
            Kalkan._lib.VerifyData.restype = c_ulong
            Kalkan._lib.VerifyData.argtypes = [c_char_p, c_int, c_char_p, c_int, c_char_p, c_int, c_char_p,
                                               POINTER(c_int), c_char_p, POINTER(c_int), c_int, c_char_p,
                                               POINTER(c_int)]

            Kalkan._lib.KC_GetLastErrorString.restype = c_ulong
            Kalkan._lib.KC_GetLastErrorString.argtypes = [c_char_p, POINTER(c_int)]

            Kalkan._lib.VerifyXML.restype = c_ulong
            Kalkan._lib.VerifyXML.argtypes = [c_char_p, c_int, c_char_p, c_int, c_char_p, POINTER(c_int)]

            # В v2.0.2 эта функция точно должна быть
            if hasattr(Kalkan._lib, 'KC_LoadTrustedCerts'):
                Kalkan._lib.KC_LoadTrustedCerts.restype = c_ulong
                Kalkan._lib.KC_LoadTrustedCerts.argtypes = [c_char_p, c_int, c_int]
        except:
            pass

    def _init_kalkan(self):
        # Для 2.0.2 используем стандартный Init
        if hasattr(Kalkan._lib, 'KC_Init'):
            Kalkan._lib.KC_Init.restype = c_ulong
            Kalkan._lib.KC_Init.argtypes = []

        # Трюк с папкой /tmp всё еще полезен
        cwd = os.getcwd()
        try:
            os.chdir("/tmp")
        except:
            pass

        res = KCR_OK
        try:
            print("🔧 Пробую KC_Init (v2.0.2)...")
            res = Kalkan._lib.KC_Init()
        except AttributeError:
            # Если вдруг v2.0.2 тоже пустая - мы это увидим
            os.chdir(cwd)
            raise Exception("❌ Ошибка: В библиотеке нет KC_Init! Возможно файл поврежден.")

        os.chdir(cwd)

        if res != KCR_OK:
            err = res & 0xFFFFFFFF
            print(f"❌ Ошибка Init: {hex(err)}")
            # Пробуем продолжить, так как сертификаты мы грузим вручную ниже
        else:
            print("✅ Init прошел успешно!")

    def _load_trusted_certs(self):
        # Если функции нет (как было в 2.0.13), выходим
        if not hasattr(Kalkan._lib, 'KC_LoadTrustedCerts'):
            print("⚠️ KC_LoadTrustedCerts отсутствует в библиотеке.")
            return

        cert_dir = "/usr/local/share/ca-certificates/kalkan/"
        print(f"📂 Загрузка сертификатов из {cert_dir}...")

        certs = glob.glob(os.path.join(cert_dir, "*.crt")) + glob.glob(os.path.join(cert_dir, "*.cer"))
        count = 0

        for cert_path in certs:
            try:
                with open(cert_path, "rb") as f:
                    cert_data = f.read()
                ret = Kalkan._lib.KC_LoadTrustedCerts(cert_data, len(cert_data), KC_CERT_CA)
                if ret == KCR_OK:
                    count += 1
            except:
                pass

        print(f"✅ Загружено сертификатов: {count}")

    def verify_xml(self, xml_string: str) -> dict:
        """
        Принимает подписанный XML (как вернул NCALayer signXml)
        и прогоняет его через VerifyXML из libkalkancryptwr-64.so.

        Возвращает:
          - при успехе: {"valid": True, "signer": "...сырой текст...", "flags": "0x..."}
          - при ошибке: {"valid": False, "error": "...", "kc_error": "...", "code": "0x..."}
        """
        if not hasattr(Kalkan._lib, 'VerifyXML'):
            return {"valid": False, "error": "Метод VerifyXML отсутствует в библиотеке"}

        xml_bytes = xml_string.encode('utf-8')
        in_len = len(xml_bytes)

        out_buf = ctypes.create_string_buffer(65536)
        out_len = c_int(len(out_buf))

        # Пробуем несколько комбинаций флагов:
        flag_variants = [
            KC_USE_NOTHING,  # просто XML
            KC_SIGN_CMS | KC_USE_NOTHING,  # XML + флаг CMS
            KC_SIGN_CMS | KC_IN_BASE64 | KC_USE_NOTHING,  # на всякий случай, если где-то ждут base64
        ]

        last_ret = None

        for flags in flag_variants:
            out_len.value = len(out_buf)

            ret = Kalkan._lib.VerifyXML(
                None,  # alias (контейнер) нам не нужен для проверки XML
                flags,
                xml_bytes,
                in_len,
                out_buf,
                byref(out_len)
            )
            last_ret = ret
            print(f"🔍 VerifyXML(flags={hex(flags)}) → {hex(ret)}")

            if ret == KCR_OK:
                signer_info = out_buf.value.decode('utf-8', errors='ignore')
                return {
                    "valid": True,
                    "signer": signer_info,
                    "flags": hex(flags),
                }

        # Если ни один вариант не сработал — пробуем достать текст ошибки из KC_GetLastErrorString
        err_msg = ""
        if hasattr(Kalkan._lib, 'KC_GetLastErrorString'):
            try:
                err_buf = ctypes.create_string_buffer(4096)
                err_len = c_int(len(err_buf))
                Kalkan._lib.KC_GetLastErrorString(err_buf, byref(err_len))
                err_msg = err_buf.value.decode('utf-8', errors='ignore')
            except Exception:
                pass

        return {
            "valid": False,
            "error": f"VerifyXML завершился с кодом {hex(last_ret) if last_ret is not None else 'None'}",
            "kc_error": err_msg,
        }

