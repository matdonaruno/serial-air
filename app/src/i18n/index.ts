import { Platform, NativeModules } from 'react-native';
import en from './en';
import ja from './ja';
import zh from './zh';
import zhTW from './zh-TW';
import ko from './ko';
import th from './th';
import vi from './vi';
import id from './id';
import hi from './hi';
import de from './de';
import fr from './fr';
import es from './es';
import pt from './pt';
import it from './it';
import ru from './ru';
import ar from './ar';

export type Translations = typeof en;

const translations: Record<string, Translations> = {
  en,
  ja,
  zh,
  'zh-TW': zhTW,
  ko,
  th,
  vi,
  id,
  hi,
  de,
  fr,
  es,
  pt,
  it,
  ru,
  ar,
};

let _currentLang: string | null = null;

function getDeviceLanguage(): string {
  try {
    const { getLocales } = require('expo-localization');
    const locales = getLocales();
    const locale = locales?.[0];
    const lang = locale?.languageCode ?? 'en';
    const region = locale?.regionCode;
    console.log('[i18n] expo-localization:', lang, region, JSON.stringify(locale));

    // Check for region-specific variant first (e.g. zh-TW)
    if (region) {
      const langRegion = `${lang}-${region}`;
      if (translations[langRegion]) return langRegion;
    }

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

    // Try full locale first (e.g. zh-TW, zh-Hant)
    const parts = locale.split(/[-_]/);
    const lang = parts[0];
    const region = parts[1];

    if (region) {
      const langRegion = `${lang}-${region}`;
      if (translations[langRegion]) return langRegion;
      // Map zh-Hant to zh-TW
      if (lang === 'zh' && (region === 'Hant' || region === 'TW' || region === 'HK')) {
        return translations['zh-TW'] ? 'zh-TW' : (translations[lang] ? lang : 'en');
      }
    }

    console.log('[i18n] fallback locale:', locale, '-> lang:', lang);
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
