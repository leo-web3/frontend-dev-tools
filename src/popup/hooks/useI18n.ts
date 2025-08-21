import { useExtensionStore } from './useExtensionStore';
import { getTranslation, type Language, type I18nKeys } from '@/shared/i18n';

export const useI18n = () => {
  const { globalSettings } = useExtensionStore();
  
  const t = (key: keyof I18nKeys): string => {
    return getTranslation(globalSettings.language as Language, key);
  };
  
  const formatMessage = (key: keyof I18nKeys, ...args: (string | number)[]): string => {
    const message = t(key);
    return args.reduce((acc, arg, index) => {
      return acc.replace(`{${index}}`, String(arg));
    }, message);
  };
  
  return {
    t,
    formatMessage,
    language: globalSettings.language,
  };
};