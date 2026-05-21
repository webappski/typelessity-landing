# Architect review — typelessity-landing (feat/tf-redesign)

> Date: 2026-05-20
> Scope: code-level audit after TypelessForm design-system migration; **not** a visual review.
> Audited tree: `/Users/dmitry-isaevski/Projects/typelessity-landing` on `feat/tf-redesign`.
> Reference DS: `/Users/dmitry-isaevski/Projects/typelessform` (read-only, for comparison).
> Build verified once: `npm run build` → 68 prerendered routes, initial bundle 407.21 kB raw / 114.45 kB gz. No build warnings, no budget overruns.

---

## 1. Verdict overall

The codebase is in **structurally good shape but operationally not deployable**. The Angular 21 architecture is modern (standalone, signals, OnPush everywhere, lazy routes, SSR with prerender, no NgModules anywhere in user code). The new TF token layer is clean and self-contained. The schema/SEO refactor after the Q1 collapse is correct in shape (`@id`-linked Organization/Person/SoftwareApplication, breadcrumb chains everywhere). Build is fast (6.6s), bundle sizes are well under budget, and there are no compile-time warnings.

**Two genuine production blockers, both in `vercel.json`:**

1. **`/` → `/en` redirect (`vercel.json:48-50`) still ships**, even though `/en` no longer exists after Q1. Production root URL will 404-via-catch-all. Apex `typelessity.com` is broken until this redirect block is deleted.
2. **CSP forbids the fonts the site loads (`vercel.json:12`).** `style-src` lacks `https://fonts.googleapis.com`, `font-src` lacks `https://fonts.gstatic.com`. `index.html:14-22` loads DM Sans + Space Mono from Google. In production the stylesheet and woff2 are blocked → silent fallback to system stack → the whole TF redesign degrades to Helvetica/SF Mono. CSP must be patched **or** Google Fonts swapped for the already-installed-but-unused `@fontsource/*` self-hosted packages.

