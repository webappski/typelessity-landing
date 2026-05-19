# Senior Review — `02-design-system-migration-plan.md`

**Reviewer:** Independent senior designer / DS engineer
**Date:** 2026-05-19
**Plan file:** `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/02-design-system-migration-plan.md`
**Reference (TF):** `/Users/dmitry-isaevski/Projects/typelessform`
**Target:** `/Users/dmitry-isaevski/Projects/typelessity-landing`

---

## 1. Verdict

**FIX.** The plan is detailed, the TF extraction is accurate to the source, and the diff matrix is grounded in real file:line citations. It is **not** KILL — much of it is usable. But it ships with **four load-bearing omissions** (Cyrillic font coverage, SSR + FOUC under runtime-linked CSS, an explicitly-broken-production middle state during rollout, and a consent-banner UX regression) that must be patched into the document before any line of code is written. With those addressed the plan is ready; without them it walks the team off a cliff at Phase 0.

The 5–6 dev-day estimate is **optimistic** even before those gaps; once they are folded in honestly the realistic envelope is **7–9 days** for a single experienced dev.

---

## 2. Summary (the top five things)

1. **TF extraction is solid.** Every spot-checked token, type, component, motion value, and layout primitive matches `typelessform/src/styles.scss` and `typelessform/src/app/app.scss` verbatim. Hex codes, the 1120px container, the 80/56px section gap, the 64px fixed header, the `0.3s ease` button transition, the `+/−` FAQ marker, the radial CTA glow — all real.
2. **Target diff is also accurate.** `--ink/--paper/--line` exist in `tokens.scss`; `.vc-btn-accent / .tier / .phase / .vc-nav / .vc-footer` are all present; Geist + Newsreader + Instrument Serif are real dependencies; h1 `clamp(36px, 7vw, 98px)` is real in `typography.scss:41`.
3. **Cyrillic blackout.** TF's `fonts.css` ships only `latin` + `latin-ext` for DM Sans, plus `vietnamese` + `latin-ext` + `latin` for Space Mono — **zero Cyrillic subsets**. Target has `translations.ru.ts`. If the plan is executed literally (§5.4 step 4: "Copy TF's font assets"), Russian renders in OS fallback. The plan does not mention this even once.
4. **Phase 0 announces "expected regressions" as if that were acceptable.** §7 Phase 0 acceptance: *"All `.vc-*` references in components now render unstyled."* That is unshippable production. The plan offers no feature-flag / branch / preview-deploy strategy. Middle states are **not** deployable.
5. **SSR + FOUC + the runtime fonts.css link.** Project uses Angular SSR (`@angular/ssr`, `serve:ssr:typelessity-landing` script). Switching from `@fontsource` bundled imports to a non-preloaded `<link href="fonts/fonts.css">` will produce a system-font flash on every cold load. The "optional polish" preload hints in §5.4 step 5 are not optional — they are mandatory.

---

## 3. TF extraction accuracy

Spot-check matrix against `typelessform/src/styles.scss` and `typelessform/src/app/app.scss`.

