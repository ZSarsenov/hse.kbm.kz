import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Стилизованный диалог подтверждения взамен window.confirm().
 *
 * Использование: смонтируйте <ConfirmDialog /> один раз в корне приложения,
 * а в любом месте вызывайте импортированную функцию confirm(...):
 *
 *   const ok = await confirm({ message: 'Удалить наряд?', danger: true, confirmText: 'Удалить' });
 *   if (!ok) return;
 */

export interface ConfirmOptions {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  /** Красная (опасная) кнопка подтверждения вместо синей */
  danger?: boolean;
}

type Listener = (opts: ConfirmOptions) => Promise<boolean>;

let listener: Listener | null = null;

/** Показать диалог подтверждения. Разрешается true (подтвердил) / false (отменил). */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  // Пока компонент не смонтирован — нативный fallback
  if (!listener) return Promise.resolve(window.confirm(opts.message));
  return listener(opts);
}

interface State extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export const ConfirmDialog: React.FC = () => {
  const [state, setState] = useState<State | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(cardRef, !!state);

  const handle = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  useEffect(() => {
    listener = handle;
    return () => { listener = null; };
  }, [handle]);

  const close = (result: boolean) => {
    if (state) state.resolve(result);
    setState(null);
  };

  // Escape — отмена, Enter — подтверждение
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Enter') { e.preventDefault(); close(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Фокус: для опасных действий — на «Отмену», для обычных — на подтверждение
  useEffect(() => {
    if (!state) return;
    (state.danger ? cancelBtnRef.current : confirmBtnRef.current)?.focus();
  }, [state]);

  if (!state) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(false); }}
    >
      <style>{`
        @keyframes dlg-pop { from { opacity: 0; transform: scale(.96) translateY(6px); } to { opacity: 1; transform: none; } }
        .dlg-pop { animation: dlg-pop .18s cubic-bezier(.23, 1, .32, 1) both; }
        @media (prefers-reduced-motion: reduce) { .dlg-pop { animation: none; } }
      `}</style>

      <div
        ref={cardRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={state.title || state.message}
        className="dlg-pop w-full max-w-sm bg-white rounded-2xl border border-slate-200/80 shadow-[0_24px_64px_-16px_rgba(6,32,58,0.35)] overflow-hidden"
      >
        <div className="p-5 flex gap-3.5">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
            state.danger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'
          }`}>
            {state.danger ? <AlertTriangle size={22} /> : <HelpCircle size={22} />}
          </div>
          <div className="min-w-0 pt-0.5">
            {state.title && (
              <h3 className="font-bold text-slate-900 text-base leading-snug">{state.title}</h3>
            )}
            <p className={`text-sm text-slate-500 leading-relaxed whitespace-pre-line ${state.title ? 'mt-1' : 'text-slate-700 font-medium'}`}>
              {state.message}
            </p>
          </div>
        </div>

        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex justify-end gap-2">
          <button
            ref={cancelBtnRef}
            onClick={() => close(false)}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200/70 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {state.cancelText || 'Отмена'}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={() => close(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              state.danger
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-300'
                : 'bg-[#0A3D62] hover:bg-[#0C4A77] focus:ring-blue-300'
            }`}
          >
            {state.confirmText || 'Подтвердить'}
          </button>
        </div>
      </div>
    </div>
  );
};
