// The 25 languages of the chat window, in the order of the mock (build-lib.mjs LANGS_ALL). The source is the product:
// SUPPORTED_LOCALES in packages/shared/src/i18n/types.ts of ~/Projects/typelessity (25 entries); e2e/pricing-faq-facts.spec.ts
// reads that file and compares the count with the list the pages print.
// `code` is the product's locale code (the same 25 as SUPPORTED_LOCALES, in this order of the mock): the home page puts it in `lang` on the native name.
export interface LandingLanguage { readonly english: string; readonly native: string; readonly code: string }

export const LANDING_LANGUAGES: readonly LandingLanguage[] = [
  { english: 'English', native: 'English', code: 'en' },
  { english: 'Polish', native: 'Polski', code: 'pl' },
  { english: 'German', native: 'Deutsch', code: 'de' },
  { english: 'Russian', native: 'Русский', code: 'ru' },
  { english: 'Spanish', native: 'Español', code: 'es' },
  { english: 'French', native: 'Français', code: 'fr' },
  { english: 'Italian', native: 'Italiano', code: 'it' },
  { english: 'Portuguese', native: 'Português', code: 'pt' },
  { english: 'Dutch', native: 'Nederlands', code: 'nl' },
  { english: 'Ukrainian', native: 'Українська', code: 'uk' },
  { english: 'Czech', native: 'Čeština', code: 'cs' },
  { english: 'Slovak', native: 'Slovenčina', code: 'sk' },
  { english: 'Hungarian', native: 'Magyar', code: 'hu' },
  { english: 'Romanian', native: 'Română', code: 'ro' },
  { english: 'Bulgarian', native: 'Български', code: 'bg' },
  { english: 'Croatian', native: 'Hrvatski', code: 'hr' },
  { english: 'Serbian', native: 'Srpski', code: 'sr' },
  { english: 'Slovenian', native: 'Slovenščina', code: 'sl' },
  { english: 'Greek', native: 'Ελληνικά', code: 'el' },
  { english: 'Turkish', native: 'Türkçe', code: 'tr' },
  { english: 'Swedish', native: 'Svenska', code: 'sv' },
  { english: 'Danish', native: 'Dansk', code: 'da' },
  { english: 'Finnish', native: 'Suomi', code: 'fi' },
  { english: 'Norwegian', native: 'Norsk', code: 'no' },
  { english: 'Japanese', native: '日本語', code: 'ja' },
] as const;
