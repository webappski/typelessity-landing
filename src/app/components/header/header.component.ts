import { Component, ChangeDetectionStrategy, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslationService } from '../../i18n/translation.service';
import { ThemeService } from '../../core/theme/theme.service';
import { pilotSignupUrl } from '../../pages/home/home.content';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly t = inject(TranslationService);
  private readonly theme = inject(ThemeService);
  private readonly document = inject(DOCUMENT);
  private readonly burger = viewChild<ElementRef<HTMLButtonElement>>('burger');
  protected readonly signupUrl = pilotSignupUrl('nav', 'free-pilot');
  protected readonly mobileMenuOpen = signal(false);

  constructor() {
    // A client-side navigation does not reload the page: the menu and the scroll lock it set must end with the navigation (F13.2).
    inject(Router)
      .events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.closeMenu());
  }

  protected toggleTheme(): void {
    this.theme.toggle();
  }

  protected toggleMenu(): void {
    this.setMenu(!this.mobileMenuOpen());
  }

  protected closeMenu(): void {
    if (this.mobileMenuOpen()) this.setMenu(false);
  }

  /** Escape closes the menu and returns the focus to the burger (WAI-ARIA disclosure pattern, F13.4). */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (!this.mobileMenuOpen()) return;
    this.setMenu(false);
    this.burger()?.nativeElement.focus();
  }

  private setMenu(open: boolean): void {
    this.mobileMenuOpen.set(open);
    // The page behind the open menu does not scroll. Only touched in the browser by a click, a key or a navigation.
    this.document.body.style.overflow = open ? 'hidden' : '';
  }
}
