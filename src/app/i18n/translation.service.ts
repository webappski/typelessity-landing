import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { EN } from './translations.en';
import { DEFAULT_LANG } from './i18n.config';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly doc = inject(DOCUMENT);

  constructor() {
    const root = this.doc.documentElement;
    if (root) root.setAttribute('lang', DEFAULT_LANG);
  }

  lang(): string {
    return DEFAULT_LANG;
  }

  t(key: string): string {
    return EN[key] ?? key;
  }
}
