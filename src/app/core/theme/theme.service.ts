import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export type Theme = 'light' | 'dark';

/** The value of the theme-color metas, per theme: --bg of each (the browser bar). Same two values as index.html. */
const BAR: Record<Theme, string> = { light: '#FFFFFF', dark: '#0A1120' };

/**
 * The theme switch. The theme follows the system until the visitor chooses; a choice is <html data-theme> and
 * localStorage['ty-theme']. The inline script in index.html applies a stored choice before the first paint; this service only
 * flips it on a click. Nothing here runs on the server, and every storage access is in try (Safari private mode, blocked data).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** The theme on screen now: the choice if there is one, else the system's. */
  current(): Theme {
    const chosen = this.document.documentElement.getAttribute('data-theme');
    if (chosen === 'light' || chosen === 'dark') return chosen;
    return this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggle(): Theme {
    const next: Theme = this.current() === 'dark' ? 'light' : 'dark';
    this.document.documentElement.setAttribute('data-theme', next);
    try {
      this.document.defaultView?.localStorage.setItem('ty-theme', next);
    } catch {
      /* no storage: the choice lasts for this visit */
    }
    this.document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', BAR[next]));
    return next;
  }
}
