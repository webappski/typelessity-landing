import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * L15 (2026-10-21): the site's global stylesheet and its @font-face rules, carried as the styles of a component that renders nothing.
 *
 * Why a component: Angular's server render writes the styles of every component it rendered into the page as one <style> per
 * component, so the prerendered HTML carries these rules itself, in <head>, and the browser has no stylesheet to fetch before the
 * first paint (before: two render-blocking <link rel=stylesheet>, fonts/fonts.css and styles-*.css, one level more in the chain
 * HTML -> CSS -> font; pending-review/2026-10-21/L13/perf-opus-review.md §4 item 2).
 * This is NOT critical-CSS extraction (Beasties, `inlineCritical`, turned off in d79e866): Beasties keeps the rules that match the
 * DOM it sees, which has no data-theme, so a dark visitor got a light first frame. Here every rule goes in, both themes whole, and
 * the inline theme script of index.html still runs before them.
 * ViewEncapsulation.None: the rules stay global, as they were in styles-*.css. The component sits in app.html once and is never
 * destroyed, so its <style> is never removed; the browser reuses the server's <style> on hydration.
 * fonts.css stays the one source of the faces (public/fonts, also served at /fonts/fonts.css); its url() are absolute (/fonts/…)
 * so that they resolve the same from that file and from a page at any address.
 *
 * The fonts (moved here from a comment of src/index.html, which went into every page — L15 code review, item 4): Montserrat
 * (text, headings) and Space Mono (code) are self-hosted, because loading them from Google sent every visitor's IP there before
 * any consent (A27). public/fonts holds Google's files for the same families and weights (fetched 2026-09-24 for Space Mono,
 * 2026-10-19 for Montserrat) and our subset of the Montserrat latin-ext file (the top of fonts.css says how it is made);
 * licences: OFL-*.txt beside the files. src/index.html has one preload: the Latin file of Montserrat 400, the URL fonts.css
 * names, with crossorigin. It has no stylesheet link: the rules come inline in the style element of this component.
 */
@Component({
  selector: 'app-global-styles',
  standalone: true,
  template: '',
  styleUrls: ['../../public/fonts/fonts.css', '../styles.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalStyles {}
