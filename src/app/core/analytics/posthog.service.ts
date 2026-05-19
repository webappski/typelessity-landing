import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, effect, inject } from '@angular/core';
import { ConsentService } from '../consent/consent.service';

const POSTHOG_KEY = '';
const POSTHOG_HOST = 'https://eu.posthog.com';

@Injectable({ providedIn: 'root' })
export class PostHogService {
  private readonly consent = inject(ConsentService);
  private readonly platform = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platform);

  private loaded = false;

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      if (this.consent.analyticsAllowed() && !this.loaded && POSTHOG_KEY) {
        this.bootstrap();
      }
      if (!this.consent.analyticsAllowed() && this.loaded) {
        this.optOut();
      }
    });
  }

  private async bootstrap(): Promise<void> {
    const { default: posthog } = await import('posthog-js');
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: 'history_change',
      autocapture: false,
    });
    this.loaded = true;
  }

  private async optOut(): Promise<void> {
    const { default: posthog } = await import('posthog-js');
    posthog.opt_out_capturing();
    this.loaded = false;
  }
}
