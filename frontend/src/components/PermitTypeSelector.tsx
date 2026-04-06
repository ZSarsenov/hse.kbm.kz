import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { PermitCategory } from '../types';

interface PermitTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (category: PermitCategory) => void;
}

export const PermitTypeSelector: React.FC<PermitTypeSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900">{t('permitType.title')}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Selection Cards */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Option A: Dangerous Work */}
          <button 
            onClick={() => onSelect(PermitCategory.DANGEROUS)}
            className="group flex flex-col items-center text-center p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
              {t('permitType.dangerousTitle')}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {t('permitType.dangerousDesc')}
            </p>
          </button>

          {/* Option B: Electrical Work */}
          <button 
            onClick={() => onSelect(PermitCategory.ELECTRICAL)}
            className="group flex flex-col items-center text-center p-8 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">
              Наряд для работы в электроустановках
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Работы в действующих электроустановках под напряжением и со снятием напряжения.
            </p>
          </button>

        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {t('permitType.footer')}
          </p>
        </div>

      </div>
    </div>
  );
};
