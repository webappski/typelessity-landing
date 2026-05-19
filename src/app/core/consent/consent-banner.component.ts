import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ConsentService } from './consent.service';

@Component({
  selector: 'app-consent-banner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './consent-banner.component.scss',
  template: `
    @if (visible()) {
      <div class="consent" role="dialog" aria-labelledby="consent-h" aria-describedby="consent-d">
        <div class="consent__inner vc-wrap">
          @if (!showPrefs()) {
            <div>
              <div class="consent__h" id="consent-h">Cookies</div>
              <p id="consent-d" class="consent__d">
                We use strictly necessary cookies. Optional functional and analytics cookies require your consent.
                Read the <a href="/llms.txt" target="_blank" rel="noopener">overview</a> or
                <a href="/en/legal/privacy">privacy policy</a>.
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
export class ConsentBannerComponent {
  private readonly consent = inject(ConsentService);

  protected readonly visible = computed(() => !this.consent.decided());
  protected readonly showPrefs = signal(false);

  protected readonly functional = signal(this.consent.current().functional);
  protected readonly analytics = signal(this.consent.current().analytics);

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
}
