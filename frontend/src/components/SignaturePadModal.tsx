import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const MEDIA_BASE = '/permits_scans';

export interface SignaturePadModalProps {
  open: boolean;
  memberLabel: string;
  onClose: () => void;
  onConfirm: (blob: Blob) => Promise<void>;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  open,
  memberLabel,
  onClose,
  onConfirm,
}) => {
  const padRef = useRef<SignatureCanvas>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  // Synchronize canvas internal pixel size with rendered size.
  // This fixes touch/mouse coordinate drift on phones.
  useEffect(() => {
    if (!open) return;
    const syncCanvasSize = () => {
      const sig = padRef.current;
      const wrapper = wrapperRef.current;
      if (!sig || !wrapper) return;

      const canvas = sig.getCanvas();
      const rect = wrapper.getBoundingClientRect();
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      const width = Math.max(Math.floor(rect.width), 1);
      const height = Math.max(Math.floor(rect.height), 1);

      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      }

      sig.clear();
    };

    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [open]);

  const handleClear = () => {
    padRef.current?.clear();
  };

  const handleConfirm = async () => {
    if (!padRef.current) return;
    const isEmpty = padRef.current.isEmpty();
    if (isEmpty) {
      alert('Нарисуйте подпись в поле выше.');
      return;
    }
    setSaving(true);
    try {
      const canvas = padRef.current.getCanvas();
      let blob: Blob;
      if (typeof canvas.toBlob === 'function') {
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Не удалось создать изображение'))),
            'image/png'
          );
        });
      } else {
        const dataUrl = padRef.current.toDataURL('image/png');
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }
      await onConfirm(blob);
      onClose();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения подписи.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Подпись: {memberLabel}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          <div
            ref={wrapperRef}
            className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden h-48"
          >
            <SignatureCanvas
              ref={padRef}
              canvasProps={{
                className: 'w-full h-full touch-none',
                style: { touchAction: 'none' },
              }}
              backgroundColor="rgb(248, 250, 252)"
              penColor="#1e40af"
              minWidth={1.2}
              maxWidth={2.2}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Распишитесь пальцем или мышью</p>
        </div>
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Очистить
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Сохранение…' : 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export function getSignatureUrl(path: string | null | undefined): string {
  if (!path) return '';
  const base = MEDIA_BASE.endsWith('/') ? MEDIA_BASE : MEDIA_BASE + '/';
  return path.startsWith('http') ? path : base + path;
}
