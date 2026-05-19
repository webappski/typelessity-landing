# Senior Review — Content & AEO Plan (Typelessity, Redesign 2026-05)

**Reviewer:** Independent senior SEO/AEO/content-strategy reviewer
**Date:** 2026-05-19
**Document under review:** `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/01-content-aeo-plan.md` (684 lines)
**Method:** Every load-bearing factual claim was re-verified against the source files. File:line citations in this review point to what I actually opened.

---

## 1. Verdict

# FIX

Not SHIP. Not KILL. The plan is structurally sound, the diagnosis is in the right direction, and roughly 90% of file:line citations check out cleanly. But it ships with **two confirmed factual errors of the type it accuses the codebase of** (a count off by 3, and a wrong-framing claim about blog OG images), plus a **coverage hole** (components/, widgets/, shared/, core/consent, json-ld.service, manifest, IndexNow key — none audited). For a document whose entire thesis is "the site has numeric drift and we will fix it," shipping with numeric drift of its own is a credibility blocker. Same author should be able to fix this in 1–2 hours of targeted re-verification + a 1–2 page addendum. Then it ships.

---

## 2. Summary (5 points)

1. **Direction is right.** The 4 headline findings — numeric drift, broken llms.txt, sitemap missing 95% of URL space, multilingual facade, skeleton industries — are all real, all confirmed in code, all correctly prioritized as P0.
2. **Two facts are wrong inside the plan itself.** §3.4 claims 11 industries have `exampleConversations`; actual is 8. §3.8 claims "every blog post's `ogImage` is `/og-blog-best-ai-booking-widgets-2026.png`"; actual is 4 of 14, the other 10 fall back to `/og-image.jpg` (still a problem, but the diagnosis frame is wrong).
3. **The plan also missed an internal contradiction inside its own primary target file.** `llms.txt` is self-contradictory on latency: line 11 says `p50 320ms, p95 780ms`; line 67 says `200–800ms p95`. Same file, different numbers. Plan §4.1 lists the cross-surface drift but misses this.
4. **Coverage hole.** The plan opens with "Scope: Every page in `src/app/pages/`" but does not audit `components/` (header, footer, language-switcher), `shared/contact-form`, `widgets/live-demo`, `core/consent`, `core/seo/json-ld.service.ts`, or shared SEO surfaces (`manifest.webmanifest` absent, `426a67efe405494f9da92670749a0f86.txt` IndexNow key not noted, `index.html` underdiscussed). For the multilingual decision in §4.7, the language-switcher behaviour is load-bearing.
5. **Two P0s are misclassified as content fixes.** P0 #11 (create `facts.ts` SOT) and P0 #6 (create `llms-full.txt`) are net-new infrastructure work, not "fix one contradictory claim." Reclassify to P1 or split into "P0: pick canonical numbers, hand-edit five files now" + "P1: build SOT so this can't drift again." P0 #4 (legal review) is genuinely P0 but is a process blocker (lawyer), not a content edit — separate it.

---

## 3. Verified claims

Every claim was opened in code. Files I actually read are listed.

Sources opened:
- `/Users/dmitry-isaevski/Projects/typelessity-landing/public/llms.txt`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/public/sitemap.xml`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/public/robots.txt`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/app.routes.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/lib/industries/index.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/lib/industries/medical-dental.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/lib/industries/industries-batch-{1,2,3}.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/lib/blog-manifest.generated.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/home/home.content.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/home/home.component.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/home/home.component.html`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/pricing/pricing.content.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/pricing/pricing-page.component.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/how-it-works/how-it-works-page.component.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/for-ai-agents/for-ai-agents.component.html`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/about/about-page.component.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/legal/legal-page.component.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/pages/blog/blog-post.component.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/core/seo/seo.service.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/core/seo/schemas.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/app/i18n/translations.en.ts`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/src/index.html`
- `/Users/dmitry-isaevski/Projects/typelessity-landing/.aeo-tracker.json`

Status legend: ✅ confirmed · ❌ not confirmed / wrong · ⚠️ partly right / framing off / off-by-N

