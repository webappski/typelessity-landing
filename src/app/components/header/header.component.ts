import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
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
  protected readonly signupUrl = pilotSignupUrl('nav', 'free-pilot');
  protected readonly mobileMenuOpen = signal(false);

  protected toggleMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
