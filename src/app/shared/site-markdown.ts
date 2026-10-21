import type { Provider } from '@angular/core';
import { MARKED_OPTIONS, MarkedRenderer, provideMarkdown } from 'ngx-markdown';
import type { Tokens } from 'marked';

/**
 * The markdown setup of the pages that render markdown: articles (/blog/:slug), /privacy and the /legal/* pages.
 *
 * L15 (2026-10-21): these providers used to sit in the root app.config.ts, so ngx-markdown and marked (≈55 KB of JS before
 * compression) were a static import of the app and every page, `/` included, preloaded their chunk. Now each of the three page
 * components lists `provideSiteMarkdown()` in its own `providers`, so the library is bundled with those lazy pages only.
 * `provideMarkdown` returns plain providers (ngx-markdown 21), which a component may carry.
 *
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

export function provideSiteMarkdown(): Provider[] {
  return provideMarkdown({
    markedOptions: {
      provide: MARKED_OPTIONS,
      useFactory: () => ({
        renderer: buildRenderer(),
        gfm: true,
        breaks: false,
      }),
    },
  }) as Provider[];
}
