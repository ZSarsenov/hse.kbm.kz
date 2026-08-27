import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { PermitCategory } from '../types';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface PermitTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: PermitCategory) => void;
}

export const PermitTypeSelector: React.FC<PermitTypeSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useTranslation();
  const cardRef = useRef<HTMLDivElement>(null);
  useFocusTrap(cardRef, isOpen);

  // Escape — закрыть окно
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <style>{`
        @keyframes pts-pop { from { opacity: 0; transform: scale(.97) translateY(8px); } to { opacity: 1; transform: none; } }
        .pts-pop { animation: pts-pop .18s cubic-bezier(.23, 1, .32, 1) both; }
        @media (prefers-reduced-motion: reduce) { .pts-pop { animation: none; } }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div ref={cardRef} role="dialog" aria-modal="true" aria-label={t('permitType.title')} className="pts-pop relative bg-white w-full max-w-xl rounded-2xl border border-slate-200/80 shadow-[0_24px_64px_-16px_rgba(6,32,58,0.35)] overflow-hidden">

        {/* Header — в стиле секций форм: капитель + графитовое подчёркивание */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b-2 border-slate-900">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.18em] mb-1">
              {t('permitType.footer')}
            </p>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('permitType.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mt-1 -mr-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label={t('permitType.title')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Варианты */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Наряд повышенной опасности */}
          <button
            onClick={() => onSelect(PermitCategory.DANGEROUS)}
            className="group relative text-left p-5 bg-white border border-slate-200 rounded-xl transition-all duration-200 hover:border-[#0A3D62] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0A3D62]/20"
          >
            <span className="absolute top-4 right-4 text-[11px] font-bold font-mono text-slate-300 group-hover:text-slate-400 transition-colors">01</span>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5 pr-8">
              {t('permitType.dangerousTitle')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {t('permitType.dangerousDesc')}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A3D62] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              {t('permitType.select')} <ArrowRight size={14} />
            </span>
          </button>

          {/* Наряд для электроустановок */}
          <button
            onClick={() => onSelect(PermitCategory.ELECTRICAL)}
            className="group relative text-left p-5 bg-white border border-slate-200 rounded-xl transition-all duration-200 hover:border-[#0A3D62] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0A3D62]/20"
          >
            <span className="absolute top-4 right-4 text-[11px] font-bold font-mono text-slate-300 group-hover:text-slate-400 transition-colors">02</span>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5 pr-8">
              {t('permitType.electricalTitle')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              {t('permitType.electricalDesc')}
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A3D62] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              {t('permitType.select')} <ArrowRight size={14} />
            </span>
          </button>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.18em] font-semibold">
            {t('permitType.footer')}
          </p>
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors"
          >
            {t('permitType.cancel')}
          </button>
        </div>

      </div>
    </div>
  );
};
