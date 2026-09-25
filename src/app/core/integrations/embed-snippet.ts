// The code the Webappski portal hands out at the Install step (webappka product-config.ts,
// typelessity packages/api/src/lib/embed-code.ts). cdn.typelessity.com is roadmap-only and does not
// resolve — never show it as the embed host.
export const WIDGET_SCRIPT_URL = 'https://typelessity-widget.vercel.app/widget.js';
export const WIDGET_API_URL = 'https://typelessity.vercel.app';

export const EMBED_SNIPPET =
  `<script type="module" src="${WIDGET_SCRIPT_URL}"></script>\n` +
  `<typelessity-widget api-url="${WIDGET_API_URL}"></typelessity-widget>`;
