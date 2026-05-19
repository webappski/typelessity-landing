# Design System Migration Plan — TypelessForm → Typelessity-Landing

**Date:** 2026-05-19
**Reviewer:** Senior designer (line-by-line)
**Status:** Plan only — no code changes.
**Reference (source of truth):** `/Users/dmitry-isaevski/Projects/typelessform`
**Target:** `/Users/dmitry-isaevski/Projects/typelessity-landing`

---

## 1. Executive Summary

### What is happening

Typelessity-Landing currently runs on **"Variant C — Cream paper + graphite + electric tangerine"** — a light, editorial, monochrome system with serif italics and a single tangerine accent. TypelessForm (TF) runs on a **dark "tech terminal" aesthetic** — `#282838` slate background, warm `#FF6B2B` orange accent, `Space Mono` display + `DM Sans` body, code-window UI, glow shadows. The two systems are **fundamentally opposite in palette and tone**: light editorial vs. dark tech. Migrating Typelessity to "look 1-в-1 like TypelessForm" requires:

- **Total palette inversion**: from cream/graphite to slate/orange.
- **Total font swap**: Geist Variable + Newsreader + Instrument Serif → DM Sans + Space Mono (self-hosted woff2, GDPR).
- **Component reauthoring**: every component currently uses `.vc-*` classes and `var(--ink/--paper/--line)` tokens — to be replaced with TF's flat class system (`.btn`, `.section`, `.badge`, `.feature-card`, `.faq-item`, etc.) and `var(--accent/--bg-primary/--text-primary)` tokens.
- **Layout retune**: container `1240px → 1120px`, padding `36px → 24px`, sections become `--section-gap: 80px` (vs. ad-hoc `50–70px` today).
- **Motion swap**: from cream subtle transitions to TF's `0.3s ease` hover lifts with orange glow shadows and dashed orange divider lines.
- **New content components** that TF does **not** have natively (industries grid, language switcher, contact form, multi-FAQ-category page, pricing comparison table) must be **re-skinned to TF's `.feature-card / .step-card / .price-card / .faq-item` primitives** while keeping target-only structures.

### Scope estimate

- **18 SCSS files** to rewrite (≈ 3,700 lines today → expect ≈ 1,800–2,400 lines after).
- **3 token files** to consolidate into 1 (`tokens.scss`) — Variant C surfaces removed, TF surfaces added.
- **1 global stylesheet** (`styles.scss`) to be rebuilt — current 224 lines (Variant C utility classes) → ~280 lines (TF utilities + global header/footer/sections from `app.scss` since TF puts most globals in `app.scss`).
- **1 typography.scss** to drop `@fontsource` imports for Geist/Newsreader/Instrument Serif and either (a) move font loading into self-hosted `public/fonts/fonts.css` like TF, or (b) keep `@fontsource` for `dm-sans` + `space-mono`.
- **1 index.html** to add `<link rel="stylesheet" href="fonts/fonts.css">` if going self-hosted route + add `theme-color` to dark.
- **18 HTML templates / inline templates** to be rewritten — the class hooks change wholesale (`.vc-btn-accent` → `.btn .btn-primary`, etc.).

**Complexity: High.** This is not a re-skin, this is a full theme swap with semantic-class migration and font-stack swap.

---

## Revision History

- **v1 (2026-05-19)** — initial plan.
- **v2 (2026-05-19)** — post-review revisions (independent senior FIX verdict). Critical gaps closed: Cyrillic font strategy, SSR/FOUC hardening, branch-based rollout, consent-banner GDPR granularity, accent-hex contradiction, line-drift, accessibility, estimate. See full diff at the bottom (**v2 Changelog**).

---

## 2. Design System Extraction from TypelessForm (source of truth)

### 2.1 Color system

From `typelessform/src/styles.scss:4-25` — declared on `:root`:

| Variable               | Value                         | Role                                        |
|------------------------|-------------------------------|---------------------------------------------|
| `--bg-primary`         | `#282838`                     | Body / page background — dark slate         |
| `--bg-secondary`       | `#313142`                     | Section-alt rows, footer, mobile menu       |
| `--bg-card`            | `#3A3A4C`                     | Cards (step, feature, price, faq, demo)     |
| `--bg-card-hover`      | `#434356`                     | Step-card hover state                       |
| `--bg-code`            | `#2E2E3E`                     | Terminal body / code blocks                 |
| `--text-primary`       | `#F0F0F5`                     | Headings, body main text                    |
| `--text-secondary`     | `#A3A3B8`                     | Paragraphs, nav links, descriptions         |
| `--text-muted`         | `#7C7C92`                     | Hero notes, labels, footer copy             |
| `--accent`             | `#FF6B2B`                     | Orange — primary CTA, links, step-number    |
| `--accent-hover`       | `#FF8548`                     | CTA hover                                   |
| `--accent-glow`        | `rgba(255, 107, 43, 0.15)`    | Section CTA radial glow                     |
| `--accent-subtle`      | `rgba(255, 107, 43, 0.08)`    | Badge bg, feature-icon bg, active tab       |
| `--border`             | `rgba(255, 255, 255, 0.08)`   | Default 1px border                          |
| `--border-accent`      | `rgba(255, 107, 43, 0.3)`     | Card hover border, faq[open] border         |
| `--success`            | `#34D399`                     | Code-string color, pricing tick (✓)         |
| `--info`               | `#60A5FA`                     | Reserved (currently unused in app.scss)     |

Header has its own dark glass override: `background: rgba(10, 10, 15, 0.85)` with `backdrop-filter: blur(16px)` (`app.scss:8-11`).

Code highlighting palette (terminal blocks, `app.scss:295-310`):
- `code-comment` → `var(--text-muted)` (`#7C7C92`)
- `code-tag` → `#e06c75`
- `code-attr` → `#d19a66`
- `code-string` → `var(--success)` (`#34D399`)
- `code-prompt` → `var(--accent)`, font-weight 700

Hardcoded mac-traffic-light dots (`app.scss:261-275`): red `#ff5f57`, yellow `#febc2e`, green `#28c840`.

Dark code variant inside Voice-to-JSON (`app.scss:501`): `background: #0d1117` with `border: 1px solid rgba(255, 255, 255, 0.1)` and `color: #e6edf3`.

### 2.2 Typography

**Two families, both self-hosted woff2 in `/public/fonts/` (GDPR-safe — no Google Fonts request).**

From `typelessform/src/index.html:51-52`:
```html
<!-- Self-hosted fonts (GDPR: no IP leakage to Google) -->
<link rel="stylesheet" href="fonts/fonts.css" />
```

From `typelessform/public/fonts/fonts.css`:

| Family       | Weights         | Subsets                | File hashes                                                       |
|--------------|-----------------|------------------------|-------------------------------------------------------------------|
| `DM Sans`    | 400, 500, 600, 700 | latin, latin-ext       | `rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2` (latin) etc. |
| `Space Mono` | 400, 700        | latin, latin-ext, vietnamese | `i7dPIFZifjKcF5UAWdDRYEF8RXi4EwQ.woff2` (latin 400) etc.     |

All declarations use `font-display: swap`. No variable fonts — discrete weights.

**⚠️ Cyrillic blackout (verified 2026-05-19):**

TF's `public/fonts/fonts.css` declares **only** these subsets:

| Family       | Subsets present                              | Cyrillic? |
|--------------|----------------------------------------------|-----------|
| DM Sans 400/500/600/700 | `latin`, `latin-ext`              | ❌ no     |
| Space Mono 400/700      | `latin`, `latin-ext`, `vietnamese` | ❌ no   |

A `grep -E "cyrillic|U\\+0400"` against `typelessform/public/fonts/fonts.css` returns **0 hits**. A direct `curl` against `fonts.googleapis.com/css2?family=DM+Sans` and `…?family=Space+Mono` (2026-05-19) confirms that **Google Fonts does not ship a `cyrillic` subset for either family**. The fonts are simply not published with Cyrillic glyphs upstream.

Target has live `translations.ru.ts` — Russian must continue to render. The plan therefore cannot do a bare "copy TF's font assets" step; it must adopt a **Cyrillic strategy** (see §5.4 step 4 and Phase 0 task `P0-7`).

DE and PL are covered by `latin-ext` and survive without intervention.

CSS vars (`styles.scss:28-29`):
```scss
--font-display: 'Space Mono', monospace;
--font-body: 'DM Sans', sans-serif;
```

**Type scale** (extracted across `styles.scss` + `app.scss`):

| Token / role           | Family        | Size                      | Weight | Line-height | Letter-spacing |
|------------------------|---------------|---------------------------|--------|-------------|----------------|
| `body`                 | DM Sans       | 16px (1rem)               | 400    | 1.6         | —              |
| `.hero-title` (h1)     | Space Mono    | `clamp(32px, 5vw, 52px)`  | 700    | 1.15        | —              |
| `.section-title` (h2)  | Space Mono    | `clamp(28px, 4vw, 42px)`  | 700    | 1.2         | —              |
| `.hero-desc`           | DM Sans       | 17px                      | 400    | 1.7         | —              |
| `.section-subtitle`    | DM Sans       | 17px                      | 400    | 1.7         | —              |
| `.badge`               | Space Mono    | 11px                      | 400    | —           | 2px            |
| `.btn`                 | DM Sans       | 15px                      | 600    | —           | —              |
| `.btn-sm`              | DM Sans       | 13px                      | 600    | —           | —              |
| `.btn-lg`              | DM Sans       | 16px                      | 600    | —           | —              |
| `.terminal-title`      | Space Mono    | 12px                      | 400    | —           | —              |
| `.terminal-body`       | Space Mono    | 13.5px                    | 400    | 1.8         | —              |
| `.step-card h3`        | Space Mono    | 18px                      | 700    | —           | —              |
| `.step-number`         | Space Mono    | 48px                      | 700    | 1           | —              |
| `.stat-number`         | Space Mono    | 36px                      | 700    | —           | —              |
| `.stat-label`          | DM Sans       | 13px                      | 400    | 1.5         | —              |
| `.feature-card h3`     | DM Sans       | 16px                      | 600    | —           | —              |
| `.feature-card p`      | DM Sans       | 14px                      | 400    | 1.6         | —              |
| `.price-value`         | Space Mono    | 42px                      | 700    | —           | —              |
| `.faq-item summary`    | DM Sans       | 15px                      | 600    | —           | —              |
| `.faq-item p`          | DM Sans       | 14px                      | 400    | 1.7         | —              |
| `.footer-col h4`       | Space Mono    | 13px                      | —      | —           | 1px, uppercase |
| `.logo-text`           | Space Mono    | 18px (header) / 20px (footer) | 700 | —          | —              |
| `.article-title`       | Space Mono    | `clamp(28px, 4vw, 42px)`  | 700    | 1.2         | —              |
| `.article-body`        | DM Sans       | 16.5px                    | —      | 1.85        | —              |
| `.article-body h2`     | Space Mono    | 24px                      | 700    | —           | —              |
| `.article-body h3`     | Space Mono    | 19px                      | 600    | —           | —              |
| `.article-body th`     | Space Mono    | 12px                      | 600    | —           | 0.5px, uppercase |
| `.card-title` (blog)   | Space Mono    | 22px                      | 700    | 1.3         | —              |
| `.card-date / read-time` | Space Mono  | 12px                      | —      | —           | 0.5px          |

Rule of thumb: **headings + numerics + meta + monospace UI labels → `Space Mono`. Body, descriptions, paragraphs → `DM Sans`.**

### 2.3 Spacing & layout primitives

From `typelessform/src/styles.scss:32-35`:
```scss
--container: 1120px;
--section-gap: 80px;
--radius: 12px;
--radius-lg: 20px;
```

Container utility (`styles.scss:63-67`):
```scss
.container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }
```

Section primitive (`app.scss:364-371`):
```scss
.section { padding: var(--section-gap) 0; }
.section + .section, .section + .cta-section { padding-top: 0; }
.section-alt { background: var(--bg-secondary); }
.section-alt + .section-alt { padding-top: 0; }
```

Breakpoints (used inconsistently but pattern-extractable):
- `1000px` — pricing 4-col → 2-col (`app.scss:1092`)
- `860px` — main mobile breakpoint: nav collapses, hero stacks, integration stacks, steps stack vertically (`app.scss:133, 221, 450, 946`)
- `700px` — features 1-col, stats 2-col, demo inline-form, footer link wrap (`app.scss:352, 800, 867, 1268`)
- `640px` — voice-json examples stack (`app.scss:590`)
- `600px` — pricing 1-col (`app.scss:1097`)

Mobile root override (`app.scss:222-241`):
```scss
@media (max-width: 860px) {
  :root { --section-gap: 56px; }
  .hero { padding: 88px 0 48px; }
  .hero-inner { grid-template-columns: 1fr; gap: 32px; }
  .section-header { margin-bottom: 32px; }
  .stats { padding: 32px 0; }
  .footer { padding: 40px 0 24px; }
}
```

Hero padding desktop: `120px 0 64px`. Footer padding desktop: `64px 0 32px`.

### 2.4 Components — full inventory from TF

**Header** (`app.scss:1-145`):
- Fixed, full-width, z-index 100, height 64px.
- `background: rgba(10, 10, 15, 0.85); backdrop-filter: blur(16px);`
- Border-bottom 1px `--border`.
- Logo: Space Mono 18px 700, `.highlight` orange.
- Nav links: DM Sans 14px, `--text-secondary` → hover `--text-primary`.
- Header CTA: `.btn .btn-primary .btn-sm` (`8px 20px`, 13px).
- Burger: appears < 860px, animated hamburger → X with `span.open` toggle.
- Mobile menu: vertical stack, `--bg-secondary` background.

**Hero** (`app.scss:147-241`):
- `position: relative; padding: 120px 0 64px; overflow: hidden;`
- `.hero-bg-grid` — two crossed linear-gradients at `rgba(255, 107, 43, 0.03) 1px` on `60px 60px`, masked by `radial-gradient(ellipse at 50% 30%, black 30%, transparent 70%)`.
- Grid: 2 equal columns, gap 64px.
- Title: Space Mono `clamp(32px, 5vw, 52px)` 700, line 1.15.
- Description: DM Sans 17px, max-width 480px.
- CTA cluster: `display: flex; gap: 16px; flex-wrap: wrap.`
- `.hero-note`: 13px `--text-muted`.
- Video wrapper: 16:9 aspect, `border-radius: var(--radius-lg)`, shadow `0 24px 64px rgba(0, 0, 0, 0.4)`.

**Stats bar** (`app.scss:312-361`):
- `border-top` + `border-bottom` 1px `--border`, padding 48px 0.
- Flex row, gap 48px, centered.
- `.stat-number` Space Mono 36px 700 orange; `.stat-label` DM Sans 13px muted.
- `.stat-divider` 1px×48px `--border`.
- Mobile (< 700px): 2-col grid, dividers hidden.

**Section header** (`app.scss:381-391`):
```scss
.section-header {
  text-align: center;
  margin-bottom: 48px;
  .badge { margin-bottom: 16px; }
  .section-subtitle { margin: 0 auto; }
}
```

**Badge** (`styles.scss:74-85`):
- Inline-block, Space Mono 11px, letter-spacing 2px, uppercase, orange `--accent`.
- 1px border `--border-accent`, bg `--accent-subtle`, padding `6px 16px`, border-radius 100px (pill).

**Buttons** (`styles.scss:87-124`):
- `.btn` base: inline-flex, gap 8px, DM Sans 600 15px, padding `14px 32px`, radius 100px, `transition: all 0.3s ease`.
- `.btn-primary`: bg `--accent`, color `#fff`, shadow `0 4px 24px rgba(255, 107, 43, 0.3)`.
  - Hover: bg `--accent-hover`, shadow `0 8px 32px rgba(255, 107, 43, 0.4)`, `translateY(-2px)`.
- `.btn-outline`: transparent, 1px `--border`, color `--text-primary`.
  - Hover: border `--accent`, color `--accent`, bg `--accent-subtle`.
- Modifiers: `.btn-sm` (padding 8px 20px / 13px), `.btn-lg` (18px 40px / 16px), `.btn-full` (width 100%, justify center).

**Step card** (`app.scss:401-438`; `.steps-grid` wrapper at 394-399):
- Flex 1, max-width 320px, bg `--bg-card`, border 1px `--border`, radius `--radius-lg` (20px), padding `32px 28px`, text-center, `transition: all 0.3s`.
- Hover: border `--border-accent`, bg `--bg-card-hover`, `translateY(-4px)`.
- Step-number: Space Mono 48px 700 orange `opacity: 0.15`.
- h3: Space Mono 18px.
- Step-connector: SVG dashed line between cards (40×2, stroke `--accent`, dasharray `4 4`).

**Feature card** (`app.scss:825-871`):
- bg `--bg-card`, border 1px `--border`, radius `--radius` (12px), padding `28px 24px`, `transition: all 0.3s`.
- Hover: border `--border-accent`, `translateY(-2px)`.
- `.feature-icon`: 44×44 box, bg `--accent-subtle`, radius 10px, marg-bottom 16px.
- 3-col grid desktop, 1-col < 700px.

