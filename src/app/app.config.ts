import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MARKED_OPTIONS, MarkedRenderer, provideMarkdown } from 'ngx-markdown';
import type { Tokens } from 'marked';

import { routes } from './app.routes';

/**
 * Custom marked renderer:
 *  - Wraps tables in a scroll container with the original `<table>`.
 *  - Stamps each `<td>` with `data-label` carrying its column-header text,
 *    enabling a CSS-only mobile card layout where each row stacks as a
 *    labelled key-value list (no horizontal scroll needed below 720px).
 *
 * The TL;DR styling is handled by a positional CSS selector
 * (`.blog-post__body markdown > p:first-of-type`) — no renderer state needed.
 */
function buildRenderer(): MarkedRenderer {
  const renderer = new MarkedRenderer();

  const stripTags = (html: string): string =>
    html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

  // Marked v9+ uses token-based renderer. Build the entire table here:
  //   - wrap in <div class="md-table-wrap"> for scrollable container
  //   - tag each <td> with data-label="<column header text>" for mobile cards
  renderer.table = function (token: Tokens.Table): string {
    const headers = token.header.map((h) => stripTags(h.text));
    const headerHtml = token.header
      .map((h) => `<th>${this.parser.parseInline(h.tokens)}</th>`)
      .join('');
    const rowsHtml = token.rows
      .map((row) => {
        const cells = row
          .map((cell, i) => {
            const inner = this.parser.parseInline(cell.tokens);
            const label = headers[i] ?? '';
            const labelAttr = label
              ? ` data-label="${label.replace(/"/g, '&quot;')}"`
              : '';
            return `<td${labelAttr}>${inner}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');
    return `<div class="md-table-wrap"><table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
  };

  return renderer;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    provideMarkdown({
      markedOptions: {
        provide: MARKED_OPTIONS,
        useFactory: () => ({
          renderer: buildRenderer(),
          gfm: true,
          breaks: false,
        }),
      },
    }),
  ],
};
