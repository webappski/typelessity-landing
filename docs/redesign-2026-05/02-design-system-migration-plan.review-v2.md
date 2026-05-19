# Senior Review v2 — `02-design-system-migration-plan.md`

**Reviewer:** Independent senior designer / DS engineer (round 2, no contact with author)
**Date:** 2026-05-19
**Plan file:** `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/02-design-system-migration-plan.md` (1819 lines, v2)
**Round-1 review:** `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/02-design-system-migration-plan.review.md`
**Reference (TF):** `/Users/dmitry-isaevski/Projects/typelessform`
**Target:** `/Users/dmitry-isaevski/Projects/typelessity-landing`

---

## 1. Verdict

**SHIP — with one minor polish.**

All four critical fixes flagged in round-1 are genuinely closed against the primary source — verified by re-reading the cited TF files (`public/fonts/fonts.css`, `app.scss`, `cookie-consent.component.ts`) and the target consent banner (`core/consent/consent-banner.component.ts`). 16 supporting fixes are present with concrete content (not just placeholders). The 4 "NOT applied" items have legitimate, defensible rationales — none of them is a coward's dodge. The estimate has been honestly revised from 5–6 to 8.5–9 dev-days.

The one polish item is **not** blocking: §5.1 still shows the **bare** `--font-body: 'DM Sans', sans-serif` example, while §5.4 step 6 introduces the **system-fallback stack** that "supersedes" the bare stack. An implementer copy-pasting §5.1 in isolation will ship the wrong stack and break the FOUC-mitigation. Fix at PR time, not at planning gate.

The plan is **ready to drive implementation on `feat/tf-redesign`**.

---

## 2. Critical fix verification (4/4 closed)

| Critical gap from round-1 | Plan §           | Closed?   | Evidence (line-level pointer)                                          |
|---|---|---|---|
| **Cyrillic strategy**     | §2.2, §5.4-A, P0-1 | ✅ closed | §2.2 lines 101-115 documents blackout (verified via `grep -c "cyrillic\|U+04" typelessform/public/fonts/fonts.css` → 0). §5.4-A lines 797-841 specifies Option A: Inter cyrillic + cyrillic-ext (8 files) + JetBrains Mono cyrillic + cyrillic-ext (4 files), source URL `gwfh.mranftl.com`, concrete `unicode-range: U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116` for cyrillic and `U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F` for cyrillic-ext. Mounted under same `font-family: 'DM Sans'` so the browser swaps glyph-by-glyph inside one paragraph — standard subset technique, identical to Google Fonts' own approach. P0-1 hoists this to the very first foundation task. |
| **SSR / FOUC hardening**  | §5.4              | ✅ closed | §5.4 step 1 (line 759) → **absolute** `/fonts/fonts.css` (not `fonts/fonts.css`), with rationale about Angular SSR nested-route 404 risk. Step 5 (line 769) preload reclassified as **MANDATORY**. Step 6 (lines 779-786) system-font fallback stack: `'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` + matching mono stack. Step 9 (lines 789-795) curl verification on `/`, `/ru`, `/ru/blog` with grep assertions. `font-display: swap` confirmed kept (step 7). |
| **Branch-based rollout**  | §7.0              | ✅ closed | §7.0 lines 1451-1464 lays out: long-lived `feat/tf-redesign` off `main`; `main` frozen on cream theme throughout P0-P5; preview deploy per phase (Vercel/Firebase/Cloudflare); founder + senior reviewer approve on preview URL; **single squash-merge** to `main` only after P5; documented rollback (revert squash-merge SHA); explicit "feature-flag alternative — NOT recommended" with cost rationale. Per-phase acceptance now bifurcated into `acceptance-dev` and `acceptance-deploy` (line 1464 + every phase below). |
| **Consent-banner GDPR**   | §5.5.5            | ✅ closed | §5.5.5 lines 952-992 fully rewritten. Verified against target source: `core/consent/consent-banner.component.ts` lines 30-52 ships 3-tier UL with `Required/Functional/Analytics` toggles; plan explicitly preserves this UL structure (line 978-984), names "Explicit non-goal: do NOT collapse to TF's 2-button banner" (line 992), restyles surfaces only, lists all 13 i18n keys to add to `translations.{en,de,pl,ru}.ts` (line 988). ARIA preserved verbatim (line 989). |

