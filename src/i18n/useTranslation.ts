import React, { useSyncExternalStore } from 'react';
import { getLanguage, setLanguage, subscribeLanguage, t } from './i18n';
import type { Language, TranslationParams } from './types';

export interface UseTranslationReturn {
  t: (key: string, params?: TranslationParams, fallback?: string) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
  isPt: boolean;
  isEn: boolean;
}

export function useTranslation(): UseTranslationReturn {
  const hasDispatcher = Boolean(
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H ||
      (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher
        ?.current
  );

  let language: Language = 'pt-BR';

  if (hasDispatcher) {
    try {
      language = useSyncExternalStore(
        subscribeLanguage,
        getLanguage,
        getLanguage
      );
    } catch {
      language = getLanguage();
    }
  } else {
    language = getLanguage();
  }

  return {
    t,
    language,
    setLanguage,
    isPt: language === 'pt-BR',
    isEn: language === 'en',
  };
}
