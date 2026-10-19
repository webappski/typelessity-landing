// The code the Webappski portal hands out at the Install step (webappka product-config.ts,
// typelessity packages/api/src/lib/embed-code.ts). cdn.typelessity.com is roadmap-only and does not
// resolve — never show it as the embed host.
export const WIDGET_SCRIPT_URL = 'https://typelessity-widget.vercel.app/widget.js';
export const WIDGET_API_URL = 'https://typelessity.vercel.app';

export const EMBED_SNIPPET =
  `<script type="module" src="${WIDGET_SCRIPT_URL}"></script>\n` +
  `<typelessity-widget api-url="${WIDGET_API_URL}"></typelessity-widget>`;

// The Content-Security-Policy lines a site needs for the widget, as the Webappski portal's Install step prints them
// (webappka typelessity-install.ts typelessityCspLines + TYPELESSITY_PERMISSIONS_POLICY). /install prints this list;
// e2e/install-facts.spec.ts reads the portal's source and fails when the two differ.
export const WIDGET_CSP: ReadonlyArray<{ directive: string; source: string }> = [
  { directive: 'script-src', source: new URL(WIDGET_SCRIPT_URL).origin },
  { directive: 'connect-src', source: new URL(WIDGET_API_URL).origin },
  { directive: 'font-src', source: new URL(WIDGET_SCRIPT_URL).origin },
  { directive: 'img-src', source: 'data:' },
  { directive: 'style-src-attr', source: "'unsafe-inline'" },
];