**All four critical fixes are real, with concrete, implementable content — not hand-wavy "we'll figure it out later".**

### Author rigor check on Cyrillic

§5.4-A Option A uses the correct unicode-range partition technique. The browser, given `@font-face { font-family: 'DM Sans'; unicode-range: U+0400-045F; src: url(inter-400-cyrillic.woff2) }` alongside the latin DM Sans, will pull glyphs from Inter for Cyrillic codepoints **without** switching the `font-family` cascade — meaning a Russian sentence renders DM Sans for spaces/punctuation and Inter for letters, with no font-family change visible to the layout engine. This is what Google Fonts itself does internally. Plan's understanding is correct.

### Author rigor check on SSR preload count

Round-1 review (§10 item 2) demanded **4 preloads**: "DM Sans 400 latin, DM Sans 600 latin, Space Mono 400 latin, Space Mono 700 latin". Plan ships **3 preloads** and explains why: TF's `fonts.css` reuses the **same** `…Cmcqbu0-K6z9mXg.woff2` file for all 4 DM Sans weights (verified: `grep "rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2" typelessform/public/fonts/fonts.css | wc -l` → 4). Preloading the same file 4 times is wasteful and triggers a Lighthouse "preload not used" warning. The 3-preload count is **correct**, and the plan explicitly walks the implementer through why the round-1 reviewer's count was naive. **Round-2 conclusion: plan corrects round-1; plan is right.**

---

## 3. Supporting fixes verification (16/16 closed)

| Round-1 supporting fix | Plan §                | Closed? | Notes |
|---|---|---|---|
| Accent-hex contradiction §3.6 ↔ §4 | §3.6 line 464 | ✅ | "We adopt TF's `#FF6B2B` via the §5.1 token swap. (This wording supersedes any earlier 'already correct' claim...)". Residual "already correct" at line 1099 is in a different context (referring to var-name correctness, not hex) — benign. |
| `shared/icon` migration note | §5.5.4-a lines 944-950 | ✅ | Verified source: `shared/icon/icon.component.ts` lines 13-20 uses `stroke="currentColor"` — plan's "no rewrite needed" claim is accurate. Visual verification step prescribed. |
| `@media (hover: hover)` for hover-lifts | §5.6 lines 1306-1316 | ✅ | Concrete CSS pattern + enumerated per-component list (5.5.6, 5.5.7, 5.5.11, 5.5.12, 5.5.13, 5.5.14, 5.5.18). |
| `aria-expanded` on `<summary>` | §5.5.9 line 1108, §5.6 lines 1334-1337, §5.5.5 line 989 | ✅ | Concrete Angular template binding `[attr.aria-expanded]="open"` + `(toggle)="open = $event.target.open"`. Consent Preferences toggle bound to `showPrefs()` signal. |
| Global `main { padding-top: 64px }` named as deliberate divergence | §5.3 lines 749-753 + P1-5 line 1489 | ✅ | Documented in §5.3 prose, listed in P1-5 as "deliberate divergence" task. |
| Utility-classes location (`_components.scss` partial) | §6.2 line 1424, P0-6 line 1475 | ✅ | P0-6 commits to "house TF utility classes in a new partial `src/styles/_components.scss` imported via `@use './styles/components.scss';` from `src/styles.scss`". Rationale included. |
| §8.7 TF-oracle vs internal-baseline split | §8.7 lines 1623-1641 | ✅ | TF-oracle subset (5 routes: `/`, `/blog`, `/blog/<post>`, `/404`, `/legal/<slug>`), internal-baseline subset (7 routes: `/about`, `/faq`, `/for-ai-agents`, `/how-it-works`, `/industries`, `/industries/<slug>`, `/pricing`). Explicit 360/768/1280/1440 viewports. Playwright/Percy/Chromatic named. |
| §8.8 Performance budgets | §8.8 lines 1643-1652 | ✅ | LCP < 2.5s, FCP < 1.8s, CLS < 0.1, TBT < 200ms desktop / 400ms mobile, Best Practices ≥ 95, CSS bundle ≤ 80 KB compressed. All measurable. |
| §8.9 Accessibility budgets | §8.9 lines 1654-1661 | ✅ | axe-core 0 critical/serious on 5 routes, Lighthouse a11y ≥ 95, focus-visible tab-through, reduced-motion behavior, aria-expanded, hover-guard tap-test. |
| OG / favicon / manifest regeneration | §6.3 lines 1435-1442, P5-7..P5-11 lines 1544-1548 | ✅ | Inventoried: `og-image.jpg`, `og-blog-*.png`, `favicon.ico` → SVG + mask-icon, `apple-touch-icon.png`, PWA manifest if present. All flagged as Phase 5 deliverables. |
| Reduced-motion override for reading-progress + reveal keyframes | §5.6 lines 1318-1332 | ✅ | Explicit CSS: `.reading-progress { transition: none !important; }` + `.blog-card, .article-body { opacity:1 !important; transform: none !important; animation: none !important; }`. |
| Step-card line-drift 394-438 → 401-438 | §2.4 line 253, Appendix A line 1746, Changelog line 1807 | ✅ | All three locations corrected. Verified against `app.scss` lines 401-438 (matches verbatim). No residual `394-438` or `394-459` references. |
| Revision History block | Lines 37-40 | ✅ | Added between §1 Executive Summary and §2 Extraction. |
| Home stats 6→4 columns | P2 line 1510 | ✅ | "Decision: drop to 4 columns... Columns collapse to 2-col grid @ ≤ 700px, dividers hidden. Documented divergence; not a visual bug." |
| `.tier` de-duplication | P3-7 line 1524 | ✅ | "Post-task: de-duplicate `.tier` rules between `home.component.scss` and `pricing-page.component.scss` — both should reference the global `.price-card` from `_components.scss`." |
| woff2 dedup explained | P0-3 line 1472 | ✅ | "TF's `fonts.css` declares 4 weights of DM Sans pointing to only 2 unique hashed woff2 files... Therefore preload only the unique hashed files that actually exist on disk (verify with `ls public/fonts/`)". Implementer trap pre-disarmed. |

