import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { TranslationMap } from './translation.types';
import type { Lang } from './i18n.config';
import { DEFAULT_LANG, isLang } from './i18n.config';
import { EN } from './translations.en';
import { DE } from './translations.de';
import { RU } from './translations.ru';
import { PL } from './translations.pl';

const TRANSLATIONS: Record<Lang, TranslationMap> = { en: EN, de: DE, ru: RU, pl: PL };

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly doc = inject(DOCUMENT);
  readonly lang = signal<Lang>(this.detectLang());
  private readonly map = computed(() => TRANSLATIONS[this.lang()]);

  constructor() {
    effect(() => {
      const root = this.doc.documentElement;
      if (root) root.setAttribute('lang', this.lang());
    });
  }

  setLang(lang: Lang): void {
    this.lang.set(lang);
  }

  t(key: string): string {
    return this.map()[key] ?? key;
  }

  private detectLang(): Lang {
    const segment = (this.doc.location?.pathname ?? '').split('/')[1];
    return isLang(segment) ? segment : DEFAULT_LANG;
  }
}