Everything else is sprint-grade tech debt: a stale `--ink/--paper/--line` alias layer that ~13 component SCSS files still consume; ~50 `::ng-deep` selectors in blog-post (locked to ngx-markdown's component boundary); a never-referenced canonical utility layer in `styles.scss` (~80 lines of dead public API); `lang()` on TranslationService with zero call sites; and a Cal.com directive still themed to the pre-redesign purple. None of those block ship.

**One-word verdict: needs-cleanup.** Two-hour P0 batch, then it's productionable. P1+P2 cleanup is real but can ride one or two follow-up sprints.

---

## 2. Per-layer findings

### Level 1 — ViewEncapsulation strategy

**Status:** Default (Emulated) everywhere. No component uses `ViewEncapsulation.None` (verified: `Grep ViewEncapsulation src` → no matches). No conflicts observed between `styles.scss` globals and per-component scope — selectors are sufficiently namespaced (`.home-*`, `.blog-post__*`, `.faq-list__*`, `.industry__*`, etc).

**`::ng-deep` usages — 40+ in one file:**

- `src/app/pages/blog/blog-post.component.scss:166-629` — every `<markdown>`-rendered tag (p, h2, h3, ul, ol, li, table, code, pre, blockquote, hr, em, strong, a) is restyled via `::ng-deep`. This is the documented workaround for `ngx-markdown`'s `MarkdownComponent` host wrapping, not a misuse. It works, it's stable, and `::ng-deep` deprecation has been "soon™" since Angular 9 with no replacement available for content projection that crosses a third-party component boundary.
- **Recommendation:** Convert `BlogPostComponent` to `encapsulation: ViewEncapsulation.None` and namespace all selectors under `.blog-post__body` (`src/app/pages/blog/blog-post.component.scss`). The file already does this for most selectors (`.blog-post__body ::ng-deep p { … }`), so the move is mechanical: drop `::ng-deep`, rely on the `.blog-post__body` ancestor for scoping. Tradeoff: any selector that escapes `.blog-post__body` leaks globally, so a careful sweep is required before flipping the switch.
- All other components have zero `::ng-deep` — clean.

**Components candidate for `ViewEncapsulation.None`:** only `BlogPostComponent`. The "global utility" classes (`.terminal-window`, `.feature-card`, etc.) in `styles.scss` are not used anywhere in templates (see L3), so there's no scope-vs-global tension to resolve there.

**Action items:**
- `src/app/pages/blog/blog-post.component.ts` → add `encapsulation: ViewEncapsulation.None`, strip 40+ `::ng-deep` keywords, re-verify scope. Estimate 1.5h with testing.

---

### Level 2 — Token system audit

**Token definition file:** `src/styles/tokens.scss` (74 lines).

**Canonical tokens (used everywhere):**
- Surface: `--bg-primary`, `--bg-secondary`, `--bg-card`, `--bg-card-hover`, `--bg-code` — all in active use.
- Text: `--text-primary`, `--text-secondary`, `--text-muted` — heavy use in post-migration files (home, pricing, faq, about, how-it-works, industries-page, contact-form, footer, header, consent-banner).
- Accent: `--accent`, `--accent-hover`, `--accent-glow`, `--accent-subtle`, `--border-accent` — fully adopted.
- Layout: `--container`, `--container-pad`, `--section-gap`, `--radius`, `--radius-lg` — partially adopted (see magic-number findings below).

**Legacy compat aliases (`tokens.scss:46-60`):**
| Alias | Aliased to | Live usages | Status |
|---|---|---|---|
| `--bg` | `--bg-primary` | 0 | **dead** — remove |
| `--bg-soft` | `--bg-secondary` | 6 (live-demo, for-ai-agents, legal) | active |
| `--paper` | `--bg-card` | 12 (live-demo, for-ai-agents, industry-detail, blog-list, blog-post) | active |
| `--ink` | `--text-primary` | ~80 (blog-list, blog-post dominate) | active |
| `--ink2` | `--text-secondary` | ~30 | active |
| `--ink3` | `--text-muted` | ~25 | active |
| `--line` | `--border` | ~25 (blog-list, blog-post, industry-detail, legal, for-ai-agents) | active |
| `--line2` | `--border` | 5 (blog-list, live-demo) | active — but redundant alias of an alias |
| `--accent-soft` | `--accent-subtle` | 0 | **dead** — remove |
| `--font-serif` | `--font-body` | 0 | **dead** — remove |
| `--font-display-italic` | `--font-body` | 0 | **dead** — remove |
| `--font-sans` | `--font-body` | ~10 (blog-list, blog-post) | active |
| `--font-mono` | `--font-display` | ~25 (live-demo, for-ai-agents, blog-list, blog-post, legal, industry-detail) | active |
| `--gradient-mesh-hero` | inline gradient | 1 (`styles.scss:413` `.vc-mesh`) | active but trivial — inlinable |
| `--gradient-cta-glow` | inline gradient | 0 | **dead** — remove (also documented as dead in your context block) |

**Dead aliases to remove now (P2, no codemod needed):** `--bg`, `--accent-soft`, `--font-serif`, `--font-display-italic`, `--gradient-cta-glow`. Delete the lines from `tokens.scss:46,54,55,56,60`.

**Naming inconsistency:** the codebase has **mixed** `--ink*` and `--text-*` schemes coexisting. All migrated components (`home`, `pricing`, `faq`, `about`, `how-it-works`, `industries-page`, `header`, `footer`, `contact-form`, `consent-banner`, `for-ai-agents` partly) use `--text-*`. All untouched-by-redesign components (`blog-list`, `blog-post`, `industry-detail`, `legal`, `not-found`, `live-demo`, parts of `consent-banner`, `contact-form`, `for-ai-agents`) use `--ink*`. This is a snapshot of mid-migration. The right next step is a focused codemod sprint that sed-replaces `--ink` → `--text-primary`, `--ink2` → `--text-secondary`, `--ink3` → `--text-muted`, `--line` → `--border`, `--line2` → `--border`, `--paper` → `--bg-card`, `--bg-soft` → `--bg-secondary`, `--font-sans` → `--font-body`, `--font-mono` → `--font-display`. Word boundaries matter (`--ink` is a prefix of `--ink2`, `--ink3` — order replacements long→short, or use regex `\b--ink\b`).

**Radius scale — magic numbers:**
- `tokens.scss` defines only `--radius: 12px` and `--radius-lg: 20px`.
- Actual values in component SCSS: 1, 3, 4, 5, 6, 8, 10, 12, 14, 16, 100, 999 (pill).
- **Recommendation:** add `--radius-sm: 8px`, `--radius-md: 12px` (already `--radius`), `--radius-lg: 20px` (existing), `--radius-pill: 999px`. Then sweep `border-radius: 999px` → `var(--radius-pill)` (10+ usages), `border-radius: 100px` → `var(--radius-pill)` (2 usages in `styles.scss:78,89`), `border-radius: 8px` → `var(--radius-sm)`, `border-radius: 6px`/`5px`/`4px` → `var(--radius-sm)` if visual delta is acceptable (founder decision). 1–3px values are decorative bars, leave hardcoded.

**Breakpoints — no tokens at all:**
- Defined nowhere (tokens.scss only has implicit `@media (max-width: 860px/540px)` for container padding).
- Hardcoded breakpoints in components: **540, 640, 720, 760, 860, 880**. Six different values for "small/medium" boundaries. `blog-list` and `blog-post` use 720 + 880; `home` uses 540 + 860; `pricing` uses 720 + 760 (sic); `consent-banner` uses 640.
- **Recommendation:** SCSS doesn't trivially share CSS custom properties inside `@media` queries (the queries are parsed pre-eval). Use SCSS variables: introduce `src/styles/_breakpoints.scss` with `$bp-sm: 540px; $bp-md: 720px; $bp-lg: 860px;`, `@use` it in every component scss. Even if you don't unify the inconsistencies, naming them is half the cleanup.

**Spacing scale:** `--section-gap: 80px` (responsive to 56px below 860px) is the only spacing token. Component-level padding/margin use raw pixels everywhere. Padding values seen include 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 48, 56, 64, 80, 96, 120. Most align loosely to a 4px grid, none to an 8px grid. **Not a P0/P1 problem** — Angular's component-scoped SCSS makes spacing local. Don't refactor unless adopting a stricter scale gives visual benefit.

---

### Level 3 — SCSS organization

**Largest files:**
- `src/app/pages/blog/blog-post.component.scss` — 631 lines (40+ `::ng-deep`, editorial markdown styles).
- `src/app/pages/home/home.component.scss` — 655 lines.
- `src/app/pages/blog/blog-list.component.scss` — 454 lines.
- `src/app/pages/how-it-works/how-it-works-page.component.scss` — 356 lines.
- `src/app/pages/pricing/pricing-page.component.scss` — 282 lines.
- All others < 200 lines.

These are within manageable range for Angular component SCSS. Splitting them would require partials (`@use` imports) which complicate the component bundle graph slightly. **Not worth refactoring.**

**Duplicated rules — concrete cases:**

1. **`.tier` shape duplicated** between `home.component.scss:401-485` and `pricing-page.component.scss:29-114`. Same `--featured` modifier, same `__name`/`__price`/`__sub`/`__bullets`/`__badge` BEM children. ~85 lines of copy-paste with slight differences (pricing version adds `.tier--featured .tier__price` color override at L48, otherwise identical).
   - **Fix:** extract to `src/styles/components/_tier.scss`, `@use` from both pages. Defer until alias purge is done so both copies are using the same token vocabulary first.

2. **`.faq` shape duplicated** between `faq-page.component.scss:36-88` (`.faq-list`) and `pricing-page.component.scss:189-237` (`.faq`) and `home.component.scss:488-546` (`.home-faq`). Three slightly different namespaces of the same `details/summary/__i/__q/__a` structure. The global `.faq-item` in `styles.scss:220-257` covers it but **no template uses it.**
   - **Fix:** rename templates to use the global `.faq-item` shape and delete the per-component copies, OR delete the global shape if you prefer per-component variants. Pick one.

3. **`.pillar` shape duplicated** between `home.component.scss:243-283` and `how-it-works-page.component.scss:131-166`. Same `__num/__h/__b`. ~45 lines. Same fix.

4. **`.vc-section-h` global** (`styles.scss:386-394`) is correct and used consistently across home, pricing, faq, how-it-works, industries-page, about, contact-form callsites. Working as intended.

5. **`.home-cta__bg`** is referenced in `home.component.html:210` (`<div class="home-cta__bg" aria-hidden="true"></div>`) but **never defined** in `home.component.scss`. Dead empty div — harmless visually but should be removed for cleanliness.

**Dead-but-still-defined global utilities in `styles.scss` (never referenced in any template):**
- `.badge` (`styles.scss:68-79`)
- `.btn` + `.btn-primary` + `.btn-outline` + `.btn-sm` + `.btn-lg` + `.btn-block` (`styles.scss:81-121`) — all templates use `.vc-btn*` instead
- `.section` + `.section-alt` (`styles.scss:123-131`)
- `.section-header` + `.section-title` + `.section-subtitle` (`styles.scss:133-152`) — pages use `.vc-section-h` + `.vc-section-sub` instead
- `.feature-card` (`styles.scss:154-168`)
- `.step-card` + `.step-number` (`styles.scss:170-196`)
- `.price-card` (`styles.scss:198-218`) — pricing uses `.tier` instead
- `.faq-item` (`styles.scss:220-257`)
- `.terminal-window` (`styles.scss:259-265`)

**This is roughly 200 lines of dead global API surface.** Either delete it (P2, fast) or run a codemod that migrates templates *to* it and drops the parallel `.vc-*` set (P2-P3, slower, semantically cleaner). The pragmatic call: kill the dead globals now (they're untested code paths), run a separate `.vc-* → canonical` rename later as one focused PR.

**Dead Q1-collapse stubs:** none observed at SCSS level. The Q1 cleanup removed `.de/.pl/.ru` translation files and the `:lang` routes; no styles depend on `[lang]` attributes (Grep `\[lang` → 0 matches in scss).

---

### Level 4 — Routes / SSR / build pipeline

**`app.routes.ts` (66 lines):** flat 11-route map post-Q1, every page lazy-loaded. Routes correctly use `loadComponent` (not `loadChildren`) for standalone-component entry points. Wildcard route at the end routes to `NotFoundComponent`. Clean.

**`app.routes.server.ts` (46 lines):** prerender list for 8 static pages + dynamic `industries/:slug` (42 entries) + `blog/:slug` (13 entries) + `legal/:doc` (5 entries) + Server-rendered catch-all. **68 prerendered routes total**, exactly matching build output. Reasonable for current scale; if blog grows to 200+ posts the prerender step lengthens linearly but doesn't break.

**`server.ts` (69 lines):** standard Express + `AngularNodeAppEngine` template. The hardcoded `index: false` and `redirect: false` on `express.static` are correct for SSR + prerendered hybrid. **Could it be simpler?** Yes — if you commit to pure prerender + serverless `/api/contact` (already in `api/contact.ts` as a Vercel Edge function), you can drop the entire Express server. The current `server.ts` is only reachable from `RenderMode.Server` (the `**` route) and the trade-off is "graceful unknown-path handling vs. one fewer runtime artifact." For 11 known routes + a few prerender-failure scenarios, **Server mode catch-all is over-architecture.** Recommend: change `app.routes.server.ts:44` from `RenderMode.Server` to `RenderMode.Prerender` (with explicit `404` route registration via Angular's `**` mapping), drop `server.ts`, drop the Express dependency. Saves ~250kB of server runtime, simpler Vercel config, no functional loss.

**`tools/build-sitemap.ts`:** correct. Reads `ALL_INDUSTRIES` and `BLOG_POSTS` from the same source modules the app uses, emits 68 URLs. No edge cases observed. Lastmod uses `updatedAt ?? publishedAt` for blog — correct.

**`tools/build-blog-index.ts`:** `prebuild` script that scans `src/assets/content/blog/*.mdx` and emits `src/app/lib/blog-manifest.generated.ts`. Output verified: 13 posts. Generated file is checked into git per convention (it's imported at compile-time so it must be). Working.

**`angular.json`:** standard Angular 21 config. `inlineStyleLanguage: scss`, single `styles: ["src/styles.scss"]` entry, server entry wired. Production config has `outputHashing: all`, dev has `optimization: false + sourceMap: true`. Build budgets: initial warning at 650 kB / error 1 MB; component-style warning 100 kB / error 200 kB. **Sensible defaults, no changes needed.**

**Bundle sizes (current build, contradicts task brief's 207kB claim):**
- Initial total: **407.21 kB raw / 114.45 kB gz**, well under the 650 kB warning threshold.
- Largest initial chunk: `chunk-2XN2NB65.js` 245.99 kB raw (Angular framework — irreducible).
- Largest lazy chunk: `chunk-5EZKYVHW.js` 190.28 kB raw `module` (ngx-markdown's marked-runtime is in here — fires only for blog and legal routes).
- **`pricing-page-component` chunk: 53.93 kB raw / 12.58 kB gz** — the task brief's "207kB" figure is stale (predates a previous cleanup pass). The current size is fine; no action needed.
- `home-component`: 30.54 kB. `blog-post-component`: 15.61 kB. All routes under 60 kB lazy.
- Note that `home`, `pricing`, `faq`, `how-it-works` all import the full `HOME` object from `home/home.content.ts` (179 lines, ~14 KB raw). Tree-shaking can't reach inside an `as const` object literal at the property level — every consumer gets the whole shape. With the current sizes this is not a problem; if `HOME` doubles in size, consider splitting (`home.tldr.ts`, `home.faq.ts`, `home.pricing.ts`).

**Prerendering 68 routes:** OK at current scale. If blog or industries grow 5–10x, prerender time becomes the bottleneck of `ng build`. The fix at that point is to move dynamic routes to `RenderMode.Server` with edge caching. **No action now.**

**Google Fonts loading (`index.html:14-22`):** preconnect + preload + stylesheet from `fonts.googleapis.com`. SSR-friendly in that the browser sees them in initial HTML, but:

- **CSP currently blocks it** (see L9 / vercel.json:12). This is the #1 production blocker.
- `display=swap` is set, so FOUT is what users will see (acceptable; FOIT was uglier).
- Self-hosted alternative is already in `package.json`: `@fontsource-variable/geist`, `@fontsource-variable/newsreader`, `@fontsource/geist-mono`, `@fontsource/instrument-serif` — **all four are unused** (Grep `@fontsource` in `src` → 0 matches). These are dependencies left over from a previous typography iteration. Either:
  1. Keep Google Fonts → patch CSP (`vercel.json:12`).
  2. Swap to self-hosted → `npm i @fontsource/dm-sans @fontsource/space-mono`, import in `styles.scss` or `typography.scss`, remove `<link>` tags from `index.html`. Drop the four unused @fontsource packages.
  3. Recommended: option 2. Eliminates a third-party dependency on every page load, removes the CSP carve-out forever, costs ~30–60 minutes.

**Service worker / PWA manifest:** none present (no `ngsw-config.json`, no `manifest.webmanifest`, no `service-worker` registration). For a static-marketing site that prerenders, SW is **not needed and would be over-engineering**. PostHog handles repeat-visit analytics; CDN handles caching. Leave as-is.

**Action items:**
- `vercel.json:48-50` — delete `/` → `/en` redirect (**P0**).
- `vercel.json:12` — patch CSP to allow Google Fonts OR swap to self-hosted (**P0**).
- `src/app/routes.server.ts:44` — consider `RenderMode.Prerender` everywhere + drop `server.ts` (**P3**).

---

### Level 5 — TranslationService cleanup

**Files:** `src/app/i18n/translation.service.ts` (23 lines), `src/app/i18n/i18n.config.ts` (2 lines, only `DEFAULT_LANG = 'en'`), `src/app/i18n/translation.types.ts` (1 line, `TranslationMap = Record<string, string>`), `src/app/i18n/translations.en.ts` (47 lines, ~30 keys).

**Call sites:** 46 `t.t(…)` calls across 10 files (10 in headers/footers, 36 in pages for SEO meta strings). All keys are `nav.*`, `footer.*`, `seo.*` — chrome + meta only. Body content is already inline in templates and `*.content.ts` files.

**`lang()` method (`translation.service.ts:15-17`):** zero call sites (Grep `\.lang\(\)` → no matches). Truly vestigial. Delete it now.

**Should the service be inlined and deleted entirely?** The 46 call sites are spread across two layout components (header, footer) and 8 pages. Inlining strings is a straightforward edit, but the wrapper offers two things:
1. A single source of truth for nav labels and SEO meta (no scattered duplicates).
2. A re-entry point if multilingual ever returns (the founder explicitly stated "EN-only" in Q1 — needs confirmation if that's permanent or pending market expansion).

If multilingual is **permanently** dead, inline everything and delete the service + types + config (saves ~3 KB raw). If it's **deferred not deleted**, keep the wrapper (zero runtime overhead, one indirection). **This is a founder call**, not an architectural one. Flag in open questions.

**Dead i18n keys:** all 30 keys in `translations.en.ts` are referenced at least once (Grep verified across templates + components). No dead keys.

**Action items:**
- `src/app/i18n/translation.service.ts:15-17` — delete `lang()` method (P2, 5 minutes).
- Hold inline-and-delete decision pending founder confirmation on multilingual reversibility (open question).

---

### Level 6 — SEO / Schema architecture

**SeoService (`src/app/core/seo/seo.service.ts`, 75 lines):** correct shape. `apply()` sets title, description, OG, Twitter, canonical for every route. Article type adds published/modified/author meta. Hardcoded `og:locale: en_US` — fine post-Q1. `canonicalUrl()` correctly strips trailing slash for root. **No bugs.**

**JsonLdService (`src/app/core/seo/json-ld.service.ts`, 27 lines):** appends `<script type="application/ld+json" id="ld-{name}">` to head, idempotent via element removal. Clean.

**Schemas (`src/app/core/seo/schemas.ts`, 191 lines):**
- `organizationLd()` — has `@id = ${SITE_URL}/#organization`, references `webappski.com/#organization` as parent, links founder to `PERSON_ID`. Correct.
- `PERSON_ALEX_ISA` — has `@id = ${SITE_URL}/about#alex-isa`, `worksFor` references `ORG_ID`. Correct.
- `softwareApplicationLd()` — has `@id`, references `ORG_ID` as publisher, includes two `offers`. Correct.
- `websiteLd()` — has SearchAction. Correct. (No `@id` though — not strictly required for WebSite type but inconsistent with the rest.)
- `breadcrumbLd()` — generic, correct.
- `faqLd()` — generic, correct.
- `articleLd()` — calculates wordCount from body if provided; uses `PERSON_ALEX_ISA` as author (consistent across all blog posts since there's one author). **wordCount calc is body-dependent** — if a blog post sets `body: ''` or omits it, wordCount silently drops. Currently every BLOG_POSTS entry has a non-empty body (build-blog-index.ts pulls from MDX file content), so safe.
- `aboutPageLd()` — embeds `PERSON_ALEX_ISA` as `mainEntity`. Correct.
- `productLd()` — has `@id = ${SITE_URL}/#product`. **No `brand.@id`** — links by name only. Minor inconsistency; Google's structured data tester won't flag it, but tying brand to `ORG_ID` would be cleaner.

**Schema usage map:**
| Page | Schemas emitted |
|---|---|
| / (home) | org, website, app, faq |
| /pricing | product, faq |
| /faq | faq |
| /about | about (which embeds person) |
| /how-it-works | none |
| /industries | breadcrumb |
| /industries/:slug | industry (Service) + breadcrumb + industry-faq (optional) |
| /for-ai-agents | organization, software, breadcrumb |
| /blog | none |
| /blog/:slug | article + breadcrumb + article-faq (optional) |
| /legal/:doc | breadcrumb |

**Issues:**
1. **No Organization schema on most pages.** Best practice is to emit Organization once per page (it's small) so any landing surface tells crawlers about the company. Currently only home + for-ai-agents emit it. Low-cost fix: add `this.jsonLd.set('org', organizationLd())` to every page's ngOnInit.
2. **Article links to publisher by inline name only**, not by `@id` (`schemas.ts:146`). Should be `publisher: { '@id': ORG_ID }`.
3. **`/how-it-works` has no schema at all.** A `HowTo` schema or just an inherited Organization would help.
4. **`/blog` list page has no schema** — should emit at minimum Organization + Breadcrumb + a `Blog` schema (`'@type': 'Blog'`).

**Action items:**
- `schemas.ts:146` — change publisher to `{ '@id': ORG_ID }` (P2, 30s).
- Add Organization schema emission to every page (P2, 30min).
- Add Blog schema to `/blog` list (P2, 15min).
- Add `@id` to `websiteLd()` for consistency (P3, 30s).

---

### Level 7 — Accessibility (a11y)

**Skip link (`app.html:1`, `styles.scss:11-29`):** present and styled correctly. `:focus-visible` reveals it via top: 0. Working.

**Focus-visible (`styles.scss:32-36`):** global 2px accent outline with 2px offset and 4px border-radius. Defensible.

**ARIA on `<details>` FAQ:** the `<details>/<summary>` pair is the correct accessible primitive — native screen-reader behavior is correct without ARIA. The `summary` elements have `cursor: pointer` and `list-style: none`, with `::-webkit-details-marker { display: none }` to remove the disclosure triangle (replaced with a custom `+/−` or chevron). **All FAQ pages handle this correctly.**

**Mobile menu (`header.component.html:25-40`):** uses `[attr.aria-expanded]` on the burger toggle, `aria-label="Toggle menu"`. The menu itself uses an `@if` conditional, so it's actually removed from the DOM when closed (not just hidden). Screen readers get a clean state. **One miss:** no `aria-controls` on the burger pointing to the menu element ID. Add `aria-controls="mobile-nav"` and `id="mobile-nav"` on the `.vc-mobile-menu` div (P2, 1 min).

**Consent banner (`consent-banner.component.ts:11`):** has `role="dialog"`, `aria-labelledby="consent-h"`, `aria-describedby="consent-d"`. **Missing `aria-modal="true"`** — a screen reader treating this as a modal needs it to know it should trap focus. Add (P2, 30s). Also no focus trap implementation, so keyboard users can tab out of the dialog to underlying page elements. **Accessibility regression vs the dialog role.** P1 fix: either add focus trap behavior or downgrade role to `region`.

**Heading hierarchy:** verified via `Grep <h1>` — every route has exactly one `<h1>`. No h2-skipping observed in spot checks of home, about, pricing, faq, blog-post.

**Color contrast (dark theme):**
- `--text-primary: #F0F0F5` on `--bg-primary: #282838` — contrast ratio ~13.1:1, passes AAA.
- `--text-secondary: #A3A3B8` on `--bg-primary: #282838` — contrast ratio ~6.5:1, passes AA for normal text (≥4.5) but **not AAA for normal text** (needs ≥7).
- `--text-muted: #7C7C92` on `--bg-primary: #282838` — contrast ratio ~3.7:1. **Fails AA for normal text (4.5).** Passes only for large text (≥3.0). This is concerning since `--text-muted` is used for body-adjacent metadata (`.home-stat__l`, `.home-hero__trust`, dates in blog cards, etc.) — much of it small text.
  - **Recommendation:** lighten `--text-muted` to ~#9494A8 (gets to ~4.6:1). Verify against the design intent before changing.
- `--accent: #FF6B2B` on `--bg-primary: #282838` — contrast ratio ~5.2:1, passes AA for normal text. OK.
- `#fff` text on `--accent: #FF6B2B` (`.vc-btn-primary`, `.btn-primary`) — contrast ratio ~3.3:1, passes only for large text (button labels at 13–15px are borderline; AA requires 4.5 for normal). **Concerning** — button text on the primary CTA is just barely passing if you treat 15px@600 as "large." Consider darkening accent to ~#E85A1F to get ~4.7:1, or change button text to a near-black for primary buttons.

**Reduced motion:**
- Global rule in `reset.scss:36-43` zeros out all animations/transitions/scroll-behavior. Good blanket coverage.
- Per-component: `live-demo.component.scss:202` opts the typing animation out. Correct.
- `blog-post.component.scss:621` and `blog-list.component.scss:451` — verified they exist (no body shown, but presence is the signal).
- **Header backdrop-filter** is **not** reduced under `prefers-reduced-motion` — but backdrop-filter is a visual effect, not motion, so this is correct (a11y guidance covers motion, not blur/transparency).
- **Reading-progress bar** in `blog-post.component.scss:25` has `transition: width 60ms linear` — this is motion. Add `@media (prefers-reduced-motion: reduce) { .blog-progress { transition: none; } }` (already implicitly covered by the global reset.scss rule that zeroes all transitions, but verify after `ViewEncapsulation` decisions).

**Action items:**
- `consent-banner.component.ts:11` — add `aria-modal="true"`, add focus trap behavior (**P1**).
- `header.component.html` — add `aria-controls`/`id` linking burger to mobile menu (P2).
- `tokens.scss:15` — verify `--text-muted` contrast on small text; lighten if needed (P2).
- Verify primary button text contrast (P2).

---

### Level 8 — Performance

**Header backdrop-filter (`header.component.scss:11-12`):** `blur(16px) saturate(140%)`. Repaint cost on mobile Safari and older Android is real — the entire header (full viewport width × 64px) repaints on every scroll because the layer behind it changes. Mitigations available:
- `will-change: backdrop-filter` (one paint upfront, then reused) — but this allocates a GPU layer permanently, memory cost.
- Lower the blur radius (16px → 8px) — visually similar at this size, halves the compute.
- Drop the blur and use a flat `rgba(40,40,56,0.92)` solid — best performance, slight visual delta.
- **Verdict:** the current effect is tasteful; on M1/M2 Macs and modern Android (Pixel 6+, recent iPhones) it's invisible. On a 2020-era Android budget phone, it'll be janky. **Not a P1 unless analytics later show scroll-jank on mobile.**

**Hero `.vc-mesh` (`styles.scss:412-415`):** a CSS gradient (two radial-gradients composited) under a mask-image. Compositor-only — no paint cost beyond initial layer creation. **OK.** Mask-image is a per-frame paint on layout change but the layer is full-bleed and rarely re-laid-out. Fine.

**Hero `.home-hero__right { min-height: 560px }` (task brief mentions it was removed):** verified — current `home.component.scss:51-56` has no `min-height` on `__right`, just `position: relative; display: flex; align-items: center`. Removal confirmed; live-demo widget naturally sizes itself. **Done.**

**Reading progress bar (`blog-post.component.ts:124-133`):** subscribes to `fromEvent(window, 'scroll', { passive: true })` with no throttle/debounce/rAF coalescing. Every scroll event computes `docH - innerHeight` and writes a signal. On a fast scroll, this fires ~60+ times/second.
- `{ passive: true }` is correctly set (scroll handlers never block).
- Signal writes do trigger CD on the binding host (the `<div class="blog-progress" [style.--read-progress.%]="progress()">`). With OnPush + signals, CD is local — Angular only re-evaluates the one binding. So per-frame cost is one DOM property write.
- **Practically: not a P0/P1.** Could be optimized to once-per-rAF for cleanliness (P3).
- The CSS transition `width 60ms linear` smooths visual updates anyway, so coalescing wouldn't change perceived smoothness.

**Live-demo widget (`live-demo.component.ts` + `.scss`):** uses `setTimeout` chains in a `tick()` method, signals for state. SSR-aware (`isPlatformBrowser` check at `ts:106` shortcircuits to "done" state for prerender). Animations:
- `ld-caret` (caret blink) — `opacity` only, GPU-friendly, 0.9s cycle.
- `ld-pulse` (extracted-card pulse) — `box-shadow` only, 1.6s cycle. **Box-shadow animation is paint-bound, not composited.** On older devices this is the most expensive animation in the file.
- `opacity` transitions on `.is-active` extract/api cards — composited, cheap.
- All animations opt out under `prefers-reduced-motion: reduce` at `live-demo.component.scss:202`.
- The `setTimeout` chain keeps a running timer indefinitely on browser tab — when the tab is backgrounded, the chain throttles but doesn't pause. Consider using `requestAnimationFrame` for the typing phase + `IntersectionObserver` to pause when widget is offscreen (P3).

**HOME content imported by 4 components:** see L4 — current build shows no real cost.

**Action items:**
- `blog-post.component.ts:128` — wrap scroll handler in rAF coalesce (P3).
- `live-demo.component.scss:127-134` — consider replacing `box-shadow` pulse with `transform: scale()` glow ring (P3).
- Add `IntersectionObserver` pause to live-demo (P3).

---

### Level 9 — Dead code sweep

**Confirmed dead code (delete now, low risk):**

1. **`src/app/models/landing.models.ts`** (35 lines, defines `Faq`, `Feature`, `Phase`, `PricingTier`, `Stat`, `Theme`) — **zero imports** anywhere (Grep `from .*landing.models` → 0 matches). All content uses inline `as const` types in `*.content.ts`. **Delete the file.**

2. **`translation.service.ts:15-17` — `lang()` method**: zero call sites.

3. **`tokens.scss:46,54,55,56,60` — `--bg`, `--accent-soft`, `--font-serif`, `--font-display-italic`, `--gradient-cta-glow`**: zero references each.

4. **`home.component.html:210` — `<div class="home-cta__bg">`**: no matching CSS rule.

5. **`@fontsource/*` packages in `package.json:29-32`**: `@fontsource-variable/geist`, `@fontsource-variable/newsreader`, `@fontsource/geist-mono`, `@fontsource/instrument-serif` — zero imports in `src` (verified). Remove from `package.json` → `npm install` → about 4–5 MB of node_modules disappears. Either now (saves install time + bundle visibility), or replace by importing DM Sans/Space Mono to fix the CSP issue (Option 2 of L4).

6. **`styles.scss:68-265`** — the entire "canonical utility" block (`.badge`, `.btn`, `.btn-primary`, `.btn-outline`, `.btn-sm`, `.btn-lg`, `.btn-block`, `.section`, `.section-alt`, `.section-header`, `.section-title`, `.section-subtitle`, `.feature-card`, `.step-card`, `.step-number`, `.price-card`, `.faq-item`, `.terminal-window`) — **zero template references.** ~200 lines. Either delete (recommended) or run the rename codemod that migrates templates *to* these classes. Pick one. Doing nothing leaves a confusing parallel namespace forever.

**Probably-orphan after further audit (verify before deleting):**

- `src/app/i18n/translation.types.ts` (1-line `TranslationMap = Record<string,string>`) — used only by `translations.en.ts` and `translation.service.ts`. If you keep the service, keep the type. Trivial.

- `IndustryContent.exampleConversations` (`src/app/lib/types.ts:24`) optional field — used by industry-detail-page. Active.

- `IndustryContent.jsonLd` (`src/app/lib/types.ts:29`) optional field — used by industry-detail-page (fallback to inline `buildServiceLd` if absent). Active.

- `BlogPost.faqs` (`src/app/lib/types.ts:47`) optional field — used by blog-post for the `article-faq` JSON-LD. Active.

**Action items:**
- Delete `landing.models.ts` (P2, 1 min).
- Delete `--bg`, `--accent-soft`, `--font-serif`, `--font-display-italic`, `--gradient-cta-glow` aliases (P2, 1 min).
- Delete unused `@fontsource/*` deps or repurpose for self-hosted fonts (P0 or P2 depending on Google-Fonts fix path).
- Delete dead utility block in `styles.scss` (P2, 1 min) OR migrate templates to it (P3, 2–3h).
- Remove dead `.home-cta__bg` div (P2, 30s).

---

### Level 10 — Class-hook migration (.vc-* → canonical)

**Current state:** the `.vc-*` set is the de facto live namespace. Templates use:
- `.vc-btn` + `.vc-btn-primary` + `.vc-btn-accent` + `.vc-btn-ghost` + `.vc-btn-lg` + `.vc-btn-block` — across 11 files (header, footer, home, pricing, how-it-works, industry-detail, not-found, consent-banner, contact-form, faq, for-ai-agents).
- `.vc-wrap` (container), `.vc-mesh` (hero gradient bg), `.vc-grain` (display: none, kept as safety), `.vc-section-h` + `.vc-section-sub`, `.vc-kicker` + `.vc-kicker-bar`, `.vc-eyebrow` + `.vc-dot`, `.vc-h1-grad` + `.vc-h1-em`, `.vc-accent-magenta`, `.vc-logo` + `.vc-logo-mark` + `.vc-logo-text`, `.vc-pill`, `.vc-nav` + `.vc-nav-inner` + `.vc-nav-links` + `.vc-nav-cta` + `.vc-burger` + `.vc-mobile-menu`, `.vc-footer*`.

**Counts:** 221 `vc-*` occurrences across 21 files (Grep `vc-` count: 221).

**Templates still on `.vc-btn-primary` (the largest target):** 11 files, ~14 element occurrences. Mechanical sed: `s/\bvc-btn-primary\b/btn-primary/g; s/\bvc-btn-accent\b/btn-primary/g; s/\bvc-btn-ghost\b/btn-outline/g; s/\bvc-btn-lg\b/btn-lg/g; s/\bvc-btn-block\b/btn-block/g; s/\bvc-btn\b/btn/g`. The accent class would lose its distinct shadow (it's identical to primary in current `styles.scss`, so no visual delta). The ghost class maps onto outline. Run, build, visually spot-check the home + pricing + header.

**Classes that should stay `.vc-*` as distinguishing:**
- `.vc-mesh` — it's a specific TF hero gradient bg, not a "utility." Keep namespaced.
- `.vc-grain` — display:none safety, keep.
- `.vc-h1-grad` + `.vc-h1-em` — specific to one hero layout, keep namespaced.
- `.vc-accent-magenta` — semantic modifier, but only one use (`how-it-works:47`). Could rename to `.kicker--alt` if you want.

**Classes that should rename to a clean global semantic:**
- `.vc-btn*` → `.btn*` (recommended now, mechanical).
- `.vc-eyebrow` → `.eyebrow` or `.pill`.
- `.vc-kicker` + `.vc-kicker-bar` → `.kicker` + `.kicker__bar` (proper BEM).
- `.vc-section-h` → `.section-header`, `.vc-section-sub` → `.section-subtitle` (matches the dead canonical utility names — completes the migration in one move).
- `.vc-wrap` → `.container` (already aliased in `styles.scss:41`, can drop `.vc-wrap` after rename).
- `.vc-pill` → `.link-pill` or merge into `.btn-ghost-sm`.

**Header/footer have their own `.vc-nav*` / `.vc-footer*` set** — these are component-scoped pseudo-globals (defined in `header.component.scss` / `footer.component.scss`). Not part of the canonical utility migration; rename if you want, but lower priority.

**Recommended sequence:**
1. **Sprint 1 (P1):** sed-batch `.vc-btn*` → `.btn*` across 11 templates. Delete the duplicate `.vc-btn*` definitions in `styles.scss:273-330`. Test home, pricing, contact-form, consent-banner, header.
2. **Sprint 2 (P2):** sed-batch `.vc-eyebrow` → `.pill`, `.vc-kicker` → `.kicker`, `.vc-section-h` → `.section-header`, `.vc-wrap` → `.container`. Delete legacy. Now the dead canonical utility block in `styles.scss` becomes the live API.
3. **Sprint 3 (P3):** `--ink/--paper/--line` → `--text-*/--bg-card/--border` across 13 component SCSS files. ~150 occurrences. Last alias purge. Drop alias block from `tokens.scss`.

**Don't do sprints 1+2+3 in one PR** — each is 1–2h, but combining them makes review impossible. Land one, sanity-check production, land next.

---

## 3. Prioritized action list

### P0 — must fix before production deploy (blockers, security, broken state)

| # | What | File:line | Effort |
|---|---|---|---|
| P0.1 | Delete the `/` → `/en` redirect | `vercel.json:48-50` | 1 min |
| P0.2 | Patch CSP to allow Google Fonts, OR self-host via @fontsource | `vercel.json:12` (+ swap in `index.html:14-22` + `styles/typography.scss`) | 30–60 min |
| P0.3 | Verify production deploy of fixes via curl on canonical + small subset of font URLs | n/a | 15 min |

**P0 total: ~1–2 hours.**

### P1 — should fix this sprint (heavy tech debt, perf, a11y regressions)

| # | What | File:line | Effort |
|---|---|---|---|
| P1.1 | Consent banner: add `aria-modal="true"` + focus trap, or downgrade `role="dialog"` | `consent-banner.component.ts:11` | 1–2h |
| P1.2 | Cal.com directive: replace `theme: 'light'`, brand color `#5b53ff` → `#FF6B2B`, theme dark | `cal-com.directive.ts:21-22` | 5 min |
| P1.3 | `.vc-btn*` → `.btn*` rename (sed across 11 templates) + drop duplicate definitions in styles.scss | 11 template files + `styles.scss:273-330` | 1–2h |
| P1.4 | Add Organization JSON-LD to every page (currently only home + for-ai-agents emit it) | 6 page ngOnInit blocks | 30 min |
| P1.5 | Article publisher → `{ '@id': ORG_ID }` | `schemas.ts:146` | 30 sec |
| P1.6 | BlogPostComponent → `ViewEncapsulation.None`, strip 40+ `::ng-deep` | `blog-post.component.ts` + `.scss` | 1.5h |
| P1.7 | Verify `--text-muted` contrast against `--bg-primary` for small text; lighten if needed | `tokens.scss:15` | 30 min |
| P1.8 | Verify primary button label contrast; possibly darken `--accent` or lighten button text | `tokens.scss:18`, `styles.scss:96` | 30 min |

**P1 total: ~6–10 hours.**

### P2 — next sprint (cleanup, dead code, naming consistency)

| # | What | File:line | Effort |
|---|---|---|---|
| P2.1 | Delete `lang()` method from TranslationService | `translation.service.ts:15-17` | 5 min |
| P2.2 | Delete dead token aliases (`--bg`, `--accent-soft`, `--font-serif`, `--font-display-italic`, `--gradient-cta-glow`) | `tokens.scss:46,54,55,56,60` | 5 min |
| P2.3 | Delete `landing.models.ts` (orphan) | `src/app/models/landing.models.ts` | 1 min |
| P2.4 | Delete dead canonical utility block (`.btn`, `.feature-card`, `.step-card`, `.price-card`, `.faq-item`, `.terminal-window`, `.badge`, `.section-*`) OR run rename codemod | `styles.scss:68-265` | 1h (delete) / 4h (codemod) |
| P2.5 | Delete `.home-cta__bg` empty div | `home.component.html:210` | 30 sec |
| P2.6 | Delete unused @fontsource packages (if not used for P0.2) | `package.json:29-32` | 5 min |
| P2.7 | `--ink/--paper/--line/--font-mono/--font-sans` → canonical token sweep across 13 component SCSS files | ~150 occurrences | 2–3h |
| P2.8 | Continue `.vc-* → canonical` rename: `vc-eyebrow`, `vc-kicker`, `vc-section-h`, `vc-wrap` | All templates + `styles.scss` | 2h |
| P2.9 | Extract `.tier` / `.pillar` / `.faq-list` shared shapes to global SCSS partials | `home.component.scss` + `pricing-page.component.scss` + `how-it-works-page.component.scss` + `faq-page.component.scss` | 1.5h |
| P2.10 | Add `--radius-sm/-pill` to tokens, sweep radius magic numbers | `tokens.scss` + ~20 occurrences | 1h |
| P2.11 | Add SCSS breakpoint partial, sweep `@media (max-width:540/640/720/760/860/880)` | `src/styles/_breakpoints.scss` + ~25 occurrences | 1.5h |
| P2.12 | Header `aria-controls`/`id` on burger ↔ mobile menu | `header.component.html:25` | 1 min |
| P2.13 | Add `aboutPageLd`/`blogLd`/`@id` for websiteLd | `schemas.ts` + various pages | 1h |
| P2.14 | Inline TranslationService strings & delete service (if multilingual permanently deprecated — needs founder decision) | 10 files | 1–2h |

**P2 total: ~12–20 hours.**

### P3 — nice to have (refactoring, opt)

| # | What | File:line | Effort |
|---|---|---|---|
| P3.1 | Drop `server.ts` + Express, switch all routes to `RenderMode.Prerender` + serverless for /api/contact | `server.ts` + `app.routes.server.ts` | 2h |
| P3.2 | rAF-coalesce blog scroll progress | `blog-post.component.ts:124-133` | 30 min |
| P3.3 | Live-demo: IntersectionObserver pause + `transform: scale()` pulse instead of `box-shadow` | `live-demo.component.ts` + `.scss` | 1.5h |
| P3.4 | Backdrop-filter perf: profile on mid-tier Android, decide whether to drop blur | `header.component.scss:11-12` | 1h |
| P3.5 | Tighten `IndustryContent`/`BlogPost` types (remove optional fields no real industry leaves blank) | `src/app/lib/types.ts` | 1h |
| P3.6 | Migrate ngx-markdown → static-time MD→HTML (drop runtime marked + markdown component, ~190 kB lazy chunk) | `app.config.ts` + `tools/build-blog-index.ts` | 4h |
| P3.7 | Split HOME content if it doubles in size | `home.content.ts` | n/a until needed |

**P3 total: ~8–15 hours.**

---

## 4. Estimated dev-effort per priority tier

| Tier | Range | Confident midpoint |
|---|---|---|
| P0 | 1–2 h | **1.5 h** |
| P1 | 6–10 h | **8 h** |
| P2 | 12–20 h | **16 h** |
| P3 | 8–15 h | **11 h** |
| **Total** | **27–47 h** | **~37 h** |

These are conservative "founder-coding-with-AI-pair" estimates. A senior FE pulling solo from a quiet day could clear P0+P1 in a single 8-hour session and P2 over a focused weekend.

---

## 5. Recommended migration roadmap (legacy aliases / .vc-* classes)

**Do now (this week, before next deploy):**
1. P0 batch (vercel.json fixes). One hour.
2. P1.2 (Cal.com colors) and P1.5 (article publisher @id). Five minutes total, no risk.

**Do next sprint (single focused PR each, in this order):**
3. **PR #1: `.vc-btn* → .btn*` rename.** Mechanical sed across 11 templates, drop ~50 lines of duplicate definitions in `styles.scss`. Easy revert, small diff. **Validates the rename methodology.**
4. **PR #2: a11y batch.** Consent banner aria-modal + focus trap (P1.1), header aria-controls (P2.12), text-muted contrast bump (P1.7). Bundles a11y review into one PR.
5. **PR #3: dead code purge.** Delete `landing.models.ts`, dead tokens, `lang()` method, `.home-cta__bg` div, unused @fontsource (if not used for P0.2). All deletions, no behavior change. **Zero-risk shrink.**
6. **PR #4: ViewEncapsulation.None on BlogPostComponent.** Self-contained, big simplification, needs careful visual review.

**Defer to a focused refactor sprint (not next sprint, the one after):**
7. **PR #5: `--ink/--paper/--line` purge.** ~150 occurrences across 13 files. Needs a codemod or careful sed with word boundaries. Should be done **after** PR #1–4 so the diff doesn't tangle with template changes.
8. **PR #6: Remaining `.vc-* → canonical` renames** (eyebrow, kicker, section-h, wrap).
9. **PR #7: SCSS organization** (extract `.tier`/`.pillar` shared, breakpoint partial, radius tokens).

**Don't do (unless explicitly worth it):**
- Drop `server.ts` (P3.1) — until you confirm Vercel hosts the Edge function without it. Currently working; "if it ain't broke."
- Split `HOME` content — no measurable cost today.
- Migrate ngx-markdown to static — 4h refactor for ~190 kB lazy-chunk savings on a content route that's already prerendered. Bad ROI.

**Don't do at all:**
- Add Service Worker / PWA manifest. Marketing site, statically rendered, CDN-cached. SW adds complexity with no user-facing win.
- Add a CSS-in-JS layer. The token system + scoped SCSS is already strictly better at this scale.

---

## 6. Open architectural questions

These need a founder decision before deciding P-tier:

1. **Is multilingual permanently dead?** If yes → inline strings, delete TranslationService entirely, drop `i18n.config.ts` + `translation.types.ts` (P2.14, ~2h). If deferred → keep service as a forward-compatible seam. Currently `TranslationService` exists with zero benefit but its removal makes return harder.

2. **Google Fonts vs self-hosted DM Sans / Space Mono?** Both ship; choose for P0.2. Self-hosted is technically better (no third-party dependency, simpler CSP, faster on cold-cache visitors), but adds ~30 KB to the initial bundle if not lazy-loaded.

3. **Keep the dead "canonical utility" block in `styles.scss` or run the rename codemod?** Right answer is rename (PR #1+#6). But if multilingual returns this year and the codebase has to host translation files again, the entire styling layer becomes a lower priority and you may want to lock it. Founder call.

4. **`role="dialog"` on consent banner with no focus trap — accept the a11y regression as known limitation, or fix properly?** Fixing properly means importing or writing a focus trap implementation (~50 lines). Downgrading to `role="region"` keeps a11y baseline but breaks the modal expectation.

5. **`--text-muted` contrast.** Lighten to ~#9494A8 to pass AA on small text, or keep as deliberate visual hierarchy and accept that any text using `--text-muted` must be ≥18px? The codebase currently uses `--text-muted` on 12px–14px text in multiple places. The cleanest fix is brand decision: lighten the token.

6. **Cal.com light theme on a dark site.** The directive forces `theme: 'light'` which means the booking modal will jarringly switch palettes. Is this intentional or a leftover? Should be `theme: 'dark'`.

7. **Will the production deploy use the Express server (`server.ts`) or Vercel Static + Edge?** This determines whether server-rendered fallback for unknown routes is actually reachable. If pure-static, drop `server.ts`. If hybrid, keep it.

---

## Appendix A — Concrete file/line references map

For quick founder navigation:

```
P0 blockers:
  vercel.json:48-50        ← /en redirect (delete)
  vercel.json:12           ← CSP (patch)
  src/index.html:14-22     ← font tags (replace OR keep with CSP patch)

P1 high-value:
  src/app/core/consent/consent-banner.component.ts:11   ← aria-modal + focus trap
  src/app/core/integrations/cal-com.directive.ts:21-22  ← dark theme + tangerine
  src/app/core/seo/schemas.ts:146                       ← publisher @id
  src/app/pages/blog/blog-post.component.ts             ← ViewEncapsulation.None
  src/styles/tokens.scss:15                             ← --text-muted contrast

P2 cleanup:
  src/app/models/landing.models.ts                  ← delete file
  src/app/i18n/translation.service.ts:15-17         ← delete lang()
  src/styles/tokens.scss:46,54,55,56,60             ← delete dead aliases
  src/styles.scss:68-265                            ← delete dead utilities (or migrate to)
  src/styles.scss:273-330                           ← delete after .vc-btn* rename
  src/app/pages/home/home.component.html:210        ← delete dead div
  package.json:29-32                                ← delete unused @fontsource
  src/app/components/header/header.component.html:25 ← aria-controls

Per-component SCSS legacy alias hotspots (P2 alias sweep targets):
  src/app/widgets/live-demo/live-demo.component.scss             ← --paper, --line, --ink*, --font-mono
  src/app/pages/blog/blog-list.component.scss                    ← --ink*, --paper, --line, --line2, --font-mono, --font-sans (heavy)
  src/app/pages/blog/blog-post.component.scss                    ← --ink*, --paper, --line, --font-mono, --font-sans (heavy)
  src/app/pages/industries/industry-detail-page.component.scss   ← --ink*, --paper, --line, --bg-soft, --font-mono
  src/app/pages/legal/legal-page.component.scss                  ← --ink*, --line, --bg-soft, --font-mono
  src/app/pages/for-ai-agents/for-ai-agents.component.scss       ← --ink*, --paper, --line, --bg-soft, --font-mono
  src/app/pages/not-found/not-found.component.scss               ← --ink*
  src/app/core/consent/consent-banner.component.scss             ← --ink*
  src/app/shared/contact-form/contact-form.component.scss        ← --ink2
```

## Appendix B — What's working well (don't change)

Tokens of architectural quality observed during the audit, recorded so future regressions can be caught:

- **Standalone components, every component** — clean import lists, no NgModule leakage.
- **ChangeDetectionStrategy.OnPush, every component** — verified across 14 component definitions.
- **Signals + computed across services** (consent, posthog, headers) — modern reactive style.
- **`@if`/`@for` control-flow syntax** — no `*ngIf`/`*ngFor` remains. Angular 21 idiomatic.
- **Lazy routes with `loadComponent`** — no eager bundle bloat.
- **Prerender + selective Server render** — correct hybrid strategy for content-heavy marketing.
- **SSR-aware platform guards** in `PostHogService`, `LiveDemoComponent`, `ConsentService` — every browser-only API gated by `isPlatformBrowser`.
- **TypeScript strict mode** (`tsconfig.app.json` inherited) — observed via correct readonly/inject patterns.
- **JSON-LD `@id` linking** — Person/Organization/Software cross-referenced correctly.
- **Centralized `IconComponent` (`src/app/shared/icon/icon.component.ts`)** — small icon vocabulary, no per-page SVG repetition.
- **Generated blog manifest checked in (`blog-manifest.generated.ts`)** — correct pattern for build-time-derived data; alternative (runtime fetch) would block SSR.
- **`color-scheme: dark` declared at `:root` (`tokens.scss:62`)** — UA-native dark mode for scrollbars/form controls.
- **Test infra installed** (`tsx --test`, `*.spec.ts` files for slugify and pad-number) — even if coverage is light, the harness exists.

These are not "fixed" — they are baseline good practice the team should be proud of.
