// The 25 languages of the chat window, in the order of the mock (build-lib.mjs LANGS_ALL). The source is the product:
// SUPPORTED_LOCALES in packages/shared/src/i18n/types.ts of ~/Projects/typelessity (25 entries); e2e/pricing-faq-facts.spec.ts
// reads that file and compares the count with the list the pages print.
export interface LandingLanguage { readonly english: string; readonly native: string }

export const LANDING_LANGUAGES: readonly LandingLanguage[] = [
  { english: 'English', native: 'English' },
  { english: 'Polish', native: 'Polski' },
  { english: 'German', native: 'Deutsch' },
  { english: 'Russian', native: 'Русский' },
  { english: 'Spanish', native: 'Español' },
  { english: 'French', native: 'Français' },
  { english: 'Italian', native: 'Italiano' },
  { english: 'Portuguese', native: 'Português' },
  { english: 'Dutch', native: 'Nederlands' },
  { english: 'Ukrainian', native: 'Українська' },
  { english: 'Czech', native: 'Čeština' },
  { english: 'Slovak', native: 'Slovenčina' },
  { english: 'Hungarian', native: 'Magyar' },
  { english: 'Romanian', native: 'Română' },
  { english: 'Bulgarian', native: 'Български' },
  { english: 'Croatian', native: 'Hrvatski' },
  { english: 'Serbian', native: 'Srpski' },
  { english: 'Slovenian', native: 'Slovenščina' },
  { english: 'Greek', native: 'Ελληνικά' },
  { english: 'Turkish', native: 'Türkçe' },
  { english: 'Swedish', native: 'Svenska' },
  { english: 'Danish', native: 'Dansk' },
  { english: 'Finnish', native: 'Suomi' },
  { english: 'Norwegian', native: 'Norsk' },
  { english: 'Japanese', native: '日本語' },
] as const;
