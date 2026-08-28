import React from 'react';
import { Check } from 'lucide-react';

export interface StepperStep {
  id: string | number;
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Индекс активного шага (0-based) */
  currentIdx: number;
  onSelect: (id: string | number) => void;
}

/**
 * Единый степпер форм нарядов: круги с номерами/галочками и соединители.
 * Живёт в шапке формы (не «липкий») — общий для опасного и электро-наряда.
 */
export const Stepper: React.FC<StepperProps> = ({ steps, currentIdx, onSelect }) => (
  <div className="bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-start">
      {steps.map((step, idx) => (
        <React.Fragment key={step.id}>
          {idx > 0 && (
            <div className={`flex-1 h-0.5 mt-[15px] mx-1 rounded-full transition-colors ${currentIdx >= idx ? 'bg-[#0A3D62]' : 'bg-slate-200'}`} />
          )}
          <button
            type="button"
            onClick={() => onSelect(step.id)}
            className="flex flex-col items-center gap-1.5 group min-w-[56px] sm:min-w-[64px]"
          >
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              idx < currentIdx
                ? 'bg-[#0A3D62] border-[#0A3D62] text-white'
                : idx === currentIdx
                  ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-300 group-hover:text-blue-500'
            }`}>
              {idx < currentIdx ? <Check size={16} strokeWidth={3} /> : idx + 1}
            </span>
            <span className={`text-[11px] font-semibold leading-tight text-center transition-colors ${
              idx === currentIdx
                ? 'text-blue-700'
                : idx < currentIdx
                  ? 'text-slate-600'
                  : 'text-slate-400 group-hover:text-blue-500'
            }`}>
              {step.label}
            </span>
          </button>
        </React.Fragment>
      ))}
    </div>
  </div>
);