---

## 4. "NOT applied" defenses — legitimate?

| Deferred item                        | Rationale                                                                                      | Verdict     |
|---|---|---|
| **Print styles** (review §6.10)      | Review itself called this "optional"; no compelling business need for printable legal.        | ✅ Legit    |
| **Focus-trap mobile menu** (review §6.5) | TF lacks it; target lacks it; not a **regression** introduced by this migration — a pre-existing gap. Flagged as separate post-migration a11y task. | ✅ Legit. Plan would be over-scoped if it tried to fix every pre-existing a11y gap. |
| **`color-scheme: dark`** (review §6.11) | Verified: plan §5.1 line 582 sets `color-scheme: dark;` inside the new `:root`. Round-1 reviewer also confirmed this was already present (review §6.11 "Plan §5.1 example does set `color-scheme: dark;` at the bottom — good ✅"). No edit needed. | ✅ Legit, no work required. |
| **1000px container intermediate step** (review §6.6) | TF doesn't have one. Target works with the `1120 → 860 → 700 → 600` ladder. Adding a `_breakpoints.scss` partial is a future refactor, not a migration blocker. | ✅ Legit. The reviewer's original ask was for "what happens between 1120 and 860" — pricing 4-col → 2-col @ 1000px **is** the answer and is preserved (§8.3 line 1600). |

**All four deferrals are defensible. None is a dodge.**

---

## 5. Estimate sanity-check — 8.5–9 dev-days