**Price card** (`app.scss:953-1103`):
- bg `--bg-card`, border 1px `--border`, radius `--radius-lg`, padding `32px 24px`, flex column, hover `translateY(-4px)`.
- `--featured`: border `--accent`, gradient `linear-gradient(180deg, rgba(255, 107, 43, 0.08) 0%, var(--bg-card) 40%)`.
- `.price-badge`: absolute `-12px / 50%` centered, bg `--accent`, color `#fff`, Space Mono 11px uppercase, padding `4px 16px`, radius 100px.
  - `--left`: pinned `left: 20px`.
  - `--soon`: pinned `right: 20px`, bg `--accent-subtle`, color `--accent`, 1px border `--border-accent`.
- `.price-value`: Space Mono 42px 700.
- `.price-features li`: 14px, padding 8px 0, border-bottom 1px `--border`, with `::before` content `✓` color `--success`.
- 4-col → 2-col < 1000px → 1-col < 600px.

**FAQ item** (`app.scss:1106-1158`):
- `<details>` with bg `--bg-card`, 1px `--border`, radius `--radius`, transition border-color.
- `[open]`: border `--border-accent`.
- `summary`: padding `20px 24px`, weight 600, 15px, list-style none.
  - `::after` content `+` Space Mono 20px orange, on `[open]` switches to `−`.
  - `::-webkit-details-marker { display: none; }`
- `p`: padding `0 24px 20px`, 14px, `--text-secondary`, line 1.7.
- `.faq-code` block: padding `14px 18px`, JetBrains/Fira Code 13px, bg `--bg-dark, #1a1a1a`, radius 8px.

**Demo (forms)** (`app.scss:600-822`):
- Tabs: pill rows, padding `12px 24px`, 14px, bg `--bg-card`, border 1px `--border`, radius 100px.
  - `.active`: border `--accent`, color `--accent`, bg `--accent-subtle`.
- Form container `.demo-form`: bg `--bg-card`, border 1px `--border`, radius `--radius-lg`, padding 32px.
- `.demo-form-title`: Space Mono 18px, gap 10px, padding-bottom 16px, border-bottom 1px `--border`.
- `.form-row`: grid `1fr 1fr` gap 16px; `--three`: `1fr 1fr 1fr`.
- Inputs: padding `10px 14px`, 14px, bg `--bg-primary`, border 1px `--border`, radius 8px, focus border `--accent`.
- Custom select arrow via inline SVG bg-image.
- Checkbox: 16×16, `accent-color: var(--accent)`.

**Integration step (`.i-step`)** (`app.scss:905-944`):
- Flex row, gap 20px, with `.i-step-num` 36×36 circle: bg `--accent-subtle`, border 1px `--border-accent`, color `--accent`, Space Mono 14px 700.

**Terminal window** (`app.scss:243-310`):
- bg `--bg-code`, radius `--radius-lg`, border 1px `--border`, shadow `0 24px 64px rgba(0, 0, 0, 0.4)`.
- `.terminal-bar`: padding `14px 20px`, bg `rgba(255, 255, 255, 0.03)`, border-bottom 1px `--border`.
- Three mac dots 12×12 round (`.red #ff5f57, .yellow #febc2e, .green #28c840`).
- `.terminal-title`: Space Mono 12px muted.
- `.terminal-body`: padding 24px, Space Mono 13.5px, line 1.8.

**Voice-to-JSON block** (`app.scss:461-598`):
- Mic icon: 40×40 round bg `--accent` color white.
- Speech bubble: bg `rgba(255, 255, 255, 0.05)`, border `rgba(255, 255, 255, 0.1)`, radius 12px, padding 1.25rem.
- Code block dark: bg `#0d1117`, border `rgba(255, 255, 255, 0.1)`, radius 12px.
- Examples: `flex 1 1 250px`, max-width 340px, bg `rgba(255, 255, 255, 0.03)`, border `rgba(255, 255, 255, 0.08)`, radius 10px.

**CTA section** (`app.scss:1174-1182`):
```scss
.cta-section {
  padding: var(--section-gap) 0;
  background:
    radial-gradient(ellipse at 50% 50%, var(--accent-glow) 0%, transparent 60%),
    var(--bg-primary);
}
.cta-inner { text-align: center; }
```

**Footer** (`app.scss:1185-1273`):
- bg `--bg-secondary`, border-top 1px `--border`, padding `64px 0 32px`.
- Flex wrap, gap 48px.
- `.footer-left`: flex 1, min-width 200px; `.logo-text` Space Mono 20px 700 block.
- `.footer-links`: flex gap 64px; `.footer-col h4` Space Mono 13px uppercase letter-spacing 1px.
- `.footer-bottom`: width 100%, padding-top 32px, border-top 1px `--border`, 13px muted, flex space-between.
- `.cookie-settings-link`: 13px muted, hover `--text-primary`.

**Blog list cards** (`blog-list.component.ts:111-247`):
- `.blog-card`: column flex, bg `--bg-card`, border 1px `--border`, radius `--radius-lg`, overflow hidden, `transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1)`.
- Hover: border `--border-accent`, `translateY(-4px)`, shadow `0 16px 48px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-accent)`.
- `.card-accent-line`: 4px column, bg `rgba(255, 107, 43, 0.25)`, on hover → solid `--accent` with `0 0 20px` glow.
- `.card-cover img`: hover `scale(1.03)`.
- Cover image: full-width, lazy, 760×399.
- Entry animation: `@keyframes cardReveal` from `translateY(24px) opacity 0` over `0.6s cubic-bezier(0.4, 0, 0.2, 1)`, staggered with `animation-delay: i * 120 + 'ms'`.

**Blog post article** (`blog-post.component.ts:154-578`):
- Reading-progress bar: position fixed, top 64px (header height), height 2px, bg `--accent`, with `0 0 8px rgba(255, 107, 43, 0.5)` glow.
- Back-link: Space Mono 13px muted, hover orange, animated `gap` transition.
- Article header bordered with `border-bottom 1px --border`.
- Author avatar 36×36 circle bg `--accent-subtle` border `--border-accent` color `--accent`.
- Cover: max-width 720px, radius `--radius-lg`, border 1px `--border`.
- Article body: 16.5px line 1.85.
- h2 Space Mono 24px 700 margin 56px 0 20px.
- h3 Space Mono 19px 600 margin 40px 0 14px.
- li::marker color `--accent`.
- a: border-bottom 1px `rgba(255, 107, 43, 0.3)`, hover solid `--accent`.
- code inline: Space Mono 14px, bg `--bg-code`, padding `3px 8px`, radius 6px, border 1px `--border`.
- blockquote: 3px left border `--accent`, padding `16px 24px`, bg `--accent-subtle`, italic.
- Tables: separate border-collapse, radius `--radius`, header bg `--bg-card`, Space Mono 12px uppercase th.
- Article CTA: bg `--bg-card`, border `--border-accent`, radius `--radius-lg`, padding `40px 36px`, with absolute `.cta-glow` radial in upper-right corner.
- Reveal animation: `articleReveal 0.5s cubic-bezier(0.4, 0, 0.2, 1)`.

**Not-found page** (`not-found.component.scss`):
- Centered, code `4rem` 700 orange, title `2rem`, lede 1.7 line-height.

**Security / longform doc page** (`security.component.scss`):
- max-width 760px container, h1 Space Mono 2rem, h2 Space Mono 1.4rem with bottom border, code with `--accent-subtle` bg + `--border-accent` border, table with separator borders, optional author block with circular avatar.

### 2.5 Motion & micro-interactions

- Universal hover: `transition: all 0.3s ease;` on `.btn`, `.step-card`, `.price-card`, `.feature-card`.
- Color transitions: `transition: color 0.2s;` on nav links, footer links, badges.
- `transform: translateY(-2px)` on `.btn-primary:hover`; `-4px` on `.step-card` / `.price-card` / `.blog-card`.
- `.blog-card` uses cubic-bezier `(0.4, 0, 0.2, 1)` (Material standard) over `0.35s`.
- Keyframes:
  - `cardReveal` (blog list): 24px translate + opacity, 0.6s.
  - `articleReveal` (blog post): 16px translate + opacity, 0.5s.
- Reading-progress bar (blog post): JS-driven width % updated `@HostListener('window:scroll')`.
- FAQ toggle: `+` ↔ `−` text swap on `[open]` via CSS pseudo-content.
- No CSS-only ambient animations (no marquees, no pulses on hero — TF is restrained).

### 2.6 Visual details

- **Radii**: `--radius: 12px` (badges, faq, demo-hint, feature-card, voice-json__code). `--radius-lg: 20px` (cards, terminal, video, demo-form, article-cta). Pill 100px for badges/buttons/tabs. Small 6–8px for inputs, copy-button, faq-code.
- **Borders**: 1px throughout. Default `--border` (`rgba(255,255,255,0.08)`). Accent variants `--border-accent` (`rgba(255,107,43,0.3)`).
- **Shadows**:
  - CTA button: `0 4px 24px rgba(255, 107, 43, 0.3)` → hover `0 8px 32px rgba(255, 107, 43, 0.4)`.
  - Video / terminal: `0 24px 64px rgba(0, 0, 0, 0.4)`.
  - Blog card hover: `0 16px 48px rgba(0, 0, 0, 0.3)` + `0 0 0 1px var(--border-accent)` (double-stroke effect).
  - Reading-progress: `0 0 8px rgba(255, 107, 43, 0.5)` glow.
- **Backgrounds**:
  - Page bg: `var(--bg-primary)` flat slate.
  - `.section-alt`: `--bg-secondary` strip.
  - `.cta-section`: radial gradient `--accent-glow` over `--bg-primary`.
  - `.hero-bg-grid`: 60px grid mask radial.
  - `.price-card--featured`: 180° gradient orange-tint → bg-card.
- **Dividers**: 1px `--border` lines via border-top/bottom on sections and stat-dividers (1px×48px vertical).

### 2.7 Accessibility