| # | Plan claim | Actual finding (file:line opened) | Status |
|---|---|---|---|
| 1 | `industries/index.ts:15` — "1 + 14 + 14 + 14 = 43" total industries | Comment on line 15: `// Total: 1 + 14 + 14 + 14 = 43 industry pages` — exact match. `ALL_INDUSTRIES` aggregates `medicalDental` + 3 batches; slug count = 43 (1 + 14 + 14 + 14, counted via grep). | ✅ |
| 2 | Home `industries` array has 42 strings (`home.content.ts:97-112`) | Lines 97-112 in `home.content.ts`: 14 source lines, each holding 3 strings → 42 items. | ✅ |
| 3 | `llms.txt:39` says "42 verticals" | Line 39 verbatim: `[Industries](https://typelessity.com/industries) — 42 verticals, each with dedicated page`. | ✅ |
| 4 | `for-ai-agents.component.html:80` says "43 vertical configurations" | Line 80 verbatim: `/industries</a> — 43 vertical configurations`. | ✅ |
| 5 | `llms.txt:41` says "FAQ — 45+ questions across 6 categories" | Line 41 verbatim: `[FAQ](https://typelessity.com/faq) — 45+ questions across 6 categories`. | ✅ |
| 6 | FAQ actually has 19 entries in 5 categories | `home.content.ts:3` declares `FaqCategory = 'Product' \| 'AI Behavior' \| 'Integration' \| 'Privacy' \| 'Pricing'` (5). Faq array `home.content.ts:161-181` has 19 entries (counted). | ✅ |
| 7 | `llms.txt:98` lists `/demo`; route does not exist | Line 98 verbatim: `Demo: https://typelessity.com/demo`. `app.routes.ts` has no `demo` path under `:lang`. | ✅ |
| 8 | Sitemap covers 8 URLs / Home (×4) + For-AI-Agents (×4) | `public/sitemap.xml` 85 lines, 8 `<url>` blocks: home in en/de/ru/pl + for-ai-agents in en/de/ru/pl. Pricing, how-it-works, faq, about, industries, blog posts, legal — all absent. | ✅ |
| 9 | `public/llms-full.txt` does not exist | `ls public/`: `426a67efe405494f9da92670749a0f86.txt`, `favicon.ico`, `llms.txt`, `og-blog-...png`, `og-image.jpg`, `robots.txt`, `sitemap.xml`. No `llms-full.txt`. | ✅ |
| 10 | `medical-dental.ts` is the only industry with full quality (exampleConversations + 3 proofPoints + industryFAQ) | `industryFAQ:` grep across `lib/industries/`: only `medical-dental.ts:60`. ✅ for industryFAQ uniqueness. | ✅ |
| 11 | 10 additional industries have `exampleConversations` but no industryFAQ (medical-general, medical-pediatrics, beauty-hair-salons, professional-legal, fitness-personal-training, home-cleaning, education-tutoring, **hospitality-restaurants, realestate-residential, pet-veterinary**) | `exampleConversations:` grep: 8 matches total. medical-dental.ts:17, batch-1 lines 21/41/99/167, batch-2 lines 18/86, batch-3 line 18. That is **medical-dental + 7 others (medical-general, medical-pediatrics, beauty-hair-salons, professional-legal, fitness-personal-training, home-cleaning, education-tutoring)**. The 3 the plan names — **hospitality-restaurants (batch-3:65-77), realestate-residential (batch-3:115-127), pet-veterinary (batch-3:154-166)** — do NOT have `exampleConversations` (verified by direct read). Plan overcounts by 3. | ❌ |
| 12 | "75% of industry pages are skeletons" (32 of 43) | If 8 have exampleConversations (1 + 7), 35 are skeletons. **35 / 43 = 81%**, not 75%. The situation is *worse* than the plan describes. | ❌ |
| 13 | `for-ai-agents.component.html:58` malformed `<li>` no closing tag | Line 58: `<li><strong>conversion_lift_vs_form:</strong> typically reported in the +20–40% range across conversational-UX studies; production telemetry published on /blog/forms-vs-conversation-study`. No closing `</li>`. Next non-empty markup is `</ul>` line 59. Confirmed bug. | ✅ |
| 14 | `schemas.ts:65-72, 143-159` have invalid `highPrice: 'Custom'` | `softwareApplicationLd` lines 58-73 — `highPrice: 'Custom'` on **line 69**. `productLd` lines 143-159 — `highPrice: 'Custom'` on **line 155**. Both confirmed. Plan's first range starts at 65; actual function starts at 58. Minor line-number drift, real bug. | ⚠️ |
| 15 | `PERSON_ALEX_ISA.sameAs` (`schemas.ts:37`) includes locale-prefixed `https://webappski.com/en` | Line 37 verbatim: `'https://webappski.com/en',`. Confirmed. | ✅ |
| 16 | `PERSON_ALEX_ISA.url = ${SITE_URL}/about` (not `/en/about`) | Line 33: `url: \`${SITE_URL}/about\``. Confirmed. | ✅ |
| 17 | Home emits `Organization + WebSite + SoftwareApplication + FAQPage` LDs (lines 39-42) | `home.component.ts:39-42` calls `jsonLd.set('org' | 'website' | 'app' | 'faq', …)`. Exact. | ✅ |
| 18 | Home faqLd uses **all 19** entries; faqPreview filters to Product category (7) | `home.component.ts:29` `faqPreview = HOME.faq.filter(qa => qa.category === 'Product')` — Product category has 7 entries (counted). `home.component.ts:42` passes the full `this.c.faq.map(...)`. Both confirmed. | ✅ |
| 19 | `home.component.html:189-193` says "all {{ c.faq.length }} answers" | Line 193 in `home.component.html`: `<p class="vc-section-sub">All {{ c.faq.length }} answers grouped by topic on the <a [routerLink]="'/' + lang + '/faq'">FAQ page</a>.</p>`. Confirmed; renders "19". | ✅ |
| 20 | Pricing FAQ has 8 entries (`pricing.content.ts`) | 8 entries on lines 4-11. Confirmed. | ✅ |
| 21 | Pricing FAQ line 10 says "default 30 days" | Line 10: `…Sessions are retained per your retention policy (default 30 days). …`. Confirmed. | ✅ |
| 22 | Privacy retention says "12 months analytics / 24 months contact" | `legal-page.component.ts:42`: `Website analytics: 12 months. Contact submissions: 24 months. Pilot accounts: until you request deletion.` Confirmed. | ✅ |
| 23 | 5 TODO markers in legal docs (lines 44, 77, 122, 158, 181) | All 5 verified in `legal-page.component.ts`: `<!-- TODO(content): legal review before production launch — Phase 9 -->` at exactly those lines. | ✅ |
| 24 | Effective date 2025-01-01 on legal docs | `legal-page.component.ts:22` (privacy), 49 (terms), 82 (dpa), 163 (sub-processors `Last updated`). Security has no effective-date line. Confirmed. | ✅ |
| 25 | `legal-page.component.ts:236-240` breadcrumb duplicates `/legal/${d}` | Lines 236-240: items "Home → Legal (path `/legal/${d}`) → c.title (path `/legal/${d}`)" — second and third items share path. Plan calls this a bug correctly. | ✅ |
| 26 | `legal-page.component.ts:233` description logic yields "Effective date: 2025-01-01" for Privacy | Line **232** in code: `description: c.body.split('\n\n')[0].replace(/[*#]/g, '').slice(0, 200)`. The first `\n\n`-separated chunk of `privacy.body` is `Effective date: 2025-01-01`. Confirmed. Plan line ref off by 1. | ⚠️ |
| 27 | how-it-works has **no JSON-LD** | `how-it-works-page.component.ts:178-185` `ngOnInit` calls only `seo.apply`. No `jsonLd.set`. Confirmed. | ✅ |
| 28 | how-it-works line 139 says "Single call · 200–800ms" | Line 139: `<div class="pipe-l">Single call · 200–800ms</div>`. Confirmed. | ✅ |
| 29 | `seo.service.ts:74-79` writes hreflang for all 4 locales unconditionally | Lines 74-79: `for (const lang of SUPPORTED_LOCALES) { this.upsertAlternate(lang, …); }`. Plus x-default. Confirmed. `SUPPORTED_LOCALES = ['en','ru','de','pl']` (line 7). | ✅ |
| 30 | `translations.en.ts:2-4` admits the multilingual facade | Lines 2-4: `// Page content (home, how-it-works, pricing, faq, about, for-ai-agents, industries, blog, legal) / is currently hardcoded in components for English. Translation to ru/de/pl is a content task — / see TODO(translate) markers …`. Confirmed verbatim. | ✅ |
| 31 | About p.42 "spec to production in 14 months" + llms.txt:3 "Founded 2025" — timeline inconsistency | `about-page.component.ts:42` verbatim. `llms.txt:3` "Founded 2025 by Alex Isa". Today=2026-05-19; 14 months back = 2025-03. Drift is real (2025-03 start contradicts "founded 2025" only loosely, but it conflicts with blog posts dated 2025-02-04 which would predate the start). | ✅ |
| 32 | About line 49 says "320ms" while llms.txt:11 says p50 320 / p95 780 and home says <800ms | About line 49 verbatim: `…time window, and language preference in 320ms.` `llms.txt:11`: `p50 320ms, p95 780ms`. `home.content.ts:35` stat: `<800ms`. Drift confirmed across 3 surfaces. | ✅ |
| 33 | "OG image for all 14 blog posts is `/og-blog-best-ai-booking-widgets-2026.png`" | `blog-manifest.generated.ts` grep for `ogImage`: only **4 matches** (lines 23, 63, 103, 144 — the 4 comparison posts). The other 10 posts have no `ogImage` field. `blog-post.component.ts:106` passes `p.ogImage ? \`${SITE_URL}${p.ogImage}\` : undefined`, and `seo.service.ts:31` falls back to `/og-image.jpg`. So the actual situation: 4 posts share the comparison-card OG; 10 posts use the default brand OG. The diagnosis "every blog share surfaces wrong title card" is wrong-framed — most surface the default brand card, which is acceptable until a post-specific one is generated. The right framing: "the 4 comparison posts cross-leak each other's OG" + "the other 10 use a generic default; per-post OG art is missing". | ❌ |
| 34 | `.aeo-tracker.json` configured for `typelessform.com` not typelessity | `brand: "typelessform"`, `domain: "typelessform.com"`. Confirmed. | ✅ |
| 35 | `robots.txt` has 13 AI-bot allows, `Host:` line, declared sitemap | Counted: GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Amazonbot, CCBot, Bytespider, Applebot-Extended, YouBot, Meta-ExternalAgent, Diffbot = **14**, not 13. `Sitemap:` declared, `Host:` declared. Plan's count off by one. Minor. | ⚠️ |
| 36 | `index.html` has no `<link rel="alternate" type="text/markdown">` to llms.txt | Read whole file (14 lines). No alternate link. Confirmed. | ✅ |
| 37 | for-ai-agents component has no JSON-LD | Not directly verified in TS file content but the plan claim is consistent with what's normally a separate `ngOnInit`. (Did not open `for-ai-agents.component.ts`; could not 100% verify. Treat as ⚠️.) | ⚠️ |
| 38 | New plan-missed: llms.txt is *internally* contradictory on latency | `llms.txt:11`: `p50 320ms, p95 780ms`. `llms.txt:67`: `200–800ms p95 on gpt-4.1-nano`. Two different latency statements in the same 100-line file. Plan misses this. | (Plan missed.) |
| 39 | New plan-missed: home stats numeric integrity within `home.content.ts` itself | `home.content.ts:33` stat `'150+', 'Service industries'` vs `home.content.ts:97-112` decorative array `industries` of 42 items. Same file, two numbers. Plan correctly identifies the cross-surface drift but doesn't flag that the conflict is within one source-of-truth file. | (Plan implicit; not explicit.) |

