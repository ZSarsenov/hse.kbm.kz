import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const lng = i18n.language?.startsWith('kk') ? 'kk' : 'ru';

  return (
    <div
      className={`inline-flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 text-sm font-semibold shadow-sm ${className}`}
      role="group"
      aria-label={t('lang.kkShort') + ' / ' + t('lang.ruShort')}
    >
      <button
        type="button"
        onClick={() => void i18n.changeLanguage('kk')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          lng === 'kk' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        {t('lang.kkShort')}
      </button>
      <button
        type="button"
        onClick={() => void i18n.changeLanguage('ru')}
        className={`px-2.5 py-1 rounded-md transition-colors ${
          lng === 'ru' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        {t('lang.ruShort')}
      </button>
    </div>
  );
};
