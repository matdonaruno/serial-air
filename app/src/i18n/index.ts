import { Platform, NativeModules } from 'react-native';
import en from './en';
import ja from './ja';

export type Translations = typeof en;

const translations: Record<string, Translations> = { en, ja };

let _currentLang: string | null = null;

function getDeviceLanguage(): string {
  try {
    const { getLocales } = require('expo-localization');
    const locales = getLocales();
    const lang = locales?.[0]?.languageCode ?? 'en';
    console.log('[i18n] expo-localization:', lang, JSON.stringify(locales?.[0]));
    return translations[lang] ? lang : 'en';
  } catch (e) {
    console.log('[i18n] expo-localization failed, using fallback:', e);
    let locale = 'en';
    if (Platform.OS === 'ios') {
      locale =
        NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
        'en';
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier ?? 'en';
    }
    const lang = locale.split(/[-_]/)[0];
    console.log('[i18n] fallback locale:', locale, '→ lang:', lang);
    return translations[lang] ? lang : 'en';
  }
}

export function setLanguage(lang: string | null) {
  _currentLang = lang;
}

export function getLanguage(): string {
  return _currentLang ?? getDeviceLanguage();
}

export function t<K extends keyof Translations>(key: K): Translations[K] {
  const lang = getLanguage();
  return (translations[lang] ?? translations.en)[key];
}