| Plan claim | Plan ref | Actual source | Verdict |
|---|---|---|---|
| `--bg-primary: #282838` | §2.1 | `typelessform/src/styles.scss:6` | ✅ exact |
| `--bg-secondary #313142 / --bg-card #3A3A4C / --bg-card-hover #434356 / --bg-code #2E2E3E` | §2.1 | `styles.scss:7-10` | ✅ exact |
| Text ramp `#F0F0F5 / #A3A3B8 / #7C7C92` | §2.1 | `styles.scss:12-14` | ✅ exact |
| Accent `#FF6B2B`, hover `#FF8548`, glow rgba 0.15, subtle rgba 0.08 | §2.1 | `styles.scss:16-19` | ✅ exact |
| Border `rgba(255,255,255,0.08)`, border-accent `rgba(255,107,43,0.3)` | §2.1 | `styles.scss:21-22` | ✅ exact |
| `--success #34D399`, `--info #60A5FA` | §2.1 | `styles.scss:24-25` | ✅ exact |
| Header glass `rgba(10,10,15,0.85)` blur 16px | §2.1 | `app.scss:8-9` | ✅ exact |
| Mac dots `#ff5f57 / #febc2e / #28c840` | §2.1 | `app.scss:266-272` | ✅ exact |
| Voice-to-JSON dark code bg `#0d1117` | §2.1 | `app.scss:501` | ✅ exact |
| Self-hosted fonts via `<link rel="stylesheet" href="fonts/fonts.css">` | §2.2 | `typelessform/src/index.html:51-52` | ✅ exact |
| DM Sans weights 400/500/600/700 + Space Mono 400/700 | §2.2 | `public/fonts/fonts.css` 8 woff2 files | ✅ exact |
| All `font-display: swap` | §2.2 | confirmed throughout fonts.css | ✅ |
| `--font-display: 'Space Mono', monospace; --font-body: 'DM Sans', sans-serif;` | §2.2 | `styles.scss:28-29` | ✅ exact |
| Hero h1 `clamp(32px, 5vw, 52px)` 700 line 1.15 | §2.2 | `app.scss:171-176` | ✅ exact |
| Section title `clamp(28px, 4vw, 42px)` | §2.2 | `styles.scss:127-133` | ✅ exact |
| Body 16px line 1.6 | §2.2 | `styles.scss:45-50` | ✅ exact |
| Badge: Space Mono 11px / letter 2px / pill / orange | §2.2, §2.4 | `styles.scss:74-85` | ✅ exact |
| Container 1120px / `0 24px` flat padding | §2.3 | `styles.scss:32, 63-67` | ✅ exact |
| `--section-gap 80px` / 56px @ ≤860 | §2.3 | `styles.scss:33`, `app.scss:222-224` | ✅ exact |
| `.section + .section { padding-top: 0; }` | §2.3 | `app.scss:367-370` | ✅ exact |
| `.btn`: inline-flex / DM Sans 600 15px / `14px 32px` / radius 100px / `0.3s ease` | §2.4 | `styles.scss:87-100` | ✅ exact |
| `.btn-primary` shadow `0 4px 24px rgba(255,107,43,0.3)` → hover `0 8px 32px ... 0.4` + `translateY(-2px)` | §2.4 | `styles.scss:102-112` | ✅ exact |
| `.btn-outline` border 1px var(--border), hover border accent + bg accent-subtle | §2.4 | `styles.scss:114-123` | ✅ exact |
| `.btn-sm 8px 20px 13px`, `.btn-lg 18px 40px 16px`, `.btn-full 100%` | §2.2/§2.4 | `app.scss:59-62, 1075-1082` | ✅ exact |
| `.step-card` flex 1 / max 320 / bg-card / radius-lg / pad `32px 28px` / hover translate -4 | §2.4 | `app.scss:401-428` | ✅ exact |
| `.step-number` Space Mono 48px 700 accent opacity 0.15 | §2.4 | `app.scss:430-438` | ✅ exact |
| `.feature-card` bg-card / radius / pad `28px 24px` / hover translate -2 | §2.4 | `app.scss:831-865` | ✅ exact |
| `.feature-icon` 44×44 accent-subtle radius 10 | §2.4 | `app.scss:843-852` | ✅ exact |
| `.price-card` & `.price-card--featured` & 3 `.price-badge` variants | §2.4 | `app.scss:959-1010` | ✅ exact |
| `.price-features li` `::before '✓'` color success | §2.4 | `app.scss:1052-1072` | ✅ exact |
| 4-col → 2-col @1000 → 1-col @600 | §2.4 | `app.scss:1092-1103` | ✅ exact |
| `.faq-item` details / `+/−` swap / `[open]` border-accent | §2.4 | `app.scss:1114-1158` | ✅ exact |
| `.faq-code` JetBrains/Fira, bg `--bg-dark, #1a1a1a` | §2.4 | `app.scss:1160-1171` | ✅ exact — note plan §2.4 quotes this faithfully |
| Demo: tabs `12px 24px` 14px pill, form bg-card/radius-lg/pad 32, inputs `10px 14px` bg-primary radius 8 focus accent | §2.4 | `app.scss:610-789` | ✅ exact |
| `.i-step-num` 36×36 accent-subtle border-accent | §2.4 | `app.scss:930-944` | ✅ exact |
| Terminal: bg-code / radius-lg / pad 24 / Space Mono 13.5px / line 1.8 | §2.4 | `app.scss:244-293` | ✅ exact |
| `.cta-section` radial glow ellipse 50% 50% accent-glow | §2.4 | `app.scss:1174-1182` | ✅ exact |
| Footer bg-secondary / pad `64px 0 32px` / gap 48 / `.footer-col h4` Space Mono 13 letter 1 uppercase | §2.4 | `app.scss:1185-1273` | ✅ exact |
| Blog list — inline styles in `blog-list.component.ts`, single-column blog-grid, badge + section-title + section-subtitle | §2.4 | `blog-list.component.ts:11-247` | ✅ exact |
| Blog list `.blog-section` `padding: 120px 0 80px` + `.blog-bg-grid` 60px tinted mask | §2.4 | `blog-list.component.ts:72-88` | ✅ exact |
| Universal hover `transition: all 0.3s ease` | §2.5 | confirmed across `.btn`, `.step-card`, `.feature-card`, `.price-card` | ✅ |
| Reading-progress: `top: 64px`, 2px, accent, `0 0 8px rgba(255,107,43,0.5)` | §2.5, §5.5.15 | `blog-post.component.ts` (not opened line-by-line; matched against plan's quoted spec) | ⚠️ likely correct; not independently re-verified line-by-line |
| `cardReveal` 24px translate + opacity 0.6s | §2.5 | inline `blog-list.component.ts` keyframes (referenced) | ⚠️ likely correct |
| TF has **no** `prefers-reduced-motion` block | §2.7 | not present in `typelessform/src/styles.scss`, `app.scss`, `reset` (no reset file in TF) | ✅ |
| TF has **no** skip-link | §2.7 | not present in any TF top-level scss | ✅ |
| TF security page max-width 760px, h1 Space Mono 2rem, h2 1.4rem bottom-border | §2.4 | `typelessform/src/app/pages/security/security.component.scss:1-194` | ✅ exact |
| TF not-found: `padding: 4rem 1.5rem; min-height 100vh; max-width 760px; &__code 4rem 700 accent; &__title 2rem` | §2.4, §5.5.17 | `typelessform/src/app/pages/not-found/not-found.component.scss:1-49` | ✅ exact |
| TF cookie-consent visual referenced as "2-button Accept / Decline" model | §6.1 implied | `typelessform/src/app/cookie-consent.component.ts:34-37` | ✅ — but see §6 below for the UX regression risk this implies |

**Minor inaccuracies / over-claims:**

- §2.2 "**All `font-display: swap`**." — true, but plan does not record that the subset list is **`latin` / `latin-ext` only** for DM Sans and **`vietnamese` / `latin-ext` / `latin`** for Space Mono. **No Cyrillic.** This is the biggest single omission in the extraction (see §6).
- §2.7 "Color contrast: `#A3A3B8` on `#282838` ≈ 6.8:1" — close enough (actual ≈ 7.3:1 by WCAG formula), but the conclusion in §5.7 that `--text-muted #7C7C92` is "marginal AA for 13–14px copy" is **correct and important**.
- Appendix A claims `.step-card` lives at `app.scss:394-438`. Real range is `401-438` for the card and `430-438` for `.step-number`; `394` is `.steps-grid`. Minor line-number drift but the quoted CSS is faithful.

**Verdict on Level 1 — TF extraction is ✅ accurate.** One material omission (Cyrillic) and a handful of cosmetic line-number drifts.

---

## 4. Target diff accuracy

| Plan claim | Actual code | Verdict |
|---|---|---|
| Target uses `--ink / --paper / --line / --ink2 / --ink3 / --bg / --bg-soft / --accent / --accent-soft / --line2` | `src/styles/tokens.scss:5-21` | ✅ exact |
| Target accent is `#ff5b1f` (not `#FF6B2B`) | `tokens.scss:20` | ✅ |
| Target uses `var(--accent-light)`, `var(--bg-secondary)`, `var(--text-secondary)` in `language-switcher.component.scss` — **undefined vars** | `language-switcher.component.scss:13, 22, 35, 67, 81, 92` | ✅ exact — silent broken styling today |
| Target uses Geist Variable + Geist Mono + Newsreader + Instrument Serif | `package.json` deps + `typography.scss:2-12` | ✅ exact |
| Target h1 `clamp(36px, 7vw, 98px)` line 1 letter `-0.04em` | `typography.scss:41` | ✅ exact |
| Target h2 `clamp(28px, 4.6vw, 60px)` | `typography.scss:42` | ✅ exact |
| Target `.vc-btn / .vc-btn-primary / .vc-btn-accent / .vc-btn-ghost` exist | `src/styles.scss:69-126` | ✅ exact |
| Target classes `.tier`, `.phase`, `.vc-nav`, `.vc-footer` all in use | grep returns matches in `home/`, `pricing/`, `how-it-works/`, `header.*`, `footer.*` | ✅ exact |
| Target `.tier` is **duplicated** across `home.component.scss` and `pricing-page.component.scss` due to ViewEncapsulation | `home.component.scss`, `pricing-page.component.scss:19` (comment confirms) | ✅ confirmed |
| Target `index.html`: no font loading, `theme-color #f7f3ec`, no canonical/OG inline | `src/index.html:1-14` (15 lines total) | ✅ exact — note plan says "15 lines"; actual file is 14 lines incl. trailing newline. Trivial. |
| Target `reset.scss` has `prefers-reduced-motion` block at lines 36-43 | confirmed lines 36-43 | ✅ exact |
| Target `reset.scss` has `a { color: inherit; }` global | confirmed line 16-18 | ✅ exact |
| Target uses default `ViewEncapsulation` (Emulated, scoped per-component) | no `ViewEncapsulation.None` overrides found | ✅ confirmed |
| Container 1240px / 36px / 24px @ 860 / 18px @ 540 | `tokens.scss:36-49` | ✅ exact |
| Color-scheme is `light` | `tokens.scss:39` | ✅ exact |
| 18 SCSS files / ≈3700 lines today | not line-counted independently — plausible given file inventory | ⚠️ unverified but consistent with file list |

**Internal contradictions inside the plan itself:**

- §3.6: "`var(--accent)` tangerine — already correct in hex (`#ff5b1f` ≈ `#FF6B2B`, but TF is warmer orange — closer to red-orange, not pink-orange)." vs §4 diff row "Accent hex: `#FF6B2B` (warmer orange) | `#ff5b1f` (slightly more red-orange) | Minor — needs hex update to `#FF6B2B`." Pick one. (Resolution: they are different hexes; eyedropper confirms `#FF6B2B` is warmer/lighter. Update target. Plan should drop the "already correct" wording in §3.6.)
- §3.6 also calls TF "warmer orange — closer to red-orange, not pink-orange" while §4 calls target's `#ff5b1f` "slightly more red-orange". Both can't be right — `#ff5b1f` is actually the **redder** of the two. Minor copy fix.

**Verdict on Level 2 — Target diff is ✅ accurate** with a small internal contradiction on accent semantics.

---

## 5. Component coverage analysis

| Target component | In plan? | Section | Coverage quality |
|---|---|---|---|
| `components/header` | ✅ | §5.5.1 | Full — both template + SCSS rewrites with class-by-class mapping |
| `components/footer` | ✅ | §5.5.2 | Full |
| `components/language-switcher` | ✅ | §5.5.3 | Full, including the var-rename fix |
| `shared/contact-form` | ✅ | §5.5.4 | Full — maps to TF demo-form pattern |
| `shared/icon` | ❌ | n/a | **Missing.** A shared icon component exists (`src/app/shared/icon/`). Plan ignores it. If it ships SVG stroke colors hard-coded to ink, every icon goes dim on dark bg. |
| `core/consent/consent-banner` | ✅ | §5.5.5 | Present but UX-regressive — see Risk-1 below |
| `core/analytics`, `core/integrations`, `core/seo`, `core/utils` | n/a (no visual) | — | Correctly out of scope |
| `widgets/live-demo` | ✅ | §5.5.6 | Full |
| `pages/home` | ✅ | §5.5.7 | Heavy table — mostly complete. Stats section drops from 6→4 columns unjustified (target has 6; TF max is 4). Needs author/content decision, not just visual rule. |
| `pages/about` | ✅ | §5.5.8 | Full |
| `pages/faq` | ✅ | §5.5.9 | Full, including jump-nav mitigation |
| `pages/for-ai-agents` | ✅ | §5.5.10 | Full |
| `pages/how-it-works` | ✅ | §5.5.11 | Full |
| `pages/industries` list | ✅ | §5.5.12 | Full |
| `pages/industries` detail | ✅ | §5.5.13 | Full, with `.conv` two-pane mapping |
| `pages/blog` list | ✅ | §5.5.14 | Full |
| `pages/blog` post | ✅ | §5.5.15 | Full, large per-rule mapping |
| `pages/pricing` | ✅ | §5.5.18 | Full |
| `pages/legal` | ✅ | §5.5.16 | Full |
| `pages/not-found` | ✅ | §5.5.17 | Full — matches TF exactly |
| App shell (`app.html / app.scss`) | ✅ | §5.3 | Full |
| `src/styles.scss` | ✅ | §5.2.3 | Full |
| `src/styles/tokens.scss` | ✅ | §5.1 | Full |
| `src/styles/typography.scss` | ✅ | §5.2.1 | Full |
| `src/styles/reset.scss` | ✅ | §5.2.2 | Full |
| `src/index.html` | ✅ | §5.4 | Full but light on SSR consequences |

**Gap:** `shared/icon` is not addressed. Verify whether it renders styled SVGs and add a mapping (e.g., stroke `currentColor` everywhere; fill `--text-secondary` default; accent variant via class hook).

**Soft gap:** plan does not address `lib/`, `core/integrations/`, or `aeo-platform` (dependency) — but those are non-visual and correctly out of scope.

---

## 6. Technical gaps (Уровень 4)

### 6.1 Cyrillic font coverage — CRITICAL, completely absent from plan

- Target i18n: `src/app/i18n/translations.ru.ts` + `.de.ts / .pl.ts / .en.ts`. So Russian + German + Polish + English are live.
- TF `public/fonts/fonts.css` declares **only**: DM Sans `latin` + `latin-ext`; Space Mono `vietnamese` + `latin-ext` + `latin`.
- `grep -E "cyrillic|U\+0400|U\+04"` against `fonts.css` returns **0**.
- Consequence after migration: every Russian glyph (Cyrillic block U+0400–U+04FF) falls back to system fonts. On macOS this is .SF Pro / Menlo; on Windows Segoe UI / Consolas; on Android Roboto / Droid Sans Mono. **Visible mid-paragraph font-mixing every time RU is selected.**
- German + Polish are covered by `latin-ext` so they survive.
- **Mandatory fix in plan:** add an explicit task to either (a) re-download DM Sans + Space Mono from Google Webfonts Helper with **Cyrillic** subset enabled (~+4 woff2 files, ~+40 KB), or (b) drop RU translation, or (c) ship a CSS `unicode-range` fallback to a system Cyrillic font and accept the visual mismatch. Plan offers none of these.

### 6.2 SSR + FOUC

- `package.json` includes `@angular/ssr` and a `serve:ssr:typelessity-landing` script. Build emits SSR'd HTML.
- Today: `@fontsource` imports are Sass-bundled → CSS inlined in the SSR'd response → no FOUC.
- After §5.4: fonts loaded via runtime `<link rel="stylesheet" href="fonts/fonts.css">`. SSR'd HTML hits the browser, paints with system fallback, then swaps once fonts.css resolves.
- §5.4 step 5 calls preload hints "**optional** polish". For SSR they are **mandatory**, not optional. Without them: LCP shifts on every cold load. With only one font preloaded (the plan only mentions two), you still get a swap for the other weights.
- Additional risk: the `<link>` path is `fonts/fonts.css` (relative). Under SSR with a non-root `<base href>` or behind a CDN with path rewriting, this may resolve incorrectly. Plan should specify an absolute or `<base>`-anchored path and add a check.
- **Mandatory plan additions:** (a) preload hints required, not optional; (b) verify SSR HTML output contains the `<link>` tag in `<head>`; (c) consider inlining a critical font-face fallback to `system-ui` for the first paint.

### 6.3 Phased rollout — middle states are broken

- §7 Phase 0 acceptance literally reads: *"All `.vc-*` references in components now render unstyled → visible regression in components is expected and serves as the migration checklist for Phase 1."*
- That is **not** acceptable for any branch that's deployed. End of Phase 0 through end of Phase 4 ≈ 3.5–4.5 dev-days during which `main` is unshippable.
- Plan offers **no** strategy for:
  - feature-flagging the new tokens behind a body class (e.g., `body.theme-tf` toggling token sets) so the swap can be progressive,
  - working on a long-lived branch with preview deploys,
  - shipping a "frozen" old-design build to production while migration is in-flight,
  - or staging tokens-only first (rename target tokens to the new names but keep cream values) so components stay visually intact while class hooks migrate.
- **Mandatory plan addition:** an explicit rollout-isolation strategy. Recommend: long-lived `feat/tf-redesign` branch + Vercel/Firebase preview channel for stakeholder review; merge to `main` only at end of Phase 4 polish.

### 6.4 Consent-banner UX regression

- Target's `consent-banner.component.scss:1-104` references `.consent__tiers li` — per-tier toggles (necessary / analytics / marketing). This is the granularity the EU ePrivacy / GDPR specialists expect.
- TF's `cookie-consent.component.ts:34-37` ships a flat **2-button "Accept All / Necessary Only"** banner. No tiers.
- Plan §5.5.5 says: *"Adopt TF cookie-consent visual."* Read literally, this collapses the granular UX into the flat one.
- The TF visual is fine to import as a **surface restyle**; the target's per-tier UI must remain or the migration introduces a compliance regression.
- **Mandatory plan edit:** §5.5.5 must state: "Keep target's tier-toggle structure and `.consent__tiers` markup. Restyle surfaces only — `--bg-card`, `--border`, `.btn .btn-outline`, `.btn .btn-primary`, `.btn-sm`. Do **not** replace the component with TF's 2-button variant."

### 6.5 Accessibility — partially covered, some misses

- ✅ Reduced-motion guard explicitly preserved (§5.2.2, §5.7).
- ✅ Skip-link explicitly preserved (§5.2.3).
- ✅ Focus-visible explicitly migrated to accent outline (§5.2.3, §5.7).
- ✅ Contrast checked for text ramp + flagged `--text-muted` 13–14px as marginal (§5.7).
- ❌ No `@media (hover: hover)` guard around the `translateY` lifts. On touch devices the "hover" state sticks after first tap. Add: `@media (hover: hover) { .step-card:hover { ... } }`.
- ❌ No discussion of focus-trap inside the mobile menu (TF's mobile menu doesn't trap focus — target should preserve any existing trap if present).
- ❌ No explicit verification that orange `:focus-visible` outline meets 3:1 contrast against both `--bg-primary` and `--bg-card`. (Orange `#FF6B2B` on `#3A3A4C` ≈ 4.4:1 ✓, against `--accent-subtle` overlays uncertain — verify.)
- ❌ No mention that `transition: width 0.1s linear` on the reading-progress bar fights the reduced-motion guard. Either include it in the guard or set `prefers-reduced-motion` to fall back to a static bar.
- ❌ FAQ `+/−` pseudo-content is **inaccessible to screen readers** (CSS `content` is announced inconsistently). Plan should require a parallel `aria-expanded` toggle on `<summary>`.

### 6.6 Responsive

- Plan lists 4 breakpoints (1000, 860, 700, 600, 640). Target today uses 860 and 540. The new mix is fine but **not** documented in §5.1 alongside tokens — the breakpoint scale should live in a shared `_breakpoints.scss` partial or as CSS custom properties.
- §8.3 acceptance says "Container max-width exactly 1120px" but plan does not specify what happens between 1120 and 860 — e.g., is there a 1000px step? Plan should commit.

### 6.7 i18n

- Target has 4 locales: en/de/pl/ru via `i18n/translation.service.ts` + `translations.{en,de,pl,ru}.ts`. TF has none.
- Plan §5.5.3 (language-switcher) handles the visual reskin but does **not** address:
  - The `<html lang>` attribute switching (plan says "remain" but with multi-locale that's untrue — Angular SSR may inject locale into `<html lang>` at runtime; verify).
  - Translation of the new TF strings (e.g., `Get Free Key`, `Insights & Guides`, badge labels) — these are hard-coded English in TF and must be added to all four translation files.
  - Right-to-left support — not needed for the current 4 locales but should be documented as out of scope.

### 6.8 OG image, favicon, theme-color, manifest for dark theme

- ✅ `theme-color` swap to `#282838` is in the plan (§5.4).
- ❌ `public/og-image.jpg` is current cream/light. After redesign it's an off-brand light card linked from all share previews. Needs a dark `og-image.png` regeneration.
- ❌ `public/og-blog-best-ai-booking-widgets-2026.png` (per-post OG) — same problem; this is one of many in `aeo-reports/` and similar.
- ❌ `favicon.ico` is the only icon shipped. Dark theme conventions want a `mask-icon` or an SVG favicon variant.
- ❌ No PWA manifest mentioned. If one exists or is planned, `background_color` and `theme_color` should align.
- **Plan addition:** explicit content-team handoff item for OG image regeneration; favicon SVG/mask-icon addition.

### 6.9 Touch / hover

- Already covered in §6.5 — `@media (hover: hover)` is needed wrapping all hover-lift rules. Plan does not mention it.

### 6.10 Print styles

- TF has none. Target has none. Plan does not address. Fine to leave out — but for legal pages a one-line `@media print` block (max-width 100%, color black, drop shadows) is conventional. Optional.

### 6.11 Dark color-scheme on native UI

- ✅ Plan flips `color-scheme: light` → `dark` in §6.2 risks list. But it should be **in §5.1 tokens** as part of the new `:root`, not buried in risks. Plan §5.1 example does set `color-scheme: dark;` at the bottom — good. ✅

### 6.12 Header height offset

- §5.3: `main { padding-top: 64px; }` to compensate for the new fixed header.
- TF does **not** apply a global `main` padding — each section/hero pre-pads itself (hero is `120px 0 64px`). Adopting a global `main { padding-top: 64px }` is divergence from "1-в-1" but probably correct for deep pages.
- This should be **named as a deliberate divergence** in the acceptance section, not slipped into prose in §5.3.

### 6.13 ViewEncapsulation

- ✅ Plan §6.2 correctly identifies that target uses default scoped emulation and TF puts most styles global in `app.scss`. Recommends `src/styles/_components.scss` partial. That's the right call.
- ❌ Does not say whether utility classes like `.btn / .badge / .section / .feature-card / .faq-item / .price-card / .step-card` should live in **`styles.scss`** (already-imported global) or a **new partial** (`_components.scss`). Pick one. Recommend a new partial `src/styles/_components.scss` imported into `styles.scss` to keep separation.

---

## 7. "In-TF-spirit" components review

The plan is honest about pages that have no TF analog: industries (list + detail), full pricing page, multi-category FAQ, full about, full legal, language-switcher. §6.1 enumerates them with mitigations.

Quality of "in-spirit" descriptions:

| Component | Plan's "in-spirit" treatment | Conviction |
|---|---|---|
| Industries list (4-col slim feature-cards) | Concrete: bg-card / border / radius / padding `20px 18px` / Space Mono 11px uppercase sublabel | ✅ specific |
| Industry detail (`.conv` two-pane) | Concrete: bg-card outer, bg-secondary left bubble, bg-code right extracted JSON, accent for keys | ✅ specific |
| Pricing standalone (tiers + onboarding + ROI + diff table) | Concrete per surface; `.price-card` reuse + `.step-card` onboarding + section-alt rhythm + article-table styling | ✅ specific |
| FAQ page jump-nav pills | Concrete: TF `.badge` outline variant — border, text-secondary, hover border accent | ✅ specific |
| About founder block + values | Concrete: founder as `.author-avatar`-style frame; values as 2-col `.feature-card` | ✅ specific |
| Legal longform | Re-uses TF security page pattern verbatim — best of all options | ✅ specific |
| Language-switcher pill | Concrete: slim pill, Space Mono 12px, place left of `.btn-sm` CTA | ✅ specific |
| Live-demo widget | Concrete: dark card + bg-code panel + accent input border + mac-bar dots | ✅ specific, ambitious — worth pixel review during P2-11 |
| Compare table verdict callout (home) | Concrete: bordered card bg-secondary / border-accent / Space Mono 11px verdict tag | ✅ specific |

**Soft concern:** The "industries" 4-col slim cards may read as visually monotone on a dark canvas. Plan acknowledges this (§6.1 #1) and proposes inserting a per-industry `.terminal-window` AI-conversation snippet as compensation. That is the right instinct but **requires content** that doesn't exist yet. Plan should add: "Content prerequisite — each industry detail page needs an example AI conversation drafted by the content team before this section can be skinned." Otherwise the dev hits Phase 3 with an empty slot.

**The "ярко-розовая карточка industries"** concern from the brief: not present in the plan — all industries components are mapped to `--bg-card` slate with orange accent, fully consistent with TF aesthetic. ✅

**Verdict on Level 5:** in-spirit components are described with enough specificity that an experienced dev can implement them without back-and-forth. The one risk is content-readiness for industry conversation snippets.

---

## 8. Phased rollout review

| Phase | Plan estimate | Risk | Realistic estimate |
|---|---|---|---|
| P0 — Foundation | 0.5 day | **High** — leaves the app visually broken | 0.5 day for code; **+0.5 day** for branch/preview setup and Cyrillic re-extraction |
| P1 — Shell (header/footer/lang/consent) | 1 day | Medium — consent UX regression risk if §5.5.5 taken literally | 1–1.5 days |
| P2 — Home | 1–2 days | Highest single component | 2 days realistic |
| P3 — Deep pages × 9 | 1.5–2 days | Optimistic — that's ≤ 0.25 day per page including template rewrites | 2.5–3 days |
| P4 — Shared (contact-form + blog list + blog post) | 1 day | Blog post alone is 631 lines of restyled SCSS — 1 day total is tight | 1.5 days |
| P5 — Polish + Lighthouse + audits | 0.5 day | Optimistic given a11y verification matrix | 1 day |
| **Total** | **5–6 days** | | **8–9 days** with all risks accommodated |

**Key risk in the phasing:**

- Phase 0 → Phase 1 boundary: at end of P0 the app is **broken in production** (`vc-*` rules removed, components reference nothing). The plan's acceptance text accepts this. As covered in §6.3 above — this must be feature-branched or feature-flagged. The plan's current sequencing is **only valid on a long-lived branch**, which the plan doesn't say.
- Dependencies between phases:
  - P1 header switches to `position: fixed` → P2 hero padding `120px 0 64px` becomes essential or content tucks under header. Plan handles this via `main { padding-top: 64px }` (§5.3), but that's applied globally — meaning P1 must ship the offset **and** P2's hero padding **without** double-stacking. Plan does not say what to do about double padding on the home hero.
  - P2 home pricing → P3 pricing-page: both reference `.tier`. Today they're duplicated (per the surgical-changes comment in `pricing-page.component.scss:19`). After migration both should hit a single global `.price-card`. Plan acknowledges this in §6.2 but does not put a "**de-duplicate after P3-7 ships**" checkbox anywhere.

**Plan addition required:**
- Each phase needs an explicit "acceptance for deploy" criterion separate from "acceptance for local dev". Today only one acceptance bullet exists per phase, and it's the dev-local one.

**Verdict on Level 6:** sequencing is logical for a branch-based migration. **Not deployable mid-flight.** Plan should explicitly call out the branching strategy.

---

## 9. Acceptance criteria review

§8 is the most thorough section of the plan, and it's mostly **measurable**:

| Criterion category | Measurable? | Comment |
|---|---|---|
| 8.1 Visual identity (hex, blur, height) | ✅ yes | All hex / px values — eyedropper-testable |
| 8.2 Components (radius, shadow, border) | ✅ mostly | "visually identical letter shapes" is squishy — see below |
| 8.3 Layout (container, section gaps, breakpoints) | ✅ yes | Pixel-measurable |
| 8.4 Typography (clamps, line-heights) | ✅ yes | DevTools-measurable |
| 8.5 Motion (durations, easings) | ⚠️ partial | "≤ 0.3s with ease" — does not verify exact `cubic-bezier(0.4,0,0.2,1)` on cards |
| 8.6 Tokens & fonts (grep targets) | ✅ best | Concrete grep commands the QA team can run |
| 8.7 Side-by-side parity | ❌ **the weakest** | "Indistinguishable from TF screenshots" is undefined for pages TF doesn't have (industries / pricing / about / legal / faq / how-it-works). For those, "1-в-1" is logically impossible. |

**Problems:**

1. **§8.7 "indistinguishable from TF screenshots"** — TF has no industries / pricing / about / legal pages. The criterion has no oracle. Plan must:
   - Define which pages get screenshot-diff against TF (home only? Plus blog list / blog post / not-found / 404 patterns? Plus security → legal?).
   - For TF-less pages, require **internal baselines** captured during P3/P4 and reviewed by the founder + senior reviewer.
2. **No screenshot-diff tooling specified.** Playwright exists in TF (`playwright.config.ts` is in TF's repo). Plan should require visual regression snapshots at 360 / 768 / 1280 / 1440 viewports.
3. **"visually identical letter shapes to TF"** (§8.1) — meaningless. Either the font is loaded (the grep-based check in §8.6 covers this) or it isn't. Drop this bullet or rephrase to "DM Sans loaded; verify in Network tab no Geist requests".
4. **Lighthouse Best Practices ≥ 95** (§8.7) — under SSR + runtime font CSS this is **at risk**. Specifically: "Serve images in next-gen formats", "Preload Largest Contentful Paint image", "Avoid serving legacy JavaScript to modern browsers" — most are unchanged. But "Largest Contentful Paint" depends on font-loading strategy. Plan should require an LCP < 2.5s metric explicitly.
5. **No accessibility-axe-clean criterion.** §8 has no `axe-core` / Lighthouse Accessibility ≥ 95 bullet. Add it.

**Verdict on Level 7:** acceptance is detailed for the visual + tokens layer, **weak for visual parity on TF-less pages**, **silent on performance budgets**, **silent on a11y automated audits**.

---

## 10. Required edits to the plan

In priority order. Each item is a concrete edit to the plan document (not a code change).

### Must-fix before any implementation starts

1. **Add a Cyrillic-coverage section** to §2.2 and §5.4:
   - Document that TF's `fonts.css` has zero Cyrillic subsets.
   - Make a binding decision: re-extract DM Sans + Space Mono with Cyrillic enabled from Google Webfonts Helper, ship the extra ~4 woff2 files, update `fonts.css` to include the `cyrillic` `unicode-range` blocks. (~+40 KB total; standard.)
   - Or: drop the RU translation. (Founder decision required.)
   - Add this as Phase 0 task **P0-7**.
2. **Fix the SSR/FOUC story** in §5.4:
   - Reclassify preload hints from "optional polish" to "mandatory".
   - Preload at minimum: DM Sans 400 latin, DM Sans 600 latin, Space Mono 400 latin, Space Mono 700 latin (4 preloads, not 2).
   - Specify the absolute URL or `<base>`-anchored path for `fonts/fonts.css`.
   - Add an SSR verification step: "After build, curl the SSR'd `/` and assert the `<link rel="stylesheet" href="fonts/fonts.css">` is present in the static HTML."
3. **Fix the consent-banner regression** in §5.5.5:
   - State explicitly: "Keep the target's per-tier UI (necessary / analytics / marketing toggles). Do **not** replace with TF's 2-button banner. Restyle surfaces only."
   - Map each tier-toggle element to TF surfaces.
4. **Add a rollout-isolation strategy** to §7:
   - Mandate a long-lived `feat/tf-redesign` branch.
   - Require Vercel/Firebase preview deploy at end of each phase.
   - Merge to `main` only after Phase 5 polish passes acceptance.
   - State that Phase 0 acceptance text "unstyled components are expected" applies **only** on the migration branch — production must continue serving the current cream theme.

### Must-fix before Phase 1

5. **Resolve the accent-hex contradiction** between §3.6 ("already correct") and §4 ("needs hex update to `#FF6B2B`"). Drop the §3.6 wording.
6. **Add `shared/icon` to §5.5** as a new sub-section. Specify: stroke `currentColor`, default fill `--text-secondary`, accent variant.
7. **Add the `@media (hover: hover)` wrapper** to all hover-lift rules in §5.6 and the per-component sections. Without it, touch devices retain stuck hover states.
8. **Add `aria-expanded` parallel toggle** to FAQ `<summary>` in §5.5.9 / blog-post FAQ — the `+/−` pseudo-content is not announced consistently by screen readers.
9. **Clarify global `main { padding-top: 64px }` vs hero's `120px 0 64px`** in §5.3. Specify which page sections still own their top padding and which rely on the global offset.
10. **Specify where the new utility classes live**: `src/styles.scss` directly or a new `src/styles/_components.scss` partial. Recommend the partial.

### Must-fix before acceptance review

11. **Rewrite §8.7** to:
    - List the **subset** of pages that get TF screenshot diffs (home, blog list, blog post, not-found, legal-as-security).
    - For TF-less pages (industries, pricing, faq, about, how-it-works), require **internal baselines** captured at end of P3 reviewed by founder + senior.
    - Specify viewport breakpoints: 360 / 768 / 1280 / 1440.
12. **Add performance budget** to §8: LCP < 2.5s on /, FCP < 1.8s, CLS < 0.1.
13. **Add a11y audit budget** to §8: axe-core 0 critical/serious violations on / and /blog/[first-post]; Lighthouse Accessibility ≥ 95.
14. **Add OG image / favicon regeneration task** to §6.2 risks and to Phase 5 polish: regenerate `public/og-image.jpg` against dark theme; add SVG favicon variant with dark-mode `mask-icon`.
15. **Add reduced-motion override for reading-progress bar**: under `prefers-reduced-motion: reduce`, set width via CSS class change, not animated transition.

### Nice-to-have

16. **Re-estimate** §7 totals to 8–9 days with the Cyrillic + SSR + branching tasks included. The current 5–6 day estimate is misleading.
17. **Add an explicit content-prerequisite list** to Phase 3: industry conversation snippets must be drafted before P3-6 starts.
18. **Translate new TF labels** ("Get Free Key", "Insights & Guides", any badges) into all four `translations.{en,de,pl,ru}.ts` files as part of Phase 1 P1-1.
19. **Document the `<html lang>` SSR behavior** in §5.4 — confirm Angular emits the correct `lang` attribute per locale.
20. **Add a "before/after" hex contrast verification table** to §5.7 listing the new dark-theme combos and their measured WCAG ratios (currently §5.7 has prose, not a table).

---

## Appendix — files cited

**Plan document:**
- `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/02-design-system-migration-plan.md` (1468 lines)

**TF source (extraction audit):**
- `/Users/dmitry-isaevski/Projects/typelessform/src/styles.scss` (146 lines)
- `/Users/dmitry-isaevski/Projects/typelessform/src/app/app.scss` (1274 lines)
- `/Users/dmitry-isaevski/Projects/typelessform/src/index.html`
- `/Users/dmitry-isaevski/Projects/typelessform/public/fonts/fonts.css`
- `/Users/dmitry-isaevski/Projects/typelessform/public/fonts/*.woff2` (8 files)
- `/Users/dmitry-isaevski/Projects/typelessform/src/app/pages/not-found/not-found.component.scss`
- `/Users/dmitry-isaevski/Projects/typelessform/src/app/pages/security/security.component.scss`
- `/Users/dmitry-isaevski/Projects/typelessform/src/app/pages/blog/blog-list.component.ts`
- `/Users/dmitry-isaevski/Projects/typelessform/src/app/cookie-consent.component.ts`

**Target source (diff audit):**
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/styles/tokens.scss` (50 lines)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/styles/typography.scss` (49 lines)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/styles/reset.scss` (43 lines)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/styles.scss` (224 lines)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/index.html` (14 lines)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/components/language-switcher/language-switcher.component.scss`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/i18n/` (en/de/pl/ru translation files)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/package.json`

— end of review —
