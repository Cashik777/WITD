import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import es from './locales/es.json'

// English has no URL prefix (it's the default the whole site was built in);
// these three get one (/fr, /de, /es) — see src/lib/locale.ts for the
// routing/link side of that split.
export const supportedLocales = ['en', 'fr', 'de', 'es'] as const
export type Locale = (typeof supportedLocales)[number]

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr }, de: { translation: de }, es: { translation: es } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})

export default i18n