- Scroll-behavior: `smooth` on `html` (`styles.scss:40`).
- `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale.`
- No `prefers-reduced-motion` block in TF root — animations always play (this is a **gap** in TF, but we'll preserve target's reduced-motion guard).
- Focus styles: not explicit (`:focus { outline: none }` is **not** set; browser defaults apply).
- Skip-link: **not present in TF** (gap — target has one, we keep target's `.skip-link` pattern but reskin colors).
- Color contrast: `#F0F0F5` on `#282838` ≈ 14:1 (AAA), `#A3A3B8` on `#282838` ≈ 6.8:1 (AAA for normal text).

---

## 3. Current State of Typelessity-Landing

### 3.1 Token system (`src/styles/tokens.scss`)

Single `:root` block declaring:
- Surfaces: `--bg #f3ede2`, `--bg-soft #f8f3e9`, `--paper #fdfbf6` — **light cream**.
- Ink: `--ink #14110d`, `--ink2 #5a544c`, `--ink3 #8a8278` — **graphite ramp**.
- Lines: `--line rgba(20,17,13,0.10)`, `--line2 rgba(20,17,13,0.05)`.
- Accent: `--accent #ff5b1f`, `--accent-soft rgba(255,91,31,0.10)` — **electric tangerine, used sparingly** (max 10 accent spots per spec).
- Fonts: `--font-sans 'Geist Variable'`, `--font-mono 'Geist Mono'`, `--font-serif 'Newsreader Variable'`, `--font-display-italic 'Instrument Serif'`.
- Gradients: `--gradient-mesh-hero` (two radial halos), `--gradient-cta-glow` (single CTA halo).
- Layout: `--container: 1240px`, `--container-pad: 36px` (24px @ 860, 18px @ 540).
- `color-scheme: light`.

### 3.2 Typography (`src/styles/typography.scss`)

- Loads via `@fontsource-variable/geist`, `@fontsource/geist-mono`, `@fontsource-variable/newsreader` (opsz + opsz-italic), `@fontsource/instrument-serif/400` + italic.
- Body: `var(--font-sans)` 16px, `font-feature-settings: 'ss01', 'cv11'`, letter-spacing `-0.011em`.
- h1 `clamp(36px, 7vw, 98px)` line 1 letter `-0.04em`.
- h2 `clamp(28px, 4.6vw, 60px)` line 1.08 letter `-0.032em`.
- h3 `clamp(19px, 2vw, 22px)` letter `-0.022em`.
- Editorial italic via Instrument Serif/Newsreader for blog hero `em` etc.

### 3.3 Global styles (`src/styles.scss`)

224 lines containing **Variant C utility classes**:
- `.vc-wrap` (container at `var(--container)` with `var(--container-pad)`).
- `.vc-mesh`, `.vc-grain` (decorative backgrounds).
- `.vc-btn`, `.vc-btn-primary` (graphite), `.vc-btn-accent` (tangerine), `.vc-btn-ghost`.
- `.vc-eyebrow`, `.vc-dot`, `.vc-kicker`, `.vc-kicker-bar`.
- `.vc-h1-grad` (tangerine slanted underbar), `.vc-h1-em` (Instrument Serif italic emphasis word).
- `.vc-section-h`, `.vc-section-sub`.
- `.skip-link` (a11y) + global `:focus-visible { outline: 2px solid var(--ink); }`.
- Scrollbar reskin (`--ink3`).

### 3.4 App shell (`src/app/app.html`, `src/app/app.scss`)

- Minimal: `<a class="skip-link>`, `<app-header />`, `<main id="main" tabindex="-1"><router-outlet/></main>`, `<app-footer />`, `<app-consent-banner />`.
- `app.scss` only declares `:host { display: block; }`.
- The home content lives in `home.component.ts` (per Variant B architecture: home = compact summary).

### 3.5 Components present in landing (not in TF)

- **Language switcher** (`components/language-switcher`) — TF has no i18n UI. Currently uses `--border`, `--accent-light`, `--bg-secondary`, `--text-secondary` — **variables that don't exist** in tokens.scss. This is a bug today (it falls back to invalid).
- **Contact form** (`shared/contact-form`) — used on contact pages; TF has no contact form (CTA links out).
- **Consent banner** (`core/consent`) — both projects have one; TF's is `cookie-consent.component.ts`, target's is `consent-banner.component`.
- **Live-demo widget** (`widgets/live-demo`) — TF has its own multi-tab demo inline in `app.html`; target has a standalone widget with `__chat`, `__input`, `__caret`, `__pulse`, `__code`, `__rows`.
- **Industries pages** — list + per-industry detail; TF has none.
- **About page** — TF has only inline About section on home; target has full page.
- **How-it-works page** — TF: section on home only.
- **Pricing page** — TF: section on home only.
- **For-AI-agents page** — TF has a `for-ai-agents.component` too — minimal page with `.ai-docs` longform styling.
- **Legal page** — TF has security page; target has legal index + multiple legal slug pages.
- **FAQ page** — full FAQ; TF: FAQ section on home only.
- **Blog list / post** — both projects have full blog.

### 3.6 What differs in current target SCSS

Every component currently uses:
- `var(--paper)` / `var(--bg-soft)` for surfaces.
- `var(--ink)` / `var(--ink2)` / `var(--ink3)` for text.
- `var(--line)` / `var(--line2)` for borders.
- `var(--accent)` tangerine — **hex mismatch**: target = `#ff5b1f` (more red-shifted), TF = `#FF6B2B` (warmer / slightly more orange). The two are visually distinguishable side-by-side. We adopt TF's `#FF6B2B` via the §5.1 token swap. (This wording supersedes any earlier "already correct" claim; see §4 diff row "Accent hex" — they are the same finding.)
- Border-radius: 10–24px (mix). TF uses tight 8–20.
- Buttons: `.vc-btn-*` classes everywhere instead of TF's flat `.btn .btn-primary`.
- Padding scales different: target uses `60–70px` sections, TF uses 80px.

### 3.7 Index.html

- No font loading at all (relies on `@fontsource` Sass imports → bundled).
- `theme-color #f7f3ec` (light cream).
- Missing canonical, OG, Twitter, structured data tags (those live in pages via Title/Meta services — fine, no migration needed).

---

## 4. Diff Analysis

| Layer                | TypelessForm (reference)                              | Typelessity-Landing (today)                             | Severity |
|----------------------|-------------------------------------------------------|---------------------------------------------------------|----------|
| **Palette base**     | Dark slate `#282838 → #3A3A4C`                        | Cream paper `#f3ede2 → #fdfbf6`                         | Critical |
| **Text colors**      | `#F0F0F5 / #A3A3B8 / #7C7C92` light                   | `#14110d / #5a544c / #8a8278` graphite                  | Critical |
| **Accent hex**       | `#FF6B2B` (warmer orange)                             | `#ff5b1f` (slightly more red-orange)                    | Minor — needs hex update to `#FF6B2B` |
| **Border tone**      | `rgba(255,255,255,0.08)` (light-on-dark)              | `rgba(20,17,13,0.10)` (dark-on-light)                   | Critical |
| **Body font**        | DM Sans, self-hosted woff2 in `/public/fonts/`        | Geist Variable, bundled via `@fontsource`               | Critical |
| **Display font**     | Space Mono, self-hosted                               | Newsreader + Instrument Serif (editorial italic)        | Critical |
| **Mono font**        | (same Space Mono is used as mono)                     | Geist Mono                                              | Critical |
| **Container**        | 1120px, padding `0 24px` constant                     | 1240px, padding `0 36px → 24px → 18px` responsive       | Major    |
| **Section gap**      | `--section-gap: 80px` (56px mobile)                   | Ad-hoc `50–70px` per page                               | Major    |
| **Radii**            | 12 / 20 / 100 / 6–8                                   | 10–24 mix; tier 24, faq 14, cards 12–16                 | Major    |
| **Shadows**          | Orange-glow + deep dark drop shadows                  | Subtle dark drops (`rgba(20,17,13,0.x)`)                | Major    |
| **Hero bg**          | 60px orange grid mask                                 | `vc-mesh` two-radial halos + `vc-grain` SVG noise       | Major    |
| **Buttons**          | `.btn .btn-primary / .btn-outline / .btn-sm / -lg / -full` | `.vc-btn .vc-btn-primary / -accent / -ghost / -lg / -block` | Critical (rename + restyle) |
| **Eyebrow / badge**  | `.badge` orange pill with border + tint               | `.vc-eyebrow` paper pill + line border + dot           | Critical |
| **Section header**   | `.section-header` text-center + `.badge` + h2 + sub   | `.vc-section-h` left-aligned + `.vc-kicker` + h2        | Major (alignment + classes) |
| **Cards**            | `.step-card / .feature-card / .price-card / .faq-item / .blog-card` | `.phase / .pillar / .tier / .industry-card / .home-faq__list details / .blog-feature__card / .blog-row__card` | Critical (rename + colors) |
| **Header chrome**    | `.header / .header-inner / .nav-desktop / .burger / .mobile-menu` | `.vc-nav / .vc-nav-inner / .vc-nav-links / .vc-burger / .vc-mobile-menu` | Critical |
| **Footer chrome**    | `.footer / .footer-inner / .footer-left / .footer-links / .footer-col / .footer-bottom` | `.vc-footer / .vc-footer-grid / .vc-footer-brand / .vc-footer-h / .vc-footer-links` | Critical |
| **Skip-link**        | absent in TF                                          | present, dark ink on cream bg                           | Keep target's — restyle to dark theme |
| **Reduced-motion**   | absent in TF                                          | present in `reset.scss:36-43`                           | Keep target's |
| **Theme-color meta** | absent in TF                                          | `#f7f3ec` cream                                         | Swap to `#282838` slate |
| **Language switcher**| absent in TF                                          | present, uses undefined vars (`--accent-light`, `--bg-secondary`, `--text-secondary`) | Critical — must be fixed during port (uses TF's `--bg-secondary` once we adopt TF tokens) |
| **Live demo widget** | inline demo with tab forms                            | standalone widget with chat/input/extract/api panels    | Major — restyle to dark theme + apply card surfaces |
| **Editorial italic** | none (Space Mono headings, no serif)                  | Newsreader + Instrument Serif italics in blog hero, h1 `<em>` | Critical (drop the serif system entirely) |

**Summary depth of change per file:**

| File                                                | Today (lines) | Predicted after | Change type                  |
|-----------------------------------------------------|---------------|-----------------|------------------------------|
| `src/styles/tokens.scss`                            | 49            | ~40             | Full token swap              |
| `src/styles/typography.scss`                        | 48            | ~30             | Font family swap, drop serif |
| `src/styles/reset.scss`                             | 43            | 43              | Keep as-is (reduced-motion good) |
| `src/styles.scss`                                   | 224           | ~120            | Drop `.vc-*` utils, add TF utils |
| `src/app/app.scss`                                  | 4             | 4               | No change (host display)     |
| `src/app/app.html`                                  | 7             | 7               | No change                    |
| `src/index.html`                                    | 15            | ~20             | Add fonts.css link, theme-color |
| `header.component.scss`                             | 113           | ~145            | Rename to `.header / .nav-desktop`, dark glass bg |
| `footer.component.scss`                             | 62            | ~90             | Rename to `.footer`, dark bg-secondary |
| `language-switcher.component.scss`                  | 100           | ~100            | Re-map vars (`--accent-light` → `--accent-hover`, `--bg-secondary` already TF), fix surface |
| `contact-form.component.scss`                       | 82            | ~110            | Reskin labels/inputs to TF form-group spec |
| `consent-banner.component.scss`                     | 104           | ~110            | Dark card surface, `.btn` class |
| `live-demo.component.scss`                          | 205           | ~220            | Repaint to `--bg-card / --border`, keep structure |
| `home.component.scss`                               | 631           | ~520            | Heavy rewrite: hero stats how-it-works pillars industries compare pricing faq cta all need TF classes |
| `about-page.component.scss`                         | 87            | ~90             | Hero pad, values grid → `.feature-card` |
| `faq-page.component.scss`                           | 119           | ~120            | `.faq-item` adoption, jump-nav reskin |
| `for-ai-agents.component.scss`                      | 124           | ~110            | Dark code block (already `#1a1815` → switch to `--bg-code`), `.aiagents-def` → TF card |
| `how-it-works-page.component.scss`                  | 317           | ~280            | `.how-phase` numbered blocks → port to `.step-card` + connector |
| `industries-page.component.scss`                    | 62            | ~70             | `.industry-card` → `.feature-card` variant |
| `industry-detail-page.component.scss`               | 190           | ~190            | `.conv` two-pane card; restyle to dark |
| `blog-list.component.scss`                          | 454           | ~280            | Replace editorial archive layout with TF blog grid card list — major reduction |
| `blog-post.component.scss`                          | 631           | ~580            | Restyle to TF blog-post inline styles (article-body, faq, cta — already very close in structure) |
| `legal-page.component.scss`                         | 80            | ~80             | Reskin tables, code, links to dark |
| `not-found.component.scss`                          | 39            | ~50             | Match TF not-found.component.scss exactly |
| `pricing-page.component.scss`                       | 301           | ~250            | `.tier` → `.price-card`, onboarding → `.step-card`, diff table → TF table style |

---

## 5. Migration Plan

### 5.1 Tokens (`src/styles/tokens.scss`)

**Replace the entire `:root` block** with TF's palette + sizing + fonts. Target structure (keep dual-naming during transition is **NOT** recommended — clean swap):

```scss
:root {
  // ── Surfaces (TF) ──
  --bg-primary: #282838;
  --bg-secondary: #313142;
  --bg-card: #3A3A4C;
  --bg-card-hover: #434356;
  --bg-code: #2E2E3E;

  // ── Text ──
  --text-primary: #F0F0F5;
  --text-secondary: #A3A3B8;
  --text-muted: #7C7C92;

  // ── Accent ──
  --accent: #FF6B2B;
  --accent-hover: #FF8548;
  --accent-glow: rgba(255, 107, 43, 0.15);
  --accent-subtle: rgba(255, 107, 43, 0.08);

  // ── Borders ──
  --border: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(255, 107, 43, 0.3);

  // ── Semantic ──
  --success: #34D399;
  --info: #60A5FA;

  // ── Typography ──
  --font-display: 'Space Mono', monospace;
  --font-body: 'DM Sans', sans-serif;

  // ── Sizing ──
  --container: 1120px;
  --section-gap: 80px;
  --radius: 12px;
  --radius-lg: 20px;

  color-scheme: dark;
}

@media (max-width: 860px) {
  :root { --section-gap: 56px; }
}
```

**Remove entirely**: `--ink`, `--ink2`, `--ink3`, `--paper`, `--bg`, `--bg-soft`, `--line`, `--line2`, `--accent-soft`, `--gradient-mesh-hero`, `--gradient-cta-glow`, `--font-sans`, `--font-mono`, `--font-serif`, `--font-display-italic`, `--container-pad`.

**Why no `--container-pad`?** TF uses a flat `padding: 0 24px` inside `.container` (`styles.scss:66`) — no responsive padding step-down. We adopt that.

**Action for files referencing dropped tokens (`--ink`, `--paper`, `--line`, etc.)**: replace via per-file mapping during component migration. Mapping table:

| Old (Variant C) | New (TF)                |
|-----------------|-------------------------|
| `--ink`         | `--text-primary`        |
| `--ink2`        | `--text-secondary`      |
| `--ink3`        | `--text-muted`          |
| `--paper`       | `--bg-card`             |
| `--bg`          | `--bg-primary`          |
| `--bg-soft`     | `--bg-secondary`        |
| `--line`        | `--border`              |
| `--line2`       | `--border` (or remove second tier) |
| `--accent`      | `--accent` (keep — hex changes by var update) |
| `--accent-soft` | `--accent-subtle`       |
| `--font-sans`   | `--font-body`           |
| `--font-mono`   | `--font-display`        |
| `--font-serif`  | (none — drop usages, replace with `--font-display`) |
| `--font-display-italic` | (drop usages — TF has no italic display tier) |

### 5.2 Global styles & typography

#### 5.2.1 `src/styles/typography.scss`

- **Drop all `@fontsource-variable/geist`, `@fontsource/geist-mono`, `@fontsource-variable/newsreader/*`, `@fontsource/instrument-serif/*` imports.**
- Replace with one of two approaches:
  - **Option A (matches TF 1-в-1):** drop SCSS @use imports entirely. Add self-hosted woff2 files to `public/fonts/` (copy from TF or download fresh from Google Webfonts Helper), create `public/fonts/fonts.css`, and load via `<link>` in `index.html` (see §5.4). This is the **GDPR-safe approach TF uses**.
  - **Option B (npm-managed):** install `@fontsource/dm-sans` (`400`,`500`,`600`,`700`) and `@fontsource/space-mono` (`400`,`700`) and `@use` them in `typography.scss`. Easier to manage but bundled — bigger initial CSS. **Pick Option A** to be truly 1-в-1.
- Rewrite typography rules:

```scss
html {
  font-size: 16px;
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-body);
  background: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  margin: 0;
}

// Hero & section title clamps live in component SCSS — global only sets family/weight.

p { margin: 0; }
code, pre, kbd, samp { font-family: var(--font-display); }
```

- **Remove** `font-feature-settings: 'ss01', 'cv11'` (Geist-specific OpenType features). Remove `letter-spacing: -0.011em` global (DM Sans does not need negative tracking).
- **Remove** `text-wrap: balance / pretty` global defaults — TF does not use them. (Optional: keep `text-wrap: balance` on h1 only.)

#### 5.2.2 `src/styles/reset.scss`

- **Keep as-is.** The `prefers-reduced-motion` block (lines 36–43) is an a11y win that TF lacks; we preserve it.
- **Drop** the `a { color: inherit; }` reset — TF wants `a { color: var(--accent); }` global (`styles.scss:53-58`). Either remove from reset or override globally in `styles.scss`.

#### 5.2.3 `src/styles.scss` — rewrite globally

Replace the entire file. New structure must include:

1. `@use './styles/reset.scss';`
2. `@use './styles/tokens.scss';`
3. `@use './styles/typography.scss';`
4. Global `a` rule from TF `styles.scss:53-58`:
   ```scss
   a {
     color: var(--accent);
     text-decoration: none;
     transition: color 0.2s;
     &:hover { color: var(--accent-hover); }
   }
   ```
5. Universal box-sizing reset (already in reset.scss).
6. `img { max-width: 100%; height: auto; display: block; }` (already in reset.scss).
7. **`.container` utility** (replace `.vc-wrap`):
   ```scss
   .container { max-width: var(--container); margin: 0 auto; padding: 0 24px; }
   ```
8. **`.highlight`** utility (TF `styles.scss:69-72`):
   ```scss
   .highlight { color: var(--accent); position: relative; }
   ```
9. **`.badge`** utility (TF `styles.scss:74-85`).
10. **`.btn`, `.btn-primary`, `.btn-outline`, `.btn-sm`, `.btn-lg`, `.btn-full`** utilities (TF `styles.scss:87-124` + `app.scss:59-62, 1075-1082`).
11. **`.section-title`, `.section-subtitle`** (TF `styles.scss:127-140`).
12. **Scrollbar reskin** with `--text-muted` thumb on `--bg-primary` track (TF `styles.scss:143-145`).
13. **Skip-link** preserved with restyled colors:
    ```scss
    .skip-link {
      position: absolute; top: -100px; left: 0; z-index: 1000;
      background: var(--accent); color: #fff;
      padding: 10px 16px; border-radius: 0 0 8px 0;
      font-size: 14px; font-weight: 600;
      transition: top 0.15s;
      &:focus-visible { top: 0; outline: 2px solid #fff; outline-offset: 2px; }
    }
    ```
14. **`:focus-visible`** default — restyle to orange:
    ```scss
    :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
    main:focus { outline: none; }
    ```
15. **Drop entirely**: `.vc-wrap`, `.vc-mesh`, `.vc-grain`, `.vc-btn*`, `.vc-eyebrow`, `.vc-dot`, `.vc-kicker*`, `.vc-h1-grad`, `.vc-h1-em`, `.vc-section-h`, `.vc-section-sub`.

#### 5.2.4 Section primitives

Add to `styles.scss` (or to `app.scss` to match TF's split — TF puts these in `app.scss`):

```scss
.section {
  padding: var(--section-gap) 0;
  & + .section, & + .cta-section { padding-top: 0; }
}

.section-alt {
  background: var(--bg-secondary);
  & + .section-alt { padding-top: 0; }
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
  .section-subtitle { margin: 0 auto; }
  .badge { margin-bottom: 16px; }
}
```

`.cta-section` should also live in global:
```scss
.cta-section {
  padding: var(--section-gap) 0;
  background:
    radial-gradient(ellipse at 50% 50%, var(--accent-glow) 0%, transparent 60%),
    var(--bg-primary);
}
.cta-inner { text-align: center; }
```

### 5.3 Layout / app shell

`src/app/app.html` — **no structural change required.** Skip-link, header, main, router-outlet, footer, consent-banner stay in same positions.

`src/app/app.scss` — **no change** (keeps `:host { display: block; }`).

**Conceptual change**: the header is `fixed` in TF (`app.scss:2-11`). Target's header is `sticky` (`header.component.scss:7-9`). For 1-в-1, switch to `position: fixed`. **Consequence**: `<main>` needs a top padding offset equal to header height (64px), otherwise content hides under the fixed bar. Add to `styles.scss`:
```scss
main { padding-top: 64px; }  // matches .header height
```
(TF gets away without this because the home component's hero begins with `padding: 120px 0 64px` and other sections sit below — but our deep pages need the safety net.)

### 5.4 Index.html (fonts, head)

Edit `src/index.html`:

1. Add **inside `<head>`**, before any inline styles. **Use an absolute path** — TF's relative `href="fonts/fonts.css"` breaks under Angular SSR on nested routes (e.g., `/ru/blog/foo` resolves the relative URL to `/ru/blog/fonts/fonts.css` → 404):
   ```html
   <link rel="stylesheet" href="/fonts/fonts.css" />
   ```
2. Change theme-color: `<meta name="theme-color" content="#282838">` (was `#f7f3ec`).
3. Keep favicon link (icon paths unchanged).
4. **Copy TF's font assets** to target's `public/fonts/` **with Cyrillic supplementation** (see §5.4-A below):
   - `public/fonts/fonts.css` (modified — Cyrillic blocks added).
   - All 8 TF woff2 files (latin / latin-ext / vietnamese subsets).
   - Plus **Cyrillic substitute files** — see §5.4-A.
5. **Add `preload` hints — MANDATORY (not optional) under SSR.** Without preload, the SSR'd HTML reaches the browser, paints with system fallback, and then swaps when `fonts.css` resolves. That is a visible FOUC on every cold load and shifts LCP. **TF de-duplicates files across weights** (the 4 DM Sans weight declarations in `fonts.css` all point to the same 2 hashed woff2 files for latin / latin-ext; Space Mono uses 3 unique files across 2 weights). Preload only the unique files that exist on disk:
   ```html
   <!-- DM Sans latin (single file serves 400/500/600/700) -->
   <link rel="preload" href="/fonts/rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2" as="font" type="font/woff2" crossorigin />
   <!-- Space Mono latin 400 -->
   <link rel="preload" href="/fonts/i7dPIFZifjKcF5UAWdDRYEF8RXi4EwQ.woff2" as="font" type="font/woff2" crossorigin />
   <!-- Space Mono latin 700 -->
   <link rel="preload" href="/fonts/i7dMIFZifjKcF5UAWdDRaPpZUFWaHi6WZ3Q.woff2" as="font" type="font/woff2" crossorigin />
   ```
   Three preloads cover all above-the-fold weights (hero h1 = Space Mono 700, hero body = DM Sans 400, header CTA = DM Sans 600 → both served by the single DM Sans latin file). For `ru-RU` locale, also preload the Cyrillic Inter / JetBrains Mono latin files (see §5.4-A) — the static SSR'd HTML can include all preloads unconditionally; browsers fetch only what `unicode-range` actually needs.
6. **Add system-font fallback stack to body** (`typography.scss`) so FCP renders before any woff2 resolves and the cascade only swaps to DM Sans / Space Mono after they're cached:
   ```scss
   :root {
     --font-body: 'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
     --font-display: 'Space Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
   }
   ```
   (This supersedes the bare `'DM Sans', sans-serif` shown in §2.2 — the bare TF stack relies on browser default sans which produces a more jarring swap.)
7. Keep `font-display: swap` everywhere in `fonts.css` (TF default).
8. Remove `@fontsource-*` packages from `package.json` (`@fontsource-variable/geist`, `@fontsource/geist-mono`, `@fontsource-variable/newsreader`, `@fontsource/instrument-serif`).
9. **SSR verification step (required at the end of P0):** after `ng build` + `serve:ssr:typelessity-landing`, run
   ```bash
   curl -s http://localhost:4000/ | grep -E 'fonts\.css|theme-color'
   curl -s http://localhost:4000/ru | grep -E 'fonts\.css|theme-color'
   curl -s http://localhost:4000/ru/blog | grep -E 'fonts\.css|theme-color'
   ```
   Assert each response contains `<link rel="stylesheet" href="/fonts/fonts.css">` inside `<head>` and `<meta name="theme-color" content="#282838">`. If any deep route resolves to `fonts/fonts.css` relatively → 404 risk.

#### 5.4-A Cyrillic strategy (closes blackout flagged in §2.2)

TF's `fonts.css` ships no Cyrillic subsets, and Google Fonts itself does **not publish** a Cyrillic subset for DM Sans or Space Mono (verified via `fonts.googleapis.com/css2` 2026-05-19). Three options — Founder decision required. Default recommendation = **Option A**.

**Option A (RECOMMENDED, ~+50 KB) — Cyrillic via sibling font, kept in family:**
- Add `'Inter'` (or `'PT Sans'`, both have Cyrillic on Google Fonts, both close to DM Sans metrics) as a **Cyrillic-only fallback inside the same `--font-body` stack**:
  ```css
  /* Cyrillic — Inter (DM Sans does not ship cyrillic) */
  @font-face {
    font-family: 'DM Sans';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(/fonts/inter-400-cyrillic.woff2) format('woff2');
    unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116;
  }
  /* Cyrillic-ext — same approach */
  @font-face {
    font-family: 'DM Sans';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url(/fonts/inter-400-cyrillic-ext.woff2) format('woff2');
    unicode-range: U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F;
  }
  ```
  Repeat for weights 500/600/700. Because we keep `font-family: 'DM Sans'` and rely on `unicode-range` partition, the browser uses DM Sans for Latin glyphs and Inter for Cyrillic glyphs **inside the same paragraph** — no font-stack switching, no mid-sentence size jumps. Standard subset technique; same one Google Fonts uses internally.
- For Space Mono → use `'JetBrains Mono'` (Cyrillic available on Google Fonts) the same way under `font-family: 'Space Mono'`.
- Files to add: `public/fonts/inter-{400,500,600,700}-{cyrillic,cyrillic-ext}.woff2` (8 files) + `public/fonts/jetbrains-mono-{400,700}-{cyrillic,cyrillic-ext}.woff2` (4 files) = ~12 files, total ≈ 50–60 KB compressed.
- Source: download from `https://gwfh.mranftl.com/fonts/inter?subsets=cyrillic,cyrillic-ext` and `…/jetbrains-mono?subsets=cyrillic,cyrillic-ext` (Google Webfonts Helper, GDPR-safe).
- Unicode-range source: identical to Google Fonts CSS-2 API output for the `cyrillic` / `cyrillic-ext` subsets.

**Option B (~+12 KB) — switch RU body to native Cyrillic family entirely:**
- Replace `--font-body` for `:lang(ru)` with `'PT Sans', sans-serif` (Cyrillic native) and keep DM Sans for non-RU. Less consistent visually across locales but cheapest.
  ```scss
  :lang(ru) { --font-body: 'PT Sans', system-ui, sans-serif; }
  ```

**Option C (0 KB) — drop RU translations.** Founder choice; affects `translations.ru.ts` removal + sitemap pruning. Out of scope for this design plan, included only for completeness.

**Test plan** (after either Option A or B):
1. Visit `/ru`, `/ru/about`, `/ru/blog/<any post>`, `/ru/faq`, `/ru/pricing`, `/ru/legal/privacy`, `/ru/industries/restaurants`.
2. In DevTools → Rendering panel → enable "Highlight ad frames" off, then in the Computed pane on a Cyrillic `<p>` confirm `font-family` resolves to `DM Sans` (Option A — visually it's Inter under the hood) and not to system default.
3. Network tab: confirm `inter-400-cyrillic.woff2` (or `pt-sans-400.woff2`) loaded; confirm zero requests to `fonts.googleapis.com`.
4. Visual check at hero headings (Space Mono → JetBrains Mono substitution): "Превратите беспорядочные данные в идеальный JSON" — monospace cell widths should stay consistent.

### 5.5 Per-component migration

> **General rule for every component below**: replace `.vc-*` class hooks with TF's class hooks in templates, and replace SCSS rules accordingly. Variable mapping per §5.1.

#### 5.5.1 `components/header/header.component` (path: `src/app/components/header/`)

**Today** (`header.component.scss:1-113`):
- `.vc-nav` sticky 22px 0 padding, cream `rgba(247, 243, 236, 0.78)` blur.
- `.vc-nav-inner` flex gap 36px.
- `.vc-logo / .vc-logo-mark / .vc-logo-text` 17px 600.
- `.vc-nav-links a` graphite ink2 14.5px.
- `.vc-nav-cta` flex with `.vc-pill` and `.vc-btn-*` CTAs.
- `.vc-burger` 22px×2px bars graphite.
- `.vc-mobile-menu` cream bg.

**Migration to TF** (matches `typelessform/src/app/app.scss:1-145`):
- Container class becomes `.header` (fixed, top 0, z 100, height 64px header-inner). Add `<div class="container header-inner">` wrapper inside.
- Replace `.vc-nav` block with `.header`:
  ```scss
  .header {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
  }
  .header-inner {
    display: flex; align-items: center; justify-content: space-between;
    height: 64px;
  }
  ```
- Logo: `.logo / .logo-icon / .logo-text` per TF (Space Mono 18px 700, accent icon).
- Nav: `.nav-desktop a` 14px DM Sans `--text-secondary` → hover `--text-primary`.
- Header CTA: use `.btn .btn-primary .btn-sm`.
- Burger: TF style (span 20×2 white bars, transform to X with `.open` modifier).
- Mobile menu: `--bg-secondary` background.
- Breakpoint `860px`: hide `.nav-desktop, .header-actions`; show `.burger, .mobile-menu`.

**Template changes** (`header.component.html`):
- `<nav class="vc-nav">` → `<header class="header"><div class="container header-inner">`.
- `<a class="vc-logo">` → `<a class="logo">` with `<span class="logo-icon">` and `<span class="logo-text">Typelessity<span class="highlight">.</span></span>` or similar.
- `<ul class="vc-nav-links">` → `<nav class="nav-desktop">` with plain `<a>` children.
- `<button class="vc-burger">` → `<button class="burger">`.
- Mobile menu wrapper → `.mobile-menu`.
- The language-switcher slot stays — but its hosting `.vc-pill` wrapper needs to drop and the switcher itself gets a TF-aware class set (see §5.5.3).

#### 5.5.2 `components/footer/footer.component` (path: `src/app/components/footer/`)

**Today** (`footer.component.scss:1-62`):
- `.vc-footer` 70px 0 36px padding, border-top `--line`.
- `.vc-footer-grid` 2fr 1fr 1fr 1fr 4-col.
- `.vc-footer-brand p` 13.5px graphite.
- `.vc-footer-h` 13px 600.
- `.vc-footer-links a` 13.5px graphite → hover ink.

**Migration to TF**:
- Replace `.vc-footer` → `.footer`:
  ```scss
  .footer {
    background: var(--bg-secondary);
    border-top: 1px solid var(--border);
    padding: 64px 0 32px;
  }
  ```
- `.footer-inner` flex wrap gap 48px.
- `.footer-left` flex 1, with `.logo-text` Space Mono 20px 700 block.
- `.footer-links` flex gap 64px.
- `.footer-col h4` Space Mono 13px uppercase letter-spacing 1px.
- `.footer-col a` DM Sans 14px `--text-muted` → hover `--text-primary`.
- `.footer-bottom` width 100%, padding-top 32px, border-top `--border`, 13px `--text-muted`, flex space-between.
- Add `.cookie-settings-link` if footer hosts the cookie-prefs trigger.

**Template** (`footer.component.html`):
- Re-shape to TF structure: `.footer > .container.footer-inner > .footer-left + .footer-links > .footer-col* + .footer-bottom`.

#### 5.5.3 `components/language-switcher/language-switcher.component`

**Today** uses undefined vars: `--border`, `--accent-light`, `--bg-secondary`, `--text-secondary`. After token migration, `--border`, `--bg-secondary`, `--text-secondary` all become defined. `--accent-light` does **not** exist in TF — replace with `--accent-hover`.

**Migration**:
- Keep BEM-ish `.lang-dropdown / .lang-trigger / .lang-menu / .lang-option / .lang-divider / .lang-active / .lang-code`.
- Trigger: `padding: 6px 10px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); border-radius: 8px;`. Hover border → `--accent`, color → `--accent-hover`.
- Menu: dropdown bg `--bg-secondary`, border 1px `--border`, radius 10px, shadow `0 8px 24px rgba(0, 0, 0, 0.4)`, padding 6px.
- Options: hover `bg: var(--accent); color: #fff;`.
- Active row: color `--accent`.
- Keep `dropIn` keyframe.
- **Add**: `.lang-trigger:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`.
- The trigger likely needs a different size when sitting in TF's `.header-actions` slot (8px 20px / 13px → match `.btn-sm`).

#### 5.5.4 `shared/contact-form/contact-form.component`

**Today**: `.cf` form with `.cf__grid / .cf__row / .cf__msg`. Uses `--ink / --ink2 / --line / --paper`. Inputs 12px 14px padding, border 1px line, radius 10px, focus shadow 3px ink rgba.

**Migration to TF demo-form pattern** (see TF `app.scss:686-789`):
- Container: bg `--bg-card`, border 1px `--border`, radius `--radius-lg`, padding 32px (or smaller if embedded — keep flex column gap 16px).
- `.cf__grid` → `.form-row` (grid 1fr 1fr gap 16px), 1-col < 700px.
- Each `.cf__row` → `.form-group` with label `font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: 6px;`.
- Inputs: `padding: 10px 14px; font-size: 14px; color: var(--text-primary); background: var(--bg-primary); border: 1px solid var(--border); border-radius: 8px;`. Focus border `--accent`.
- Checkbox row: `accent-color: var(--accent);`.
- Success message bg: keep green tint, but make it dark-theme: `background: rgba(52, 211, 153, 0.1); color: var(--success);`.
- Error message: `background: rgba(229, 62, 62, 0.12); color: #f87171;`.

#### 5.5.4-a `shared/icon/icon.component`

**Today** (`shared/icon/icon.component.ts:1-31`): inline-template Angular component with `IconName = 'chevron-down' | 'arrow-right-small'`. SVGs already declare `stroke="currentColor"` (and `fill="none"`).

**Migration**: **no template changes**. Confirm at migration time that all callers pass `color: var(--text-secondary | --text-primary | --accent)` to the parent context — because `currentColor` inherits from the CSS `color` property, the same icons will automatically re-tint to the dark-theme palette without any code edit. Add a one-line comment in the component file noting `// Icons inherit color via currentColor; no per-theme rewrite needed.`. If a future variant icon requires an accent fill independent of text color, expose a `[fill]` input then; out of scope for v1 migration.

**Verification**: after Phase 1, open `/` in the rendered app and inspect the language-switcher chevron and any inline `arrow-right-small`. Computed `color` should resolve to `--text-secondary` (or whatever the parent passes); the SVG stroke must visibly match. No SVGs should appear pure-`#000` against the dark slate background — that would signal a caller forcing `color: black` somewhere.

#### 5.5.5 `core/consent/consent-banner.component`

**Today** (`consent-banner.component.scss:1-104`, `consent-banner.component.ts:1-86`):
- Two-state banner: collapsed (Cookies + Preferences/Reject/Accept) and expanded preferences (3-tier toggles).
- `.consent__tiers li` lists **Required / Functional / Analytics** with per-tier checkboxes — granular GDPR + ePrivacy compliance.
- `.consent` fixed bottom, paper bg, line border, radius 18px, soft shadow.
- `.consent__h` 15px 600 ink; `.consent__d` 13.5px ink2.
- `.consent__actions .vc-btn` 9px 16px / 13.5px buttons.
- `.consent__tiers li` bg `--bg-soft` border `--line` radius 12px.

**TF reference** (`typelessform/src/app/cookie-consent.component.ts:34-37`): flat **2-button** Accept-All / Necessary-Only — **no per-tier toggles**.

**Migration — surface restyle only; UX granularity preserved.**

Adopting TF's flat 2-button structure as-is would be a **compliance regression**: target's per-tier toggle pattern is the safer GDPR/ePrivacy posture (allows users to opt-in to analytics independently of functional). The plan therefore **keeps target's template structure** (`.consent`, `.consent__inner`, two states via `@if (!showPrefs())`, `.consent__tiers` 3-row UL) and only restyles surfaces to TF aesthetic.

Concrete mapping:

- **Outer `.consent` card** (both states): bg `--bg-card`, border 1px `--border`, radius `--radius-lg` (20px), padding `22px 26px`, shadow `0 24px 60px -16px rgba(0, 0, 0, 0.6)`. Position unchanged (fixed bottom 16px left 16px right 16px z-100).
- **`.consent__h`** Space Mono 15px 700 `--text-primary`, margin-bottom 6px.
- **`.consent__d`** DM Sans 13.5px `--text-secondary` line 1.55 max-width 600px.
- **Inline links inside copy** (`/llms.txt`, `/en/legal/privacy`): `color: var(--accent); border-bottom: 1px solid rgba(255, 107, 43, 0.3);` hover solid `--accent`.
- **Collapsed-state action row** (`.consent__actions`):
  - `<button class="vc-btn vc-btn-ghost">Preferences</button>` → keep `class="vc-btn vc-btn-ghost"` → on rename pass also rename DOM class to `class="btn btn-outline btn-sm"` and update SCSS accordingly. Function: opens preferences panel.
  - `<button class="vc-btn vc-btn-ghost">Reject optional</button>` → `class="btn btn-outline btn-sm"`.
  - `<button class="vc-btn vc-btn-primary">Accept all</button>` → `class="btn btn-primary btn-sm"`.
- **Expanded-state preferences `<form class="consent__prefs">`** — keep the full `<ul class="consent__tiers">` markup. Tier rows:
  - Each `li`: bg `--bg-secondary`, border 1px `--border`, radius 12px, padding `12px 16px`.
  - `label` grid: `18px 1fr` two-column.
  - `input[type=checkbox]` 18×18, `accent-color: var(--accent)` (replaces `accent-color: var(--ink)`).
  - `<strong>` row: DM Sans 14px 600 `--text-primary`.
  - `<span>` row: DM Sans 13px `--text-secondary`.
  - Disabled "Required" tier: same visuals + `[disabled]` adds `opacity: 0.55; cursor: not-allowed;`.
- **Expanded-state action row** (Back / Save):
  - Back: `class="btn btn-outline btn-sm"`.
  - Save: `class="btn btn-primary btn-sm"`.
- **i18n preservation**: when rewriting the template, **do NOT replace any visible string with hardcoded English**. The current TS uses inline literals (`"Cookies"`, `"Preferences"`, etc.) but these belong in `translations.{en,de,pl,ru}.ts` as part of P1-1 of Phase 1 (add keys `consent.title`, `consent.body`, `consent.actions.preferences`, `.reject`, `.acceptAll`, `consent.tiers.required.label`, `.required.desc`, `.functional.label`, `.functional.desc`, `.analytics.label`, `.analytics.desc`, `consent.actions.back`, `.save`). Wire via `TranslationService` like other UI strings.
- **ARIA preserved**: `role="dialog"`, `aria-labelledby="consent-h"`, `aria-describedby="consent-d"` stay verbatim.
- **Mobile** (≤ 640px): stack action buttons full-width via `.consent__actions .btn { flex: 1; min-width: 0; justify-content: center; }`. Already in target SCSS — keep, only swap class selector from `.vc-btn` to `.btn`.

**Explicit non-goal:** do **not** collapse to TF's 2-button banner. The TF source file (`typelessform/src/app/cookie-consent.component.ts`) is a visual reference for chrome and copy tone, not for UX architecture.

#### 5.5.6 `widgets/live-demo/live-demo.component`

**Today** (`live-demo.component.scss:1-205`):
- `.ld` container with cream gradient bg, line border, deep box-shadow, padding 18px, radius 24px.
- `.ld__card` paper bg, line border, radius 16px.
- `.ld__h` Geist Mono 10.5px uppercase ink3.
- `.ld__bubble` chat bubble bg-soft 75% max-width.
- `.ld__input` bg with strong ink border (1.5px) outline.
- `.ld__caret` 2px tangerine, blinking 0.9s steps.
- `.ld__pulse` 8px tangerine with 4px aura, pulsing.
- `.ld__code` Geist Mono 12px.
- `.ld__tag` solid ink chip with paper text.
- `.ld__rows` mono rows with circular dots.
- Reduced-motion guard at bottom (lines 202-205).

**Migration**:
- Outer `.ld` container reads as a dark-theme card now:
  - Background: `linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))` on top of `--bg-card`, or simply `bg: var(--bg-card)`.
  - Border `1px solid var(--border)`, radius `--radius-lg` (20px).
  - Box-shadow `0 30px 80px -32px rgba(0, 0, 0, 0.6)` (deeper for dark theme).
- `.ld__glow` keeps orange halo (`rgba(255, 107, 43, 0.18)` — re-tinted to match `--accent`).
- `.ld__card` cards inside: bg `--bg-code` or `--bg-secondary` (use code-style for the JSON panel, secondary for chat panel), border `--border`, radius 16px.
- `.ld__h` Space Mono 10.5px uppercase `--text-muted`.
- `.ld__bubble` bg `--bg-secondary`, border `--border`, color `--text-primary`.
- `.ld__input` bg `--bg-primary`, border 1.5px solid `--accent` (orange highlight to indicate input focus), shadow `0 0 0 4px var(--accent-subtle)`.
- `.ld__caret` already `--accent` — keep.
- `.ld__pulse` keep `--accent` with `rgba(255, 107, 43, 0.2)` aura.
- `.ld__tag` swap: bg `--accent`, color `#fff`, Space Mono 10.5px 600 — orange tag matches TF accent.
- `.ld__rows li` bg `--bg-secondary`, border `--border`.
- `.ld__row-d` circular dots: use `--accent`, `--text-secondary`, `--text-muted` for the 3-stage gradient.
- `.ld__arrow` color `--text-muted`.
- Preserve `@media (prefers-reduced-motion: reduce)` guard.

#### 5.5.7 `pages/home/home.component`

**Today** (`home.component.scss:1-630`): the deepest rewrite. Sections:
- `.home-hero` (mesh + grain bg, 2-col grid 1.05fr 1fr, h1 98px clamp).
- `.home-answer` (TL;DR + facts dl).
- `.home-stats` (6-col paper row).
- `.home-how` (2-col phases with mono numbers).
- `.home-arch` (3-col pillars).
- `.home-industries` (4-col cells + "More" graphite invert).
- `.home-compare` (table + graphite verdict callout).
- `.home-pricing` (2-tier with featured ink border).
- `.home-faq` (paper details with mono index numbers).
- `.home-cta` (tangerine glow CTA section).

**Migration plan section-by-section** (template `home.component.html` rewrites alongside SCSS):

| Old class       | New class (TF)                                                | Notes                                       |
|-----------------|---------------------------------------------------------------|---------------------------------------------|
| `.home-hero`    | `.hero` + `.hero-bg-grid` decorative div                      | `padding: 120px 0 64px;` desktop, 88px 0 48px mobile |
| `.home-hero__grid` | `.hero-inner` (grid 1fr 1fr gap 64px)                      | Drop `.05fr` asymmetry — TF uses 1:1        |
| `.home-hero__h1` | `.hero-title` (Space Mono `clamp(32px,5vw,52px)` 700)        | **Drop** the 98px h1 — TF caps at 52px      |
| `.home-hero__sub` | `.hero-desc` (DM Sans 17px max-width 480px)                 |                                             |
| `.home-hero__cta` | `.hero-cta` flex gap 16px                                   |                                             |
| `.home-hero__trust` | `.hero-note` (13px `--text-muted`)                        |                                             |
| `.home-hero__right` | hero visual slot — `.hero-visual > .video-wrapper` (16:9 iframe) | Optionally swap for `.terminal-window` |
| `.home-answer`  | `.section` (no special class) + 2 columns inside `.container` | Use `.section-title` + `.section-subtitle`  |
| `.home-facts`   | A `dl` styled like a `.feature-card` — or use TF's "About" inline `<dl>` style from `app.html:1204-1234` |
| `.home-stats`   | `.stats` (border-top + border-bottom 1px `--border`, padding 48px 0) | 6 → 4 columns to match TF; collapse to 2 on mobile, dividers hidden |
| `.home-stat__n` | `.stat-number` Space Mono 36px 700 `--accent`                |                                             |
| `.home-stat__l` | `.stat-label` 13px `--text-muted` margin-top 4px              |                                             |
| `.home-how`     | `.section` + `.section-header` (centered) + `.steps-grid`     |                                             |
| `.phase`        | `.step-card` (max-width 320px, bg `--bg-card`, border `--border`, radius `--radius-lg`, padding 32px 28px, center text) |
| `.phase__num`   | `.step-number` (Space Mono 48px 700 `--accent` opacity 0.15) | Drop the solid-ink number block — use opacity ghost |
| `.phase__name`  | `.step-card h3` Space Mono 18px                              |                                             |
| `.phase__body`  | `.step-card p` DM Sans 14px `--text-secondary`                |                                             |
| **between phases** | `.step-connector` (40×2 SVG dashed orange `stroke-dasharray="4 4"`) | New decorative SVG     |
| `.home-arch`    | `.section` + `.features-grid` (3-col) + `.feature-card`       |                                             |
| `.pillar__num`  | drop the mono chip — TF doesn't use ordinals on feature cards | Or render as `.badge` size variant         |
| `.pillar__h`    | `.feature-card h3` DM Sans 16px 600                          |                                             |
| `.pillar__b`    | `.feature-card p` DM Sans 14px `--text-secondary` line 1.6   |                                             |
| `.home-industries` | new `.section` with 4-col `.features-grid` of micro `.feature-card`s — **TF has no industries equivalent**; restyle each cell as a slim feature-card variant (radius `--radius`, padding `20px 18px`, single-row text + sub) |
| `.home-compare` | `.section` + table styled like blog-post article tables (TF `blog-post.component.ts:388-430`): bg `--bg-card` th, separate borders, radius `--radius`. Verdict callout becomes a bordered card `bg --bg-secondary, border --border-accent, radius --radius-lg, padding 28px 32px` with `.verdict-tag` Space Mono 11px `--accent` 0.08em uppercase |
| `.home-pricing` | `.section section-alt` + `.pricing-grid` + `.price-card`      | If 2 tiers only — set `grid-template-columns: 1fr 1fr` and `max-width: 920px; margin: 0 auto;` |
| `.tier--featured` | `.price-card--featured` (border `--accent` + gradient bg)   |                                             |
| `.tier__badge`  | `.price-badge .price-badge--left` (`top: -12px; left: 20px` if you want left-pinned) | |
| `.tier__price`  | `.price-amount > .price-value` (Space Mono 42px) + `.price-period` |                                       |
| `.tier__bullets` | `.price-features li` with `::before { content: '✓'; color: var(--success); }` |                                |
| `.home-faq`     | `.section` + `.faq-grid` + `<details class="faq-item">`       | Drop the mono ordinals — TF FAQ has no numbers |
| `.home-faq__list summary` | `.faq-item summary` (padding 20px 24px, weight 600, `+`/`−` pseudo via `::after`) | |
| `.home-faq__a`  | `.faq-item p` (padding `0 24px 20px`, 14px `--text-secondary`) |                                            |
| `.home-cta`     | `.cta-section` (radial glow + `--bg-primary`)                 | h2 `.section-title`, sub `.section-subtitle`, button `.btn .btn-primary .btn-lg` |
| `.home-cta__snippet` | optional `.terminal-window` block (mac dots + body)      |                                             |

**Heuristic for surplus tokens**: every `var(--ink)` → `var(--text-primary)`, every `var(--paper)` → `var(--bg-card)`, every `var(--bg-soft)` → `var(--bg-secondary)`, every `var(--line)` → `var(--border)`.

#### 5.5.8 `pages/about/about-page.component` (path: `src/app/pages/about/`)

**Today** (`about-page.component.scss:1-87`):
- `.about-hero` padding 70px 0 24px h1 `clamp(28px,4.6vw,60px)`.
- `.about-hero__lede` 19px line 1.55 `--ink2`.
- `.about-mission / .about-founder / .about-values` padding 50px 0.
- `.values` 2-col grid of `.values li` paper cards.

**Migration**:
- `.about-hero` → use `.section` padding + `.section-header` (centered) **or** keep left-aligned but apply TF type tokens (h1 `.section-title`).
- Lede: keep paragraph styling, color `--text-secondary` 18px line 1.7 max-width 760px.
- Values grid: replace `.values li` cards with `.features-grid` + `.feature-card` styling — bg `--bg-card`, border 1px `--border`, radius `--radius`, padding `28px 24px`, with `strong` inside Space Mono 17px and `p` 14px `--text-secondary`.
- Founder block: keep as plain text column with TF link styling (`a` color `--accent` with `border-bottom: 1px solid rgba(255,107,43,0.3)`).

#### 5.5.9 `pages/faq/faq-page.component`

**Today** (`faq-page.component.scss:1-119`):
- `.faq-eyebrow` orange (`var(--accent)` already correct).
- `.faq-hero` padding 70px 0 24px h1 `clamp(30px,5vw,68px)`.
- `.faq-cat h2` 26px.
- `.faq-list details` paper cards with `[open]` shadow + rotating toggle icon.
- `.faq-jump` jump-nav pills.

**Migration**:
- `.faq-hero` → `.section` + `.section-header` + `.section-title`. Eyebrow becomes `<span class="badge">FAQ</span>`.
- `.faq-cat h2` Space Mono 22–26px (use `.section-title` smaller variant — TF doesn't have h3 subsection cap; create `.section-title-sm` or inline a `font-size: 24px` rule).
- `.faq-list details` → `.faq-item` exactly per TF (`app.scss:1114-1158`). Drop the SVG chevron toggle in favor of `+/−` pseudo-content. `[open]` border becomes `--border-accent`. **A11y**: bind `<summary [attr.aria-expanded]="item.open">` (Angular template) and wire `(toggle)="item.open = $event.target.open"` on `<details>` so screen readers announce expansion state — see §5.6 ARIA hardening.
- `.faq-jump a` (jump pills): restyle as TF `.badge`-sized pills — bg transparent, border 1px `--border`, color `--text-secondary` 14px, hover border `--accent` color `--accent`. `.faq-jump__count` becomes Space Mono 11px `--text-muted` `--accent-subtle` bg.
- Remove `var(--vc-accent, ...)` and `var(--vc-graphite, ...)` legacy fallback references — they reference deprecated tokens.

#### 5.5.10 `pages/for-ai-agents/for-ai-agents.component`

**Today** (`for-ai-agents.component.scss:1-124`):
- `.aiagents-hero` padding 70px 0 24px h1 `clamp(28px,4.6vw,60px)`.
- `.aiagents-def` paper card border `--line` radius 14px.
- `.aiagents-code` `#1a1815` bg `#f7f3ec` text — TF dark code block already.
- `.aiagents-features` 2-col grid.

**Migration**:
- Hero → `.section .section-header` + `<span class="badge">AI Agents</span>` + `.section-title`.
- `.aiagents-def` → `.feature-card`-styled box: bg `--bg-card`, border `--border`, radius `--radius`, padding `22px 26px`, color `--text-primary`. Inline `<code>` chips: bg `--bg-secondary`, padding `1px 6px`, radius 4px, Space Mono 14–15px, color `--text-primary`.
- `.aiagents-code` block → use TF terminal-style: bg `--bg-code`, border 1px `--border`, radius 8px, Space Mono 13px, color `--text-secondary` with `--text-primary` for key tokens. Optionally wrap with `.terminal-window`/`.terminal-bar` for the full mac-dots treatment.
- `.aiagents-features li` → `.feature-card` slim variant.
- All h2 → Space Mono `clamp(24px,3vw,32px)` 700 `--text-primary`.

#### 5.5.11 `pages/how-it-works/how-it-works-page.component`

**Today** (`how-it-works-page.component.scss:1-317`):
- `.how-hero` standard hero.
- `.how-phase` 3 large numbered sections (56×56 dark squares with white numbers), each with 1.4fr 1fr grid body+example.
- `.how-phase__example` paper card with bordered mono content + ext tag list.

**Migration**:
- `.how-hero` → `.section .section-header`.
- `.how-phase` (large numbered sections):
  - Keep the section structure: each `.how-phase` is a `.section` (alternate `--section-alt` if desired for visual rhythm).
  - `.how-phase__num` 56×56 → restyle bg `--accent-subtle`, border 1px `--border-accent`, color `--accent`, Space Mono 18px 700 (matches TF's `.i-step-num` motif scaled up).
  - Example callout becomes `.terminal-window` mini variant: bg `--bg-code`, border `--border`, radius `--radius`, padding 20px 22px, Space Mono content.
  - Ext tag list (`.how-phase__ext li`): bg `--bg-secondary`, border `--border`, color `--text-secondary`, Space Mono 11.5px, padding 4px 10px, radius 6px.
- All section h2 → `.section-title` clamped Space Mono.

#### 5.5.12 `pages/industries/industries-page.component`

**Today** (`industries-page.component.scss:1-62`):
- `.industries-hero` standard.
- `.industries-cat h2` 22px.
- `.industries-grid` auto-fill minmax(260px, 1fr) gap 10px.
- `.industry-card` paper cards with `__name` 14.5px and `__sub` mono 11px uppercase.

**Migration**:
- Hero → `.section .section-header`.
- Category h2 → Space Mono `clamp(20px,2.5vw,26px)` `--text-primary`.
- `.industries-grid` keep auto-fill responsive grid.
- `.industry-card` → adopt TF `.feature-card` minus icon: bg `--bg-card`, border 1px `--border`, radius `--radius`, padding `20px 18px`. `__name` DM Sans 15px 600 `--text-primary`; `__sub` Space Mono 11px uppercase letter-spacing 0.04em `--text-muted`. Hover: border `--border-accent`, `translateY(-2px)`, shadow `0 6px 16px rgba(0, 0, 0, 0.3)`.

#### 5.5.13 `pages/industries/industry-detail-page.component`

**Today** (`industry-detail-page.component.scss:1-190`):
- `.industry` 50px 0 90px max-width 920px.
- `.industry__back` 13px ink2 (back-link pattern).
- `.industry__hero` border-bottom `--line`.
- `.conv` 2-col paper card with `__bubble` (bg-soft) and `__extracted` (mono code).

**Migration**:
- `.industry__back` → TF back-link pattern (TF blog `back-link`): Space Mono 13px `--text-muted` → hover `--accent` with `gap` transition.
- `.industry__hero` border-bottom `--border`, h1 `.section-title`-sized.
- `.industry__sub` DM Sans 18px `--text-secondary` line 1.55 max-width 720px.
- `.industry__section h2` Space Mono `clamp(22px,3vw,28px)` `--text-primary`.
- `.conv` (conversation card):
  - Outer: bg `--bg-card`, border 1px `--border`, radius `--radius`, overflow hidden.
  - `.conv__bubble` left: bg `--bg-secondary`, border-right 1px `--border`, padding 18px 22px.
  - `.conv__lang` Space Mono 11px uppercase `--accent`.
  - `.conv__extracted` right: bg `--bg-code`, Space Mono 12.5px line 1.55 `--text-secondary` with `--accent` for keys.
- CTA buttons inside detail page: `.btn .btn-primary` / `.btn .btn-outline`.

#### 5.5.14 `pages/blog/blog-list.component`

**Today** (`blog-list.component.scss:1-454`): heavy editorial layout — hero with stats, featured card, category-grouped numbered listings, mono dates, large `clamp(36px,7.4vw,96px)` h1 with serif italic em emphasis.

**Migration to TF blog-list pattern** (TF inline styles in `blog-list.component.ts:72-247`):
- `.blog-section` outer: `padding: 120px 0 80px; position: relative; overflow: hidden;`.
- `.blog-bg-grid` decorative: 60px grid mask `mask-image: radial-gradient(ellipse at 50% 0%, black 20%, transparent 60%);` orange tint.
- `.blog-header` (was `.blog-hero`): text-center, margin-bottom 56px. `.badge` margin-bottom 16px.
- Drop the editorial italic `em` in h1 — TF uses plain Space Mono. Title `.section-title`.
- Drop the `.blog-hero__stats` block (TF has no "articles count / topics / etc." subline) — or restyle to TF `.stats` 4-stat row.
- Featured card + numbered listings: collapse to **one** vertical card list. TF uses single-column `.blog-grid` with `flex-direction: column; gap: 32px; max-width: 760px; margin: 0 auto;`.
- `.blog-card`: bg `--bg-card`, border 1px `--border`, radius `--radius-lg`, overflow hidden, hover translate-Y(-4px) + border `--border-accent` + shadow + `.card-accent-line` orange glow.
- `.card-cover img`: hover `scale(1.03)` over 0.5s cubic-bezier.
- `.card-accent-line`: 4px vertical column, `rgba(255, 107, 43, 0.25)` → solid on hover.
- `.card-content` padding 28px 32px.
- `.card-meta` Space Mono 12px `--text-muted` (date / read-time divided by faint `/`).
- `.card-title` Space Mono 22px 700 line 1.3.
- `.card-excerpt` DM Sans 15px `--text-secondary` line 1.7.
- `.card-link` Space Mono 13px 600 `--accent`, with SVG arrow that translates 4px on hover.
- `@keyframes cardReveal` staggered with `animation-delay: i * 120 + 'ms'`.

#### 5.5.15 `pages/blog/blog-post.component`

**Today** (`blog-post.component.scss:1-631`): structurally similar to TF — reading-progress, article header, author avatar, cover, article-body with h2/h3/p/li/blockquote/code/table styling, FAQ section, article footer with CTA.

**Migration** — much closer to 1:1, mostly **token swap**:
- Reading progress bar `top: 64px` (matches new fixed header height), bg `--accent`, glow `0 0 8px rgba(255, 107, 43, 0.5)`.
- `.blog-article` padding `120px 0 80px` (account for fixed header).
- `.back-link` Space Mono 13px `--text-muted` → hover `--accent` with gap animation.
- `.article-header` border-bottom 1px `--border` padding-bottom 40px.
- `.article-meta` Space Mono 12px `--text-muted`.
- `.article-title` Space Mono `clamp(28px, 4vw, 42px)` 700 `--text-primary`.
- `.author-avatar` 36×36 round bg `--accent-subtle` border 1px `--border-accent` color `--accent` Space Mono 14px 700.
- `.author-name` DM Sans 14px 600 `--text-primary`; `.author-role` Space Mono 11px `--text-muted` letter 0.3px.
- `.article-cover` max-width 720px radius `--radius-lg` border 1px `--border`.
- `.article-body` DM Sans 16.5px line 1.85 `--text-secondary`.
- `.article-body h2` Space Mono 24px 700 `--text-primary` margin 56px 0 20px.
- `.article-body h3` Space Mono 19px 600 `--text-primary` margin 40px 0 14px.
- `.article-body li::marker` color `--accent`.
- `.article-body a` color `--accent` border-bottom 1px `rgba(255,107,43,0.3)`.
- `.article-body code` Space Mono 14px bg `--bg-code` padding 3px 8px radius 6px border 1px `--border`.
- `.article-body blockquote` 3px left border `--accent` padding 16px 24px bg `--accent-subtle` radius `0 var(--radius) var(--radius) 0` italic `--text-primary`.
- Tables: bg `--bg-card` thead, Space Mono 12px uppercase 0.5px letter-spacing th, `--text-secondary` td with hover `rgba(255,255,255,0.02)`.
- `.article-faq .faq-item` per global `.faq-item` rules.
- `.article-cta` bg `--bg-card` border 1px `--border-accent` radius `--radius-lg` padding 40px 36px with `.cta-glow` absolute orange radial in upper-right.
- `articleReveal` keyframe preserved (0.5s cubic-bezier).

#### 5.5.16 `pages/legal/legal-page.component`

**Today** (`legal-page.component.scss:1-80`):
- `.legal` padding 60px 0 90px max-width 800px.
- h1 clamp, body 16px line 1.7 ink.
- Tables paper-bg ink2 th.
- Code inline bg-soft.

**Migration**:
- `.legal` keep as max-width longform reader.
- h1 Space Mono `clamp(26px,4.4vw,42px)` 700 `--text-primary`.
- `.legal__body` DM Sans 16px line 1.7 `--text-primary`.
- h2 Space Mono 22px 700 `--text-primary` margin 32px 0 12px.
- h3 Space Mono 18px 600 `--text-primary` margin 24px 0 10px.
- Links: `color: var(--accent); border-bottom: 1px solid rgba(255, 107, 43, 0.3);` hover solid.
- Tables: border-collapse, th bg `--bg-card` Space Mono 12px uppercase `--text-primary`, td DM Sans 14px `--text-secondary`, border-bottom 1px `--border`.
- `code` inline: Space Mono 14px bg `--bg-code` border 1px `--border` padding 1px 6px radius 4px color `--text-primary`.
- `.legal__nav` border-top 1px `--border`, links DM Sans 13.5px `--text-muted` → hover `--text-primary`, `.active` color `--text-primary` 500.

#### 5.5.17 `pages/not-found/not-found.component`

**Today** (`not-found.component.scss:1-39`):
- `.nf` 70vh grid place-items center.
- h1 `clamp(32px,6vw,80px)` ink.
- `.nf__sub` 18px ink2.
- `.nf__actions` flex center.

**Migration**:
- Match TF not-found exactly (TF `not-found.component.scss:1-49`):
  - `padding: 4rem 1.5rem; min-height: 100vh;`
  - `&__container { max-width: 760px; margin: 0 auto; text-align: center; }`
  - `&__code { font-size: 4rem; font-weight: 700; color: var(--accent); margin-bottom: 1rem; line-height: 1; }`
  - `&__title { font-family: var(--font-display); font-size: 2rem; margin-bottom: 1.5rem; color: var(--text-primary); }`
  - `&__lede { line-height: 1.7; color: var(--text-secondary); margin-bottom: 2.5rem; }`
  - `&__actions { display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; }`
- Template needs an `.nf__code` span (e.g., "404") above the title for accent display.

#### 5.5.18 `pages/pricing/pricing-page.component`

**Today** (`pricing-page.component.scss:1-301`):
- `.pricing-hero` padding 70px 0 24px h1 `clamp(30px,5vw,68px)`.
- `.home-tiers` duplicated in this file (per surgical-changes guideline) — 2-col tier grid.
- `.tier` paper card radius 24px padding 40px, `.tier--featured` ink border 1.5px.
- `.tier__price` clamp 40px-64px ink.
- `.tier__bullets li::before { content: '✓'; }` ink.
- `.pricing-onboarding` 2-col paper cards with leading-zero counter.
- `.pricing-roi` paper rows with `.roi__row--accent` accent-soft bg.
- `.pricing-faq` paper details (same `.faq-list` rules).
- `.pricing-diff` table with `#f7f3ec` th bg.

**Migration**:
- Pricing hero → `.section .section-header` + `.section-title`. Add a `<span class="badge">Pricing</span>` eyebrow.
- Tier grid → `.pricing-grid` with `grid-template-columns: 1fr 1fr; max-width: 920px; margin: 0 auto;`.
- `.tier` → `.price-card` (TF) with all surfaces:
  - bg `--bg-card` border 1px `--border` radius `--radius-lg` padding `32px 24px` flex column position relative.
  - `--featured` variant: border 1px `--accent` with gradient bg `linear-gradient(180deg, rgba(255,107,43,0.08) 0%, var(--bg-card) 40%)`.
  - `.price-badge` absolute `-12px / 50%` centered (use `.price-badge--left` if pinned left).
  - `.tier__name` → `.price-header h3` Space Mono 18px.
  - `.tier__price` → `.price-amount > .price-value` Space Mono 42px 700.
  - `.tier__sub` → `.price-desc` DM Sans 14px `--text-secondary`, border-bottom 1px `--border` (TF: drop the dashed border style — replace with solid).
  - `.tier__bullets` → `.price-features li` with `::before { content: '✓'; color: var(--success); }` and border-bottom 1px `--border` per item.
- Onboarding 4-step grid → reuse `.step-card` styling (or a slimmer card variant with leading-zero counter as Space Mono pill).
- ROI rows → keep as a card with rows; restyle to `--bg-card` border `--border` radius `--radius`. `.roi__row--accent` → bg `--accent-subtle`, value `--accent`.
- Pricing FAQ → use shared global `.faq-grid` + `.faq-item`.
- `.pricing-diff__table` → matches blog-post article-table styling: bg `--bg-card` th, Space Mono 12px uppercase th, DM Sans 14px td, 1px `--border` separators, radius `--radius`. **Remove** hardcoded `#f7f3ec`/`#fff` colors.

### 5.6 Motion

Globally we adopt these TF transitions in `styles.scss`:
- `a { transition: color 0.2s; }`
- `.btn { transition: all 0.3s ease; }`
- Card hovers use `all 0.3s` with `translateY(-2px)` (feature) / `translateY(-4px)` (step / price / blog).
- Tab buttons use `all 0.2s`.
- FAQ summary toggle: pseudo `+/−` swap is instantaneous.
- Reading-progress bar: `transition: width 0.1s linear;`
- Blog card reveal: `@keyframes cardReveal` 0.6s cubic-bezier `(0.4, 0, 0.2, 1)`, staggered.
- Article reveal: `@keyframes articleReveal` 0.5s cubic-bezier.
- Live-demo: keep existing keyframes `ld-caret` (steps blinking) and `ld-pulse` (orange aura).
- Dropdown (`language-switcher`): keep `dropIn` 0.15s ease-out.

**Drop all of Variant C's motion vocabulary** — there is no `vc-mesh`, no `vc-grain` SVG fractalNoise overlay, no `vc-h1-grad` underbar with `skewX(-6deg)`. The TF aesthetic relies on **subtle hover-lift + orange glow shadow**, not decorative paper texture.

**Touch-device hover guard (mandatory).** Wrap every `translateY` / border-color hover-lift rule in `@media (hover: hover)` so the lifted state is not applied on first-tap on touch devices (where it sticks until next tap). Pattern:
```scss
@media (hover: hover) {
  .step-card:hover { border-color: var(--border-accent); background: var(--bg-card-hover); transform: translateY(-4px); }
  .feature-card:hover { border-color: var(--border-accent); transform: translateY(-2px); }
  .price-card:hover { transform: translateY(-4px); }
  .blog-card:hover { border-color: var(--border-accent); transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px var(--border-accent); }
  .btn-primary:hover { transform: translateY(-2px); }
}
```
This guard must land in every per-component section that defines a hover-lift (§5.5.6 live-demo, §5.5.7 home cards, §5.5.11 how-it-works phases, §5.5.12 industries cards, §5.5.13 conv card, §5.5.14 blog list, §5.5.18 price-card).

**Reduced-motion hardening (`prefers-reduced-motion: reduce`).** Target's `reset.scss:36-43` already zeroes out all `transition` / `animation` durations. Two TF-introduced patterns need explicit overrides inside the reduced-motion guard so they degrade gracefully rather than become invisible or jumpy:

1. **Reading-progress bar** — under reduced motion, `transition: width 0.1s linear` produces a 100ms jump every scroll tick. Disable the transition entirely; the JS-driven `width` assignment becomes instant (correct for users who explicitly opt out of motion):
   ```scss
   @media (prefers-reduced-motion: reduce) {
     .reading-progress { transition: none !important; }
   }
   ```
2. **Blog `cardReveal` + article `articleReveal` keyframes** — under reduced motion, the global guard in `reset.scss` already neutralizes the animation; verify that the entry state is `opacity: 1` and `transform: none` so the content doesn't remain hidden if the animation step is skipped. Add to keyframe definitions a fallback:
   ```scss
   @media (prefers-reduced-motion: reduce) {
     .blog-card, .article-body { opacity: 1 !important; transform: none !important; animation: none !important; }
   }
   ```
3. **Live-demo `ld-caret` and `ld-pulse`** — keep as decorative; reduced-motion guard kills them as expected; OK.

**ARIA hardening for FAQ +/− pseudo-content.** TF uses CSS `content: '+'` / `content: '−'` on `.faq-item summary::after`. Screen readers announce CSS-generated content inconsistently — some skip it entirely. Add a parallel programmatic state hook via `aria-expanded`:

- Template change in `§5.5.9 faq-page` and any inline FAQ (blog-post, home, pricing): bind `<summary [attr.aria-expanded]="open">` so VoiceOver / NVDA announce "expanded / collapsed" regardless of visual marker. Wire `open` from `<details (toggle)="open = $event.target.open">`.
- Also applies to `.consent` Preferences/Back toggle (§5.5.5): bind `aria-expanded` on the "Preferences" button to the `showPrefs()` signal.

**Focus-visible contrast verification (must-check during P5).**
- `outline: 2px solid var(--accent)` (`#FF6B2B`) — measure WCAG ratio against each surface it lands on:
  - `--bg-primary` `#282838`: ≈ 4.4:1 ✓ (≥ 3:1 required for non-text focus indicators).
  - `--bg-card` `#3A3A4C`: ≈ 4.4:1 ✓.
  - `--bg-card-hover` `#434356`: ≈ 4.0:1 ✓.
  - `--accent-subtle` overlay (`rgba(255,107,43,0.08)` over `--bg-card`): orange on near-orange — **risk**. Add `outline-offset: 2px` (already in §5.2.3) so the outline sits in clear bg space outside the chip; verify visually.

### 5.7 Accessibility

- **Keep** `prefers-reduced-motion` block in `reset.scss` — TF lacks it; we are strictly better.
- **Keep** `.skip-link` from current global — restyle as in §5.2.3 (orange accent bg on focus).
- **Keep** `:focus-visible` global outline — switch to `outline: 2px solid var(--accent); outline-offset: 2px;`.
- **Color contrast verification**: re-verify all body text combos:
  - `--text-primary #F0F0F5` on `--bg-primary #282838` → AAA.
  - `--text-secondary #A3A3B8` on `--bg-primary` → ≈ 6.8:1 → AA for body text, just shy of AAA.
  - `--text-muted #7C7C92` on `--bg-primary` → ≈ 4.6:1 → AA for normal text (18px+); marginal for 13–14px copy. **Avoid `--text-muted` for body paragraphs**; use only for meta lines as TF does.
- Forms: `:focus { border-color: var(--accent); }` on inputs — accent provides 3:1 against `--bg-primary` ≈ 4.5:1 ✓.
- Keep ARIA attributes already present in templates (`aria-label`, `aria-expanded`, `aria-current`, etc.). Migration is purely visual.
- **`@media (hover: hover)` guards** mandatory on all `translateY` lifts and `border-color` hover changes (see §5.6 — touch-device "stuck hover" mitigation).
- **`aria-expanded` programmatic state** added to: every `<summary>` inside `.faq-item`, the consent banner Preferences toggle, and the mobile burger button (already on burger today — preserve).
- **`prefers-reduced-motion` extensions**: explicit overrides for `.reading-progress` and `cardReveal`/`articleReveal` keyframes (§5.6 detail).
- **Focus-visible WCAG check** for the new orange outline (§5.6 measurements).

**Contrast verification table** (text-on-surface combinations introduced by this migration; AA = 4.5:1 normal text, 3:1 large/UI):

| Combo | Approx ratio | WCAG verdict |
|---|---|---|
| `--text-primary #F0F0F5` on `--bg-primary #282838` | 14.0 : 1 | AAA |
| `--text-primary` on `--bg-secondary #313142` | 12.3 : 1 | AAA |
| `--text-primary` on `--bg-card #3A3A4C` | 10.6 : 1 | AAA |
| `--text-secondary #A3A3B8` on `--bg-primary` | 7.3 : 1 | AAA normal |
| `--text-secondary` on `--bg-card` | 5.5 : 1 | AA normal |
| `--text-muted #7C7C92` on `--bg-primary` | 4.6 : 1 | AA normal (≥ 18px ideal) |
| `--text-muted` on `--bg-card` | 3.5 : 1 | **fails normal**, AA large only |
| `--accent #FF6B2B` on `--bg-primary` (link/CTA text) | 4.4 : 1 | AA normal ✓ |
| `--accent` on `--bg-card` | 3.4 : 1 | **AA large only** — use accent for h-tier text, not 14px body inline |
| Focus outline `--accent` on `--bg-primary` (UI 3:1) | 4.4 : 1 | ✓ |
| `:focus-visible` outline on `--bg-card` (UI 3:1) | 3.4 : 1 | ✓ |

Rules:
- **`--text-muted` is only for meta lines** (Space Mono 12–13px, footer copy, hero-note) — never for body paragraphs longer than 1 line. Enforced via P5 grep audit.
- **Inline `--accent` text on `--bg-card`** (e.g., FAQ `+/−` marker, accent links in feature cards) at 14px and below requires ≥ 600 weight to qualify as "large" — already true for TF's `.btn`, `.badge`, `summary::after`.

---

## 6. Risks & Gaps

### 6.1 TF has no equivalent for these target pages — must design "in TF spirit"

1. **`pages/industries` (list + detail)**.
   - No TF page matches. Use 4-column `.features-grid` of slim cards (per §5.5.12) and dedicated detail page with conversation/`.conv` cards (per §5.5.13).
   - Risk: visually monotone — TF's home is rich with terminals, voice-json, demo tabs; industries is text-only.
   - Mitigation: insert a `.terminal-window` snippet on each detail page showing the AI conversation flow per industry — keeps the TF tech feel.

2. **`pages/pricing` standalone (4 tiers + onboarding + ROI + diff table)**.
   - TF has 4-col pricing **only as a home-page section**. Standalone page needs more density.
   - Risk: visual sprawl on a sparse dark canvas.
   - Mitigation: alternate `.section` and `.section-alt` strips to give vertical rhythm; reuse `.step-card` for onboarding cards; ROI block becomes a dark version of TF's stats bar.

3. **`pages/faq` with multi-category jump nav**.
   - TF has flat FAQ section on home only — no categories, no jump.
   - Risk: jump-nav pills (`.faq-jump a`) have no TF analog.
   - Mitigation: design jump pills as TF `.badge` outline variants (border `--border`, color `--text-secondary`, hover border `--accent` color `--accent`).

4. **`pages/about` full page with founder block + values grid**.
   - TF has a tiny inline About `<section>` with a `<dl>`.
   - Risk: TF aesthetic discourages "personal" content blocks.
   - Mitigation: render founder photo (if any) inside an `.author-avatar`-style frame; values as `.feature-card` 2-col.

5. **`pages/legal` longform with table + nav rail**.
   - TF has `pages/security/security.component` which is similar — reuse that visual pattern (max-width 760px, h1/h2/h3 Space Mono, code chips with `--accent-subtle` bg).

6. **Language-switcher**.
   - TF has no i18n UI.
   - Risk: visual collision with `.btn-sm` "Get Free Key" CTA in header.
   - Mitigation: place the switcher to the **left** of the CTA in `.header-actions`, sized as a slim pill with Space Mono 12px letters (matching TF's terminal vocabulary).

7. **Live-demo widget structure** is fundamentally different from TF's tab-based demo.
   - Target's `.ld` widget shows a chat-bubble + input + extracted JSON in one card.
   - TF shows 3 selectable forms with a single mic-button banner.
   - Risk: keeping target's widget structure (signature feature of typelessity.com) but reskinning to TF surfaces may produce a hybrid that looks "off" against TF's home patterns.
   - Mitigation: invest in §5.5.6 surfaces carefully — input border-orange, code panel in `--bg-code`, pulse + caret in `--accent`. Add a `.terminal-bar`-style top row with three mac dots to reinforce TF's terminal-window motif.

### 6.2 Wider risk surface

- **Visual encapsulation collisions**: target uses default `ViewEncapsulation` (CSS scoped per-component). TF puts most styling in `app.scss` (global). After migration, **global utilities `.btn / .badge / .section / .feature-card / .faq-item / .price-card / .step-card` must live in `src/styles.scss`** (or a new `src/styles/_components.scss` partial) so component templates can use them without re-declaring. **Currently `home.component.scss` and `pricing-page.component.scss` duplicate `.tier` styles** because of encapsulation — this duplication should reduce after globalization.
- **Font swap pixel drift**: DM Sans is a wider face than Geist Variable for the same px size. Hero h1 sized `clamp(36px,7vw,98px)` will become **visually larger** in DM Sans/Space Mono. TF caps at 52px — adopt that cap to avoid wrapping issues.
- **Letter-spacing**: target uses `letter-spacing: -0.04em` on h1 (Geist optimization). DM Sans/Space Mono **do not need** negative tracking — remove or set to 0.
- **Reading-progress bar offset**: target's blog-post bar is `top: 0`. TF puts it at `top: 64px` (under fixed header). Update target's bar to `top: 64px` after switching header to `position: fixed`.
- **Theme-color jump on hot navigation**: change `<meta name="theme-color" content="#282838">` immediately — browsers cache.
- **Dark mode media query**: target declares `color-scheme: light;`. Switch to `color-scheme: dark;` so native form controls (date pickers, scrollbars) inherit dark theme.
- **i18n strings & ARIA labels** are unaffected by visual migration — but the `<html lang>` attribute is locale-aware (set by Angular SSR per route — verify in P5 by curling `/`, `/de`, `/pl`, `/ru` and asserting `<html lang="en|de|pl|ru">`). New TF-introduced labels ("Get Free Key", "Insights & Guides", any new badge copy, the consent strings listed in §5.5.5) must be added to **all four** `translations.{en,de,pl,ru}.ts` files as part of Phase 1 task P1-1. RTL is out of scope (no Arabic/Hebrew locale planned).
- **TF has no language-switcher** — target must keep its own. Visual mapping in §5.5.3 already adapted to TF chrome; no UX regression. `hreflang` link tags emitted by SEO services are unaffected by visual migration.

### 6.3 Brand assets that need regeneration against dark theme

These are static assets not covered by the SCSS migration but visible to the public; missing them produces an off-brand mismatch on share previews and OS chrome.

- **`public/og-image.jpg`** — current cream/light. Regenerate against `#282838` slate at 1200×630, DM Sans hero text in `--text-primary`, accent orange `.badge`. Treat as a Phase 5 deliverable; flag for design handoff at P0.
- **`public/og-blog-*.png`** — per-post OG images for blog. Same problem. Inventory under `public/` (run `ls public/og-*.png`) and add a regeneration task per file or a templated generator.
- **`favicon.ico`** — currently the only icon shipped. Add an SVG favicon variant (`<link rel="icon" type="image/svg+xml" href="/favicon.svg">`) sized for dark and light browser chrome, plus a `<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#FF6B2B">` for Safari.
- **PWA manifest** (`manifest.webmanifest`): if present, set `background_color: "#282838"` and `theme_color: "#282838"`. If not present and not planned — skip; document the decision.
- **Apple touch icon** (`apple-touch-icon.png`): currently cream-themed if any. Regenerate at 180×180 with dark background.

These items also surface in the §7 Phase 5 task list as `P5-7..P5-11`.

---

## 7. Phased Rollout

Order minimizes regressions and parallelizable streams.

### 7.0 Rollout isolation — branch-based strategy (MANDATORY)

The plan in §7.1+ leaves the app in **intermediate broken states** through Phases 0–4 (e.g., end of Phase 0 = global tokens swapped but components still reference `.vc-*` rules that no longer exist → `home.component`, all deep pages, header/footer all render largely unstyled). That is **not deployable**. Production must continue to serve the current cream theme until the entire migration passes acceptance.

**Rollout protocol (founder-approved before P0):**

1. **Create long-lived branch** `feat/tf-redesign` off `main` at the very start of P0. All migration work lives on this branch.
2. **`main` remains frozen on the cream/Variant C theme** for the duration of P0–P5 (~8–9 dev-days). Production deploys from `main` continue normally — bug-fix commits may merge to `main` and be rebased into `feat/tf-redesign` daily.
3. **Preview-deploy each phase**. Configure a Vercel / Firebase / Cloudflare Pages preview channel that auto-deploys every push to `feat/tf-redesign`. Founder + senior reviewer (this reviewer) approve each phase against the preview URL — not localhost only.
4. **Merge to `main` only after Phase 5 acceptance passes**, in a single squash-merge commit. The first-paint on production then ships the complete dark theme atomically.
5. **Rollback plan**: if a critical issue surfaces post-merge, revert the single squash-merge commit; `main` returns to the cream theme in one step. Document the revert SHA in `docs/redesign-2026-05/03-rollout-notes.md` (future doc, created at merge time).
6. **Feature-flag alternative** (NOT recommended for this scope): a `<body class="theme-tf">` token-set switcher technically allows progressive rollout, but doubles the SCSS surface during transition (every component carries both `.vc-*` and `.btn/.badge` rules) — net cost higher than the branch approach. Listed for completeness only.

**Each phase below has two acceptance gates**: "acceptance-dev" (works on the migration branch's preview deploy) and "acceptance-deploy" (could ship to `main` — only Phase 5 satisfies this).

### Phase 0 — Foundation (blocking; do first; ~1 day on branch)

Tasks performed on `feat/tf-redesign` branch. Production stays on cream `main` throughout this phase.

- [P0-1] **Cyrillic font fetch + assembly** (`P0-7` in review numbering — now first because it gates the entire font task): download Inter `{400,500,600,700}` cyrillic + cyrillic-ext subsets and JetBrains Mono `{400,700}` cyrillic + cyrillic-ext from `gwfh.mranftl.com/fonts/inter` and `…/jetbrains-mono` (Google Webfonts Helper, GDPR-safe). Place in `public/fonts/`. ~12 files, ~50–60 KB.
- [P0-2] Copy TF `public/fonts/` (8 woff2 + `fonts.css`) → target `public/fonts/`. Modify `fonts.css`: append the Cyrillic `@font-face` blocks per §5.4-A Option A.
- [P0-3] Edit `src/index.html`: add `<link rel="stylesheet" href="/fonts/fonts.css" />` (**absolute path**) + change `theme-color` to `#282838` + add **mandatory** preload hints per §5.4 step 5. **Implementer note**: TF's `fonts.css` declares 4 weights of DM Sans pointing to only **2 unique** hashed woff2 files (`…Cmcqbu0-K6z9mXg.woff2` for latin, `…Cmcqbu6-K6z9mXgjU0.woff2` for latin-ext — same file reused across 400/500/600/700). Same for Space Mono (3 unique files across 2 weights). Therefore preload only the unique hashed files that actually exist on disk (verify with `ls public/fonts/`); do not preload a non-existent `dm-sans-600-latin.woff2`. The `font-display: swap` cascade re-uses the cached unique file across weight declarations.
- [P0-4] Rewrite `src/styles/tokens.scss` per §5.1 (full TF token block).
- [P0-5] Rewrite `src/styles/typography.scss` per §5.2.1 — and add the system-font fallback stack from §5.4 step 6 (`--font-body` and `--font-display` with `system-ui` / `ui-monospace` chains).
- [P0-6] Rewrite `src/styles.scss` per §5.2.3 (drop `.vc-*`, add `.btn / .badge / .container / .highlight / .section* / .cta-section / scrollbar / skip-link / focus-visible`). **Decision**: house TF utility classes in a new partial `src/styles/_components.scss` imported via `@use './styles/components.scss';` from `src/styles.scss`. Rationale: keeps `styles.scss` lean and gives Phase 1+ a single file to add `.feature-card / .step-card / .price-card / .faq-item / .step-connector` global rules into.
- [P0-7] Remove `@fontsource-*` deps from `package.json` (`npm uninstall @fontsource-variable/geist @fontsource/geist-mono @fontsource-variable/newsreader @fontsource/instrument-serif`).
- [P0-8] **SSR smoke test**: build (`npm run build:ssr`) and run (`npm run serve:ssr:typelessity-landing`). Curl `/`, `/en`, `/ru`, `/ru/blog`, `/ru/blog/<any post>` — each must contain `<link rel="stylesheet" href="/fonts/fonts.css">` and `<meta name="theme-color" content="#282838">` in the head.

**Acceptance-dev (branch only)**: app builds, body uses DM Sans (Latin) + Inter (Cyrillic via `unicode-range`), headings Space Mono + JetBrains Mono (Cyrillic), dark slate page bg, orange links. **Components render largely unstyled** as `.vc-*` rules are gone and TF utilities are not yet wired through templates — this is expected **only on the migration branch**. Phase 1 closes the gap.

**Acceptance-deploy**: **NOT deployable.** `main` continues serving cream theme.

### Phase 1 — Shell (1–1.5 days on branch)

- [P1-1] Migrate `header.component` (template + SCSS) per §5.5.1. Verify fixed header offset works for all routes.
- [P1-2] Migrate `footer.component` per §5.5.2.
- [P1-3] Migrate `language-switcher.component` per §5.5.3.
- [P1-4] Migrate `consent-banner.component` per §5.5.5 — **preserving 3-tier toggles**.
- [P1-5] Add `main { padding-top: 64px; }` to `styles.scss` (fixed-header offset). Document as deliberate divergence from TF (see §5.3) in `acceptance-dev` notes.
- [P1-6] Add new TF-introduced UI strings to `translations.{en,de,pl,ru}.ts` (consent strings, "Get Free Key" CTA, any badge copy, "Insights & Guides" blog header). Wire via `TranslationService`.

**Acceptance-dev**: header / footer / language-switcher / consent-banner look 1-в-1 with TF chrome on preview deploy. Cyrillic-locale check (`/ru`) — header CTA reads "Получить ключ" (or designated RU translation) without font fallback to system.

**Acceptance-deploy**: still NOT deployable — home and deep pages remain unstyled.

### Phase 2 — Home page (2 days on branch; biggest single component)

- [P2-1] Hero + bg-grid (§5.5.7).
- [P2-2] TL;DR + facts dl.
- [P2-3] Stats bar.
- [P2-4] How-it-works `.steps-grid` + `.step-card` + `.step-connector`.
- [P2-5] Architecture pillars → `.features-grid`.
- [P2-6] Industries 4-col → slim `.feature-card` grid.
- [P2-7] Compare table → TF article-table style + verdict card.
- [P2-8] Pricing 2-tier → `.price-card`.
- [P2-9] FAQ → `.faq-item` (with `aria-expanded` per §5.6).
- [P2-10] CTA → `.cta-section`.
- [P2-11] Live-demo embedding (§5.5.6) — restyle widget surfaces.

**Stats column count decision** (resolves a soft-gap flagged in review): home today has **6 stats columns**; TF caps at **4**. Decision: drop to **4 columns** — pick the 4 strongest stats with founder, retire 2. Columns collapse to **2-col grid @ ≤ 700px**, dividers hidden. Documented divergence; not a visual bug.

**Acceptance-dev**: home renders cleanly on preview deploy at 360 / 768 / 1280 / 1440 viewports; no `--ink/--paper/--line` references remain in `home.component.scss`.

### Phase 3 — Deep pages (parallelizable; 2.5–3 days on branch)

9 pages with full template rewrites (class hooks change wholesale). Realistic budget ≈ 0.3 day each.

- [P3-1] About (§5.5.8).
- [P3-2] FAQ page (§5.5.9).
- [P3-3] For-AI-agents (§5.5.10).
- [P3-4] How-it-works (§5.5.11).
- [P3-5] Industries list (§5.5.12).
- [P3-6] Industry detail (§5.5.13). **Content prerequisite**: each industry detail page needs an example AI conversation snippet drafted by the content team before SCSS is finalized — flag in Phase 0 founder briefing.
- [P3-7] Pricing standalone page (§5.5.18). **Post-task**: de-duplicate `.tier` rules between `home.component.scss` and `pricing-page.component.scss` — both should reference the global `.price-card` from `_components.scss`. Document de-dup in the commit.
- [P3-8] Legal (§5.5.16).
- [P3-9] Not-found (§5.5.17).

**Acceptance-dev**: all 9 routes render cleanly on preview deploy at the four viewports.

### Phase 4 — Shared (1.5 days on branch)

- [P4-1] Contact-form (§5.5.4).
- [P4-2] Blog list (§5.5.14) — replace editorial archive with TF single-column blog-grid.
- [P4-3] Blog post (§5.5.15) — **631 lines of restyled SCSS**, longest single-component refactor in the migration.

### Phase 5 — Polish + audits (1 day on branch)

- [P5-1] Audit all SCSS files for remaining `--ink / --paper / --line / --bg-soft / --accent-soft / --font-sans / --font-mono / --font-serif / --font-display-italic / --container-pad / .vc-` references (grep). Expected: **zero hits**.
- [P5-2] Verify focus-visible outlines on every interactive element (tab through `/`, `/blog/<post>`, `/ru/pricing`).
- [P5-3] Verify `prefers-reduced-motion` overrides intact (DevTools → Rendering → emulate reduced motion).
- [P5-4] Verify color contrast on every paragraph per §5.7 table. Flag any `--text-muted` body usage as a content bug.
- [P5-5] Mobile pass at 360 / 768 / 1280 / 1440 viewports.
- [P5-6] Lighthouse runs on `/`, `/blog/<latest post>`, `/ru`, `/pricing`. Acceptance budgets in §8.7.
- [P5-7] Regenerate `public/og-image.jpg` at 1200×630 against dark slate (`#282838`).
- [P5-8] Regenerate per-post OG images (`public/og-blog-*.png`).
- [P5-9] Add SVG favicon variant + `mask-icon` for Safari.
- [P5-10] Update PWA manifest (if present) to dark `background_color` / `theme_color`.
- [P5-11] Regenerate `apple-touch-icon.png` against dark theme.
- [P5-12] Final SSR smoke test (`curl /`, `/en`, `/ru`, `/ru/blog`) — assert font preloads + theme-color present.

**Acceptance-deploy** (FINAL gate before merge to `main`):
- All §8 acceptance criteria pass.
- Lighthouse Best Practices ≥ 95 on `/` and `/blog/<post>`, Accessibility ≥ 95.
- axe-core: 0 critical / serious violations on `/` and `/blog/<post>`.
- LCP < 2.5s, FCP < 1.8s, CLS < 0.1 on `/` (4G simulation).
- Founder + senior reviewer sign off on preview deploy.

### Total estimate

| Phase | Realistic budget |
|---|---|
| P0 — Foundation (incl. Cyrillic + SSR setup + branch preview config) | 1 day |
| P1 — Shell (incl. consent granular preservation + i18n strings) | 1.5 days |
| P2 — Home (11 sections + live-demo) | 2 days |
| P3 — Deep pages (9 × ≈ 0.3 day) | 2.5–3 days |
| P4 — Shared (contact + blog-list + blog-post 631 lines) | 1.5 days |
| P5 — Polish + assets + audits | 1 day |
| **Total** | **8.5–9 dev-days** for a single experienced dev |

(v1 estimate was 5–6 days; the v2 honest envelope folds in Cyrillic strategy + SSR hardening + branch rollout + a11y verification + deep-page realism + OG/favicon asset regen.)

---

## 8. Acceptance Criteria

A senior designer should be able to verify each item below from the rendered site:

### 8.1 Visual identity
- [ ] Page background: solid `#282838` slate (matches TF home).
- [ ] Body text: DM Sans 400/500/600/700 — visually identical letter shapes to TF.
- [ ] Headings: Space Mono 700 — visually identical letter shapes to TF.
- [ ] Accent orange: exact `#FF6B2B` (verify with eyedropper, not `#ff5b1f` previous accent).
- [ ] Hero grid background: visible 60px crosshatch with radial fade.
- [ ] Header: dark glass `rgba(10, 10, 15, 0.85)` 16px blur, 64px height, fixed.
- [ ] Footer: dark `#313142` strip, Space Mono col headers uppercase, 64px 32px padding.

### 8.2 Components
- [ ] Buttons: pill 100px radius, primary `#FF6B2B` with `0 4px 24px` orange glow shadow, hover `translateY(-2px)` and brighter `0 8px 32px` shadow.
- [ ] Cards (feature/step/price): bg `#3A3A4C`, 1px border `rgba(255,255,255,0.08)`, hover border `rgba(255,107,43,0.3)` and `-2px / -4px` lift.
- [ ] Badge: pill 100px, Space Mono 11px 2px-letterspaced uppercase orange, with subtle `--accent-subtle` bg.
- [ ] FAQ: dark card with `+` orange marker, swaps to `−` when open, orange border accent when open.
- [ ] Demo / form inputs: 8px radius, dark `--bg-primary` bg, focus orange border.
- [ ] Code blocks: `--bg-code` (`#2E2E3E`), Space Mono 13.5px, line 1.8.
- [ ] Terminal: mac-traffic dots (red `#ff5f57`, yellow `#febc2e`, green `#28c840`).

### 8.3 Layout
- [ ] Container max-width: exactly `1120px` with `0 24px` padding.
- [ ] Section vertical rhythm: `80px 0` desktop, `56px 0` ≤ 860px.
- [ ] Hero: 2-col grid 1:1 with `gap: 64px`; stacks at 860px.
- [ ] Pricing: 4-col → 2-col @ 1000px → 1-col @ 600px.
- [ ] Features: 3-col → 1-col @ 700px.
- [ ] Stats: row flex → 2-col grid @ 700px with no dividers.

### 8.4 Typography
- [ ] Hero h1: `clamp(32px, 5vw, 52px)` line 1.15 — no overshoot to 98px.
- [ ] Section title h2: `clamp(28px, 4vw, 42px)` line 1.2.
- [ ] No serif italic anywhere (no Newsreader, no Instrument Serif) — pure mono headings.
- [ ] Body line-height 1.6.

### 8.5 Motion
- [ ] All hover transitions ≤ 0.3s with `ease`.
- [ ] Blog card reveal: 0.6s cubic-bezier(0.4,0,0.2,1), staggered 120ms between cards.
- [ ] Article reveal: 0.5s on route enter.
- [ ] Reading-progress bar fixed at `top: 64px`, 2px high, orange with 8px glow.
- [ ] `prefers-reduced-motion: reduce` zeroes out all transitions and animations (verify in DevTools simulation).

### 8.6 Tokens & fonts
- [ ] grep result: **zero hits** for `--ink`, `--ink2`, `--ink3`, `--paper`, `--bg-soft`, `--line`, `--line2`, `--accent-soft`, `--font-sans`, `--font-mono`, `--font-serif`, `--font-display-italic`, `--container-pad`, `vc-` in `src/` (except deliberately preserved legacy fallbacks if any).
- [ ] grep result: **zero hits** for `@fontsource` imports in `src/styles/typography.scss`.
- [ ] `public/fonts/` contains 8 woff2 + fonts.css mirroring TF.
- [ ] Network tab confirms `fonts/fonts.css` loads, no requests to `fonts.googleapis.com`.

### 8.7 Side-by-side parity (revised — TF-screenshot diffs only for pages that have a TF analog)

**TF-screenshot oracle subset** (these pages get pixel-diff against TF screenshots at 360 / 768 / 1280 / 1440 viewports):
- `/` home — diff against TF home screenshots (hero, stats, how-it-works, features, pricing, FAQ, footer).
- `/blog` blog-list — diff against TF `/blog`.
- `/blog/<post>` blog-post — diff against TF `/blog/<post>`.
- `/404` not-found — diff against TF not-found.
- `/legal/<slug>` legal — diff against TF `/security` (closest TF analog; pattern, not pixel).

**Internal-baseline subset** (TF has no analog; capture screenshots during P3 final review and pin them as the baseline; founder + senior reviewer sign-off):
- `/about`
- `/faq`
- `/for-ai-agents`
- `/how-it-works`
- `/industries`
- `/industries/<slug>`
- `/pricing`

For all subsets: capture at 360 / 768 / 1280 / 1440 px. Use Playwright (already a TF dep — adapt config) or Percy / Chromatic.

### 8.8 Performance budgets (added v2)

Run Lighthouse / WebPageTest on `/`, `/blog/<latest post>`, `/ru`, `/pricing` (4G mobile + desktop). All must pass:

- [ ] **LCP < 2.5s** on `/` (desktop and 4G mobile). Largest contentful element is hero h1 with preloaded font.
- [ ] **FCP < 1.8s** — system-font fallback stack ensures first paint before woff2 resolves.
- [ ] **CLS < 0.1** — no layout shifts when fonts.css swaps from fallback to DM Sans / Space Mono (achieved via metrics-similar fallback fonts and preload hints).
- [ ] **TBT < 200ms** desktop, < 400ms 4G mobile.
- [ ] **Lighthouse Best Practices ≥ 95**.
- [ ] **Total CSS bundle ≤ 80 KB compressed** (vs. ~120 KB today with Geist Variable + Newsreader + Instrument Serif bundled @fontsource).

### 8.9 Accessibility audit budgets (added v2)

- [ ] **axe-core**: 0 critical and 0 serious violations on `/`, `/blog/<latest post>`, `/pricing`, `/faq`, `/ru` (use `@axe-core/playwright` or DevTools panel).
- [ ] **Lighthouse Accessibility ≥ 95** on the same five routes.
- [ ] `:focus-visible` orange outline visible on every interactive element (tab through `/` end-to-end — no `outline: none` overrides remain).
- [ ] `prefers-reduced-motion: reduce` zeroes out card-reveal, article-reveal, reading-progress transitions, hover-lifts, live-demo caret/pulse, language-switcher dropIn (DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce" → reload).
- [ ] `aria-expanded` on every `<summary>` and the consent Preferences toggle (NVDA / VoiceOver announce expansion state).
- [ ] All hover-lifts wrapped in `@media (hover: hover)` — verified by tapping on mobile preview deploy (no stuck-hover after first tap).

### 8.10 General

- [ ] Header, footer, badge, button, step-card, feature-card, price-card, faq-item, terminal-window all visually match TF (for TF-analog pages) or internal baseline (for TF-less pages).
- [ ] Theme-color in DevTools `Application > Manifest` shows `#282838`.
- [ ] No console errors related to font loading or missing CSS custom properties.
- [ ] Network tab: zero requests to `fonts.googleapis.com`, all `/fonts/*.woff2` resolve from same origin.
- [ ] `<html lang>` attribute matches the requested locale (`en` / `de` / `pl` / `ru`) on every SSR'd route — verified by `curl -s <url> | grep '<html'`.
- [ ] OG image at `public/og-image.jpg` rendered against dark `#282838` theme (P5-7 deliverable).
- [ ] SVG favicon present and visible in browser tab.

---

## Appendix A — Exact TF code excerpts the reviewer can cite

(Quoted verbatim so the reviewer can cross-check the source.)

**Color block** — `typelessform/src/styles.scss:4-25`:
```scss
:root {
  --bg-primary: #282838;
  --bg-secondary: #313142;
  --bg-card: #3A3A4C;
  --bg-card-hover: #434356;
  --bg-code: #2E2E3E;
  --text-primary: #F0F0F5;
  --text-secondary: #A3A3B8;
  --text-muted: #7C7C92;
  --accent: #FF6B2B;
  --accent-hover: #FF8548;
  --accent-glow: rgba(255, 107, 43, 0.15);
  --accent-subtle: rgba(255, 107, 43, 0.08);
  --border: rgba(255, 255, 255, 0.08);
  --border-accent: rgba(255, 107, 43, 0.3);
  --success: #34D399;
  --info: #60A5FA;
  --font-display: 'Space Mono', monospace;
  --font-body: 'DM Sans', sans-serif;
  --container: 1120px;
  --section-gap: 80px;
  --radius: 12px;
  --radius-lg: 20px;
}
```

**Button block** — `typelessform/src/styles.scss:87-124`:
```scss
.btn {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--font-body); font-weight: 600; font-size: 15px;
  padding: 14px 32px; border-radius: 100px; border: none;
  cursor: pointer; transition: all 0.3s ease; text-decoration: none;

  &-primary {
    background: var(--accent); color: #fff;
    box-shadow: 0 4px 24px rgba(255, 107, 43, 0.3);
    &:hover {
      background: var(--accent-hover);
      box-shadow: 0 8px 32px rgba(255, 107, 43, 0.4);
      transform: translateY(-2px); color: #fff;
    }
  }
  &-outline {
    background: transparent; color: var(--text-primary);
    border: 1px solid var(--border);
    &:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-subtle); }
  }
}
```

**Header block** — `typelessform/src/app/app.scss:1-18`:
```scss
.header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.header-inner {
  display: flex; align-items: center; justify-content: space-between;
  height: 64px;
}
```

**Step card** — `typelessform/src/app/app.scss:401-438` (lines 394-399 hold `.steps-grid` wrapper; `.step-card` block starts at 401):
```scss
.step-card {
  flex: 1; max-width: 320px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 32px 28px;
  text-align: center; transition: all 0.3s;
  &:hover {
    border-color: var(--border-accent);
    background: var(--bg-card-hover);
    transform: translateY(-4px);
  }
  h3 { font-family: var(--font-display); font-size: 18px; margin: 16px 0 12px; }
  p { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }
}
.step-number {
  font-family: var(--font-display); font-size: 48px; font-weight: 700;
  color: var(--accent); opacity: 0.15; line-height: 1; margin-bottom: 10px;
}
```

---

## v2 Changelog (2026-05-19)

Edits applied in response to the senior FIX review (`02-design-system-migration-plan.review.md`). Each entry lists the review item closed.

**Critical (must-fix before implementation):**

- [added] **Cyrillic font strategy** — §2.2 documents the blackout (DM Sans + Space Mono ship no Cyrillic upstream — verified via direct `curl` to Google Fonts CSS-2 API). §5.4-A specifies Option A (Inter + JetBrains Mono Cyrillic substitution under `unicode-range` partitions inside the same `--font-body` / `--font-display` family) with concrete file list, source URL (`gwfh.mranftl.com`), and test plan. Phase 0 task P0-1 added. (Closes review §10 item 1, §6.1.)
- [changed] **SSR / FOUC hardening** — §5.4 step 5 reclassified preload hints from "optional polish" to **MANDATORY**, with 3 critical preloads (DM Sans latin single file + Space Mono latin 400 + Space Mono latin 700; TF de-duplicates DM Sans weights into a single woff2). Step 1 changed font CSS path from relative `fonts/fonts.css` to **absolute** `/fonts/fonts.css` (fixes nested-route 404 risk under Angular SSR). Step 6 adds system-font fallback stack to `--font-body` / `--font-display` (FCP rendering before woff2 resolves). Step 9 adds SSR verification (curl deep routes and assert font link + theme-color). (Closes review §10 item 2, §6.2.)
- [changed] **Consent-banner GDPR granularity** — §5.5.5 fully rewritten. Target's 3-tier `<ul class="consent__tiers">` markup + 2-state template (collapsed / preferences) **preserved**. TF's flat 2-button architecture explicitly listed as **non-goal**. Surfaces restyled to TF chrome only. Includes i18n key list for consent strings to add to all 4 `translations.{en,de,pl,ru}.ts`. (Closes review §10 item 3, §6.4.)
- [added] **Branch-based rollout strategy** — §7.0 introduces long-lived `feat/tf-redesign` branch + preview-deploy gate; `main` stays on cream theme through P0–P5; single squash-merge after Phase 5 acceptance. Per-phase acceptance split into `acceptance-dev` (branch only) and `acceptance-deploy` (Phase 5 only). Phase 0 acceptance text rewritten so "components render unstyled" applies only on branch. (Closes review §10 item 4, §6.3.)

**Pre-Phase-1:**

- [fixed] **Accent-hex contradiction** — §3.6 wording rewritten. The "already correct" claim is dropped; §3.6 now matches §4 (target `#ff5b1f` ≠ TF `#FF6B2B`; we adopt TF). (Closes review §10 item 5, §4 internal contradiction.)
- [added] **`shared/icon` migration note** — §5.5.4-a confirms icons already use `currentColor` stroke → no per-theme rewrite needed; documents verification step. (Closes review §10 item 6.)
- [added] **`@media (hover: hover)` guard** for all `translateY` lifts — §5.6 motion section, with concrete pattern and per-component list. (Closes review §10 item 7, §6.5/6.9.)
- [added] **`aria-expanded` on FAQ summaries and consent Preferences toggle** — §5.5.9 + §5.5.5 + §5.6 ARIA hardening subsection. (Closes review §10 item 8, §6.5.)
- [added] **Header offset vs hero padding clarification** — §5.3 already explains the `main { padding-top: 64px }` global; Phase 1 task list re-references it as deliberate divergence from TF. (Closes review §10 item 9, §6.12.)
- [added] **Utility-classes location decision** — P0-6 commits to a new partial `src/styles/_components.scss` imported via `styles.scss`. (Closes review §10 item 10, §6.13.)

**Pre-acceptance:**

- [rewrote] **§8.7 side-by-side parity** split into TF-screenshot oracle subset (5 page types) + internal-baseline subset (7 page types); explicit 360 / 768 / 1280 / 1440 viewports; Playwright/Percy/Chromatic candidates. (Closes review §10 item 11, §9.)
- [added] **§8.8 Performance budgets** — LCP < 2.5s, FCP < 1.8s, CLS < 0.1, TBT < 200ms desktop, Best Practices ≥ 95, CSS bundle ≤ 80 KB compressed. (Closes review §10 item 12.)
- [added] **§8.9 Accessibility audit budgets** — axe-core 0 critical/serious, Lighthouse Accessibility ≥ 95, focus-visible tab-through, reduced-motion behavior, aria-expanded, hover-guard tap test. (Closes review §10 item 13.)
- [added] **OG / favicon / manifest regeneration** — §6.3 enumerates assets; Phase 5 tasks P5-7..P5-11. (Closes review §10 item 14, §6.8.)
- [added] **Reduced-motion override for reading-progress bar + reveal keyframes** — §5.6 with explicit CSS. (Closes review §10 item 15, §6.5.)

**Nice-to-have:**

- [revised] **Estimate 5–6 → 8.5–9 dev-days** — §7 totals reworked; per-phase budgets revised; rationale embedded. (Closes review §10 item 16, §8.)
- [added] **Phase 3 content prerequisite** — industry conversation snippets required before P3-6 SCSS finalization. (Closes review §10 item 17.)
- [added] **i18n new TF labels translated** — P1-6 task in Phase 1. (Closes review §10 item 18, §6.7.)
- [added] **`<html lang>` SSR behavior** — §6.2 i18n bullet + §8.10 acceptance assertion. (Closes review §10 item 19, §6.7.)
- [added] **§5.7 contrast verification table** — full ratios for every text-on-surface combination; replaces prose. (Closes review §10 item 20.)

**Additional fixes not in numbered review list:**

- [fixed] **Appendix A line-drift** — step-card range corrected `394-438` → `401-438` (with note that `.steps-grid` occupies 394-399). Also fixed §2.4 inline reference from `app.scss:394-459` → `app.scss:401-438`. (Closes review §3 minor inaccuracy, §8 dependency note.)
- [added] **Revision History** block after §1 Executive Summary.
- [added] **§6.3 Brand assets regeneration** subsection for dark-theme OG, favicon, PWA manifest, apple-touch-icon.
- [added] **Stats column count decision** — home 6 → 4 columns documented in P2 acceptance (resolves review §5 soft gap on `pages/home`).
- [added] **De-dup of `.tier` rules** — P3-7 post-task references the single global `.price-card` in `_components.scss` (resolves review §8 phase-dependency note).

**Items consciously deferred (not applied) — rationale:**

- **Print styles** (review §6.10) — marked optional in review itself; no compelling business need for printable legal pages; risk vs. value is low. Documented as out-of-scope.
- **Focus trap inside mobile menu** (review §6.5) — TF lacks this; target lacks this; not a regression introduced by this migration. Recommended as a separate a11y task post-migration, not gating SHIP.
- **`color-scheme: dark` placement** (review §6.11) — already in §5.1 token block; no edit needed.
- **Container 1000px intermediate step** (review §6.6) — TF does not have one and target works fine with the `1120 → 860 → 700 → 600` ladder as documented. Adding `--bp-*` custom properties to a `_breakpoints.scss` is a future refactor, not a migration blocker. Documented but not added.

— end of document —
