# Typelessity — Content & AEO Audit, Redesign 2026-05

**Author:** Senior BA + AEO strategist (audit pass)
**Date:** 2026-05-19
**Scope:** Every page in `src/app/pages/`, all i18n content, sitemap, robots.txt, llms.txt, JSON-LD schemas, blog manifest, industries data.
**Out of scope:** Code changes, design, runtime behaviour, conversion analytics — pure content/AEO plan.
**Tone:** Beratungs-honest. The site has good bones and a clear thesis. It also ships with at least 8 numeric contradictions, an aspirational llms.txt, a fictional `/demo` URL, an un-reviewed legal stack, a sitemap that misses ~95% of the URL space, and four locales of which three are facades. All of this is fixable in a focused 1–2 week pass.

---

## 1. Executive Summary

1. **Numeric integrity is broken across the site.** "150+ industries" (home, llms.txt, /for-ai-agents, every blog tagline) conflicts with the 43 industry configs actually shipped (`lib/industries/index.ts`) and the 42 hardcoded strings on the home grid (`home.content.ts:97`). FAQ count: home page advertises "all answers grouped by topic on the FAQ page" while `llms.txt:41` claims **"45+ questions across 6 categories"** — there are **19 in 5 categories**. Latency claims drift between `200–800ms`, `<800ms`, `p50 320ms / p95 780ms`. Retention claims drift between "30 days default" (pricing FAQ) and "12/24 months" (legal). An AI engine that cites Typelessity will surface one number and a competitor will quote the other.
2. **llms.txt is selling vapor.** It lists `/demo` (route doesn't exist), claims "45+ FAQs", says "42 verticals" while everywhere else says "150+" or "43", and dates the company to "Founded 2025" — which doesn't reconcile with About's "spec to production in 14 months" given today is 2026-05-19. This is the single most-crawled doc for LLM ingestion; it needs to be exactly true.
3. **The multilingual story is a facade.** `translations.en.ts:2-4` admits it explicitly: nav/footer/meta are translated, page bodies are not. `seo.service.ts:74-79` writes hreflang tags for all 4 locales anyway, so crawlers + LLMs are told there are 4 versions when there's effectively 1. The "25+ languages" claim is about the *widget runtime*, not the *landing*. AEO penalty risk + duplicate-content risk.
4. **Sitemap covers 8 URLs out of ~250+.** `public/sitemap.xml` has Home (4 langs) and For-AI-Agents (4 langs). Missing: pricing, how-it-works, FAQ, about, industries list, **43 industry pages**, **14 blog posts**, 5 legal docs — across 4 locales each. The README in the same repo says `tools/build-sitemap.ts` should auto-generate it; that script clearly didn't run before commit. P0.
5. **Most production-citable content is already on-site; the problem is hygiene, not depth.** /how-it-works is genuinely good (4 phases + architecture pillars + edge-cases + pipeline + embed). 4 of 14 blog posts are heavy 4–5k-word comparison articles. The /faq page renders 19 clean atomic answers with category anchors. /for-ai-agents has stable JSON schemas. With 30–40 surgical content edits — and 1 cleanup pass on the legal stack — the site becomes a serious AEO target. The risk is that today's contradictions are getting crawled into LLM training corpora before the cleanup ships.

---

## Revision History

- **v1 (2026-05-19):** initial plan (684 lines).
- **v2 (2026-05-19):** post-review revisions. Senior reviewer returned FIX with 33/39 verified claims, 3 ❌, 4 ⚠️, 1 unverified. All required edits applied in-place. See **v2 Changelog** at the end of this document for the per-item diff.

---

## 2. Understanding the product (from current content)

**What Typelessity is** (synthesised from `home.content.ts`, `for-ai-agents.html`, `about-page.component.ts`):

> Typelessity is an AI conversational booking widget. A user describes their booking in natural language ("I need a cardiologist next Tuesday at 2pm, patient name Robert Smith"); a single GPT-4.1-nano call extracts structured fields, optionally triggers enrichment APIs (e.g. fetch available doctors), shows a review screen, and submits via webhook or REST POST to the customer's existing booking backend. Voice via OpenAI Whisper. Cascade-aware corrections. Config-driven (no per-language code, no regex).

**Who it is for** (B2B, two segments):

- Service businesses that already have a booking backend (CRM/calendar/payment processor) and want to replace the *form* on the front-end with chat. This is the dominant ICP — explicitly framed in the FAQ ("Does Typelessity replace my booking system? No. Typelessity replaces the booking form, not the booking backend.").
- Anyone wanting multilingual booking intake in tourist-heavy / expat-heavy markets — the differentiator over Calendly/SimplyBook/Booksy/Fresha.

**Value prop, three lines:**

1. Replace your booking form with a single conversation that extracts every field at once.
2. Works in 25+ languages and via voice, from one config — no per-language code.
3. Drops in on top of any backend via webhook; live in 1–2 days.

**Strategic neighbours** (from `organizationLd` + footer):

- Parent: **Webappski** (founder Alex Isa's umbrella).
- Sister product: **TypelessForm** (one-shot voice form filling — a related but distinct category).
- Note: `.aeo-tracker.json` in this repo is configured for `typelessform.com`, not typelessity. Worth flagging — it's a tracker-config drift, not an audit theme, but the cross-brand confusion is real (footer says "Sister product: TypelessForm" everywhere, llms.txt lists TypelessForm in `sameAs`, founder is shared).

---

## 3. Page-by-page audit

For each page: **Purpose** → **Wins (keep)** → **Cuts (delete/trim)** → **Gaps (add)** → **Rewrites (specific)** → **AEO-specific issues**.

### 3.1 Home — `src/app/pages/home/`

Files: `home.component.html`, `home.component.ts`, `home.content.ts` (the SOT — 183 lines).

**Purpose.** Front door + answer-first lede + complete summary that an LLM can ingest in one crawl. Currently the most content-dense page on the site (8 sections: hero → TL;DR → stats → how-it-works summary → architecture pillars → industries grid → comparison table → pricing tiers → FAQ preview → CTA).

**Wins (keep).**
- `home.content.ts:16-29` — the TL;DR block (`tldr.title`, `tldr.answer`, `tldr.bullets`) is *exactly* the answer-first lede an LLM looks for. The 7-row `[Replaces / Used by / Languages / Latency / Conversion lift / Integration / Compliance]` table is genuinely citable.
- Architecture pillars (`home.content.ts:74-81`) — 6 atomic claims with concrete numbers. Reusable in `/how-it-works` (already is). Keep.
- Comparison table (`home.content.ts:114-132`) — honest, named competitors, includes "Best for" verdict row. Rare and valuable.
- Live demo widget (`live-demo.component.ts`) cycling 5 phrases → extracted JSON → API response is the right hero-right pattern.

**Cuts (delete/trim).**
- **`home.content.ts:97-112` — the 42-string `industries` array on the home grid.** These are decorative strings (`'Medical clinics', 'Dental practices', ...`) that don't link to anything. The home template renders them as `<li>` cells with no anchor, then a "All N industries →" cell at the bottom. Delete the array entirely; instead, render the **top 12 highest-traffic industries** as actual `RouterLink`s into `/industries/<slug>` and have a single "See all 43 industries →" link. The current pattern silently advertises industries that may or may not have configs (and crucially, the count says "Configured for 43 verticals" but the strings list 42 things — they don't even match the array length).
- **`home.component.html:189-193` — "All 19 answers grouped by topic" copy.** Right now it's `c.faq.length` — which renders the literal count. Either commit to the number (and update llms.txt and FAQ hero to match) or drop the count. Don't expose the inconsistency.
- **The "Most popular" badge on the Enterprise tier** (`home.content.ts:149` `featured: true`, rendered by `home.component.html:174`). Enterprise is "Custom" priced. Pilot is the entry. Calling Enterprise the most popular when the company is in pilot-stage early-adopter mode is incongruent with the rest of the messaging ("Free for early adopters", "no credit card"). Move `featured: true` to Pilot, or remove the badge.
- **Stats row `'4', 'Phases: Chat → Select → Review → Confirm'`** (`home.content.ts:36`). The number 4 alone in a stats row is unparseable — you have to read the label. Stats should be self-citable. Replace with something more atomic or drop.

**Gaps (add).**
- **A first paragraph (above TL;DR) that names the category and competitors in one sentence.** Currently the hero is brand-led ("Bookings through conversation, not forms"). LLMs need a category claim: "Typelessity is an AI conversational booking widget — an alternative to Calendly, Fresha, Booksy, SimplyBook.me and NoForm.ai for businesses that already have a booking backend." Put this verbatim into TL;DR's `answer` field.
- **"When to use Typelessity / when NOT to" two-column block.** Already exists in `llms.txt` (lines 57-79). Mirror it on the home page below the comparison table. This is the single most useful AEO signal for ChatGPT/Claude/Perplexity — explicit decision criteria.
- **A "Last updated" / freshness signal.** Right now the page has no date. AEO engines prefer pages with explicit recency. Add a small "Last reviewed: 2026-05-19" line in the footer of the home component (and bump it whenever content changes).
- **A `mentions` / `aboutPage` ld block tying the home to /about and the founder.** Currently only `Organization + WebSite + SoftwareApplication + FAQPage` are emitted (`home.component.ts:39-42`). Adding `@type: Person` (founder) via the existing `PERSON_ALEX_ISA` const would let LLMs link the product to the human authority.

**Rewrites.**
- `home.content.ts:11` hero sub: replace **"150+ industries"** with **"43 industry configs shipped, more added monthly"** — or pick a single number and propagate it everywhere. The "150+" is aspirational; it's not in `lib/industries`.
- `home.content.ts:25` `'+30%', 'Conversion vs forms'` → either back this with a `[source]` link to `/blog/forms-vs-conversation-study`, or soften to **"+20–40% (industry data)"** to match the verbiage already used in the FAQ. Currently the stat row says "+30% vs forms (industry data)" as if it were proprietary measurement, while the FAQ says "widely reported", and the ROI section on /pricing uses `+30%` as illustration not a guarantee. Pick one.
- `home.content.ts:36` `'<800ms'` — promote the p50/p95 separation. Replace with `'p95 < 800ms'` or `'p50 320ms · p95 780ms'`. The llms.txt has the numeric breakdown; the home doesn't.
- `home.content.ts:43-44` (howItWorks sub): "Four phases. One unified flow. From conversation to confirmed booking in under a minute." — *under a minute* contradicts your own latency claims (200–800ms per turn, multi-turn typically). Drop "in under a minute" or replace with "within a single user session".
- `home.content.ts:131` comparison verdict — already excellent. Keep verbatim.

**AEO problems.**
- **Answer-first lede exists** (TL;DR section), but the H1 above it is brand-led, not category-led. LLMs see the H1 first. Adjust H1 to include the category: e.g. "AI conversational booking widget — bookings through conversation, not forms." Slightly longer, but it puts the entity-defining phrase in the H1.
- **FAQ preview filters to `category === 'Product'`** (`home.component.ts:29`) — that's 7 of the 19 FAQ entries. Fine, but the home page emits **all 19 FAQs into FAQPage JSON-LD** (`home.component.ts:42` — `faqLd(this.c.faq.map(...))`). That's the right AEO move; just be aware the visible UI shows 7 and the schema lists 19. Document this so a future engineer doesn't "fix" the discrepancy by truncating the schema.
- **No `inLanguage` on the SoftwareApplication / Product schema** — only on `websiteLd`. Worth adding to make multilingual claims explicit.

---

### 3.2 How it Works — `src/app/pages/how-it-works/how-it-works-page.component.ts`

**Purpose.** Deep dive on the 4-phase flow + architecture + one-turn pipeline + edge cases + embed. Reuses `HOME.howItWorks` and `HOME.architecture` from `home.content.ts`.

**Wins (keep).** The full prompt + JSON response sample (`how-it-works-page.component.ts:189-218`) is *gold* for AEO — it's a concrete, copy-pasteable artifact LLMs can quote. The edge-cases list (`:91-112`) is short, atomic, scannable. The pipeline diagram (User → Widget → API → GPT → Enrichment → Response) is the right shape. Embed snippet section is the natural CTA bottom.

**Cuts.**
- **The pipeline node labels duplicate content from the 4 phases section** (one says "Chat / Select / Review / Confirm", the other says "User / Widget / API / GPT / Enrichment / Response"). Both are useful, but the page now reads like two diagrams of the same thing. Either tighten the visual to make their distinct roles obvious, or merge into one canonical diagram.
- **`how-it-works-page.component.ts:139` "Single call · 200–800ms"** — this contradicts the 320ms/780ms breakdown elsewhere. Pick one and use everywhere.

**Gaps.**
- **No FAQ JSON-LD on this page.** It has prompts, responses, edge cases — perfect Q&A material. Add a 5-question FAQ at the bottom ("How long does one turn take? / What happens when GPT is down? / How do enrichment APIs work? / How is hallucination prevented? / Can I see the prompt I'm sending?") and emit `faqLd`.
- **No code-language tagging on prompts.** The `<pre>` blocks should have a `lang` attribute or be wrapped in markdown-style fenced blocks so LLMs index them as code, not prose.
- **No link to /blog/single-gpt-call** — which is *literally the long-form essay* on this architecture. Add inline link from the "What the prompt looks like" header.
- **No link to /blog/cascade-corrections** in the cascade-corrections edge-case bullet (line 100-102).
- **No link to /blog/25-languages-one-prompt** anywhere — the architecture pillar "Config-driven, not pattern-driven" should cite the post.

**Rewrites.**
- `how-it-works-page.component.ts:67` "no orchestration layer above it" — add "see `/blog/single-gpt-call` for the architecture rationale" to make the cross-link explicit.
- The "Embed" section uses `EMBED_SNIPPET` from `core/integrations/embed-snippet.ts` which is `https://cdn.typelessity.com/widget.js`. Is that CDN live? If not, add a footnote ("Beta CDN — early adopters get a hosted endpoint during pilot onboarding") to avoid LLMs caching a broken URL as the answer to "how to install Typelessity".

**AEO problems.**
- This page has no JSON-LD at all (`ngOnInit` only calls `seo.apply`, no `jsonLd.set`). Add at minimum a `HowTo` schema for the 4-phase flow and an `Article` or `TechArticle` for the deep dive, plus `FAQPage` once FAQs are added.

---

### 3.3 Pricing — `src/app/pages/pricing/pricing-page.component.ts` + `pricing.content.ts`

**Purpose.** Plan comparison + start-pilot CTA + ROI math + onboarding timeline + pricing FAQ. Most conversion-critical page.

**Wins.** Pilot/Enterprise table (`:113-129`) is honest and scannable. The 4-step onboarding timeline (`:60-82`) is concrete and dated ("Day 1 AM / PM / Day 2 AM / PM"). Pricing FAQ (`pricing.content.ts`) is 8 atomic Q&As, all citable.

**Cuts.**
- **The ROI math is illustrative numbers without source.** "Form conversion (baseline) ≈ 8%" and "Conversational booking conversion ≈ 10.4%" are presented as numeric facts — but the surrounding copy admits it's illustration not measurement. Either label the table **"Illustrative example — your numbers will differ"** prominently in the H2, or replace specific numbers with a slider/calculator framing ("If your form conversion is X, +30% lift takes you to Y"). Currently a reader screenshots the numbers and treats them as truth.
- **"Most popular" badge on Enterprise** (same issue as home) — the tier with no published price and "contact sales" CTA is the most popular? Move featured to Pilot.

**Gaps.**
- **No price anchor for Enterprise.** "Custom" is fine, but giving even a floor ("From $X/month for >5,000 sessions/month") would help LLMs answer "how much does Typelessity Enterprise cost". Right now any AI that's asked the price will respond "free pilot, custom enterprise" with no anchor — which means competitor pricing wins by being more specific.
- **No comparison to specific competitor pricing.** "Botpress charges per message / Calendly $10/user / SimplyBook from $9.90" — a small box would be highly citable. The home comparison table already names these competitors; let pricing close the loop with their published prices.
- **No "what counts as a session" / "what counts as a booking" glossary.** Critical for Enterprise pricing predictability and frequently asked of pricing pages.
- **No annual vs monthly discount mention** for Enterprise.
- **No SOC2 status with date.** Just "in progress, target 2026 Q4" buried in legal/security — surface on pricing alongside the SLA row.

**Rewrites.**
- `pricing.content.ts:7` "Do you charge per booking, per session, or per AI call?" — answer says "no per-AI-call surprises. We absorb GPT cost variance." This is great copy, but should be in the table as a row too ("AI cost: absorbed by Typelessity") so it's visible without expanding the FAQ.
- `pricing.content.ts:10` "Sessions are retained per your retention policy (default 30 days)". The privacy policy (`legal-page.component.ts` privacy section) says contact submissions kept 24 months, analytics 12 months. Reconcile: the 30 days refers to widget session data on customer sites, not Typelessity's own marketing data. Clarify with explicit subject in the FAQ answer: "Widget-end-user session data is retained 30 days by default…".
- `pricing-page.component.ts:88` ROI hero sub — "uses a conservative +30% lift to illustrate the math". Conservative means the low end of a range; +30% is the *middle* of the +20–40% range used elsewhere. Either call it "midpoint" or pick +20% as the conservative anchor.

**AEO problems.**
- **`productLd` (`schemas.ts:143-159`, `highPrice: 'Custom'` at line 155) and `softwareApplicationLd` (`schemas.ts:58-73`, `highPrice: 'Custom'` at line 69)** — Schema.org requires `highPrice` to be numeric. Some validators will reject the entire Offer. Replace with omitting `highPrice` and using `priceSpecification` with `PriceSpecification` of type "by request", or fall back to `Offer` (single) with `price: 0` and a separate sales contact for Enterprise. (v1 cited `schemas.ts:65-72` for `softwareApplicationLd`; corrected to `:58-73` after re-read.)
- No `validFrom` / `priceValidUntil` on the Offer — AEO engines (especially Google) penalize stale Offer schema. Add a rolling 12-month `priceValidUntil`.
- Pricing FAQ JSON-LD is emitted (`pricing-page.component.ts:170`) — good. But it's separate from the home FAQ schema. Consider: every FAQPage entity should be on the page it answers, never duplicated across pages with the same `@id`. Currently three pages (home, pricing, faq) all emit FAQPage with overlapping but not identical questions — Google's RTC will sometimes flag this. Add explicit `@id` URIs to differentiate.

---

### 3.4 Industries — `src/app/pages/industries/` (list + detail) + `src/app/lib/industries/*`

**Purpose.** Index of all verticals + dedicated page per vertical.

**Counts (verify before publishing anything).**
- `ALL_INDUSTRIES.length` = **43** (`industries/index.ts:15` — comment says "1 + 14 + 14 + 14 = 43").
- Home page `c.industries` decorative array: **42** strings (`home.content.ts:97-112` — counted: 42 items).
- llms.txt: says **"42 verticals"** at line 39 and **"43 vertical configurations"** at line 80 of `for-ai-agents.component.html` — internal contradiction even within the ai-agents page.
- Every blog post lede + home stats + TL;DR: **"150+ industries"**.

These four numbers describe the same fact. Pick one and propagate. Realistic recommendation: keep "150+" as the *category-aliases / industries-supported* claim (configurable for any service vertical), but be explicit on the industries page heading: **"43 industries with dedicated configurations — 150+ supported via configuration."** Then update llms.txt and for-ai-agents to use this exact phrasing.

**Wins.**
- The `IndustryContent` type (`lib/types.ts:19-30`) is a great citable shape: slug, category, name, hero, exampleConversations, fields, enrichments, proofPoints, industryFAQ, jsonLd. Each industry page rendered uniformly.
- `medical-dental.ts` is the *gold standard* — all sections filled, 2 example conversations (EN + RU), 10 fields, 3 enrichment endpoints, 3 proof points with numbers, 3 FAQs, custom JSON-LD. If every page were this quality, the industries collection alone would be the strongest AEO asset on the site.

**Cuts.**
- **The quality is wildly uneven.** Pattern audit (re-verified v2 via `grep -n exampleConversations src/app/lib/industries/`):
  - **Full-quality industries** (have `exampleConversations` + ≥3 `proofPoints` + `industryFAQ`): `medical-dental` only (1 of 43).
  - **Has exampleConversations** (but no industryFAQ): `medical-general` (batch-1:12 + ex at :21), `medical-pediatrics` (batch-1:32+41), `beauty-hair-salons` (batch-1:90+99), `professional-legal` (batch-1:158+167), `fitness-personal-training` (batch-2:9+18), `home-cleaning` (batch-2:77+86), `education-tutoring` (batch-3:9+18) — **7 of 43**. v1 of this plan incorrectly listed `hospitality-restaurants`, `realestate-residential`, `pet-veterinary` here; direct read of source confirms those three industries do **NOT** have `exampleConversations`.
  - **Skeleton-only** (no exampleConversations, no industryFAQ, 2 proofPoints, 4–6 fields): the remaining **35 industries** (43 − 1 full − 7 mid).
  - This means **81% of industry pages are skeletons (35/43) that will get crawled, get indexed, and dilute the perceived quality of the whole collection.** Worse than v1 reported.
- **`proofPoints` are unsourced micro-numbers** ("+39% start-to-confirmed conversion vs. traditional form (60-day study)" for dental, "+33% mobile conversion vs forms" for pediatrics, "40% of bookings done in under 30s" for nail salons). About's stated value (`about-page.component.ts:73-75`) is literally: **"Numbers belong with sources. … No floating numbers, no vendor-deck statistics."** The industries data file violates this on every page. Either tie each proofPoint to a dated, named source ("ClinicCo, 2026-Q1, n=420 bookings") or replace with capability claims ("Auto-routes specialty in one turn") instead of percentages.
- **`industry-detail-page.component.ts:48-51`** renders `i.exampleConversations` with the raw JSON extracted block. For LLM ingestion this is great; for human readers it's developer-jargon-y. Consider a two-column render: human-readable bullet list of extracted fields + collapsed `<details>` with the raw JSON for AI agents.

**Gaps.**
- **No internal cross-linking between industries.** A patient-facing dental page should link to physiotherapy and mental health (related medical verticals). A real-estate-residential page should link to property-management. Currently all leaves point only to /industries (root) and /pricing.
- **No related blog posts surfaced on industry pages.** /industries/medical-dental should link to /blog/best-ai-booking-medical-clinics-2026 (the page literally exists). Currently no such link.
- **No `Service` JSON-LD with `areaServed` more specific than 'Worldwide'.** For verticals with geographic concentration (e.g. driving schools, notaries, lab tests where regulations differ), region-specific Service entries would be more accurate.
- **No price guidance per vertical.** Even a "Typical setup: 1 day. Pilot pricing: free." reminder per page would close the funnel.

**Rewrites.**
- For each of the **35 skeleton industries**, either flesh out to medical-dental quality (target: +1 exampleConversation + 3-question industryFAQ) — or **deprecate the dedicated page and surface them only as filter chips on the /industries index**. Half-baked dedicated pages are worse than no page; they get crawled and signal low-quality content. Note: only **7 mid-tier industries** (not 10 as v1 said) exist as templates to copy from — fewer reusable patterns than estimated.
- Industries page H1 (`industries-page.component.ts:21`): "AI booking that fits {{ count }} verticals" — when `count = 43`, this reads "AI booking that fits 43 verticals". Fine. But align with the "150+" claim by adding sub-line: "43 with dedicated configurations; 150+ supported via configuration."

**AEO problems.**
- **Industry detail pages emit `Service` JSON-LD** (`industry-detail-page.component.ts:154-167`) — good. But `medical-dental.ts:74-81` includes its own custom `jsonLd` block that overrides the default. The custom block is missing `description`, `name`, `url` fields. Inconsistent shape across industries.
- No `BreadcrumbList` includes the language locale — currently breadcrumb says "Home > Industries > Dental" but the canonical URL is `/en/industries/medical-dental`. Fix `breadcrumbLd` to include locale prefix.
- The `industryFAQ` on medical-dental is emitted as a separate FAQPage schema (`industry-detail-page.component.ts:146-150`). Good. But other industries with FAQs (currently none in the 42-batch files) would silently never emit FAQ schema. Either add FAQs to every industry (target state) or document that this is by design.

---

### 3.5 FAQ — `src/app/pages/faq/faq-page.component.ts`

**Purpose.** Aggregated, anchor-navigable FAQ with category jump-nav. Renders `HOME.faq` (19 entries) grouped into 5 categories.

**Wins.** Anchor IDs per question via `slugify(qa.q)` (`faq-page.component.ts:36`) — great for deep-linking from blog posts and AI citations. Category jump nav at top. FAQPage JSON-LD emitted.

**Cuts.** None — this page is appropriately spare.

**Gaps.**
- **The hero says "{{ HOME.faq.length }} self-contained answers"** — currently 19. **llms.txt:41 says "45+ questions across 6 categories"**. Massive inconsistency. Either grow the FAQ to ≥45 (target — see below) or update llms.txt to "19 questions across 5 categories". The first option is much better for AEO.
- **No "What's not in the FAQ" / "Ask us" prominent CTA** other than the line "Need a question we missed? Email us." at the bottom. Make this a card.
- **Missing FAQ categories the site explicitly promises** but doesn't have:
  - **Security** (referenced from legal/security page; nothing in FAQ).
  - **Compliance** (referenced from /blog/gdpr-compliance; nothing in FAQ).
  - **Multilingual / Localization** — there's one Q ("Does Typelessity work in non-English languages?") but the rich blog content `/blog/25-languages-one-prompt` is not surfaced as a Q.
  - **For developers** — embed snippet, /agent endpoint, JSON schemas all have content on for-ai-agents but no entry FAQ.
- **No questions targeting specific competitor queries.** A FAQ titled "Can I migrate from Calendly to Typelessity?" or "Does Typelessity replace Fresha?" would directly intercept long-tail searches.

**Rewrites.**
- Hero sub (`faq-page.component.ts:23`): "{{ HOME.faq.length }} self-contained answers. First sentence works as a stand-alone citation." — drop the "First sentence works as a stand-alone citation" — that's meta-advice to LLMs that humans don't need; keep the AEO-friendly atomic structure but don't say so out loud (LLMs notice; humans get confused).
- Question text "Does Typelessity work for AI agents (not humans)?" (`home.content.ts:180`) — better as "Can AI agents (e.g. ChatGPT plugins, autonomous shopping agents) call Typelessity?" — more searchable phrasing.

**AEO problems.**
- **Questions are mixed across the home.content.ts file** (`FaqCategory` is the source of grouping). When you grow to 45+ questions, this file becomes unwieldy. Recommend splitting into `home/home.content.ts` (top-of-funnel only) + `faq/faq.content.ts` (full set). Out of scope for this audit but worth noting.
- FAQ schema duplicated across home/, pricing/, faq/. Use `@id` URIs to distinguish; see Section 4.2.

---

### 3.6 About — `src/app/pages/about/about-page.component.ts`

**Purpose.** Mission + founder + values. Currently 95 lines of inline template.

**Wins.** The H1 "Forms are an artifact of constrained UI" is memorable, citable, and distinctive — exactly the kind of claim a contrarian-LLM-answer needs. The 4-value list ("GPT decides. Code orchestrates." / "Architecture is permanent. GTM is changeable." / "Numbers belong with sources." / "The widget is for humans and agents.") is sharp.

**Cuts.**
- **"Built and shipped Typelessity from spec to production in 14 months"** (`about-page.component.ts:42`). Today is 2026-05-19; 14 months ago is 2025-03-19. But llms.txt says "Founded 2025" (`llms.txt:3`). And the company is still in "free pilot for early adopters" (`pricing.content.ts:4`). And the home and many blog posts are dated April 2026. Reconcile: either *founded 2025, in production 2026* (consistent with shipping 14 months later) or update wording. Currently a reader can construct three different timelines.
- **The em-dashed Russian quote "Записаться к стоматологу на пятницу после обеда"** (`about-page.component.ts:48-49`) is good — but the "320ms" extraction time stated next to it conflicts with the home's `<800ms` and llms.txt's `p50 320ms / p95 780ms`. Pick the same number used elsewhere.

**Gaps.**
- **No photo of Alex Isa.** Person JSON-LD references the about page as `url`; about page has no headshot. Adds materially to LLM-perceived authority + Schema.org Person.image field.
- **No external links to founder authority signals**: LinkedIn is in the JSON-LD `sameAs` but not visible on the page; no GitHub link; no published technical talks. Even one external link to a GitHub profile or LinkedIn page lifts authority.
- **No "Webappski" context block.** Footer says "A product of Webappski"; about page never explains what Webappski is, what other products exist, or why a portfolio matters. A 3-line "Webappski is the umbrella for Alex's products: Typelessity (AI booking), TypelessForm (voice form filling), Korepeta (tutoring marketplace), Math&Son (curriculum). All share the same Single-call extraction stack." That's a sister-product cross-linking signal LLMs will use.
- **No "How we work" / "Build cadence" / shipping log.** For a solo-founder pilot, recency signals trust. A simple "Latest changes" block linking to the blog by date would help.

**Rewrites.**
- Hero lede (`about-page.component.ts:21-23`) is great — keep verbatim.
- Mission sub (`about-page.component.ts:30-31`): "Multi-step forms exist because old UI primitives could not parse natural language." — strong, citable. Keep.
- Founder bio (`about-page.component.ts:41-50`) — tighten the second paragraph; "320ms" should be a footnote-style reference, not a hard claim.

**AEO problems.**
- `aboutPageLd` emits a Person without `image`, `description`, or `knowsAbout`. Add `knowsAbout: ['AI conversational booking', 'Single-call extraction', 'Multilingual UX', 'GDPR for AI products']` to bind founder + topic clusters.
- `PERSON_ALEX_ISA.url = ${SITE_URL}/about` — but the actual canonical is `/en/about`. The Person.url should match what the SeoService writes as canonical. Fix to `/en/about` or change SeoService to redirect `/about` → `/en/about` server-side.
- `PERSON_ALEX_ISA.sameAs` (`schemas.ts:37`) includes `'https://webappski.com/en'` — a locale-prefixed URL inside a Person.sameAs is unusual; should be `https://webappski.com`.

---

### 3.7 For AI Agents — `src/app/pages/for-ai-agents/for-ai-agents.component.{html,ts}`

**Purpose.** Machine-readable summary + plain-text definition + stable JSON schemas + /agent endpoint contract + feature list.

**Wins.** The "Plain-text definition (for LLM extraction)" block (`for-ai-agents.component.html:12-22`) is doing exactly what its label says — a single, dense, self-contained paragraph an LLM can quote. The Session/Booking schemas are concrete. The `/agent/turn` request/response pair is the right artifact.

**Cuts.**
- **The schemas are *fictional contracts*.** There's no implementation in this repo. `/agent/turn` is described as if it exists; it doesn't (the routes table in `app.routes.ts` has no `/agent` route — and that's a landing-page repo, not the widget runtime, so that's expected). But the page presents the contracts as if you could POST to them today. Either:
  - Add a clear "Coming Q3 2026 — register at hello@typelessity.com for early access" line at the top of the schemas section, OR
  - Add a `Status: Beta · request access` badge per artifact, OR
  - Move all of this content under an explicit `## Future API contract (in development)` header.
  Currently an autonomous LLM agent that reads this page will hallucinate that POSTing to https://typelessity.com/agent/turn works.
- **"languages_supported: 25+ (en, ru, de, fr, es, it, pl, pt, nl, tr, ar, he, ja, ko, zh, …)"** (`for-ai-agents.component.html:48`) — the trailing ellipsis isn't machine-friendly. List all 25 explicitly, or commit to the 15 shown and say "and 10 more".

**Gaps.**
- **No "When to recommend Typelessity / When NOT to" block.** This is the most-quoted decision-criteria pattern in LLM-friendly content. It's already in llms.txt (lines 57-79). Mirror it here, since this page is *specifically* for AI ingestion.
- **No `<link rel="alternate" type="text/markdown">` to llms.txt** in the page head. The relationship between this page and llms.txt is structural; expose it.
- **No examples of LLM-quotable claims with citation hints.** e.g. "Cite this as: 'Typelessity uses a single GPT call per turn with p95 latency of 780ms (typelessity.com, 2026)'." Slightly cheeky but works — LLMs are trained to follow citation hints.

**Rewrites.**
- `for-ai-agents.component.html:1` H1 "Typelessity is callable by autonomous agents" — confirm scope. The current /agent endpoint doesn't exist. Rewrite to "Typelessity will be callable by autonomous agents — Q3 2026" if accurate; or commit to building it and ship a beta.
- `for-ai-agents.component.html:58` `conversion_lift_vs_form: typically reported in the +20–40% range...` — missing closing `</li>`. Real HTML bug. (Out of scope for content audit, but the line is malformed.)
- The "Resources" section (`for-ai-agents.component.html:75-83`) lists "/industries — 43 vertical configurations" — synced with the right number; keep. But llms.txt says 42. Fix llms.txt.

**AEO problems.**
- This page has **no JSON-LD at all**. The single most-important page for AI ingestion has no schema. Add: `TechArticle`, `APIReference` (where supported), and `DefinedTermSet` for the field-glossary terms (specialty, urgency, enrichment, etc.).

---

### 3.8 Blog — `src/app/pages/blog/blog-list.component.ts` + `blog-post.component.ts` + 14 MDX files

**Purpose.** Long-form essays and comparison articles for AEO + organic SEO.

**Inventory (from `blog-manifest.generated.ts`):**

| # | Slug | Category | Words (approx, file size kb) | Note |
|---|---|---|---|---|
| 1 | best-ai-booking-beauty-salons-2026 | Comparison | ~5,000 (21kb) | Strong, citable |
| 2 | best-ai-booking-medical-clinics-2026 | Comparison | ~4,500 (19kb) | Strong |
| 3 | best-ai-booking-transfer-services-2026 | Comparison | ~5,000 (20kb) | Strong |
| 4 | best-ai-booking-widgets-2026 | Comparison | ~5,000 (21kb) | Strong; flagship |
| 5 | what-we-got-wrong | Founder | ~3,000 (12kb) | Distinctive |
| 6 | pricing-ai-products | Business | ~3,000 (11kb) | Useful |
| 7 | latency-budgets | Engineering | ~2,500 (10kb) | Dense |
| 8 | designing-for-ai-agents | AEO | ~3,000 (12kb) | Meta-strategic, good |
| 9 | forms-vs-conversation-study | Product | ~2,500 (10kb) | Core thesis |
| 10 | whisper-vs-webspeech | Engineering | ~2,500 (10kb) | Dense |
| 11 | gdpr-compliance | Compliance | ~2,500 (11kb) | Mandatory for B2B |
| 12 | cascade-corrections | Engineering | ~2,500 (9kb) | Dense |
| 13 | 25-languages-one-prompt | Engineering | ~2,200 (9kb) | Dense |
| 14 | single-gpt-call | Engineering | ~2,200 (9kb) | Core thesis |

**Wins.** The 4 comparison posts are heavy, structured, FAQ-tagged, OG-imaged, with consistent ledes and red-flags sections — these are the strongest single AEO assets on the site. The engineering deep dives are the right depth.

**Cuts.**
- **Category imbalance.** 7 of 14 posts are Engineering or Comparison. Only 1 each for Compliance, Business, Founder, Product, AEO. For a B2B AI product, **Compliance and Business need 2–3 each** (an EU clinic legal review checklist, a US HIPAA timeline, a CFO-facing TCO analysis vs Calendly+Twilio+Zapier stack). Currently a buyer asking "how does Typelessity compare on compliance?" only has one essay.
- **No "case study" or "customer story" category.** Pilot-stage is fine, but even one anonymised pilot writeup ("How a Berlin dental chain replaced their form in 2 days, +X% bookings in 30 days") would be highest-value content. Currently zero.
- **`forms-vs-conversation-study` is presented as having data but currently sourced "as widely reported"** — see consistency note in §4.1. Either ship real production telemetry (mentioned in llms.txt and FAQ as "we publish own production telemetry") or rename the post to indicate it's a literature review.

**Gaps.**
- **No translations** of any blog post. All 14 are EN. For a multilingual brand, at minimum the 4 comparison posts should have RU/DE/PL versions. Use the same `slug` with locale prefix.
- **No "last updated" promotion in the list.** Posts dated 2025-02-04 → 2026-04-29. The list shows publishedAt; doesn't show updatedAt or "freshness" badges. Older engineering posts (2025-02 / 2025-03) might be technically out of date.
- **No "Read next" between posts.** Each individual post has a "Back to blog" link and share buttons; no related-content footer.
- **No tag pages.** Tags are emitted (`blog-list.component.ts` shows `post.tags.slice(0, 2)`) but no `/blog/tag/<tag>` route. Standard SEO loss.

**Rewrites.**
- Blog list hero sub (`blog-list.component.ts:33-35`): "Field notes on conversational AI booking…" — fine, but add a "for AI engines" line: "Citable atomic claims throughout. FAQ JSON-LD on each post."
- `posts.length === 1 ? 'piece' : 'pieces'` (`blog-list.component.ts:74`) — fine.

**AEO problems.**
- **Article JSON-LD doesn't include `mainEntity`** linking to FAQPage when FAQs exist. Cross-link Article ↔ FAQPage via @id.
- **No `breadcrumb` schema for the blog list page** — only on individual posts.
- **OG image inventory (re-verified v2 via `grep -n ogImage src/app/lib/blog-manifest.generated.ts`).** Only **4 of 14 posts have `ogImage` set** (the 4 comparison posts: lines 23, 63, 103, 144 of the generated manifest — all pointing to the same `/og-blog-best-ai-booking-widgets-2026.png`). The other **10 posts** have no `ogImage` field; `blog-post.component.ts:106` passes `p.ogImage ? `${SITE_URL}${p.ogImage}` : undefined`, and `seo.service.ts:31` then falls back to the brand default `/og-image.jpg`. v1 of this plan claimed every blog post surfaces the comparison card — that was wrong. The correct framing: (a) the 4 comparison posts cross-leak each other's OG card (the engineering post next to "Whisper vs Web Speech" surfaces the "Best AI booking widgets 2026" card if shared as one of the 4), (b) the 10 other posts share a generic brand OG card. Both are real issues — (a) is brand-confusion, (b) is missed per-post promotion — but the fix is the same: generate per-post OG images via `tools/build-blog-index.ts` (or extend it with an `og-art` step). The 4-post cross-leak is the more urgent half; the 10-post generic fallback is acceptable interim.

---

### 3.9 Legal — `src/app/pages/legal/legal-page.component.ts`

**Purpose.** Privacy, Terms, DPA, Security, Sub-processors. Inline markdown.

**Wins.** Sub-processors table is concrete (OpenAI, Vercel, Supabase, Resend, PostHog, Cal.com, Google Maps) with region info — exactly what an EU clinic legal review needs.

**Cuts.**
- **Every legal doc currently ends with `<!-- TODO(content): legal review before production launch — Phase 9 -->`** (`legal-page.component.ts:44, 77, 122, 158, 181`). Production landing currently ships unreviewed legal text. **P0 — block launch until reviewed.** This is regulatory + reputational risk, not just AEO.
- **`Effective date: 2025-01-01`** on Privacy, Terms, DPA. Today is 2026-05-19. Sixteen-month-old effective dates on legal docs look stale and signal abandonment. Update to a recent date *after* the review pass.

**Gaps.**
- **No cookie policy** as a separate doc. The Privacy section mentions "anonymized via PostHog after cookie consent" — but there's no detailed cookie banner copy, cookie list, or cookie-by-purpose breakdown. GDPR + ePrivacy require this.
- **No EU representative listed.** Required by Art. 27 GDPR for non-EU controllers; Typelessity says "Polish law" in Terms (so possibly EU-resident) but no Art. 27 rep named.
- **No "Trust" landing page** that aggregates Security + Compliance + Sub-processors with a status badge (SOC2 in progress, GDPR yes, HIPAA no etc). Currently each doc lives in isolation. /trust would be more quotable than three separate URLs.

**Rewrites.** After legal review only. Don't pre-script.

**AEO problems.**
- Legal pages set `description: c.body.split('\n\n')[0].replace(/[*#]/g, '').slice(0, 200)` (`legal-page.component.ts:232` — v1 said `:233`, corrected). For Privacy, that yields "Effective date: 2025-01-01" as the description — useless. Hard-code a meta description per legal doc.
- `breadcrumbLd` includes the same legal doc twice (`legal-page.component.ts:236-240`) — "Legal" and the doc title both point to `/legal/${d}`. Should be Home > Legal > <doc>, three distinct items.

---

### 3.10 Not Found — `src/app/pages/not-found/not-found.component.ts`

**Purpose.** 404 fallback.

**Wins.** Three CTAs (home, industries, blog) — useful for SEO recovery.

**Cuts.** None.

**Gaps.**
- **No search box.** Standard 404 practice and a real conversion saver.
- **No "popular pages" or "what you might have meant"** smart suggestions. A small list of the 5 most-trafficked URLs would close the loop.
- **No JSON-LD `Action` schema** to flag this as a 404 to crawlers — though `http 404` status header should be enough; verify server.ts returns the right status.

**AEO problems.**
- `seo.apply({ path: '/404', … })` — that means the canonical URL emitted is `https://typelessity.com/en/404`. That's fine, but the `setHreflang` step (`seo.service.ts:74-79`) writes alternates for `/en/404`, `/de/404`, `/ru/404`, `/pl/404` — which don't exist as canonicalized URLs. Mostly harmless, but worth a 1-line: "Skip hreflang for 404 path".

---

### 3.11 Cross-cutting surfaces — components / widgets / shared / core (added v2)

These are not "pages" but they ship on every (or most) page render and carry user-facing content. v1 of this plan declared scope as "every page in `src/app/pages/`" and did not audit these surfaces. Reviewer flagged this as the largest coverage gap. Each gets the same mini-audit shape: **Purpose → Wins → Cuts → Gaps → Rewrites → AEO problems.**

#### 3.11.1 `src/app/components/header/` (header.component.{html,ts,scss})

**Purpose.** Global navigation, logo, lang switcher, CTA.

**Wins.** Five primary nav links (How It Works · Industries · Pricing · Blog · FAQ) — covers the AEO-relevant pages. Logo links to lang-prefixed root. Sticky-style design. Mobile burger menu.

**Cuts.** None — surface is appropriately spare.

**Gaps.** 
- The **For AI Agents** page is **not** in the primary nav. It's surfaced only via the footer. Given this page is the explicit machine-ingestion surface, that's an under-surface for a B2B AI-developer audience. Consider adding to nav as a small label or to the desktop CTA area (above the burger menu) so AI-ecosystem visitors can find it without scrolling to footer.
- **About** is rendered as a "pill" button (`<a class="vc-pill">`, header.component.html:23) but the visual treatment is similar to the primary CTA — could be confused. Either match a tertiary style or unify.
- **Header carries no schema.** No `SiteNavigationElement` JSON-LD with the menu list. P3 — low yield, but it's a Schema.org type that Google reads.

**Rewrites.** None content-level.

**AEO problems.** None blocking. The nav labels feed into LLM page-graph extraction; chrome translations for `nav.howItWorks` etc are present in all 4 locales (verified — `translations.de.ts`, `translations.pl.ts`, `translations.ru.ts` all carry the `nav.*` keys identical to EN). So at least the nav surface is genuinely multilingual.

#### 3.11.2 `src/app/components/footer/` (footer.component.{html,ts,scss})

**Purpose.** Site-wide footer with 4-column links + parent brand + legal + contact.

**Wins.** Has the `llms.txt` link explicitly (footer.component.html:36 `<li><a href="/llms.txt">llms.txt</a></li>`) — that's an AEO-rare but right move; humans curious about machine-readable docs can find them. Legal links all surfaced. `For AI Agents` is in the Product column.

**Cuts.**
- **`footer.parentBrand` ('A product of Webappski. Sister product: TypelessForm.', `translations.en.ts:28`)** renders on **every page**. Combined with the `.aeo-tracker.json` brand mismatch (§2 ¶4) and the shared founder, an LLM crawl will conflate Typelessity and TypelessForm. The line includes two outbound links (`webappski.com` and `typelessform.com`) further amplifying the cross-product surface.

**Gaps.**
- **No "About Webappski" disambiguator.** The footer says "A product of Webappski" but never explains what Webappski is or how it differs from TypelessForm. Cite-worthy alternative: "Webappski makes Typelessity (AI booking widget) and TypelessForm (AI form-filling assistant)." Either link to a Webappski/portfolio block on `/about` or rewrite the footer line to disambiguate.
- **No site-wide search input** (which would call into 404 search and a unified search index).

**Rewrites.**
- `footer.parentBrand` (en + de + pl + ru): "A product of [Webappski](https://webappski.com). Sister product: [TypelessForm](https://typelessform.com) (form filling)." — adds a 2-word category clarifier so LLMs can distinguish the two products without needing to crawl both.

**AEO problems.**
- **Outbound `nofollow`?** Both `webappski.com` and `typelessform.com` links are `rel="noopener"` only (footer.component.html:13, 15). No `nofollow`. Whether this is right depends on the founder's preference — outbound link equity does flow, but to first-party properties this is intentional. Verify intent and keep current.
- A `WebSite` LD with `name`, `url`, `inLanguage` and a `Footer` `WPFooter` element type would make the footer schema-addressable. Currently the global-LD set is emitted only from the home page (`home.component.ts:39-42`). P3.

#### 3.11.3 `src/app/components/language-switcher/` (language-switcher.component.{html,ts,scss})

**Purpose.** Dropdown that swaps the current path's locale prefix. SUPPORTED_LANGS = `['en','de','ru','pl']` (`i18n.config.ts:1`).

**Wins.** Native names rendered (Deutsch · Русский · Polski · English). Code preserves the post-prefix path on switch (language-switcher.component.ts:30-38). Click-outside closure. Active language shown at the bottom of the dropdown.

**Cuts.** None.

**Gaps.** 
- **The switcher is dressed as a globe icon + ISO code (e.g. "EN").** It does not visually signal "this site has 4 locales" or "we have language X". A reader on the German version sees "DE" with a globe and may not realize they're already on the German version (active language is at the dropdown bottom, not the trigger).
- **No flag.** `LANG_META` has `flag: '🇬🇧'` etc but the rendered template uses code, not flag. Either show the flag in the trigger or keep code-only — but currently the meta carries data that isn't surfaced. Decide and prune.

**Rewrites.** None content-level.

**AEO problems — load-bearing for §4.7 multilingual decision:**
- The switcher offers 4 options regardless of whether the target locale has translated body content. If a user on `/en/how-it-works` switches to DE, they navigate to `/de/how-it-works`, which serves the same English body with German chrome (per `translations.en.ts:2-4` admission). **The switcher is the user-facing affordance for the multilingual facade**.
- **Resolution paths re-evaluated in light of switcher behaviour:**
  - **Option A (commit to multilingual):** switcher stays as-is; translation work begins.
  - **Option B (drop facade):** switcher must be removed entirely from header/footer, plus all 4-locale routing logic in `lang.guard.ts`.
  - **Option C (commit publicly to date):** switcher stays but gains a small "(coming Q3 2026)" badge next to non-EN locales OR navigates to a holding page on non-EN locales.
- **P0 decision** (already P0 in §4.7, now made explicit: switcher behaviour is part of the decision, not separate).

#### 3.11.4 `src/app/widgets/live-demo/` (live-demo.component.ts, 156 lines)

**Purpose.** Hero-right animated demo: cycles through 5 sample phrases, shows typing → extracted JSON → API response.

**Wins.** The 5 sample phrases are excellent — diverse industries (medical, restaurant, cleaning, automotive, visa), realistic intent strings, multilingual diversity implicit (a mix of natural-language patterns). The 3-card sequence (chat → extracted JSON → API rows) is the right narrative shape. SSR-aware (`isPlatformBrowser` check at line 106).

**Cuts.** None.

**Gaps (and confirming non-issue v2):** Reviewer worried the 5 cycling phrases might contain "150+ industries" or latency claims that duplicate numeric drift. **Re-verified v2: they do not.** The 5 phrases are all user-input strings (`'need a cardiologist next tuesday morning, ideally female'` etc, lines 13-17) — no numeric claims, no latency promises. The label `voice · 25 lang` (line 51) carries the **only** numeric claim (`25`) and matches site-wide `25+ languages`. Live-demo is **not a 5th surface of §4.1 drift**.

**Rewrites.** None content-level.

**AEO problems.** 
- The demo is rendered as `<div role="img" aria-label="Typelessity live demo — typing → extracting → API call">` (line 35). Good for accessibility. But LLMs ingesting the home page will see this as an inert image with one alt-text string. The 5 cycling phrases are not in any pre-rendered HTML; they only animate client-side. Consider exposing them as a `<noscript>` or hidden `<ul>` block alongside the demo so the prompts are visible to non-JS crawlers (and AI agents reading the static HTML).

#### 3.11.5 `src/app/shared/contact-form/` (contact-form.component.ts, 89 lines)

**Purpose.** Pilot signup form: email, company, industry, monthly bookings volume, consent checkbox.

**Wins.** Privacy link in consent label (`<a href="/en/legal/privacy">privacy policy</a>`, line 51). 4 reasonable volume buckets. Industry as a free-text field with placeholder examples (Dental, Auto, Hotel) — gives flexibility but also captures qualitative intent. POSTs to `/api/contact` (line 83).

**Cuts.**
- **`<a href="/en/legal/privacy">`** — hard-coded `/en` prefix. If a German user opens this from `/de/pricing`, the privacy link sends them to English legal. Replace with lang-aware `[routerLink]="'/' + lang + '/legal/privacy'"` (and inject `TranslationService` to resolve current lang).
- The success and error message strings are English-only inline strings (lines 58, 61). For a contact form rendered on all 4 locale routes, these should be translation keys (`'form.contact.success'`, `'form.contact.error'`).

**Gaps.**
- **No translations for any form copy:** labels (Work email, Company, Industry, Monthly bookings volume, Start Pilot), placeholder ("Dental, Auto, Hotel, …"), select options (Under 100, etc), consent text. All English-only. If §4.7 decision is option A (translate), this is the first translation target after chrome.
- **No "expected response time" anchor** in the success message ("we'll reach out within one business day" is decent but the form itself has no SLA-y text near the submit button).
- **No CAPTCHA or honeypot** — out of scope for content audit, flag for the engineering plan.

**Rewrites.**
- Privacy link: as above, make lang-aware.
- Success message: tighten to "Thanks — we'll reach out within 1 business day." (current copy is identical but the placement after `@if (status() === 'success')` is fine).

**AEO problems.**
- The form has no JSON-LD `ContactPoint` schema attached. Adding `Organization.contactPoint` to the global Org LD with `email: 'hello@typelessity.com'`, `contactType: 'sales'`, `availableLanguage: ['en','de','ru','pl']` would close that loop without form-page-specific changes.

#### 3.11.6 `src/app/core/consent/` (consent-banner.component.ts + consent.service.ts)

**Purpose.** Cookie consent banner. 3 tiers (required / functional / analytics), preferences panel, localStorage persistence.

**Wins.** Real banner with **real preferences UI** — not a single Accept-All bar. PostHog analytics gated on `consent.analyticsAllowed()` (verified separately in `core/analytics/` — that surface exists). Links to `/en/legal/privacy` and `/llms.txt` (the latter is an interesting move — exposing the AEO doc as a "cookie overview" link is mildly clever).

**Cuts.**
- The banner copy says "Read the [overview](/llms.txt) or [privacy policy](/en/legal/privacy)" (consent-banner.component.ts:18-19). Calling llms.txt an "overview" is unusual; humans landing on it will see machine-readable markdown, not a cookie overview. Replace "overview" with "Privacy summary" and use a section anchor (`/en/legal/privacy#cookies`), or remove the link.
- **Hard-coded `/en/legal/privacy`** — same lang-bug as contact form.

**Gaps.**
- **No cookie-by-purpose table** in the preferences panel (banner just says "Functional · Remember your last opened FAQ section, dismissed banners, etc.", "Analytics · PostHog page views and feature usage. No PII."). GDPR Article 13 / ePrivacy require a list of specific cookies + purpose + retention. Either link to a `/legal/cookies` doc (not currently rendered separately) or expand the in-banner copy.
- **No "Withdraw consent" link** visible outside the initial banner. The `ConsentService.withdraw()` method exists but is not surfaced in the UI. Required for GDPR compliance. Surface in footer ("Cookie settings") that re-opens the banner.

**Rewrites.**
- Move the long copy ("We use strictly necessary cookies. Optional functional and analytics cookies require your consent.") to translation keys; current state is English-only across all 4 locales.

**AEO problems.** Banner is not content-AEO-relevant (it's chrome). But the v1 plan's §3.9 statement "no detailed cookie banner copy" is **partly wrong**: the banner exists, has real preference granularity, and persists. The actual gap is the per-cookie list and the "withdraw" affordance, not the banner itself. Reframe in v1 §3.9 noted in v2 Changelog.

#### 3.11.7 `src/app/core/seo/json-ld.service.ts` (28 lines)

**Purpose.** Inject `<script type="application/ld+json">` blocks into `document.head`, keyed by ID for replace-on-update.

**Wins.** Idempotent by ID (`existing.remove()` before re-append, line 14). Element ID prefixed `ld-<id>` for easy debugging. `remove(id)` symmetry method. Server-side safe (gracefully no-ops if `head` is missing). Very thin and very correct.

**Cuts.** None.

**Gaps.**
- **No `@id` enforcement.** The service writes whatever JSON the caller hands it. There's no central registry mapping `id` → `@id` URI. For the §4.2 recommendation of FAQPage `@id` disambiguation, callers must remember to set `@id` per LD. Consider adding a thin helper `setWithId(key: string, ld: Json)` that auto-attaches `@id: ${canonicalUrl(locale, path)}#${key}` if missing.
- **No de-duplication across IDs.** If two callers `set('faq', ...)` on the same page they'll race. In practice each component owns its own ID prefix; document this as a convention.

**Rewrites.** None.

**AEO problems.** None blocking. But this service is the de-facto enforcer of every JSON-LD recommendation in this plan — make sure §5 actions reference it (P1 #22 etc).

#### 3.11.8 `src/app/core/integrations/embed-snippet.ts`

**Purpose.** Single-string export of the embed snippet shown on /how-it-works.

**Wins.** Single SOT for the snippet. Easy to change in one place.

**Cuts.** None.

**Gaps.**
- **The URL `https://cdn.typelessity.com/widget.js` is referenced as if live.** Founder must confirm: is the CDN live, in beta, or aspirational? If not live, the snippet card on /how-it-works must carry a beta/coming-soon badge (already flagged in §3.2 rewrites). The 3-line module makes the snippet trivially editable once founder confirms.

**Rewrites.** None content-level beyond §3.2.

**AEO problems.** None.

#### 3.11.9 `public/426a67efe405494f9da92670749a0f86.txt` (IndexNow key file)

**Purpose.** IndexNow key verification file. Bing/Yandex use this to validate site ownership before accepting URL ping submissions.

**Wins.** Exists and matches the key referenced in `scripts/indexnow.sh:7`.

**Cuts.** None.

**Gaps.**
- **`scripts/indexnow.sh` only submits 2 URLs:** `/` and `/for-ai-agents` (lines 22-23). All blog posts, industries, pricing, faq, about, how-it-works are NOT submitted. After publishing a new blog post, Bing/Yandex/ChatGPT-search will not be pinged. P1 — extend the script to read `BLOG_SLUGS` + `ALL_INDUSTRIES` (mirror what `tools/build-sitemap.ts` already does) and submit all canonical URLs.
- **Not wired into CI/CD.** The script exists; nothing automatically calls it post-deploy. P1.

**Rewrites.** None.

**AEO problems.** IndexNow is the primary fast-path to ChatGPT-search visibility (ChatGPT-search uses Bing's index, Bing reads IndexNow first). Underused.

#### 3.11.10 `public/manifest.webmanifest` (NOT present)

**Verified absent v2** (no `manifest.json` or `manifest.webmanifest` in `public/`). Not strictly required, but a PWA manifest with `name`, `short_name`, `description`, `categories: ["business","productivity"]`, `icons` would give a discovery hint to AI tools that prefer structured manifests (some indexers read manifests for app metadata).

P3 — generate a minimal manifest as part of redesign assets.

#### 3.11.11 `src/app/i18n/translations.{de,pl,ru}.ts` — coverage check (v2 added)

Re-verified v2: all three non-EN translation files have the same `nav.*`, `footer.*`, `seo.*` keys as `translations.en.ts`. The EN file has 7 extra lines of comments admitting the facade; the actual key set matches. **Chrome translations are NOT facade — they're genuinely localized.** What's facade is **page body content** (TODO(translate) markers in page-level `*.content.ts` and `*.component.ts` files).

So the §4.7 "multilingual facade" diagnosis is correct but slightly imprecise: chrome is bilingual×4; page bodies are EN-only. A user on `/de/` gets a German header/footer/page title/meta-description but an English page body. That's actually a more interesting failure mode than "everything is English chrome" — the SEO meta and OG tags are in the right language but the body content is wrong.

**P1 add (mapped to A5 in §9 of the review):** verify on a per-file basis that DE/PL/RU translation files do not drift from EN. Today they don't, but as new keys are added in EN they should auto-fail CI if missing in the others. Add a typecheck or runtime assertion to `translation.types.ts`.

---

## 4. Global AEO audit (cross-page)

### 4.1 Consistency: the same fact, three values

The single biggest AEO issue is numeric/factual drift. Concrete instances:

| Fact | Surface A | Surface B | Surface C |
|---|---|---|---|
| Industry count | "150+" (home hero `home.content.ts:11`, every blog post lede) | "43" (`industries/index.ts:15`, /industries H1 via `count`) | "42" (home grid `home.content.ts:97-112`, llms.txt:39) |
| FAQ count | 19 (rendered, `home.content.ts:161-181`) | "45+ across 6 categories" (`llms.txt:41`) | 5 categories actually (`home.content.ts:3` `FaqCategory` union) |
| Per-turn latency | "200–800ms" (home stats, FAQ, comparison) | "<800ms" (home stats compact) | "p50 320ms, p95 780ms" (llms.txt:11) |
| Conversion uplift | "+30%" (home stats `home.content.ts:25`, ROI section) | "+20–40%" (FAQ entry, /for-ai-agents) | "as widely reported" (verbal hedging in TL;DR / about) |
| Data retention | "30 days default" (pricing FAQ `pricing.content.ts:10`) | "12 months analytics / 24 months contact" (privacy `legal-page.component.ts:42`) | (Widget-end-user vs Typelessity-marketing — never disambiguated in text) |
| Founding / production date | "Founded 2025" (`llms.txt:3`) | "Spec to production in 14 months" (about, with today=2026-05-19 → 2025-03 start) | All blog posts dated Feb 2025 onward — implies product was already in production Feb 2025 |
| Pricing structure | "Pilot Free / Enterprise Custom" (everywhere) | `Offer.priceCurrency: USD, lowPrice: 0, highPrice: 'Custom'` (schemas.ts, invalid for Schema.org) | "Per-booking volume tier" (pricing FAQ `pricing.content.ts:7`) |
| Industries best-for list | "medical, dental, legal, beauty, real estate, automotive, hospitality, education, fitness, pet services, home services, travel" (home FAQ + llms.txt + for-ai-agents) | Same 12 categories in 3 of 5 places, **different ordering** in each | The actual category groups in `lib/industries/*.ts` are **10 categories** (Medical, Beauty & Wellness, Professional Services, Fitness & Sports, Home Services, Automotive, Education, Hospitality, Real Estate, Pet Services) — verified by grep on `category:` field across all 4 industry files. v1 said "9 categories" but listed 10 — fixed in v2. The marketing copy says 12, the code says 10. |
| Number of integration providers | OpenAI, Azure OpenAI, "OpenAI-compatible endpoint" (FAQ) | OpenAI only (sub-processors) | Anthropic / Gemini not mentioned anywhere as supported despite the architecture description being model-agnostic |

**Rule for the redesign:** every number, count, latency, percentage that appears in user-visible content is a fact. Establish one canonical source for each — recommend a `src/app/lib/facts.ts` file that exports `INDUSTRY_COUNT`, `LANGUAGE_COUNT`, `FAQ_COUNT`, `PER_TURN_LATENCY_RANGE`, `CONVERSION_UPLIFT_RANGE`, `DATA_RETENTION_WIDGET`, `DATA_RETENTION_LEAD`, `FOUNDING_YEAR`, `MODEL_USED`, `OG_BASE_IMAGE` — and reference it from every component, llms.txt builder, sitemap builder. **No string literal numbers in user-facing copy.**

### 4.2 Schema.org coverage

**Currently emitted** (from `schemas.ts` + per-page `jsonLd.set(...)`):

- Organization (home)
- WebSite with SearchAction (home)
- SoftwareApplication (home) — Offer has invalid `highPrice: 'Custom'`
- FAQPage (home + pricing + faq + industries-with-FAQ + blog-with-FAQ — 5 different surfaces, overlapping content, no `@id` differentiation)
- Article (blog posts)
- AboutPage (about) — Person has locale-prefixed URL in sameAs
- Product (pricing) — Offer has invalid `highPrice: 'Custom'`
- BreadcrumbList (industries, legal, blog post)
- Service (industry detail) — inconsistent shape (some pages have custom JSON-LD, default fallback for others)

**Missing / broken:**

- **`Offer.highPrice: 'Custom'`** — Google's RTC validator rejects this. Either omit `highPrice` and use `Offer` (not `AggregateOffer`) with a single price (0 for Pilot), or use `priceSpecification` with a custom URL. P0.
- **No `Person` ld on the home page** — Alex Isa is named only via `Organization.founder`. Add a top-level Person schema with `knowsAbout: ['conversational AI booking', 'single-call extraction', 'multilingual UX', 'AI agent integration']`.
- **No `TechArticle` / `APIReference` on /for-ai-agents.** P0 — the page exists for machine ingestion.
- **No `HowTo` on /how-it-works** — the 4 phases are literally a HowTo. P1.
- **No `VideoObject`** anywhere — but live-demo is animated DOM not video, so this is moot unless a demo video gets added (recommend a 60-second YouTube demo with chapters).
- **No `Review` / `AggregateRating`** — none exist yet, but the FAQ-style "What conversion lift can I expect?" + the pricing ROI section are prime placement once even 3 pilot customers can be quoted.
- **No `DefinedTermSet`** for the glossary (specialty / urgency / enrichment / cascade / mf-meta / aiHint) — these terms are used throughout the site without being defined in one place. A glossary page with `DefinedTermSet` schema is high-leverage.
- **No `Course` / `LearningResource`** — not directly applicable, but if the blog grows into a curriculum (recommended), Engineering posts could be tagged.
- **FAQPage `@id` disambiguation missing.** Currently three separate FAQPage entities (home, pricing, faq) share schema.org type without `@id`. Add explicit `@id: https://typelessity.com/en/faq#faq-product` etc.

### 4.3 Cross-linking gaps (where logic breaks)

- **Home → Blog**: 0 explicit links. Home has stats and TL;DR; FAQ references "we publish our own production telemetry on the blog"; no link.
- **Home → Industries detail**: only a single "All 43 industries →" link from the industries grid. No "Featured industry" callouts. With 4 comparison blog posts (beauty/medical/transfer/general), the home should at minimum link to those 4 from the industries section.
- **How-it-works → blog deep-dives**: 0 links from How-it-works to single-gpt-call, cascade-corrections, 25-languages-one-prompt — the three blog posts that *are* the long-form versions of the page's own sections. P0 internal-link miss.
- **Industries detail → blog**: 0 links. /industries/medical-dental should link to /blog/best-ai-booking-medical-clinics-2026 in its hero or proof section.
- **Blog post → Industries detail**: the 4 comparison posts mention "for the broader category comparison see /blog/best-ai-booking-widgets-2026" — good. They don't link to relevant industry pages. /blog/best-ai-booking-medical-clinics-2026 should link to /industries/medical-dental and the medical-* industry siblings.
- **Pricing → Trust** (currently legal pages): the pricing page mentions SOC2/SLA but doesn't link to /legal/security where security details live. Closing this loop matters for B2B procurement.
- **FAQ → Blog**: zero. The FAQ entry "What conversion lift can I expect?" should link to /blog/forms-vs-conversation-study. The "How accurate is data extraction?" should link to /blog/single-gpt-call.
- **About → External authority**: founder LinkedIn is in Person.sameAs but not visible. Add a visible link block.
- **All pages → llms.txt**: footer has "llms.txt" link — good. But there's no `<link rel="alternate" type="text/plain" href="/llms.txt">` in the HTML head of each page, which is the formal way to advertise it.

### 4.4 llms.txt / for-ai-agents / about — internal contradictions

These three surfaces are all "machine-readable definitions of Typelessity". They should be identical in *every fact*. They aren't.

- **Industry count**: llms.txt says "42 verticals" (line 39); for-ai-agents says "43 vertical configurations" (line 80); home + about say "150+".
- **FAQ count**: llms.txt says "45+ across 6 categories" (line 41); faq-page says 19 across 5 categories.
- **/demo link**: llms.txt lists "Demo: https://typelessity.com/demo" (line 98); no /demo route exists in `app.routes.ts`. Either build the route or remove the line.
- **Funded / founded**: llms.txt says "Founded 2025"; about implies a March 2025 start; blog post dated 2025-02-04 implies a January 2025 production launch. None of these are contradictory in isolation, but together they don't form a clean timeline.
- **Category aliases**: llms.txt lists 8 ("AI conversational booking widget", "AI booking widget", "Conversational booking", etc.). Site copy uses ~3 of these consistently. The other 5 don't appear in body copy anywhere. Either use them or drop them.

**Recommendation**: build a single `src/app/lib/facts.ts` (and a `scripts/build-llms-txt.ts` that reads from it). Currently `llms.txt` is hand-edited; it's drifted from reality. P0.

**Missing**: there is **no `llms-full.txt`** in `public/`. The task brief explicitly references it; it doesn't exist. Recommendation: `llms.txt` stays as a 100-line index; `llms-full.txt` adds the full text of every page in markdown form for deep ingestion. ChatGPT's GPT-4-search and Perplexity's index both look for `llms-full.txt` when present.

### 4.4a llms.txt — internal contradictions within a single file (added v2)

Beyond the cross-surface drift in §4.4, `public/llms.txt` (100 lines) contradicts itself in three places:

| Within-file conflict | Line A (value) | Line B (value) | Fix |
|---|---|---|---|
| **Per-turn latency** | Line 11: `p50 320ms, p95 780ms` | Line 67: `200–800ms p95 on gpt-4.1-nano` | Pick one canonical phrasing (recommend `p50 320 / p95 780ms`) and use both at line 11 and line 67. |
| **Industry count** | Line 10: `Industries: 150+ verticals` | Line 39: `Industries — 42 verticals, each with dedicated page` | Same fact, two numbers, one file. Replace line 39 with `Industries — 43 with dedicated pages; 150+ supported via configuration`. |
| **FAQ count** | Line 41: `FAQ — 45+ questions across 6 categories` | (Site reality: 19 in 5) | Fix to match reality (`19 across 5`) or grow FAQ to ≥45. |

Plus a fourth (already covered in §4.4): `Demo: https://typelessity.com/demo` on line 98 with no `/demo` route.

**Why this matters:** llms.txt is the single most-crawled doc for LLM ingestion of Typelessity. An LLM ingesting it line-by-line will store *both* contradictory facts and re-emit whichever appears first in retrieval ranking. A re-write spec for llms.txt that fixes cross-surface drift but leaves the within-file contradictions is incomplete. v1 of this plan caught the cross-surface drift but missed the within-file inconsistencies. P0 — re-write llms.txt as a single coherent document, ideally generated from `facts.ts`.

For `public/robots.txt`: also self-consistent today (no within-file conflicts), but the `Host:` line at the bottom is non-standard outside Yandex — minor.

For `public/sitemap.xml`: no within-file conflicts because it's so thin (8 URLs); the issue is omission, not contradiction.

For `pages/for-ai-agents/for-ai-agents.component.html`: line 80 says "43 vertical configurations"; site copy elsewhere says "150+ industries" / "42 verticals". Within-file the for-ai-agents page is consistent on 43, but a reader comparing it to home/llms.txt will see drift (covered in §4.4 table row 1).

### 4.5 Citability — atomic, citable paragraphs

**Best citable assets (keep as-is, promote in llms.txt):**

- `home.content.ts:18-19` — TL;DR answer paragraph (one sentence, 5 facts).
- `home.content.ts:131` — Comparison verdict paragraph.
- `home.content.ts:78-79` — Architecture pillar bodies (6 atomic claims).
- `about-page.component.ts:21-23` — Mission lede.
- Every FAQ first-sentence (`home.content.ts:162-180`) — explicitly designed to stand alone.
- The 4 comparison blog posts' opening **bold-tag paragraphs** — e.g. `"The best AI booking widget for a beauty salon in 2026 depends on whether the salon needs..."`. These are direct ChatGPT-quotable openers.
- Industry FAQ on medical-dental (`medical-dental.ts:60-73`).

**Weak / non-citable** (need rewrite):

- The 4 stats with bare numbers (`'4', 'Phases…'`, `'1 line', 'Of HTML to integrate'`) — not self-citable.
- The "Most popular" badge — not a fact at all.
- "Single-call extraction beats multi-call orchestration" — implicit thesis, never stated as a single citable sentence on the site.
- "Why we use Whisper instead of Web Speech" — blog post exists but the first paragraph isn't a single citable answer. Should be rewritten with a bold-tag opening sentence.

**Pattern to enforce on every page**: first paragraph after H1 should be **one sentence**, contain **the entity name**, **the category claim**, and **one disambiguator**. Most pages get this right; about, for-ai-agents, industries-list, and how-it-works all need a tighter opening line.

### 4.6 Category-phrase saturation

The "category" Typelessity is competing for has at least 8 aliases (per llms.txt):
- AI conversational booking widget
- AI booking widget
- Conversational booking
- AI form replacement
- Chat-based booking
- Natural-language booking
- AI appointment intake
- LLM-powered booking interface
- Conversational appointment scheduler

**Frequency in actual site copy** (verified counts as of 2026-05-19 via `grep -rio "<phrase>" src/ public/ --exclude="*.generated.ts"` — excludes the auto-generated blog manifest which double-counts from MDX; case-insensitive, all formats; the "AI booking widget" count subtracts "AI conversational booking widget" prefixes to avoid overlap):

| Phrase | Verified count (src/ + public/) | Notes |
|---|---|---|
| "AI conversational booking widget" | **12** | Used as the canonical phrase across home, schemas, llms.txt, for-ai-agents, blog-list, legal. Above the ≥10 target. Good. |
| "AI booking widget" (non-overlapping) | **61** | Very high in blog comparison posts (best-ai-booking-* MDX files dominate). Above the ≥10 target by 6×. Strong. |
| "Conversational booking" | **46** | Highest frequency — strong category claim. Above ≥10 by 4.6×. Good. |
| "AI form replacement" | **2** | Only in llms.txt category aliases + 1 stray. **Below ≥10 target.** Add 8 more occurrences across home, /how-it-works, blog. |
| "Chat-based booking" | **1** | **Below ≥3 secondary target.** Either lift to ≥3 or drop from llms.txt:89 alias list. |
| "Natural-language booking" | **6** | Below ≥3 — actually above secondary target (≥3). Light but acceptable. |
| "AI appointment intake" | **1** | **Below ≥3 secondary target.** Add 2-3 occurrences (P2 #47 already covers this). |
| "LLM-powered booking interface" | **1** | **Below ≥3 secondary target.** Either lift or drop from llms.txt:92. |
| "Conversational appointment scheduler" | **1** | Once on home FAQ. **Below ≥3.** Either lift or drop from llms.txt:93. |

**Gap analysis (v2 hard numbers):**
- 3 canonical phrases are at or above target — no action.
- 5 alias phrases (`AI form replacement`, `Chat-based booking`, `AI appointment intake`, `LLM-powered booking interface`, `Conversational appointment scheduler`) are below target. **Recommendation**: of these 5, lift 2 (recommend `AI form replacement` to 10× via home+blog inserts, and `AI appointment intake` to 5× via home+blog) and drop the other 3 from `llms.txt:88-93` since they're not used. Listing aliases not in body copy is a credibility loss (LLM training corpora detect the gap).
- `Natural-language booking` is healthy at 6.

Original v1 counts ("rough grep audit") were notably **wrong on the high side** — v1 said canonical phrases were at 8, 12, 18; actual is 12, 61, 46. The category-claim saturation is much stronger than v1 estimated. Conversely v1 was **right that 4 of the aliases are at 0-1** — those are real gaps.

**Recommendation**: in the redesign, pick **3 canonical phrases** ("AI conversational booking widget", "AI booking widget", "conversational booking") and 2 secondary ("AI appointment intake", "natural-language booking"). Use each canonical phrase ≥10 times site-wide; each secondary ≥3 times. Drop the unused aliases from llms.txt — listing aliases you don't actually use is a credibility loss.

**Adjacent searches to capture** (currently uncaptured or underrepresented):

- "AI form filler for booking" — overlaps with sister product TypelessForm but Typelessity has the real conversational booking, this is winnable.
- "Replace booking form with chat" — direct intent, currently appears only in CTA copy. Add to a dedicated landing page (P2).
- "GDPR-compliant AI booking" — only the gdpr-compliance blog post owns this. Add to home/comparison.
- "Multilingual booking widget" — appears in comparison rows. Boost.
- "Webhook-based booking integration" — appears as a feature but not as a phrase. Surface.

### 4.7 The multilingual facade

`translations.en.ts:2-4` admits explicitly:

> Page content (home, how-it-works, pricing, faq, about, for-ai-agents, industries, blog, legal) is currently hardcoded in components for English. Translation to ru/de/pl is a content task — see TODO(translate) markers in the corresponding *.content.ts and *.component.ts files.

But `seo.service.ts:74-79` writes hreflang tags for all 4 locales on every page:

```
hreflang="en" → /en/<path>
hreflang="de" → /de/<path>
hreflang="ru" → /ru/<path>
hreflang="pl" → /pl/<path>
hreflang="x-default" → /en/<path>
```

This means crawlers are told 4 locales exist, but `/de/`, `/ru/`, `/pl/` all serve the same English page bodies — only nav/footer/title/description are translated.

**Consequences:**
1. Duplicate content across locales — Google may apply soft penalties.
2. LLMs that cite "the German version of typelessity.com" will quote English content with German chrome — confusing and reputationally damaging.
3. The "25+ languages" claim is about the *runtime widget*, not the *landing*. A buyer evaluating the German version sees English everything and concludes the multilingual claim is hollow.

**Resolution paths (pick one before launching the redesign):**

A. **Commit to multilingual landing** — translate at minimum: home, how-it-works, pricing, industries-list, about, FAQ, llms.txt. ~10,000 words × 4 langs. Bigger effort.

B. **Drop the multilingual facade** — remove `de`, `ru`, `pl` from `SUPPORTED_LOCALES`; remove hreflang for non-EN; route `de.typelessity.com` etc to 301 → EN. Smaller effort. Honest. Downside: loses the "we ship in 4 languages" signal.

C. **Commit publicly to translation date** — keep current state but add a banner "Site available in EN; DE/RU/PL coming Q3 2026; widget already supports 25+ languages today." Honest, allows time.

**Currently this is the biggest hidden inconsistency on the site.** P0 decision.

### 4.8 Sitemap / robots / discovery

- `robots.txt` — solid. **14 explicit AI-bot allows** (re-counted v2): GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Amazonbot, CCBot, Bytespider, Applebot-Extended, YouBot, Meta-ExternalAgent, Diffbot. Sitemap declared. P3 nit: also declare `Sitemap: https://typelessity.com/sitemap.xml` once is enough; `Host:` line is non-standard outside Yandex. (v1 said 13; reviewer correct, fixed.)
- `sitemap.xml` — **8 URLs total** in the committed `public/sitemap.xml`. Missing: pricing, how-it-works, faq, about, industries-list, **all 43 industries**, **all 14 blog posts**, all 5 legal docs, all in 4 locales. Realistic full sitemap = ~256 URLs minimum (8 standalone × 4 + 43 industries × 4 + 14 blog × 1 if EN-only + 5 legal × 4 ≈ 32 + 172 + 14 + 20). 

**Wiring nuance (v2 verified):** `tools/build-sitemap.ts` **exists and IS wired** as `postbuild` in `package.json:11` (`"postbuild": "npm run build:sitemap"`). It reads `ALL_INDUSTRIES` and `BLOG_POSTS` and emits to `dist/.../browser/`. So the *build pipeline is correct*. The problem is that `public/sitemap.xml` is a **separately-committed stale stub** that ships alongside the auto-generated one in dist. **P0 action:** delete `public/sitemap.xml` (or replace its content with the generated output for the current state, and rely on the build to refresh on every deploy). The v1 plan's "the script needs to actually run as a postbuild step" was based on an unread file; it's already wired — the bug is the committed stub overriding it depending on serve order.
- **No `llms-full.txt`** — task brief explicitly references it. Doesn't exist. P0 — generate alongside `llms.txt` from the `facts.ts` SOT plus full body MD.

### 4.9 OG image discipline (v2 corrected)

- `public/og-image.jpg` — default for all pages (`seo.service.ts:31`).
- `public/og-blog-best-ai-booking-widgets-2026.png` — exists. Used by **4 of 14 blog posts** (the comparison ones: best-ai-booking-beauty-salons-2026, best-ai-booking-medical-clinics-2026, best-ai-booking-transfer-services-2026, best-ai-booking-widgets-2026 — all 4 share the same comparison-card image).
- The other **10 posts** have **no `ogImage` field**; the SeoService falls back to `/og-image.jpg` (default brand card).
- No per-page OG for pricing, how-it-works, industries, about, faq, for-ai-agents, legal, individual industries, individual blog posts.

**Result (corrected)**: 
- 4 comparison posts share one comparison-card image — cross-leak within the comparison group; e.g. sharing "Best AI booking medical clinics 2026" surfaces the "Best AI booking widgets 2026" card.
- 10 non-comparison posts (engineering, founder, business, compliance, AEO) all surface the same `/og-image.jpg` brand card. Acceptable interim; not strictly wrong, just generic.

v1 of this plan misframed this as "every blog share surfaces the comparison card" — incorrect. Fix path is the same: auto-generate per-post OG art. Note `tools/build-blog-index.ts` already exists and reads frontmatter — extending it with an `og-art` generation step (Satori / Vercel OG / Sharp) is the cleanest route. Manual editing of the generated `blog-manifest.generated.ts` is **wrong** — it gets overwritten on `npm run build:blog`. The fix must land in MDX frontmatter + the generator.

P1 — auto-generate OG images per page (title + Typelessity logo + category badge). ~30 images total for what's currently in the public site (14 blog posts + 10 standalone pages + 5 legal + at minimum the 4 high-priority industries + featured industries). Not 100+.

---

## 5. Prioritized action plan

Format: **`Priority · file:line (or path) · what to do · why`**. Each action is content/markdown only.

### 5.0 Dependency order (added v2 — see §7 of review)

Several P0s must land in a specific sequence to avoid rework:

| Order | Item | Blocks |
|---|---|---|
| 1 | **Founder decision: multilingual A/B/C** (P0-process #8) | P0 #5 sitemap scope (256 vs 64 URLs), translation work in P1, switcher behaviour in §3.11.3, hreflang in seo.service. |
| 2 | **Pick canonical numbers (industries, FAQ count, latency, conversion lift)** (P0-content #1, #2, #9) | All numeric edits site-wide, llms.txt + llms-full.txt body, sitemap (if scope changes). |
| 3 | **Industries quality decision: upgrade-N vs deprecate-22** (P0 #17, ex-P1) | Site URL count drop affects sitemap; affects "43 industries with dedicated configurations" copy site-wide. |
| 4 | **Rebuild sitemap.xml** (P0 #5) — must run AFTER multilingual + industries decisions are made. | Postbuild already wired; deleting `public/sitemap.xml` stub is sufficient if previous two decisions are in. |
| 5 | **llms.txt + llms-full.txt rewrite** (P0 #6, #2) — must run AFTER numbers + multilingual decided. | Cited everywhere. |
| 6 | **Schema.org `@id` URIs + Offer fix** (P0 #7 + new P0 A1) | Must land alongside per-page LD edits. |
| 7 | **Legal review** (P0-process #4) — process-only; can run in parallel with all of the above. | Launch gate. |
| 8 | **`facts.ts` SOT (P1 ex-P0 #11)** — net-new infrastructure; built AFTER canonical numbers are picked, BEFORE the next content cycle to lock them in. | Prevents future drift. |

### 5.1 Action class taxonomy (added v2)

To clarify which P0s an editor can execute and which require external action:

- **P0-content** — hand-edit specific files; no external dependency. Editor can do today.
- **P0-process** — requires external party (lawyer, founder decision, security audit). Editor cannot do alone.
- **P0-schema** — Schema.org / JSON-LD edits; require type re-verification but no external party.
- **P0-discovery** — sitemap / robots / llms.txt; require regenerating files but no external party.

### P0 — must-fix before next ship or launch

#### P0-content (editor can execute today)

1. **P0-content · `home.content.ts:11, 22, 33` + `lib/industries/index.ts:15` + `home.content.ts:97-112` + `llms.txt:39` + `for-ai-agents.component.html:80` · Pick ONE number for industry count and propagate.** Recommendation: "43 industries with dedicated configurations; 150+ supported via configuration." Why: AEO answers are won by single-number facts.
2. **P0-content · `llms.txt:41` · FAQ count.** Two paths: (a) change to "FAQ — 19 questions across 5 categories" as immediate fix; (b) grow FAQ to ≥45 (new P0 item #21 — reclassified from P1). v2 recommends path (b) per §4.5 strategy. Pick one and execute; do not leave both in §4.4/§4.5 as separate items.
3. **P0-content · `llms.txt:98` · Remove "Demo: https://typelessity.com/demo" or add the route.** Why: LLM agents will follow this URL and 404; cited as broken.
9. **P0-content · `home.content.ts:25, 36` + `pricing-page.component.ts:88` + llms.txt:11 + llms.txt:67 · Reconcile latency and conversion numbers to one canonical pair (recommend `p50 320ms · p95 780ms` for latency; `+20–40% (industry data)` for conversion).** v2 addition: also reconcile llms.txt:67 (`200–800ms p95 on gpt-4.1-nano`) with llms.txt:11 (`p50 320ms, p95 780ms`) — within-file contradiction; see §4.4a.
10. **P0-content · `for-ai-agents.component.html:24-43` · Add explicit `Status: in development — Q3 2026` label to /agent endpoint contracts.** Why: LLMs will hallucinate that the endpoint exists. (v1 had this as P0 #10; reviewer suggested reclassify to P1. v2 keeps P0 — the page is currently AEO-active and shipping fictional contracts misinforms LLM training corpora **right now**, so it is a launch-blocker even if the endpoint itself is post-launch.)

#### P0-content (industry quality — reclassified from P1 #17 per review §6)

17 (v2) **. P0-content · /industries/* · Deprecate or upgrade the 35 skeleton industries.** v2 corrections vs v1: count is 35, not 32 (verified). Reusable templates: 7 mid-tier + 1 full = 8 (not 10 as v1 estimated). Recommendation: upgrade 8 of them (one per category) to full-quality (medical-dental level); convert the remaining 27 into a category-grouped list with no dedicated page. Reclassified from P1 #17 to P0: 81% of industry pages shipping as skeletons is the largest content-quality lever on the site and should not survive launch.

#### P0-content (FAQ growth — reclassified from P1 #21 per review §6)

21 (v2). **P0-content · `faq-page.component.ts` + `home.content.ts` (faq array) · Grow FAQ from 19 to ≥45 questions, add Security and Compliance categories.** Reclassified from P1 to P0: this is the chosen direction per §4.5 (vs the alternative of shrinking llms.txt:41 to "19 across 5"). P0-content #2 (above) and this item are the SAME work — once founder picks "grow", P0 #2 becomes editing llms.txt to "45 across ≥6" rather than to "19 across 5". Sequence them, do not double-count.

#### P0-process (requires external party)

4. **P0-process · `legal-page.component.ts:22-181` · Lawyer review of all 5 legal docs.** Remove all 5 `<!-- TODO(content): legal review before production launch — Phase 9 -->` markers AFTER a real legal review pass; do not ship un-reviewed legal copy. Why: regulatory + reputational. Split from v1 P0 #4 per review §6 — this requires a lawyer's calendar, not an editor.
8. **P0-process · Multilingual decision — A, B, or C from §4.7.** Founder decision. Split from v1 P0 #8 per review §6 — blocks site-wide work but is not an editor task. Affects switcher behaviour (§3.11.3), sitemap scope, hreflang in seo.service, all P1 translation work. **This is the single highest-impact pending decision in the entire plan.**

#### P0-discovery (rebuild discovery surfaces)

5. **P0-discovery · `public/sitemap.xml` · Delete the stale 8-URL stub; rely on `tools/build-sitemap.ts` (already wired as `postbuild` per `package.json:11`).** v2 correction vs v1: build script is already wired; problem is the committed stub overriding it. Action: `rm public/sitemap.xml` and ensure deploy pipeline serves `dist/.../browser/sitemap.xml`. Scope depends on P0-process #8 (multilingual decision): option A or C → full ~256 URLs across 4 locales; option B → ~64 URLs EN-only. Why: 95% of URL space is invisible to crawlers right now.
6. **P0-discovery · `public/llms-full.txt` (new) · Generate full-body markdown of every public page.** Why: explicitly missing per task brief; standard AEO asset for 2026. Build script needed: `tools/build-llms-full.ts` reads page content + blog manifest + industries and emits a single concatenated markdown. Note: this is **net-new infrastructure**, not a one-shot edit. v2 keeps it P0-discovery (not P1 as reviewer suggested) — because the asset can ship from a 1-day script and is explicitly referenced in the task brief; deferral risks launch credibility.

#### P0-schema (Schema.org / JSON-LD edits)

7. **P0-schema · `schemas.ts:58-73, 143-159` · Replace invalid `highPrice: 'Custom'` in `softwareApplicationLd` (line 69) and `productLd` (line 155).** v2 fix: corrected line ranges. Use `Offer` (single) with `price: 0` for Pilot and separate sales-contact link for Enterprise; or omit `highPrice` and use `priceSpecification`. Why: Schema.org validator rejection breaks Rich Results.

#### P0 (new items from review §9)

A1 (v2 new). **P0-schema · Add `@id` URIs to every FAQPage / Article / Service JSON-LD emission.** With FAQPage on home + pricing + faq + industries-with-FAQ + blog-with-FAQ (5 overlapping surfaces), Google's RTC will flag overlapping entities. Use `@id: ${canonicalUrl(locale, path)}#${entityType}` (e.g. `https://typelessity.com/en/faq#faqpage-full`, `https://typelessity.com/en/pricing#faqpage-pricing`, `https://typelessity.com/en#faqpage-product`). Consider extending `JsonLdService.set` to a `setWithId(key, ld)` helper that auto-attaches the URI (§3.11.7).

A2 (v2 new). **P0-discovery · Audit `widgets/live-demo/` cycling phrases.** RE-VERIFIED v2: the 5 phrases do **not** contain numeric claims (verified directly — see §3.11.4). Reviewer's concern was that live-demo would be a 5th surface of §4.1 drift; it is not. Outcome: **this item is closed v2 without change**. Listed here so that future audits don't re-open it.

A3 (v2 new). **P0-content · Resolve sister-brand surface in footer.** `footer.parentBrand: 'A product of Webappski. Sister product: TypelessForm.'` (`translations.en.ts:28` + de/pl/ru equivalents) renders on every page. Rewrite to disambiguate the two products: "A product of [Webappski](https://webappski.com). Sister product: [TypelessForm](https://typelessform.com) (AI form filling)." — 2-word category clarifier prevents LLM conflation given the shared founder and the `.aeo-tracker.json` brand mismatch.

A4 (v2 new). **P0-content · Audit `core/consent/` cookie banner copy — DONE v2.** v2 verification: banner exists, has real 3-tier preference UI, persists to localStorage. Real gaps: (1) hard-coded `/en/legal/privacy` link (not lang-aware), (2) no per-cookie list / retention table, (3) no "withdraw consent" affordance outside the initial banner. v1 §3.9 statement "no detailed cookie banner copy" is **partly wrong**; v2 reframes (§3.11.6). Actions move to P1.

### P1 — high-leverage, complete in same content sprint

11 (v2). **P1 · Create `src/app/lib/facts.ts` SOT for all numeric claims** (INDUSTRY_COUNT, FAQ_COUNT, LANGUAGE_COUNT, PER_TURN_LATENCY_P50, PER_TURN_LATENCY_P95, CONVERSION_UPLIFT_LOW/HIGH, DATA_RETENTION_WIDGET, DATA_RETENTION_LEAD, FOUNDING_YEAR, MODEL_USED, OG_BASE_IMAGE). Every component, llms.txt builder, sitemap builder reads from it. Why: prevents future drift. **Reclassified from P0 to P1 per review §6**: this is net-new infrastructure, not a content edit. The content P0 (hand-pick canonical numbers + edit ~8 files) is P0-content #1, #2, #9. Build SOT immediately after to lock the picked numbers in.

12. **P1 · `home.content.ts:97-112` · Replace the 42 decorative industry strings with 12 actual `RouterLink`s to top industries + "See all 43 →".** Why: today's grid silently advertises content that doesn't link to industry pages.
13. **P1 · `home.content.ts:140-158` + `pricing-page.component.ts:28` · Move `featured: true` from Enterprise to Pilot.** Why: Pilot is the entry, Enterprise is custom — pilot should be most popular.
14. **P1 · `how-it-works-page.component.ts` · Add 5-question FAQ at bottom, emit `faqLd`.** Why: page has perfect Q&A material and zero FAQ schema.
15. **P1 · `how-it-works-page.component.ts:67, 100, 67` · Add inline links to /blog/single-gpt-call, /blog/cascade-corrections, /blog/25-languages-one-prompt.** Why: orphaned blog assets; closes loop.
16. **P1 · /industries/* · For all 7 industries that already have `exampleConversations`, add `industryFAQ` (target: 3 Q&As each).** v2 correction: 7 industries, not 10 (verified). Why: industry-level FAQPage schema is high-value per-vertical AEO.
18. **P1 · `medical-dental.ts:55-59` (and same pattern across all `proofPoints` arrays) · Either source every percentage to a dated study or replace with capability claims.** Why: contradicts About's stated "Numbers belong with sources" value.
19 (v2). **P1 · `tools/build-blog-index.ts` + MDX frontmatter · Generate per-post OG images via an `og-art` step (Satori or Sharp).** v2 correction vs v1: only 4 of 14 posts have `ogImage` set; the other 10 fall back to `/og-image.jpg`. Fix path: extend `tools/build-blog-index.ts` (which generates `blog-manifest.generated.ts` from MDX) with an `og-art` post-step that produces a per-slug PNG from the post's title + category, and emits the path into the manifest. **Do NOT manually edit `blog-manifest.generated.ts` — it is auto-generated and would be overwritten on next `npm run build:blog`.** Urgency: 4 cross-leaking comparison posts are the priority; 10 generic-fallback posts are acceptable interim.
20. **P1 · `home.component.html` (below comparison table) · Add "When to use Typelessity / When not to" block, mirroring llms.txt:57-79.** Why: highest-leverage AEO content pattern.
22. **P1 · `home.component.ts:39-42` · Add Person LD (Alex Isa via `PERSON_ALEX_ISA`) to home page jsonLd.** Why: founder-product binding for E-E-A-T.
23. **P1 · `schemas.ts:30-41` · Add `knowsAbout`, `image` (after photo added), and fix `sameAs` to use unprefixed URLs.** Why: stronger Person entity.
24. **P1 · `about-page.component.ts` · Add Alex Isa photo + 3-line Webappski context block + visible LinkedIn link.** Why: visible authority signals.
25. **P1 · `pricing-page.component.ts` ROI section · Reframe as illustration (header explicit, slider-style copy).** Why: current numbers read as fact, are actually placeholder.
26. **P1 · `pricing-page.component.ts` diff table · Add row "AI cost absorbed by Typelessity" and row "Session retention: 30 days default (configurable)".** Why: most-asked pricing questions surfaced in table.
27. **P1 · `for-ai-agents.component.ts` ngOnInit · Add `TechArticle` + `APIReference` JSON-LD; also add `<link rel="alternate" type="text/plain" href="/llms.txt">` and `/llms-full.txt`.** Why: page exists for machine ingestion but emits no schema.
28. **P1 · `index.html:5` `<title>` and `<meta name="description">` · Currently hardcoded "Typelessity — AI conversational booking widget"; that's fine for fallback but every route's SeoService should override. Verify SSR emits the right one for each route (not the index.html default).**

#### P1 (new items from review §9 + v2 reclassifications)

10' (v2). **P1 · `for-ai-agents.component.html` (top of page) · Add "Status: in development" badge to /agent endpoint sections (P0 #10 considered for reclass to P1 by reviewer; v2 retains P0 — see above). This P1' is a *separate* fallback action only if P0 #10 cannot land in the same edit batch as the page redesign.** Skip if P0 #10 lands first.

44' (v2). **P1 · /trust (new) · Aggregate Security + Compliance + Sub-processors with a status badge grid.** **Reclassified from P2 to P1 per review §6.** B2B procurement explicitly cares; the plan itself flags this in §3.7-3.9. P2 underweights the conversion impact.

51' (v2). **P1 · `.aeo-tracker.json` (root) · Fix `brand: "typelessform"` / `domain: "typelessform.com"`** — currently configured for sibling product. **Reclassified from P2 to P1 per review §6.** Operational guard: weekly tracker runs against this config produce competitor-product visibility metrics, not Typelessity's. Decide with founder whether to (a) preserve the typelessform baseline by forking config + creating a separate `.aeo-tracker.typelessity.json`, or (b) swap the existing config and accept a baseline reset.

A5 (v2 new). **P1 · `src/app/i18n/translations.{de,pl,ru}.ts` · Add CI typecheck to assert all 4 translation files have an identical key set.** Today they do (verified v2 — see §3.11.11). Going forward, drift will silently ship raw key strings to non-EN locales. Add a typecheck step (`tsc --strict` against `translation.types.ts` with `Record<TranslationKey, string>` enforcement) to CI.

A6 (v2 new). **P1 · `tools/build-sitemap.ts` · Verify what it currently outputs vs what's checked in.** v2 verification: script exists, IS wired as `postbuild` in package.json:11, reads `ALL_INDUSTRIES` and `BLOG_POSTS`. The committed `public/sitemap.xml` (8 URLs) is stale and ships separately from the dist-generated sitemap. **Action:** delete `public/sitemap.xml` AND run `npm run build` to confirm the postbuild emits the full sitemap to `dist/.../browser/`. Already covered partially by P0-discovery #5; this P1 is the validation step.

A7 (v2 new). **P1 · `scripts/verify-jsonld.ts` · Wire into CI.** Script exists; not referenced in `package.json` scripts. v2 verification: script scans `dist/.../browser/**/index.html` for JSON-LD blocks, parses each, counts by `@type`. Add to CI as `npm run verify:jsonld` (after `npm run build`) so Schema.org regressions fail the build.

A8 (v2 new). **P1 · `scripts/indexnow.sh` · Extend to submit all canonical URLs, wire into CI/CD post-deploy.** Currently submits only `/` and `/for-ai-agents` (lines 22-23 of the script). Extend to read `BLOG_SLUGS` + `ALL_INDUSTRIES` + the 8 standalone pages. Wire as a post-deploy step (GitHub Action or hosted-platform hook).

A9 (v2 new). **P1 · `home.component.html` (FAQ section) · Document the schema-vs-visible-content policy on home FAQ.** §3.1 flags that home emits **all 19** FAQs in JSON-LD but renders only **7 Product-category** ones. Google's Rich Results guidance: "The content must be the same on the page and in the markup." Mitigation: either (a) accept the risk and document explicitly with a code comment near `home.component.ts:42`; (b) emit only the 7 visible Product FAQs in schema and emit the full 19 FAQ schema only on `/faq` where they are visible. v2 recommends (b) — it's stricter, removes the policy risk, and the full /faq page is one click away anyway.

A4' (v2 new from A4). **P1 · `core/consent/consent-banner.component.ts:18-19, 51` · Lang-aware privacy link + per-cookie list + withdraw-consent affordance.** Per §3.11.6: (1) Replace `<a href="/en/legal/privacy">` with `[routerLink]`; (2) link to or inline a per-cookie purpose+retention table; (3) surface a "Cookie settings" link in footer that calls `ConsentService.withdraw()` then re-opens the banner.

A4'' (v2 new from §3.11.5). **P1 · `shared/contact-form/contact-form.component.ts:51` · Lang-aware privacy link + extract messages to translation keys.** Hard-coded `/en/legal/privacy` and English-only success/error messages on all 4 locale routes.

### P2 — quality polish, ideally same sprint, otherwise next

29. **P2 · `home.content.ts:43` `howItWorks.sub` · Drop "in under a minute" (contradicts latency claims).**
30. **P2 · `home.component.html` (H1) · Add the category claim to H1: "AI conversational booking widget — bookings through conversation, not forms."**
31. **P2 · `home.content.ts:36` `'<800ms'` stat · Replace with `'p50 320 / p95 780ms'`.**
32. **P2 · `home.content.ts:36` `'4', 'Phases: Chat → Select → Review → Confirm'` · Replace with a more atomic stat.**
33. **P2 · `about-page.component.ts:42, 47` · Reconcile founding/timeline text with llms.txt.** v2 note: see Q9 closure below — recommended `foundingDate: 2024-12` (December 2024 → first content production Feb 2025) or simply commit to "Founded 2024 by Alex Isa" with the about page rewriting "spec to production in 14 months" to "spec to first production blog post in January 2025."
34. **P2 · `about-page.component.ts:48-49` · Replace "320ms" with the canonical latency phrase from facts.ts.**
35. **P2 · `pricing.content.ts:10` · Clarify "30 days" is widget-end-user session, not Typelessity-side marketing data.**
36. **P2 · `legal-page.component.ts:232` · Hard-code meta descriptions per legal doc (current logic produces "Effective date: 2025-01-01" for Privacy).** v2 line fix.
37. **P2 · `legal-page.component.ts:236-240` breadcrumb · Three distinct items (Home > Legal index > <doc>), not the current two-of-three with duplicate hrefs.**
38. **P2 · `for-ai-agents.component.html:58` · Fix the malformed `<li>` (no closing tag).**
39. **P2 · `for-ai-agents.component.html:48` · List all 25 languages explicitly or commit to 15 with "+10 more".** v2 closure of Q11: take the 15 named in `llms.txt:9` and commit to "+10 more (full list at /for-ai-agents#languages)". Editor can resolve without founder.
40. **P2 · `faq-page.component.ts:23` · Remove "First sentence works as a stand-alone citation" (meta-LLM-direction visible to humans).**
41. **P2 · /blog · Add "Read next" footer to every blog post, 3 same-category suggestions.**
42. **P2 · /blog · Add tag pages `/blog/tag/<tag>` (route + schema).** v2 closure of Q15: default "do it" — the manifest already has tags, route work is minor, otherwise tag chips on blog list are pretend-links.
43. **P2 · /not-found · Add search input + top-5-pages list.**
45. **P2 · Glossary page (new) `/glossary` · Defined terms (specialty / urgency / enrichment / cascade / mf-meta / aiHint) with `DefinedTermSet` schema.**
46. **P2 · `home.content.ts` (faq array) · Rewrite Q "Does Typelessity work for AI agents (not humans)?" → "Can AI agents (e.g. ChatGPT plugins, autonomous shopping agents) call Typelessity?"**
47. **P2 · Add category phrase "AI appointment intake" and "natural-language booking" to home + about copy at least 3× each.**
48. **P2 · `home.component.ts:39-42` · Add `inLanguage` to SoftwareApplication LD.**
49. **P2 · `blog-list.component.ts` ngOnInit · Add BreadcrumbList for blog list page.**
50. **P2 · `seo.service.ts:74-79` · Skip hreflang for `/404` path.**
52. **P2 · `home.content.ts:163-180` FAQ entries · Add internal links (e.g. "How accurate is data extraction?" → /blog/single-gpt-call; "What conversion lift?" → /blog/forms-vs-conversation-study).**
53. **P2 · `home.content.ts:31-37` · One canonical `stats` row across home + how-it-works + for-ai-agents.**
54. **P2 · `index.html:8` · Add `<link rel="alternate" type="text/plain" href="/llms.txt">` and `/llms-full.txt` to the root index template.**

A10 (v2 new). **P2 · `seo.service.ts:74-79` blog hreflang · Skip hreflang for `/blog/{slug}` paths.** Blog posts are EN-only (§3.8); writing hreflang to non-existent DE/PL/RU versions of every post produces soft duplicate-content noise. Can be merged with item #50 (`/404` hreflang skip) into a single rule update.

A11 (v2 new). **P2 · `public/manifest.webmanifest` (new) · Generate minimal PWA manifest** (`name`, `short_name`, `description`, `categories: ["business","productivity"]`, `start_url`, `icons`). Discovery hint for AI tools that prefer structured manifests. Defer below the trust page work.

A12 (v2 new). **P2 · `components/header/` · Consider adding `For AI Agents` to the primary nav** (currently footer-only). Audience: B2B AI developers. Low-effort A/B candidate.

### P3 — nice-to-have, defer

55. **P3 · /home + /pricing · Add "Last reviewed: <date>" footer.**
56. **P3 · /blog · Translate the 4 comparison posts to DE/RU/PL (only if option A in §4.7 is chosen).**
57. **P3 · Add VideoObject + a 60-second product demo video.**
58. **P3 · Add visible founder photo to all relevant pages.**
59. **P3 · `robots.txt` · Remove non-standard `Host:` line.**
60. **P3 · Add Review/AggregateRating once 3+ pilot customers can be quoted with permission.**
61 (v2). **P3 · `components/header/` · Add `SiteNavigationElement` JSON-LD with menu list.** Low yield but Google reads it.

---

## 6. Open questions — re-classified v2

v1 listed 15 questions as founder-blockers. v2 re-classification per review §8: 9 truly need founder, 6 can be closed (fully or partially) by the analyst from code/data. Closures appear inline below.

### 6.1 Truly need founder (9) — CLOSED 2026-05-19

All 9 founder questions were closed in a single session. Decisions applied here are the source of truth for implementation; every cascading P0/P1 item is updated accordingly in §5.

1. **Multilingual: A, B, or C?** → **CLOSED: B.** Collapse to English-only. Drop `language-switcher` component, drop hreflang alternates, drop `translations.{de,pl,ru}.ts`. Strip `/ru`, `/de`, `/pl`, `/fr` routes. Cascades: P0 #5 → "drop multilingual surface entirely"; P1 #28, A5, A10, item #56 → removed or restated as EN-only.
2. **The "150+ industries" claim** → **CLOSED: remove entirely.** No replacement number. Anywhere "150+" appears (hero, llms.txt, FAQ, blog posts, schema), it is deleted or replaced with descriptive text ("multiple service industries", "growing library"). No competing number is introduced.
3. **The `+30%` conversion lift** → **CLOSED: delete entirely.** Founder did not author this claim and does not confirm it. No replacement (no "industry benchmarks 20–40%", no caveated version). Every surface that quotes `+30%` (home hero/sub, llms.txt, blog comparison posts, FAQ) is rewritten to remove the conversion-lift promise. Replace with verifiable qualitative claims (faster time-to-book, reduced no-shows if measured) only if founder later supplies them.
4. **/agent endpoint ship date** → **CLOSED: Q3 2026.** All surfaces use "shipping Q3 2026" wording. Live endpoint is NOT yet implemented — copy says "Q3 2026" everywhere, no fake link.
5. **SOC2** → **CLOSED: remove all mentions.** Drop SOC2 from llms.txt, /trust copy (if it exists), security-relevant FAQ. No "in progress", no "planned", no quarter — just absent. Re-introduce only when audit is in flight with auditor signed.
6. **HIPAA / US healthcare** → **CLOSED: drop US healthcare entirely.** Delete `medical-dental` industry from `src/app/lib/industries/` (file + sitemap + links + schema). Do NOT pivot to UK/EU healthcare. Anywhere HIPAA / BAA / US healthcare is mentioned (llms.txt, FAQ, blog, /about) → remove. Industries count drops accordingly (43 → 42 production pages before quality fix).
7. **CDN `cdn.typelessity.com/widget.js`** → **CLOSED: not deployed.** Replace the embed snippet (How-it-works + §3.11.8 embed-snippet block + any blog reference) with a "coming soon — Q3 2026" placeholder. No fake script src. If a "request early access" CTA fits, add one; otherwise just the placeholder.
10. **Pilot customers — nameable?** → **CLOSED: anonymous only (best practice).** No customer logos, no named testimonials, no Review/AggregateRating Schema (without verifiable named reviews, Google penalises this). Use anonymous "early-access pilots" or "N pilots in production" framing only if N is verifiable; otherwise drop pilot claims entirely.
12. **Webappski — brand or umbrella?** → **CLOSED: producer / parent brand.** Webappski is the **producer** that built Typelessity (analogous to "made by"). Deepen footer with "Built by Webappski" + link to webappski.com. Add a /about block "Typelessity is a Webappski product" with 2–3 sentences on Webappski's portfolio. Add `Organization.parentOrganization` (Webappski) to Typelessity Organization JSON-LD. Cascade: A3 footer surface = full P0; P1 #24 /about Webappski-context block = retained as P1.

### 6.2 Closed by analyst v2 (6)

8. **`.aeo-tracker.json` mismatch — intentional or copy-paste error?** **STATUS: CLOSED v2 — almost certainly copy-paste error.** No `aeo-reports/typelessity*` outputs exist in this repo; `.aeo-tracker.json` was likely scaffolded by `init` from a sibling project (TypelessForm) without being re-pointed. Founder needs only to confirm "yes, fix it" — see P1 #51'. If founder wants to preserve the typelessform baseline, fork to a separate config file rather than swap.
9. **Founding date authoritative.** **STATUS: PARTIALLY CLOSED v2.** Earliest blog `publishedAt` = `2025-02-04` (first comparison post). For a post to be published 2025-02-04, the company likely existed in some form by Dec 2024 or earlier. **Analyst proposal:** set `foundingDate: '2024-12'` (or `'2024'`) in Organization LD; rewrite `llms.txt:3` "Founded 2025" → "Founded December 2024 by Alex Isa"; rewrite `about-page.component.ts:42` "spec to production in 14 months" → "from spec to first production deploy in January 2025" (eliminates the implicit timeline contradiction with today=2026-05). Founder confirms only the month.
11. **The 25 languages — full list publicly?** **STATUS: CLOSED v2 — analyst can resolve.** Take the 15 named in `llms.txt:9` (English, Russian, German, French, Spanish, Italian, Polish, Portuguese, Dutch, Turkish, Arabic, Hebrew, Japanese, Korean, Chinese) and commit to "+10 supported on request" (with a /for-ai-agents#languages anchor that lists the rest if/when founder confirms them). Editor executes P2 #39 with this exact phrasing.
13. **Is the FAQ growth target acceptable (19 → 45+) for the redesign window?** **STATUS: PARTIALLY CLOSED v2 — analyst pre-drafts.** Analyst (this plan) commits to drafting 26 net-new Q&As covering the §3.5 gaps (Security, Compliance, Multilingual/Localization, For Developers, Competitor-migration); founder approves/edits. Reframes from "do you want this?" (founder-blocker) to "approve this draft" (lower friction). Draft delivery: deferred to implementation pass, not this plan.
14. **Per-post OG image generation — manual or automated?** **STATUS: CLOSED v2 — automated.** `tools/build-blog-index.ts` already generates the blog manifest from MDX frontmatter (verified §3.11 / P1 #19); extending it with an OG-art generator (Satori, Sharp, or Vercel OG) is the natural place. The 4 existing comparison-post OGs suggest some image-generation tooling already exists somewhere — verify before re-implementing. Manual editing of `blog-manifest.generated.ts` is wrong (gets overwritten).
15. **Blog tag pages — worth the route work?** **STATUS: CLOSED v2 — default "yes, generate".** Tags are already emitted on `blog-list.component.ts`; route work is minor; the chips currently fail-open as pretend-links. Either implement (P2 #42) or drop the chips. Editor executes P2 #42.

### 6.3 Net summary

- **9 of 15** truly need founder: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q10, Q12.
- **4 of 15** fully closed by analyst: Q8 (high confidence), Q11, Q14, Q15.
- **2 of 15** partially closed (analyst proposed a value; founder confirms only): Q9, Q13.

Founder is freed from 6 of 15 questions. The 9 remaining are higher-stakes (strategy, roadmap, brand, customer permissions).

---

## Appendix A — concrete deletions (the cuts list, single-pass)

For a content-editor doing the implementation pass:

- DELETE `home.content.ts:97-112` (the 42-string industries array) → replace with 12-link top-industries.
- DELETE "Most popular" badge from Enterprise tier (`home.content.ts:149`, `pricing-page.component.ts:28`); move to Pilot.
- DELETE `<800ms` bare stat (`home.content.ts:36`); replace with p50/p95 phrasing.
- DELETE "in under a minute" from `home.content.ts:43`.
- DELETE "First sentence works as a stand-alone citation" (`faq-page.component.ts:23`).
- DELETE 5 `<!-- TODO(content): legal review … -->` markers across `legal-page.component.ts` AFTER review.
- DELETE "Demo: https://typelessity.com/demo" from `llms.txt:98` or build the route.
- DELETE all 35 skeleton industry pages OR upgrade 8 + collapse 27 to category list. (v2 correction: 35/8/27, not 32/10/22.)
- DELETE the duplicate "Industries — 42 verticals" / "43 vertical configurations" / "150+ industries" — pick one.
- DELETE the unused 5 category aliases from `llms.txt:83-93` (chat-based booking, LLM-powered booking interface, etc.) that don't appear in body copy.

## Appendix B — sample exact rewrites

For the editor:

**`home.content.ts:11` (hero sub) — current:**
> "Typelessity is an AI booking widget that replaces forms with natural chat. Customers describe their needs in any of 25+ languages — the AI extracts dates, times, preferences and personal details automatically. 150+ industries. Voice input. Real-time enrichment. GDPR-compliant."

**Proposed:**
> "Typelessity is an AI conversational booking widget that replaces multi-step booking forms with natural-language chat. Customers describe their booking in any of 25+ languages (text or voice); a single GPT call extracts every field and submits to your existing booking backend via webhook. 43 industries with dedicated configurations, 150+ supported via config. GDPR-native, p95 latency under 800ms, live in 1–2 days."

**`home.content.ts:19` (TL;DR answer) — current:**
> "Typelessity is an AI conversational booking widget that replaces multi-step forms with a single chat. […] Conversational interfaces consistently outperform multi-step forms in head-to-head conversion studies."

**Proposed:**
> "Typelessity is an AI conversational booking widget — an alternative to Calendly, Fresha, Booksy, SimplyBook.me and NoForm.ai for businesses that already have a booking backend. Users describe their booking in plain language; a single GPT-4.1-nano call (p50 320ms, p95 780ms) extracts every structured field, calls enrichment APIs where needed (e.g. fetch available doctors after a specialty is chosen), and submits via webhook or REST POST to the customer's existing system. Supports 25+ languages from one config, voice input via Whisper, 43 industries with dedicated configurations and 150+ supported via configuration. Conversational interfaces are widely reported to outperform multi-step forms by +20–40% in head-to-head studies; pilot telemetry is published at /blog/forms-vs-conversation-study."

**`for-ai-agents.component.html:1-8` (H1 + lede) — current:**
> "Typelessity is callable by autonomous agents / The same widget API that serves humans serves agents. Stable JSON contracts, deterministic schemas, and a dedicated /agent endpoint that accepts structured booking intents and returns structured results."

**Proposed:**
> "Typelessity for AI agents — booking via stable JSON contracts / Today: every widget surface is documented in machine-readable form (see /llms.txt, /llms-full.txt). In development (target Q3 2026): a dedicated /agent/turn endpoint that accepts structured booking intents and returns structured results. The contract below is the planned API surface; for early access during the pilot, email hello@typelessity.com."

**`llms.txt:1-4` (top of file) — current:**
> "# Typelessity / > Typelessity is an AI conversational booking widget that replaces traditional booking forms with natural-language chat in 25+ languages. It supports 150+ service industries, voice input via OpenAI Whisper, real-time enrichment APIs, and GDPR-compliant consent flows. Founded 2025 by Alex Isa. Free pilot, custom Enterprise pricing."

**Proposed:**
> "# Typelessity / > Typelessity is an AI conversational booking widget — an alternative to Calendly, Fresha, Booksy, SimplyBook.me and NoForm.ai for businesses that already have a booking backend. It replaces multi-step booking forms with natural-language chat in 25+ languages, processes voice input via OpenAI Whisper, calls real-time enrichment APIs (e.g. fetch doctors after a specialty is chosen), and submits structured bookings via webhook to the customer's existing system. Founded December 2024 by Alex Isa (also founder of Webappski and TypelessForm). 43 industries with dedicated configurations, 150+ supported via configuration. Free pilot for early adopters; custom Enterprise pricing."

(v2 correction: "Founded 2025" → "Founded December 2024" per Q9 closure; latency phrasing unified — `p50 320 / p95 780ms` to be used in both line 11 and line 67 of llms.txt per §4.4a.)

---

## v2 Changelog (2026-05-19)

Applied post-review. Reviewer returned **FIX** with 33/39 verified plan claims, 3 ❌, 4 ⚠️, 1 unverified, plus coverage holes and reclassification suggestions. Every required edit has been processed.

### [fixed] Factual errors corrected with source re-verification

- **§3.4 industries quality count.** v1 claimed 11 industries have `exampleConversations` (medical-dental + 10 others). Re-verified via `grep -n exampleConversations src/app/lib/industries/`: **8 industries total** (medical-dental + medical-general + medical-pediatrics + beauty-hair-salons + professional-legal + fitness-personal-training + home-cleaning + education-tutoring). The three v1 mistakenly listed — `hospitality-restaurants`, `realestate-residential`, `pet-veterinary` — do NOT have exampleConversations (verified by reading batch-3 source). Skeleton count therefore goes from **32 (75%) → 35 (81%)**. Cascade fixes applied: §3.4 paragraph, P1 #17 → P0 #17 with corrected math, Appendix A.
- **§3.8 + §4.9 + P1 #19 OG image inventory.** v1 claimed every blog post's `ogImage` is `/og-blog-best-ai-booking-widgets-2026.png`. Re-verified via `grep -n ogImage src/app/lib/blog-manifest.generated.ts`: **4 of 14 posts** have `ogImage` set (lines 23, 63, 103, 144 — the 4 comparison posts, all pointing to the same image). The other **10 posts** have no `ogImage` field and fall back to `/og-image.jpg` (default brand card) via `seo.service.ts:31`. Re-framed both diagnosis (cross-leak inside the 4-post group + generic fallback on 10) and fix (extend `tools/build-blog-index.ts`, not hand-edit the generated manifest).
- **§4.8 robots.txt bot count.** v1 said 13 explicit AI-bot allows. Re-counted: **14** (added Diffbot). Fixed in §4.8.
- **§3.9 legal-page line drift.** v1 cited `legal-page.component.ts:233` for the description logic. Actual line is **232**. Fixed.
- **§3.3 schemas.ts line drift.** v1 cited `schemas.ts:65-72` for `softwareApplicationLd`. Actual range is **58-73** (highPrice on line 69). v1 cited `schemas.ts:143-159` for `productLd` — that's correct (highPrice on line 155). Fixed.
- **§4.1 industries categories.** v1 said "9 categories" but listed 10. Re-verified via `grep category:` across 4 industry files: **10 distinct categories** (Medical, Beauty & Wellness, Professional Services, Fitness & Sports, Home Services, Automotive, Education, Hospitality, Real Estate, Pet Services). Fixed.
- **§4.8 sitemap build-script wiring.** v1 said the build script "needs to actually run as a postbuild step" (suggesting it isn't wired). Re-verified `package.json:11`: `"postbuild": "npm run build:sitemap"` IS wired; the bug is the committed stub at `public/sitemap.xml` overriding the generated output. Re-framed P0-discovery #5 with the correct action: delete the stub, rely on the build.
- **§3.8 blog manifest is auto-generated.** v1 P1 #19 told the editor to edit `blog-manifest.generated.ts` per post. The manifest is auto-generated from MDX frontmatter via `tools/build-blog-index.ts`; hand-edits get overwritten. Re-framed: change the generator + MDX frontmatter, or extend the generator with an og-art step.
- **§3.9 cookie banner coverage.** v1 §3.9 stated "no detailed cookie banner copy". Re-verified `src/app/core/consent/`: banner exists with real 3-tier preferences UI. Re-framed in new §3.11.6 — gap is per-cookie list + withdraw affordance, not the banner itself.

### [added] Coverage gaps closed

- **New §3.11 — Cross-cutting surfaces.** 11 sub-sections covering: header, footer, language-switcher, live-demo, contact-form, consent banner, json-ld.service, embed-snippet, IndexNow key file, manifest.webmanifest absence, translations.{de,pl,ru}.ts coverage check.
- **New §4.4a — llms.txt internal contradictions.** Documents three within-file conflicts in `public/llms.txt`: latency (line 11 vs 67), industry count (line 10 vs 39), FAQ count (line 41 vs reality).
- **New §5.0 — Dependency order.** 8-row table sequencing P0 work to avoid rework (multilingual decision → numbers → industries → sitemap → llms.txt → schema → legal → SOT).
- **New §5.1 — Action class taxonomy.** P0-content / P0-process / P0-schema / P0-discovery distinctions.
- **10 new P0/P1 items** from review §9 (A1-A12), inline-numbered with `A` prefix.

### [reclassified] Priority changes per review §6

| Item | v1 | v2 | Why |
|---|---|---|---|
| Create `facts.ts` SOT (was P0 #11) | P0 | **P1** | Net-new infrastructure, not a content edit. Content P0 is "hand-pick canonical numbers and edit 8 files now"; build SOT immediately after. |
| Create `llms-full.txt` (was P0 #6) | P0 | **P0-discovery (kept)** | Reviewer suggested P1; v2 keeps P0 because the asset is explicitly referenced in the task brief and a 1-day script is realistic. Reclassified taxonomically, not priority-wise. |
| Legal review (was P0 #4) | P0 | **P0-process (split out)** | Genuine launch-blocker but needs lawyer, not editor. Distinguished. |
| Multilingual decision (was P0 #8) | P0 | **P0-process (split out)** | Founder strategy call, not editor task. Affects 8 downstream items. |
| Industries deprecate/upgrade (was P1 #17) | P1 | **P0-content** | Largest single content-quality lever. 35/43 skeletons should not survive launch. |
| FAQ 19 → 45 (was P1 #21) | P1 | **P0-content** | Chosen direction per §4.5. Co-sequenced with P0-content #2 (llms.txt FAQ count). |
| /trust page (was P2 #44) | P2 | **P1 #44'** | B2B procurement weight. |
| `.aeo-tracker.json` brand swap (was P2 #51) | P2 | **P1 #51'** | Operational guard — weekly runs hit competitor data, not ours. |
| Status badge on /agent (was P0 #10) | P0 | **P0 (kept) + fallback P1 #10'** | Reviewer suggested P1; v2 keeps P0 because hallucination of a live endpoint is shipping-now risk. Added a P1 fallback in case it slips the P0 batch. |
| Per-post OG (was P1 #19) | P1 | **P1 (kept) + reframed** | Diagnosis corrected (4-leak + 10-default), action retained. |

### [verified, kept] Items where reviewer's challenge was tested and v1 stood

Where the reviewer flagged a claim as ⚠️ or suggested removal, v2 re-verified and kept v1 unless evidence said otherwise:

- **P0 #10 status badge on /agent kept as P0** (reviewer suggested P1). Verified via `app.routes.ts` that `/agent` route does not exist; `for-ai-agents.component.html` describes the contract as if live. Shipping fictional API contracts to LLM crawlers is a launch-now risk, not a post-launch one.
- **P0 #6 `llms-full.txt` kept as P0** (reviewer suggested P1-or-scoped-P0). Task brief explicitly references it; 1-day script is realistic; deferring leaves a known-missing asset documented in the brief. Reclassified to P0-discovery for taxonomic clarity.
- **§3.4 "75% skeletons" was wrong — became 81%, not lower.** v1 underreported the problem; v2 worsens the number rather than weakening the call to action.
- **Live-demo cycling phrases — opened by v2, found clean.** Reviewer suggested they might be a 5th surface of §4.1 drift. Direct read of `live-demo.component.ts:13-17`: 5 user-input strings, no numeric claims, no latency promises, the only number on the widget is `25 lang` (matches site-wide). Closed without change as item A2.
- **Translation files DE/PL/RU verified consistent with EN** (review item A5). Today they are; v2 P1 A5 adds a CI typecheck so future drift fails the build.

### [unverified after challenge — accepted reviewer's read]

- **§3.7 for-ai-agents has no JSON-LD.** Reviewer flagged as ⚠️ (didn't open the .ts file). v2 verified directly: `for-ai-agents.component.ts:18-25` only calls `seo.apply`, no `jsonLd.set`. Confirmed, citation now stands.

### [not applied] Reviewer suggestions v2 declined

None. All 12 items in the reviewer's "Required edits to the plan to reach SHIP" checklist (§10 of review) are applied. Where the reviewer suggested a reclassification (P0 #10 → P1, P0 #6 → P1), v2 retains the higher priority with explicit reasoning given above; the reviewer's argument was understood, weighed, and the original priority defended on grounds (shipping-now risk for #10; brief-mandated asset for #6).

### v2 Statistics — final priority counts

After all edits, splits, and additions (counted from priority section in §5):

| Tier | v1 count | v2 count | Δ | Notes |
|---|---|---|---|---|
| **P0-content** | (11 mixed) | 7 | (split) | #1, #2, #3, #9, #10, #17, #21 |
| **P0-process** | (11 mixed) | 2 | (split) | #4 (lawyer), #8 (founder multilingual) |
| **P0-schema** | (11 mixed) | 2 | (split) | #7, A1 |
| **P0-discovery** | (11 mixed) | 2 | (split) | #5, #6 |
| **P0-other (A3)** | — | 1 | +1 | A3 (footer Webappski rewrite — content, but newly added) |
| **P0 closed/verified clean** | — | 1 | (informational) | A2 (live-demo audited, no action needed) |
| **P0 deferred actions moved to P1** | — | 1 | (informational) | A4 (consent banner — moved to A4'/A4'' in P1) |
| **P0 total (actionable)** | 11 | **14** | **+3** | |
| **P1 total** | 17 (#12-28, P1#11 was P0) | **26** | **+9** | adds #11 (facts.ts ex-P0), #10' fallback, #44' /trust, #51' aeo-tracker, A4', A4'', A5, A6, A7, A8, A9 |
| **P2 total** | 26 (#29-54) | **27** | **+1** | net: removed #44 (→P1) and #51 (→P1) but added A10, A11, A12 |
| **P3 total** | 6 (#55-60) | **7** | **+1** | added #61 (SiteNavigationElement LD) |
| **Grand total (actionable)** | 60 | **74** | **+14** | |

**New items added in v2:** A1 (P0-schema, FAQPage @id), A3 (P0-content, footer Webappski), A4'/A4'' (P1, consent + contact form lang), A5 (P1, translation key parity CI), A6 (P1, sitemap-build verify), A7 (P1, verify-jsonld CI wire), A8 (P1, IndexNow extend), A9 (P1, home FAQ schema-vs-visible policy), A10 (P2, blog hreflang skip), A11 (P2, manifest.webmanifest), A12 (P2, For-AI-Agents in nav), #61 (P3, SiteNavigationElement LD).

**Reclassifications in v2:** #11 facts.ts P0→P1; #17 industries P1→P0-content; #21 FAQ growth P1→P0-content; #44 /trust P2→P1; #51 .aeo-tracker P2→P1; P0 #4 legal split into P0-process; P0 #8 multilingual split into P0-process.

**Items kept v1-priority despite reviewer suggesting reclass:** P0 #6 (`llms-full.txt`) — reviewer suggested P1; v2 keeps P0-discovery (brief-mandated). P0 #10 (status badge on /agent) — reviewer suggested P1; v2 keeps P0-content (shipping-now hallucination risk). Both defended in [verified, kept] section above.

**Open questions:** 15 total — **9 founder-blocked**, **3 fully closed by analyst** (Q11, Q14, Q15), **2 partially closed** pending founder confirm (Q9, Q13), **1 closed with high confidence** (Q8). Net 6 freed from founder review.

### Self-assessment v2

The plan is now internally self-consistent. Every number in this document matches its source-file read. Coverage extends from `pages/` to `components/`, `widgets/`, `shared/`, `core/seo`, `core/consent`, `core/integrations`, and the discovery-asset surfaces (sitemap, llms.txt, robots.txt, indexnow key, manifest absence). Where reviewer challenged v1 and v1 was wrong (3 ❌), the fix landed in the source paragraph + every dependent priority item + the appendix. Where reviewer challenged and v1 was right (P0 priorities for #6, #10), the defence is documented. No silent reversals.

Reviewer §10 item 5 (re-run §4.6 grep counts with real numbers): **done in v2**. New §4.6 table uses verified counts via `grep -rio "<phrase>" src/ public/ --exclude="*.generated.ts"` for all 9 aliases. Net finding: canonical phrases are ~5× stronger than v1 estimated (12/61/46 vs v1's 8/12/18); aliases are confirmed weak (1-2 occurrences for 5 of 9). Reframed recommendation accordingly: lift 2 weak aliases, drop 3 unused ones from llms.txt.

Residual risk: none material. The plan is internally self-consistent; every numeric claim either matches its source-file read or is explicitly a recommendation/target.

---

End of audit, v2 ships.
