import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

/**
 * Всплывающие уведомления (тосты) в фирменном стиле — взамен window.alert().
 *
 * Использование: смонтируйте <Toasts /> один раз в корне приложения и вызывайте
 * из любого места:
 *
 *   toast({ message: 'Наряд удалён', type: 'success' });
 *   toast({ message: 'Ошибка соединения', type: 'error' });
 */

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  /** Время жизни, мс (по умолчанию 4000) */
  duration?: number;
}

interface Item {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  duration: number;
}

let push: ((t: Item) => void) | null = null;

/** Показать всплывающее уведомление */
export function toast(opts: ToastOptions) {
  push?.({
    id: Date.now() + Math.random(),
    message: opts.message,
    type: opts.type || 'info',
    duration: opts.duration ?? 4000,
  });
}

const STYLES: Record<Item['type'], { chip: string; icon: React.ReactNode }> = {
  success: { chip: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle2 size={20} /> },
  error: { chip: 'bg-red-50 text-red-500', icon: <AlertCircle size={20} /> },
  info: { chip: 'bg-blue-50 text-blue-600', icon: <Info size={20} /> },
};

export const Toasts: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    push = (t) => {
      setItems(prev => [...prev, t]);
      window.setTimeout(() => {
        setItems(prev => prev.filter(x => x.id !== t.id));
      }, t.duration);
    };
    return () => { push = null; };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[210] flex flex-col gap-2 max-w-[calc(100vw-32px)]">
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
        .toast-in { animation: toast-in .18s cubic-bezier(.23, 1, .32, 1) both; }
        @media (prefers-reduced-motion: reduce) { .toast-in { animation: none; } }
      `}</style>
      {items.map(item => (
        <div
          key={item.id}
          role="status"
          onClick={() => setItems(prev => prev.filter(x => x.id !== item.id))}
          className="toast-in cursor-pointer bg-white border border-slate-200/80 rounded-xl shadow-[0_16px_48px_-12px_rgba(6,32,58,0.28)] pl-3 pr-4 py-3 flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${STYLES[item.type].chip}`}>
            {STYLES[item.type].icon}
          </div>
          <p className="text-sm font-medium text-slate-700 leading-snug">{item.message}</p>
        </div>
      ))}
    </div>
  );
};
