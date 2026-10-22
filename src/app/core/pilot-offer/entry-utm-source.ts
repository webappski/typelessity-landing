import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { PlatformLocation, isPlatformBrowser } from '@angular/common';

/**
 * `utm_source` of the URL the visitor entered the site on, read once at start. A visit that begins on /blog/…?utm_source=chatgpt.com and moves on to the
 * home page by a link has no query any more by then, and the strip on the home page must still know where the visitor came from (the router drops the
 * query). The service is built when the application starts (App injects it): a service nobody asked for yet would read the address too late.
 * The server has no visitor: null. Read only, never stored, never sent.
 */
@Injectable({ providedIn: 'root' })
export class EntryUtmSource {
  readonly value: string | null = isPlatformBrowser(inject(PLATFORM_ID))
    ? new URLSearchParams(inject(PlatformLocation).search).get('utm_source')
    : null;
}
