import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import kk from '../locales/kk.json';
import ru from '../locales/ru.json';

export const UI_LANGUAGE_KEY = 'ui_language';

const saved = localStorage.getItem(UI_LANGUAGE_KEY);
const initialLng = saved === 'kk' || saved === 'ru' ? saved : 'kk';

void i18n.use(initReactI18next).init({
  resources: {
    kk: { translation: kk },
    ru: { translation: ru },
  },
  lng: initialLng,
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

const setHtmlLang = (lng: string) => {
  document.documentElement.lang = lng === 'kk' ? 'kk' : 'ru';
};

setHtmlLang(initialLng);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(UI_LANGUAGE_KEY, lng);
  setHtmlLang(lng);
});

export default i18n;
