import zhCN from './zh-CN.js';
import ja from './ja.js';
import en from './en.js';

const translations = { 'zh-CN': zhCN, ja, en };

let currentLang = 'zh-CN';

// Language detection on module load
try {
  const stored = localStorage.getItem('lang');
  if (stored && translations[stored]) {
    currentLang = stored;
  } else {
    const navLang = navigator.language;
    if (navLang.startsWith('ja')) currentLang = 'ja';
    else if (navLang.startsWith('en')) currentLang = 'en';
    // else keep 'zh-CN'
  }
} catch {
  // localStorage unavailable, use default zh-CN
}

export function t(key) {
  return translations[currentLang]?.[key]
    ?? translations['zh-CN']?.[key]
    ?? key;
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  try { localStorage.setItem('lang', lang); } catch { /* silent */ }
}

export function getLang() {
  return currentLang;
}
