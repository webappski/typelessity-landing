import { Component, ChangeDetectionStrategy, inject, signal, computed, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SUPPORTED_LANGS, LANG_META, type Lang } from '../../i18n/i18n.config';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly router = inject(Router);
  private readonly t = inject(TranslationService);

  protected readonly open = signal(false);
  protected readonly currentLang = this.t.lang;
  protected readonly langMeta = LANG_META;

  protected readonly availableLangs = computed(() =>
    SUPPORTED_LANGS.filter((l) => l !== this.currentLang())
  );

  protected toggle(): void {
    this.open.update((v) => !v);
  }

  protected changeLang(lang: Lang): void {
    const currentUrl = this.router.url;
    const match = currentUrl.match(/^\/(en|de|ru|pl)(\/.*)?$/);

    if (match) {
      const pathAfterLang = match[2] || '';
      this.router.navigateByUrl(`/${lang}${pathAfterLang}`);
    } else {
      this.router.navigateByUrl(`/${lang}`);
    }

    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  protected onClickOutside(event: Event): void {
    const el = event.target as HTMLElement;
    if (!el.closest('.lang-dropdown')) {
      this.open.set(false);
    }
  }
}