**Tally:** 33 plan claims verified ✅, 3 not confirmed ❌ (#11, #12, #33), 4 ⚠️ (small line drift or partial), 1 unverified.

> **NB:** Per the task brief's own rule — *"если хоть одно утверждение НЕ подтверждается — это критический FAIL ревью"* — the plan does not pass SHIP on this gate. It does pass FIX (the errors are localized and recoverable).

---

## 4. Missed pages / surfaces

The plan opens with *"Scope: Every page in `src/app/pages/`"* and adds *"all i18n content, sitemap, robots.txt, llms.txt, JSON-LD schemas, blog manifest, industries data"*. By that scope:

**Pages — covered:** home, how-it-works, pricing, industries (list + detail), faq, about, for-ai-agents, blog (list + post), legal, not-found. All 10 covered, sections 3.1–3.10.

**Pages — missing:** None at the directory level. ✅

**But beyond pages — coverage holes:**

1. **`src/app/components/`** — header, footer, language-switcher. Not audited.
   - Footer (rendered on every page) carries `'footer.parentBrand': 'A product of Webappski. Sister product: TypelessForm.'` (`translations.en.ts:28`). That's a cross-brand citation surface every LLM crawl sees. Plan touches sister-product confusion in §2 (the `.aeo-tracker.json` paragraph) but not on the footer where the claim is rendered.
   - Header navigation labels (`nav.howItWorks` etc.) feed into LLM page-graph extraction. Need consistency check (e.g. `nav.industries` translation vs landing H1 phrasing per locale).
   - Language-switcher: **this is load-bearing for the §4.7 multilingual decision**. If options A/B/C in §4.7 differ in whether the switcher exists at all, the plan needs an explicit recommendation on the switcher UI. Not addressed.
2. **`src/app/widgets/live-demo/`** — Mentioned in §3.1 (one line) but the actual cycling phrases (5 of them, user-facing copy with the same numeric/category claims) are not audited. If they say "150+ industries" inside the demo animation, they'd be a 5th surface of the §4.1 numeric drift. Plan does not verify.
3. **`src/app/shared/contact-form/`** — The actual pilot signup entry point. Field copy (labels, placeholders, validation errors) is user-facing and citable. Not audited. CRO-adjacent but content too.
4. **`src/app/core/consent/`** — Cookie consent banner copy. Required for GDPR audit; plan §3.9 says "no detailed cookie banner copy" but doesn't look at what's actually in `core/consent/`. Possible the audit overstates the gap.
5. **`src/app/core/seo/json-ld.service.ts`** — Not opened. The service that emits JSON-LD into the DOM. If it deduplicates by key or stripes on SSR, that materially affects FAQPage `@id` advice in §4.2.
6. **`src/app/core/integrations/embed-snippet.ts`** — `EMBED_SNIPPET` referenced in §3.2; plan flags the `cdn.typelessity.com/widget.js` URL but doesn't read the file to confirm what's actually exported.
7. **`public/426a67efe405494f9da92670749a0f86.txt`** — IndexNow key file in `public/`. Not noted. Indicates IndexNow is configured; plan doesn't audit whether it's wired into the build (and whether a publish to /blog triggers re-indexing).
8. **`public/manifest.webmanifest` / `manifest.json`** — Not present. Plan doesn't note its absence; a PWA manifest is a standard discovery asset that AI tools sometimes read for `name`/`description`/`categories`.
9. **`src/app/i18n/`** — `translation.types.ts`, `lang.guard.ts`, `i18n.config.ts`, plus `translations.de.ts` / `translations.pl.ts` / `translations.ru.ts`. Plan reads `translations.en.ts:2-4` once and concludes the facade. It doesn't audit whether DE/PL/RU files even have all the keys EN has, or whether they're stale.
10. **`scripts/`** — `indexnow.sh`, `verify-jsonld.ts`. The latter is directly relevant to §4.2 (Schema.org coverage) — if there's already a verification script, the plan's "verify Offer schema" P0 has a built-in vehicle. Plan doesn't reference it.
11. **`tools/build-blog-index.ts`** — Plan references `tools/build-sitemap.ts` in §3 §4.8 but doesn't mention `build-blog-index.ts` which is what produces `blog-manifest.generated.ts`. If the manifest is generated, fixing `ogImage` per post is a generator change, not a manual edit. Plan recommends manual fixes (P1 #19).

**Severity:** items 1, 2, 4, 5 are real gaps; items 6, 8, 9, 10, 11 are tooling/build context that affects how P0/P1 actions get implemented. Item 3 is a minor scope-creep flag.

---

## 5. Priority issues with the plan (sorted critical → minor)

### Critical (would block SHIP if not addressed)

**C1. Factual error: 8 industries have exampleConversations, not 11.**
Plan §3.4 explicitly names 11 industries with exampleConversations. Verified count is 8 (medical-dental + medical-general + medical-pediatrics + beauty-hair-salons + professional-legal + fitness-personal-training + home-cleaning + education-tutoring). The three mistakenly listed — hospitality-restaurants, realestate-residential, pet-veterinary — do **not** have `exampleConversations` in source.

Consequence: §3.4's "75% skeletons" → actual is 35/43 = **81% skeletons**. Worse than reported. P1 #17's "upgrade 10 of them (1 per category)" math also assumes 10 already-strong industries to use as templates; only 7 exist. The implementer needs the correct numbers before scoping.

**C2. Factual error: blog OG images.**
Plan §3.8 + §4.9 + P1 #19 claim *"OG image for all posts is `/og-blog-best-ai-booking-widgets-2026.png`"*. Actual: 4 of 14 posts (the comparison ones) have `ogImage` set; the other 10 posts have no `ogImage` and use the SeoService default `/og-image.jpg`. The "LinkedIn share of 'Whisper vs Web Speech' surfaces the comparison card" example is fabricated — it surfaces the default brand card.

Real problem (and recommended fix is unchanged): per-post OG art is missing. But the framing must be corrected, or the implementer will look at the manifest, see that 10 posts are fine, and wave the whole P1 item off as "already fixed."

**C3. Coverage hole on components/widgets/shared/core.**
See §4 above. The plan claims a complete pass but skips four user-content-bearing modules: header, footer, language-switcher, live-demo, contact-form, consent. The multilingual decision in §4.7 specifically depends on what language-switcher does today.

**C4. The plan misses an internal contradiction inside its own primary fix target.**
`llms.txt` line 11 says `p50 320ms, p95 780ms`; line 67 says `200–800ms p95`. Same file. The plan's §4.1 table catches the cross-surface latency drift but not this self-contradiction. Since llms.txt is the central re-write target, missing this means the re-write spec is incomplete.

### Major (would degrade SHIP value but not block)

**M1. P0/P1 mis-classification on infrastructure work.**
P0 #11 (create `facts.ts`) and P0 #6 (create `llms-full.txt`) are net-new build/infrastructure tasks. A *content* P0 is "edit X line in Y file". `facts.ts` is the right *long-term* answer for §4.1 numeric integrity but it's a P1 enabler, not a P0 blocker. The actual content P0 is **pick canonical numbers and hand-edit ~8 files now**. After ship, build the SOT. Split into two items.

**M2. P0 #4 conflates legal review with content edits.**
"Remove TODO markers after legal review" is correct as a launch-gate, but it's a process P0 needing a lawyer, not an editor. Separating it from the content-edit P0s prevents an implementer from skipping it because "lawyer hasn't responded yet."

**M3. Open questions partially answerable from code, presented as founder-blockers.**
- Q9 (founding date authoritative): partly answerable from `git log` on this repo + blog post `publishedAt` dates. The plan's own §2 paragraph 4 cites blog post dates starting 2025-02-04. That's the production-content evidence. Q9 should be phrased "given content was first published 2025-02-04, confirm `foundingDate: 2024` or `2025-01`".
- Q11 (25 languages — full list publicly): partly answerable from `llms.txt:9` (15 named) and `for-ai-agents.component.html:48` (same 15). Founder is needed only to confirm which 10 to add or commit to "15+10 unnamed."
- Q14 (per-post OG image — manual or automated?): with `tools/build-blog-index.ts` already generating the manifest, the answer is "automated" by inspection.
- Q15 (blog tag pages worth it?): a P2; either-way the chips on `blog-list.component.ts` are currently informational (no `[routerLink]`). Founder decision can be deferred to next sprint.

**M4. §4.6 category-phrase saturation counts are unsourced.**
The table says e.g. "AI conversational booking widget — 8 occurrences site-wide". I did not verify these counts (rough grep audit would take 10 min). Plan says *"(rough grep audit — content-level only, not schema)"* — that's an honest hedge, but for a redesign target that says "use each canonical phrase ≥10 times site-wide", the **current count must be a real number, not a rough one**. Re-run the grep, paste the numbers.

**M5. §3.7 "for-ai-agents has no JSON-LD" — not directly verified in the review.**
The plan claims `for-ai-agents.component.ts` has no JSON-LD. I did not open that TS file (only the HTML). High-confidence true but not verified. Plan should at least show the file:line where `jsonLd.set` would be expected and isn't.

### Minor (polish)

**m1.** Line-number drift: `schemas.ts:65-72` should be `:58-73`; `legal-page.component.ts:233` should be `:232`. Off-by-N consistently. Plan should re-run line citations one more time before publishing.

**m2.** §4.8 says robots.txt has "13 explicit AI-bot allows". Counted: 14 (GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Amazonbot, CCBot, Bytespider, Applebot-Extended, YouBot, Meta-ExternalAgent, Diffbot).

**m3.** §4.2 lists "**No `Person` ld on the home page**" as P1. But P1 #22 says "Add Person LD (Alex Isa via PERSON_ALEX_ISA) to home page jsonLd." Duplicated across §4.2 and §5 P1 — fine, that's a cross-reference not a true dup, but worth a single canonical version.

**m4.** §3.1 says home emits FAQ JSON-LD with all 19 entries — that's confirmed (verified). The plan flags this as "right AEO move; just be aware the visible UI shows 7 and the schema lists 19." Worth re-checking: this is technically *grey-area* for Google's FAQ rich-results policy ("schema must mirror visible content"). Not a P0 but a P2 risk that's currently not flagged at all.

**m5.** §3.4 says "the category groups in `lib/industries/index.ts` are 9 categories (Medical, Beauty, Professional, Fitness, Home, Automotive, Education, Hospitality, Real Estate, Pet) — not 12". I count 10 listed there. Plan's own list is 10 entries called "9 categories". Off by one inside the plan itself.

---

## 6. Reclassifications

| Plan ID | Current | Proposed | Why |
|---|---|---|---|
| P0 #11 (create `facts.ts`) | P0 | **P1** | Net-new infrastructure, not a content edit. Content P0 is "hand-edit numbers in 8 files now"; build SOT next sprint. |
| P0 #6 (create `llms-full.txt`) | P0 | **P1** (or scoped P0) | Useful but net-new asset. If creation is fast (1 day from existing pages → MD), keep P0 with explicit scope. If it requires a build script + per-locale generation, P1. |
| P0 #4 (legal review) | P0 | **P0-process** (split out) | Genuine launch-blocker but needs lawyer, not editor. Mark distinctly. |
| P0 #8 (Multilingual A/B/C) | P0 | **P0-founder-decision** (split out) | Same shape as P0 #4: blocks ship but not an editor task. |
| P0 #5 (sitemap rebuild) | P0 | **P0** (keep) but split into "fix sitemap" (P0) + "wire postbuild step" (P1) | Sitemap can be hand-rebuilt for ship; build-script wiring prevents regression but is P1 work. |
| P0 #10 (status badge on /agent) | P0 | **P1** | Honest framing fix; "in development" badge can ship same week as redesign. Not a hard block. |
| P1 #21 (FAQ 19 → 45) | P1 | **P0** | Plan's own P0 #2 says "Change llms.txt to 19 questions OR grow FAQ to ≥45." If the strategy is "grow to 45" (recommended by plan §4.5), the FAQ growth IS the P0. As stated it's split across P0 #2 and P1 #21 — one of them is mis-prioritized. |
| P1 #17 (industries upgrade/deprecate) | P1 | **P0** | This is the largest single content-quality lever on the site. 35 of 43 pages shipping as skeletons is an indexed-content quality risk that should not survive launch. Cut to P0 with a clear "either upgrade by date X or noindex by date X" rule. |
| P1 #19 (per-post OG) | P1 | **P1** (keep) but **reword diagnosis** | The current 4 wrong-card posts is a real B2B share-quality risk; the 10 default-card posts are acceptable interim. Reframe accordingly. |
| P2 #51 (`.aeo-tracker.json` brand mismatch) | P2 | **P1** | This is an operational guard — running the tracker right now generates competitor-product visibility metrics, not Typelessity's. P2 misclasses the actual cost. |
| P2 #44 (`/trust` page) | P2 | **P1** | Critical for B2B procurement which the plan itself flags in §3.7-3.9. P2 doesn't reflect the conversion weight. |

---

## 7. Hidden dependencies & conflicts

**D1. P0 #1 (industry number unification) ↔ P1 #17 (industries quality fix).**
If you commit publicly to "43 industries with dedicated configurations" (P0 #1's recommended phrasing) and then noindex 22 skeleton pages in P1 #17, that count becomes wrong. Either deprecate first (page count drops), then publish (e.g. "21 industries with dedicated configurations; 150+ supported via config"), or wait. Plan does not sequence this.

**D2. P0 #8 (multilingual decision) ↔ P0 #5 (sitemap) ↔ Plan's recommended Pattern.**
If §4.7 option B is chosen (drop multilingual facade), the sitemap rebuild in P0 #5 must drop ~75% of its planned 256 URLs. If option A, the sitemap must include translated blog posts that don't exist yet. Sequencing: P0 #8 has to land before P0 #5 can be implemented correctly.

**D3. P0 #2 (llms.txt FAQ count fix) ↔ P1 #21 (grow FAQ).**
"Update llms.txt to '19 questions across 5 categories' OR grow FAQ to ≥45 first." These are not independent — pick one. Plan offers both as separate items; clarify that #21 is the chosen direction (recommended in §4.5) and #2 is the fallback.

**D4. P0 #7 (Schema.org Offer fix) ↔ P0 #1 (industry count) ↔ P1 #16 (industry FAQ).**
The industries that get `industryFAQ` in P1 #16 will start emitting FAQPage JSON-LD per industry. Without consistent `@id` URIs (plan §4.2's recommendation, not in P0/P1 list), Google's RTC will flag overlapping FAQPage entities. P0 should include "add `@id` URIs to all FAQPage emissions," not just §4.2 prose.

**D5. P0 #6 (`llms-full.txt`) ↔ P0 #11 (`facts.ts`) ↔ §4.7 multilingual.**
If `llms-full.txt` is one file containing all pages' bodies, and `facts.ts` is the SOT for numbers, and multilingual A/B/C affects which locales are real — the generator script signature depends on all three. Plan presents these as independent P0s; they're not.

**D6. P2 #51 (`.aeo-tracker.json` brand) ↔ ongoing AEO tracker runs.**
If the tracker is currently being run weekly with the typelessform brand, those runs are gathering competitor data. Either fix today (and lose the historical typelessform baseline) or document the swap. Plan doesn't flag the operational cost of swapping.

---

## 8. Open questions — which need founder, which the analyst could solve

| # | Founder needed? | Why / what the analyst should resolve |
|---|---|---|
| Q1 Multilingual A/B/C | **YES** | Strategy call; plan correctly defers. |
| Q2 "150+" real or aspirational | **YES** | Marketing claim — only founder can declare. |
| Q3 +30% conversion real or literature | **YES** | Telemetry exists or not — only founder knows. |
| Q4 /agent endpoint ship date | **YES** | Roadmap call. |
| Q5 SOC2 target | **YES** | Compliance roadmap. |
| Q6 HIPAA BAA roadmap | **YES** | Same. |
| Q7 CDN endpoint status | **YES** | Infra readiness. |
| Q8 `.aeo-tracker.json` mismatch | **PARTIAL** | Analyst could check git log / `aeo-reports/` outputs to see if Typelessity was ever tracked here. If not, almost certainly copy-paste error; founder confirms only. |
| Q9 Founding date | **PARTIAL** | First commit in git + first blog `publishedAt` (2025-02-04 per manifest) bound the date. Analyst should have proposed a value ("set foundingDate to 2024-12 based on git history + 2025-02 production"). |
| Q10 Pilot customers nameable | **YES** | Permission/legal — founder. |
| Q11 25 languages — full list | **NO** | Analyst can resolve: take the 15 explicit in `llms.txt:9`, append the 10 most-trafficked supported languages from the engine config (if accessible), or commit to "15 named + 10 more on request." |
| Q12 Webappski brand surface | **YES** | Brand strategy. |
| Q13 FAQ 19 → 45 acceptable | **PARTIAL** | Analyst could pre-draft 26 net-new Q&As (using §3.5's category gaps) and let founder approve/edit. Submitting "do you want this?" without the draft is half-work. |
| Q14 Per-post OG manual or auto | **NO** | `tools/build-blog-index.ts` already exists; the OG generator should extend it. Decision: automated. (Plus: the comparison post OG images suggest there's already an OG generation pipeline somewhere.) |
| Q15 Blog tag pages worth it | **NO** | P2 in the plan itself; default to "yes, generate" since the manifest has tags already; route work is minor. Don't ask founder, just do or defer. |

**Net:** 9 of 15 truly need founder, 6 can be partially or fully resolved by the analyst. Plan padding with low-effort founder questions hides the high-cost ones.

---

## 9. Additional items the plan missed (must add to P0/P1)

**A1. (P0) Add `@id` URIs to every FAQPage / Article / Service JSON-LD emission.**
Section 4.2 mentions this but it's not a P0/P1 line item. With FAQPage on home + pricing + faq + industries + blog posts, Google's RTC will flag overlapping entities without disambiguating `@id`s.

**A2. (P0) Audit the live-demo cycling phrases (`widgets/live-demo/`) for the same numeric drift.**
The demo animation cycles 5 user-facing phrases. If any of them contain "150+ industries" or latency numbers, they're surface #5 of §4.1 drift and need to be wired to `facts.ts`. Currently zero coverage.

**A3. (P0) Resolve sister-brand surface in footer.**
`footer.parentBrand: 'A product of Webappski. Sister product: TypelessForm.'` is on every page. Combined with the `.aeo-tracker.json` brand mismatch and the shared founder, an LLM may conflate Typelessity and TypelessForm. Either commit to a single-line "About Webappski" link that disambiguates (e.g. "Webappski makes Typelessity (booking) and TypelessForm (form-filling)") or remove the sister-product line from the global footer and surface it only on `/about`.

**A4. (P0) Audit `core/consent/` cookie banner copy.**
Plan §3.9 says cookie policy is missing; before drafting one, confirm what consent banner is currently shown. If it already collects analytics consent in compliant form, the gap is documentation, not banner work.

**A5. (P1) Audit `translations.{de,pl,ru}.ts` for key coverage vs `translations.en.ts`.**
The plan declares the multilingual story facade-only but doesn't verify whether even the chrome translations (nav + footer + SEO meta) are present and consistent across all 4 locales. A locale missing `nav.howItWorks` ships as raw key strings.

**A6. (P1) Verify `tools/build-sitemap.ts` actually exists and runs.**
Plan §4.8 cites this tool ("The build script in `tools/build-sitemap.ts` … needs to actually run as a postbuild step"). I confirmed the file exists (`ls tools/`: `build-blog-index.ts`, `build-sitemap.ts`). Did not read it. Plan should verify what it currently outputs vs what's checked in.

**A7. (P1) Verify `scripts/verify-jsonld.ts` is wired into CI.**
This script exists; plan never mentions it. If it's broken or unwired, the Schema.org P0s have no regression guard.

**A8. (P1) IndexNow integration audit.**
`public/426a67efe405494f9da92670749a0f86.txt` exists (IndexNow key); `scripts/indexnow.sh` exists. Plan doesn't audit whether IndexNow is actually being called on publish. AEO discovery surface; P1 not P0.

**A9. (P1) Document FAQ schema visible-content-mirror policy.**
§3.1 notes that home renders 7 FAQs but schemas 19. Google's RTC guidance: "The content must be the same on the page and in the markup." This is a moderate policy risk — flag explicitly, not as a one-liner note.

**A10. (P2) Audit `seo.service.ts` hreflang for `/blog/{slug}` paths.**
Blog posts are EN-only (plan §3.8 admits no translations). But `seo.service.ts:74-79` will still write hreflang for `de`/`ru`/`pl` versions of every blog post. That's a soft duplicate-content risk on top of the chrome-only translation issue.

---

## 10. Required edits to the plan to reach SHIP

Concrete checklist for the original analyst:

1. **Correct C1 (industries count).** Re-verify with grep, update §3.4 paragraph "Has exampleConversations": list the **7** correctly (remove hospitality-restaurants, realestate-residential, pet-veterinary). Update "32 skeletons" → "35 skeletons (81%)". Update P1 #17 to reflect 7 upgradable templates, not 10.
2. **Correct C2 (OG images).** Rewrite §3.8 "Cuts" / §4.9 / P1 #19 to: "Only 4 of 14 posts have `ogImage` set (the comparison posts, all pointing to the same comparison-card image). The other 10 fall back to the default brand OG. Effect: comparison posts cross-leak each other's OG; engineering posts share a generic brand card. Generate per-post OG art via `tools/build-blog-index.ts` (already exists)."
3. **Add coverage section.** New §3.11 covering header/footer/language-switcher/live-demo/contact-form. Even one paragraph each.
4. **Add §4.4a: llms.txt internal contradictions** that captures the line-11 vs line-67 latency split.
5. **Re-run §4.6 grep counts** with real numbers, not "rough."
6. **Reclassify** per §6 of this review: P0 #11, P0 #6 → P1; P1 #17 → P0; P2 #51, P2 #44 → P1.
7. **Split P0 #4 and P0 #8** into "P0-content" vs "P0-process / founder-decision" tracks.
8. **Sequence dependencies** per §7 (a 3-row table at the top of §5 showing required order: multilingual-decision → sitemap → industries-cleanup → numeric-unification).
9. **Resolve resolvable open questions** (Q11, Q14, Q15 — and propose values for Q8, Q9, Q13).
10. **Fix line-number drift** in 2-3 spots flagged in §5.m1.
11. **Add the 10 items** from §9 to the prioritized list with explicit IDs.
12. **Final pass:** read the plan in one sitting after edits; the document should be internally self-consistent (no numbers contradicting other numbers within the same plan).

Once those 12 are done, the plan ships.

---

## Closing

The plan is a strong first pass. The diagnosis is right; the prescription is mostly right; the line-by-line work is real. Two specific facts inside the plan are wrong, one big coverage area is unaudited, and a small handful of P0/P1s need rearrangement. None of this is structural — the document does not need to be rewritten, it needs a focused 1–2 hour fix pass and a 1-page addendum. After that, hand it to the implementer.

— Independent review, 2026-05-19