| Phase | Plan budget | Realistic? | Notes |
|---|---|---|---|
| P0 — Foundation (incl. Cyrillic + SSR + branch preview config) | 1 day | ✅ Realistic | Cyrillic font fetch (12 files from gwfh) + fonts.css editing + tokens.scss + typography.scss + styles.scss + `_components.scss` partial + SSR smoke test + branch + preview config. Tight but doable in one focused day. |
| P1 — Shell (header/footer/lang/consent + i18n strings) | 1.5 days | ✅ Realistic | Header is biggest surface; consent banner with i18n key wiring is non-trivial. |
| P2 — Home (11 sections + live-demo restyle) | 2 days | ✅ Realistic | 630-line home.component.scss is the deepest single-file rewrite. P2-1 through P2-11 enumerate all sections. |
| P3 — Deep pages (9 × ≈ 0.3 d) | 2.5–3 days | ⚠️ On the edge | Industries detail + how-it-works + pricing-standalone are the three heaviest. About / legal / not-found / FAQ are lighter. 0.3 d/page is **realistic only because** P0 ships the global `_components.scss` so deep pages mostly do class-hook renames + var-renames, not authoring. If `_components.scss` is incomplete, P3 blows up. **Watch P0 deliverable quality.** |
| P4 — Shared (contact + blog-list + blog-post 631 lines) | 1.5 days | ✅ Realistic | Blog-post is mostly token-swap (the structure of TF's article matches target). |
| P5 — Polish + audits + 5 brand-asset regen tasks | 1 day | ⚠️ Tight if OG regen is in-scope | Lighthouse + axe + 4 viewports × tab-through + curl smoke + OG image regen + per-post OG regen + favicon SVG + apple-touch-icon. **The OG image regeneration alone is design work, not dev** — should be off-loaded to a content/design handoff in Phase 0 briefing, not crammed into 1 dev-day. Flagged in §6.3 ("Treat as a Phase 5 deliverable; flag for design handoff at P0") — acknowledged but the 1-day budget assumes the assets arrive ready. **Document in P5 acceptance that OG renders are not gating if design handoff slips.** |
| **Total** | **8.5–9 days** | ✅ Realistic with caveats above | Honest envelope. Probably 9 days if anything slips on Cyrillic file fetch or live-demo widget styling. |

**Verdict: 8.5–9 dev-days is honest.** The previous 5–6 day estimate was missing Cyrillic + SSR + branch + OG/favicon assets + axe verification — the plan now folds all of those in.

---

## 6. NEW issues introduced in v2

v2 = 1819 lines (was 1468), +24%. Spot-checking for internal inconsistencies, broken cross-refs, and phase-numbering drift:

### 6.1 Internal contradiction — minor (NOT blocking)

- **§5.1 token block (line 574) vs §5.4 step 6 (line 782)** — font stack inconsistency. §5.1 example sets:
  ```scss
  --font-body: 'DM Sans', sans-serif;
  --font-display: 'Space Mono', monospace;
  ```
  §5.4 step 6 then says this "supersedes" §2.2 and prescribes the longer system-font fallback stack (`'DM Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`). An implementer who copies §5.1 in isolation as the P0-4 deliverable ships the wrong stack and gets a worse FOUC than necessary.
  **Required edit (small):** in §5.1 token block, replace the bare stack with the long stack, **or** add a one-line forward-pointer "→ See §5.4 step 6 for production system-fallback stack."

### 6.2 Phase numbering — consistent

P0 has 8 tasks (P0-1..P0-8). P1 has 6 tasks (P1-1..P1-6). P2 has 11 tasks. P3 has 9. P4 has 3. P5 has 12. No collisions, no skips. ✅

### 6.3 Cross-refs spot-checked (5 random file:line pointers)

| Pointer in plan | Verified |
|---|---|
| `styles.scss:6` (TF) → `--bg-primary: #282838` | ✅ exact (re-verified) |
| `app.scss:401-438` (TF step-card) | ✅ exact, matches the 38-line block verbatim |
| `app.scss:1-11` (TF header glass) | ✅ exact (`background: rgba(10, 10, 15, 0.85); backdrop-filter: blur(16px); border-bottom: 1px solid var(--border);`) |
| `consent-banner.component.ts:30-52` (target 3-tier UL) | ✅ exact — `Required / Functional / Analytics` 3-li structure with `[checked]` bindings |
| `cookie-consent.component.ts:34-37` (TF 2-button flat) | Cited as flat 2-button reference; spec lines noted, file confirmed present in TF; not opened line-by-line in this round (cosmetic). ⚠️ unverified but consistent with round-1 confirmation. |

### 6.4 No duplicate acceptance criteria

§8.1–8.10 are non-overlapping. §8.7 (parity), §8.8 (perf), §8.9 (a11y) carve distinct surfaces. No leftover v1 wording that would conflict (the §8.7 rewrite cleanly replaced the v1 "indistinguishable from TF screenshots" oracle).

### 6.5 Estimate footer (§7 Total) is consistent with per-phase totals

P0 + P1 + P2 + P3-low + P4 + P5 = 1 + 1.5 + 2 + 2.5 + 1.5 + 1 = **9.5 d** at the upper end; lower bound is 1 + 1.5 + 2 + 2.5 + 1.5 + 1 = 9.5 d (range collapses). The "8.5–9 days" footer mismatches its own per-phase math by ~0.5 d. **Cosmetic, but worth normalizing** — either widen the footer to 8.5–10 or tighten P5/P3 to make the math add. Not a SHIP blocker.

---

## 7. Acceptance criteria implementability

| Acceptance section | Implementable? | Notes |
|---|---|---|
| §8.1 Visual identity (hex / px) | ✅ Yes | Eyedropper-testable. |
| §8.2 Components (radius / shadow) | ✅ Yes | Pixel-measurable. |
| §8.3 Layout | ✅ Yes | DevTools-measurable. |
| §8.4 Typography (clamps, line-heights) | ✅ Yes | Computed-style readable in DevTools. |
| §8.5 Motion (durations, easings) | ⚠️ Mostly | "≤ 0.3s with ease" still squishy; specific cubic-bezier values mentioned for blog/article reveal — those are exact. Sufficient. |
| §8.6 Tokens & fonts (grep targets) | ✅ Yes | Best section — `grep` commands are copy-pasteable. |
| §8.7 Side-by-side parity (split) | ✅ Yes | TF-oracle subset listed, internal-baseline subset listed, viewports specified, tools (Playwright/Percy/Chromatic) named. |
| §8.8 Performance budgets | ✅ Yes | LCP/FCP/CLS/TBT all measurable with Lighthouse + WebPageTest. |
| §8.9 A11y budgets | ✅ Yes | axe-core thresholds + Lighthouse score + manual verification items. |
| §8.10 General | ✅ Yes | Including the new `<html lang>` curl assertion. |

**Implementer can run every criterion. No criterion requires designer judgment-call where measurement is feasible.**

### Cyrillic strategy implementability — full check

- ✅ All URLs given: `gwfh.mranftl.com/fonts/inter?subsets=cyrillic,cyrillic-ext`, `…/jetbrains-mono?subsets=cyrillic,cyrillic-ext`.
- ✅ File list given: 8 Inter files + 4 JetBrains Mono files.
- ✅ Concrete `unicode-range` blocks given for both cyrillic and cyrillic-ext.
- ✅ Verification step given: DevTools Computed pane on Cyrillic `<p>`, Network tab, visual hero check.
- ⚠️ Plan does **not** name the exact gwfh download (zip with all 8 files in one go vs per-weight). Implementer will figure it out from the gwfh UI — not a blocker, but a minor friction point.

### SSR hardening implementability — full check

- ✅ `<link rel="preload">` blocks given verbatim in §5.4 step 5 with absolute paths and correct hashed filenames (verified against TF's actual on-disk filenames: `rP2Yp2ywxg089UriI5-g4vlH9VoD8Cmcqbu0-K6z9mXg.woff2`, `i7dPIFZifjKcF5UAWdDRYEF8RXi4EwQ.woff2`, `i7dMIFZifjKcF5UAWdDRaPpZUFWaHi6WZ3Q.woff2`).
- ✅ Curl verification commands ready to paste.
- ✅ System-fallback stack ready (modulo §6.1 §5.1 reconciliation).

### Branch-rollout implementability — full check

- ✅ Branch name: `feat/tf-redesign`.
- ✅ Merge strategy: squash-merge.
- ✅ Rollback: revert squash-merge SHA.
- ✅ Preview-deploy provider: Vercel/Firebase/Cloudflare Pages (any of these).
- ⚠️ Plan does **not** specify which provider the target actually uses. If target is currently on, say, Vercel, that's where the preview channel lives. **Founder briefing item — verify current host before P0.** Minor.

### Consent-banner implementability — full check

- ✅ Each tier's surface mapped (`bg --bg-secondary`, border `--border`, radius 12px, padding `12px 16px`).
- ✅ Each button mapped to TF class (`.btn .btn-outline .btn-sm`, `.btn .btn-primary .btn-sm`).
- ✅ i18n keys enumerated.
- ✅ ARIA preserved.
- ✅ Mobile breakpoint behavior preserved.
- ⚠️ No ASCII mockup of the new visual — but the SCSS surfaces are explicit enough that a dev can build without one. Optional polish.

---

## 8. Minor polish items (non-blocking; fix at PR time)

In priority order:

1. **§5.1 token block (line 574)** — replace bare `--font-body: 'DM Sans', sans-serif` with the system-fallback stack from §5.4 step 6, **or** add a forward-pointer comment `// Production stack — see §5.4 step 6 for system-font fallback chain`. Without this, an implementer copying §5.1 in isolation ships the wrong stack. This is the **only** edit I would require, and it's a one-line change.

2. **Per-phase total ↔ footer total** — §7 footer says "8.5–9 days" but per-phase math is 9–9.5. Either widen the footer range or trim P5 to 0.5d (which I would not recommend given asset regen burden). Cosmetic.

3. **Preview-deploy provider** — name the actual host (Vercel / Firebase / Cloudflare Pages) the target currently uses, so P0 doesn't burn time figuring this out.

4. **Cyrillic source — gwfh download specifics** — one sentence on whether to use the zip download or per-weight URLs from gwfh. Friction-reducer only.

5. **Consent-banner ASCII mock-up** — optional. Plan is precise enough without it, but a 5-line ASCII sketch of the expanded preferences state on dark surface would help with founder visual sign-off at P1.

**None of the above is a SHIP blocker.** All can be addressed inline during P0 by the implementer or in a PR comment.

---

## 9. Summary scoring

| Dimension                          | Round-1 verdict   | Round-2 verdict    |
|---|---|---|
| TF extraction accuracy             | ✅ excellent      | ✅ unchanged (still exact) |
| Target diff accuracy               | ✅ accurate w/ 1 contradiction | ✅ contradiction resolved |
| Component coverage                 | ⚠️ shared/icon missing | ✅ covered (§5.5.4-a) |
| Cyrillic strategy                  | ❌ blackout       | ✅ Option A with concrete unicode-range |
| SSR / FOUC                         | ❌ "optional polish" mistake | ✅ MANDATORY + absolute path + curl verify |
| Phased rollout                     | ❌ broken middle states | ✅ branch-isolated + per-phase preview |
| Consent-banner UX                  | ❌ TF 2-button regression risk | ✅ 3-tier preserved, surfaces only |
| Accessibility (hover-guard, aria-expanded, reduced-motion overrides) | ⚠️ partial | ✅ explicit per-component |
| Brand assets (OG / favicon / manifest) | ❌ silent     | ✅ §6.3 + P5-7..P5-11 |
| §8.7 acceptance oracle             | ❌ TF-less pages had no oracle | ✅ split into TF-oracle + internal-baseline |
| §8.8 / §8.9 perf + a11y budgets    | ❌ silent         | ✅ concrete thresholds |
| Estimate honesty                   | ❌ 5–6 d hides the truth | ✅ 8.5–9 d folds in critical work |

**12/12 dimensions resolved. SHIP.**

---

## 10. What the implementer does next

1. Spin up `feat/tf-redesign` off `main`.
2. Brief founder on Cyrillic Option A and preview-host choice (single 30-min sync).
3. P0 (1 day) — Cyrillic fetch + tokens + typography + styles + `_components.scss` partial + SSR smoke test + preview deploy.
4. Apply §5.1-vs-§5.4-step-6 fix to font stack as a side-quest at start of P0-5 (1 minute).
5. P1 through P5 per the timeline (7.5–8 days).
6. Squash-merge to `main` after P5 acceptance + founder sign-off on preview URL.
7. Tag the merge commit, document SHA in `docs/redesign-2026-05/03-rollout-notes.md` for rollback.

**Production stays on cream until P5 ships dark theme atomically. Rollback is one revert away.**

---

## Appendix — files cited / verified in this round

**Plan + round-1 review:**
- `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/02-design-system-migration-plan.md` (1819 lines, v2)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/02-design-system-migration-plan.review.md` (round 1)

**TF re-verified (primary source for fix verification):**
- `/Users/dmitry-isaevski/Projects/typelessform/public/fonts/fonts.css` (126 lines — zero Cyrillic confirmed)
- `/Users/dmitry-isaevski/Projects/typelessform/public/fonts/*.woff2` (8 files on disk, naming matches plan's preload hints)
- `/Users/dmitry-isaevski/Projects/typelessform/src/app/app.scss` (step-card 401-438 verified)

**Target re-verified:**
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/core/consent/consent-banner.component.ts` (3-tier UL confirmed at lines 30-52)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/shared/icon/icon.component.ts` (`stroke="currentColor"` confirmed)
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/i18n/translations.ru.ts` (RU locale active — Cyrillic strategy required)

— end of review v2 —
