import React from 'react';
import { useTranslation } from '../i18n';

export const LanguageSwitch: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      className="lang-switch inline-flex items-center rounded-xl border border-stone-200/80 bg-stone-100/80 p-0.5 shadow-xs dark:border-[#1E2B45] dark:bg-[#111A2E]/80"
      role="group"
      aria-label={t('nav.selectLanguage', undefined, 'Selecionar idioma')}
      data-i18n-aria-label="nav.selectLanguage"
    >
      <button
        type="button"
        role="button"
        aria-pressed={language === 'pt-BR'}
        aria-label={t('nav.langPtLabel', undefined, 'Português (Brasil)')}
        onClick={() => setLanguage('pt-BR')}
        data-i18n="nav.langPt"
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-150 select-none cursor-pointer min-h-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
          language === 'pt-BR'
            ? 'bg-white text-stone-900 shadow-xs font-bold border border-stone-200/60 dark:bg-slate-700 dark:text-emerald-400 dark:border-slate-600'
            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        PT
      </button>
      <button
        type="button"
        role="button"
        aria-pressed={language === 'en'}
        aria-label={t('nav.langEnLabel', undefined, 'English')}
        onClick={() => setLanguage('en')}
        data-i18n="nav.langEn"
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-150 select-none cursor-pointer min-h-[32px] inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${
          language === 'en'
            ? 'bg-white text-stone-900 shadow-xs font-bold border border-stone-200/60 dark:bg-slate-700 dark:text-emerald-400 dark:border-slate-600'
            : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        EN
      </button>
    </div>
  );
};
