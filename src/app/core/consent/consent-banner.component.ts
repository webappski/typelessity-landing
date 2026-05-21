import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ConsentService } from './consent.service';

@Component({
  selector: 'app-consent-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './consent-banner.component.scss',
  template: `
    @if (visible()) {
      <div
        #dialog
        class="consent"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-h"
        aria-describedby="consent-d"
        (keydown)="onKeydown($event)"
      >
        <div class="consent__inner vc-wrap">
          @if (!showPrefs()) {
            <div>
              <div class="consent__h" id="consent-h">Cookies</div>
              <p id="consent-d" class="consent__d">
                We use strictly necessary cookies. Optional functional and analytics cookies require your consent.
                Read the <a href="/llms.txt" target="_blank" rel="noopener">overview</a> or
                <a href="/legal/privacy">privacy policy</a>.
              </p>
            </div>
            <div class="consent__actions">
              <button class="vc-btn vc-btn-ghost" (click)="showPrefs.set(true)">Preferences</button>
              <button class="vc-btn vc-btn-ghost" (click)="reject()">Reject optional</button>
              <button class="vc-btn vc-btn-primary" (click)="acceptAll()">Accept all</button>
            </div>
          } @else {
            <form class="consent__prefs" (ngSubmit)="savePrefs()">
              <div class="consent__h">Cookie preferences</div>
              <ul class="consent__tiers">
                <li>
                  <label>
                    <input type="checkbox" checked disabled />
                    <strong>Required</strong>
                    <span>Session, security, language preference. Always on.</span>
                  </label>
                </li>
                <li>
                  <label>
                    <input type="checkbox" [checked]="functional()" (change)="functional.set($any($event.target).checked)" />
                    <strong>Functional</strong>
                    <span>Remember your last opened FAQ section, dismissed banners, etc.</span>
                  </label>
                </li>
                <li>
                  <label>
                    <input type="checkbox" [checked]="analytics()" (change)="analytics.set($any($event.target).checked)" />
                    <strong>Analytics</strong>
                    <span>PostHog page views and feature usage. No PII.</span>
                  </label>
                </li>
              </ul>
              <div class="consent__actions">
                <button type="button" class="vc-btn vc-btn-ghost" (click)="showPrefs.set(false)">Back</button>
                <button type="submit" class="vc-btn vc-btn-primary">Save preferences</button>
              </div>
            </form>
          }
        </div>
      </div>
    }
  `,
})
export class ConsentBannerComponent implements AfterViewInit {
  private readonly consent = inject(ConsentService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly visible = computed(() => !this.consent.decided());
  protected readonly showPrefs = signal(false);

  protected readonly functional = signal(this.consent.current().functional);
  protected readonly analytics = signal(this.consent.current().analytics);

  @ViewChild('dialog') private dialogRef?: ElementRef<HTMLElement>;

  constructor() {
    // When dialog becomes visible (or prefs view toggles), move focus inside.
    effect(() => {
      void this.visible();
      void this.showPrefs();
      if (!isPlatformBrowser(this.platformId)) return;
      queueMicrotask(() => this.focusFirstInside());
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.focusFirstInside();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.visible()) return;
    if (this.showPrefs()) {
      this.showPrefs.set(false);
      return;
    }
    this.consent.rejectOptional();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const focusable = this.getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  protected acceptAll(): void {
    this.consent.acceptAll();
  }

  protected reject(): void {
    this.consent.rejectOptional();
  }

  protected savePrefs(): void {
    this.consent.set({ functional: this.functional(), analytics: this.analytics() });
    this.showPrefs.set(false);
  }

  private focusFirstInside(): void {
    const focusable = this.getFocusable();
    focusable[0]?.focus();
  }

  private getFocusable(): HTMLElement[] {
    const root = this.dialogRef?.nativeElement;
    if (!root) return [];
    const selectors =
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(root.querySelectorAll<HTMLElement>(selectors));
  }
}
