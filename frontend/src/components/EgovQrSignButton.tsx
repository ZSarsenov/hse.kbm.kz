import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, X } from 'lucide-react';

// Кнопка «Подписать через eGov Mobile» + окно с QR-кодом.
// Показывается, только если бэкенд включил функцию (EGOV_QR_ENABLED) —
// при любой ошибке запроса конфигурации кнопка просто не появляется.

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Token ${localStorage.getItem('auth_token')}`,
});

let enabledPromise: Promise<boolean> | null = null;
const fetchEnabled = (): Promise<boolean> => {
  if (!enabledPromise) {
    enabledPromise = fetch('/api/v1/egov_qr/config/', { headers: authHeaders() })
      .then(r => (r.ok ? r.json() : { enabled: false }))
      .then(d => d.enabled === true)
      .catch(() => false);
  }
  return enabledPromise;
};

// Сайт открыт на самом телефоне — QR отсканировать нечем, поэтому даём ссылку,
// которая открывает eGov Mobile на этом же устройстве (кросс-подписание).
const mobilePlatform = (): 'ios' | 'android' | null => {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  // iPadOS 13+ представляется как Mac, но с сенсорным экраном
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return null;
};

interface ModalProps {
  permitId: number | string;
  role?: string;
  onClose: () => void;
  onSigned: () => void;
}

const EgovQrSignModal: React.FC<ModalProps> = ({ permitId, role, onClose, onSigned }) => {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);
  const [mobileLink, setMobileLink] = useState<string | null>(null);
  const [showQrOnMobile, setShowQrOnMobile] = useState(false);
  const platform = mobilePlatform();
  const onSignedRef = useRef(onSigned);
  onSignedRef.current = onSigned;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/v1/egov_qr/start/${permitId}/`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(role ? { role } : {}),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setError(data.error || 'Не удалось создать QR-код');
          return;
        }
        setQrImage(`data:image/png;base64,${data.qr_code_base64}`);
        setSessionId(data.session_id);
        if (platform) setMobileLink(platform === 'ios' ? data.mobile_link_ios : data.mobile_link_android);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Ошибка сети');
      }
    })();
    return () => { cancelled = true; };
  }, [permitId, role]);

  useEffect(() => {
    if (!sessionId) return;
    let done = false;
    const check = async () => {
      if (done) return;
      try {
        const res = await fetch(`/api/v1/egov_qr/status/${sessionId}/`, { headers: authHeaders() });
        const data = await res.json();
        if (done) return;
        if (data.status === 'SIGNED') {
          done = true;
          window.clearInterval(timer);
          onSignedRef.current();
        } else if (data.status === 'EXPIRED') {
          done = true;
          window.clearInterval(timer);
          setError('Время действия QR-кода истекло. Закройте окно и попробуйте снова.');
        } else {
          setSignError(data.error || null);
        }
      } catch {
        // разовый сбой опроса — просто ждём следующую попытку
      }
    };
    const timer = window.setInterval(check, 2000);
    // Возврат из eGov Mobile в браузер: проверяем сразу, не дожидаясь таймера
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      done = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [sessionId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" aria-label="Закрыть">
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold mb-4">Подписание через eGov Mobile</h3>

        {error && (
          <div className="text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 text-sm mb-4">{error}</div>
        )}

        {qrImage && !error && mobileLink && !showQrOnMobile && (
          <>
            <a
              href={mobileLink}
              className="w-full px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Smartphone size={18} />
              Открыть eGov Mobile
            </a>
            <p className="text-sm text-gray-500 mt-4">
              Подпишите документ в приложении eGov Mobile и вернитесь в браузер —
              это окно закроется само.
            </p>
            <button onClick={() => setShowQrOnMobile(true)} className="text-sm text-blue-600 hover:underline mt-3">
              Подписать с другого телефона (показать QR)
            </button>
          </>
        )}

        {qrImage && !error && (!mobileLink || showQrOnMobile) && (
          <>
            <img src={qrImage} alt="QR-код для подписания" className="mx-auto w-56 h-56" />
            <p className="text-sm text-gray-500 mt-4">
              Откройте приложение eGov Mobile, выберите «Сканировать QR» и наведите камеру на код.
              После подписания на телефоне это окно закроется само.
            </p>
          </>
        )}

        {qrImage && !error && signError && (
          <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mt-4">{signError}</div>
        )}

        {!qrImage && !error && <p className="text-gray-500 text-sm py-10">Генерация QR-кода...</p>}

        <button onClick={onClose} className="mt-6 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          Отмена
        </button>
      </div>
    </div>
  );
};

interface ButtonProps {
  permitId: number | string;
  role?: string;
  onSigned: () => void;
  disabled?: boolean;
  compact?: boolean; // маленькая кнопка для таблиц (электро-наряды)
}

export const EgovQrSignButton: React.FC<ButtonProps> = ({ permitId, role, onSigned, disabled, compact }) => {
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchEnabled().then(v => { if (!cancelled) setEnabled(v); });
    return () => { cancelled = true; };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={compact
          ? 'mt-1 px-3 py-1 rounded text-[10px] font-medium inline-flex items-center gap-1 border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50'
          : 'flex-1 sm:flex-none px-6 py-2.5 rounded-lg font-medium shadow-sm flex items-center justify-center gap-2 transition-all border border-blue-600 text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed'}
      >
        <Smartphone size={compact ? 12 : 18} />
        {mobilePlatform() ? 'eGov Mobile' : 'eGov Mobile (QR)'}
      </button>
      {open && (
        <EgovQrSignModal
          permitId={permitId}
          role={role}
          onClose={() => setOpen(false)}
          onSigned={() => { setOpen(false); onSigned(); }}
        />
      )}
    </>
  );
};
