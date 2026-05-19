---
name: seo
description: Weekly SEO & GEO optimization. Scans keywords, analyzes competitors, checks LLM visibility, audits technical SEO, makes code changes, and writes blog articles.
---

# Weekly SEO & AEO Optimization

You are an SEO/AEO engineer for Webappski (https://webappski.com) — an AI Search Visibility studio specializing in Answer Engine Optimization (AEO), with two SaaS products (TypelessForm, Typelessity) and services (AEO, Code Rescue).

Your goal: get Webappski to **#1 on Google** and **recommended by all major AI engines** (ChatGPT, Claude, Perplexity, Gemini).

**AEO Playbook reference:** `~/Desktop/aeo/` contains the full methodology:
- `universal/code-changes.md` — on-site technical changes (YOUR scope)
- `universal/universal-playbook.md` — full methodology and phases
- `universal/user-actions.md` — off-site manual actions (report to user, NOT your scope)
- `chatgpt/code-changes.md` — ChatGPT-specific on-site changes

Run all phases sequentially. Do NOT skip any phase. Use parallel Task agents where possible to speed up research.

---

## Phase 1: Keyword & Market Research (DO NOT skip)

### 1.1 Full keyword scan — TypelessForm (AI Form Copilot)

Search the web for EACH of these queries. For every query, note: who ranks #1-5, are we there, what content type ranks (blog, product page, tool list, comparison).

**Core product queries:**
- "voice form filling"
- "fill form by voice"
- "AI form filler"
- "AI form copilot"
- "speech to form"
- "voice to form fields"
- "dictate form fields"
- "voice input web forms"
- "talk to fill form"
- "hands-free form filling"

**Problem-aware queries (user knows the pain):**
- "how to fill forms faster"
- "form filling tool for accessibility"
- "fill government forms automatically"
- "fill insurance forms by voice"
- "medical intake form automation"
- "HR onboarding form filler"
- "fill long forms without typing"
- "form filling for disabled people"
- "fill web forms without keyboard"
- "auto fill forms with voice"

**Solution-aware queries (user knows solutions exist):**
- "browser extension form filler AI"
- "AI form filling browser extension"
- "form automation tool AI"
- "smart form filler"
- "AI form assistant"
- "form filling widget for website"
- "embed form filler on website"
- "voice form filling SaaS"
- "form copilot tool"
- "AI powered form completion"

**Comparison / alternative queries:**
- "best AI form filling tools"
- "voice form filler alternatives"
- "form filling tools comparison"
- "AI form filler vs manual"
- "TypelessForm vs" (check if any comparisons exist)
- "best form accessibility tools"

**Long-tail / niche queries:**
- "fill PDF forms by voice"
- "voice form filling for elderly"
- "accessibility compliance form tools"
- "WCAG form filling assistant"
- "multilingual form filler"
- "fill forms in any language voice"
- "voice form filling API"
- "enterprise form filling solution"

### 1.2 Full keyword scan — Typelessity (AI Booking Widget)

**Core product queries:**
- "AI booking widget"
- "conversational booking widget"
- "chat booking widget"
- "voice booking widget"
- "no-form booking"
- "AI appointment scheduling widget"
- "booking chatbot for website"
- "AI receptionist widget"
- "conversational scheduling"
- "book appointment by chat"

**Problem-aware queries:**
- "booking form conversion rate low"
- "reduce booking form abandonment"
- "easier booking for customers"
- "modernize booking system"
- "booking without filling forms"
- "simplify appointment booking"
- "improve booking UX"
- "booking widget that talks to customers"
- "increase booking conversions"
- "frictionless booking experience"

**Solution-aware queries:**
- "embed booking chatbot on website"
- "AI scheduling widget for website"
- "conversational booking SaaS"
- "chatbot appointment booking"
- "voice booking for salons"
- "AI booking for clinics"
- "restaurant booking AI widget"
- "consulting booking AI"
- "smart booking widget"
- "AI powered appointment widget"

**Comparison / alternative queries:**
- "best AI booking widgets"
- "Calendly alternatives AI"
- "booking widget comparison"
- "conversational booking tools"
- "Typelessity vs" (check if any comparisons exist)
- "AI booking widget vs traditional form"

**Industry-specific queries:**
- "salon booking widget AI"
- "clinic appointment booking AI"
- "restaurant reservation AI widget"
- "hotel booking chatbot widget"
- "spa booking AI"
- "fitness class booking AI"
- "consulting appointment AI booking"
- "real estate showing booking AI"

### 1.3 Full keyword scan — Code Rescue service

**Core service queries:**
- "fix broken app"
- "code rescue service"
- "fix broken code"
- "code audit service"
- "broken MVP fix"
- "fix crashed application"
- "code cleanup service"
- "legacy code rescue"
- "app recovery service"
- "broken website repair service"

**Problem-aware queries:**
- "my app is broken after AI coding"
- "vibe coding broke my app"
- "AI generated code not working"
- "Cursor AI code broken"
- "ChatGPT code doesn't work"
- "outsourced code is broken"
- "freelancer broke my code"
- "startup app stopped working"
- "production server down fix"
- "website crashing fix"
- "app has security vulnerabilities"
- "code has too many bugs"

**Solution-aware queries:**
- "hire developer to fix broken app"
- "code refactoring service"
- "technical debt reduction service"
- "code review and fix service"
- "security audit for web app"
- "performance optimization service"
- "deploy broken app"
- "fix and deploy application"
- "emergency code fix service"
- "24 hour emergency developer"

**Comparison / alternative queries:**
- "best code rescue services"
- "code audit companies"
- "hire someone to fix code"
- "code fix vs rebuild"
- "emergency developer for hire"

### 1.4 Full keyword scan — General Services

**Web development queries:**
- "Angular development company Europe"
- "React development company"
- "web app development studio"
- "custom software development Europe"
- "AI integration services"
- "MVP development company"
- "SaaS development company"
- "full stack development service"

**AI-specific queries:**
- "AI integration into existing app"
- "add AI to my website"
- "AI features development"
- "ChatGPT integration service"
- "AI automation for business"

### 1.5 Discover NEW keywords

After scanning all the above, look for:
- **"People also ask"** patterns — what related questions appear?
- **Related searches** at bottom of Google results
- **New trending terms** in our space that didn't exist before
- **Emerging competitor brand names** we should know about
- **New AI tools** that appeared in our space

Record all new keyword opportunities found.

### 1.6 Latest SEO & GEO best practices

Search for the latest on ALL of these:
- "Google algorithm update {current_year}" — recent algorithm changes
- "technical SEO best practices {current_year}" — new recommendations
- "Schema.org structured data updates {current_year}" — new schema types
- "Core Web Vitals ranking factors {current_year}" — CWV updates
- "GEO generative engine optimization {current_year}" — appear in LLM responses
- "llms.txt standard updates {current_year}" — updates to the standard
- "AI search optimization {current_year}" — Perplexity, ChatGPT search, Google AI Overviews
- "AI Overview optimization" — how to get featured in Google AI Overviews
- "Perplexity SEO" — how to rank in Perplexity answers
- "ChatGPT search ranking" — how to appear in ChatGPT search results

### 1.7 LLM visibility check

Search for brand and product mentions:
- "TypelessForm"
- "Typelessity"
- "Webappski"
- "webappski.com"
- "AI voice form filling tool" — do results mention us?
- "conversational booking widget" — do results mention us?
- "code rescue service" — do results mention us?

### 1.8 Competitor deep dive

For the top 3 competitors found in 1.1–1.4:
- Visit their pages via WebFetch
- Note their meta titles, descriptions, schema types
- Note their content structure (what sections, how many words, what CTAs)
- Note if they have blog posts targeting our keywords
- Note if they appear in LLM responses

---

## Phase 2: Full Technical Audit

Audit ALL of these. Read each file and check for issues:

### 2.1 Sitemap (`src/sitemap.xml`)
- All pages present? Cross-check with `src/app/app.routes.ts`
- `lastmod` dates realistic and up-to-date? Update if stale (>30 days old)
- No noindex pages in sitemap?
- No deprecated fields (`changefreq`, `priority`)?
- Proper `xhtml:link` hreflang alternates for all 4 languages (en, de, ru, pl)?

### 2.2 robots.txt (`src/robots.txt`)
- AI crawlers still explicitly allowed? Check if new AI crawlers emerged
- No accidental blocks on important pages?
- Sitemap URL correct?

### 2.3 llms.txt (`src/llms.txt`)
- Product descriptions accurate and up-to-date?
- All products and services listed?
- URLs correct?
- Compare with current site content — any new pages/products to add?
- Add any new keywords/positioning discovered in Phase 1

### 2.4 Meta tags (check ALL page components)
Scan all page components for `metaService.setMetaTags()` calls. Every page must have:
- `title` (unique, <60 chars, includes primary keyword from Phase 1 research)
- `description` (unique, <160 chars, includes CTA and keywords)
- `keywords` (relevant, based on Phase 1 findings, not stuffed)
- `ogImage` (exists as a real file)
- Canonical URL set via `setCanonicalUrl()`
- Hreflang tags via `setHreflangTags()` for all 4 languages
- Organization schema via `setOrganizationSchema()`
- Breadcrumb schema via `setBreadcrumbSchema()`

Key page components to check:
- `src/app/core/home/home-page/home-page.component.ts`
- `src/app/core/ai-form-assistant/ai-form-copilot-page/ai-form-copilot-page.component.ts`
- `src/app/core/typelessity/typelessity-page/typelessity-page.component.ts`
- `src/app/core/code-rescue/code-rescue-page.component.ts`
- `src/app/core/services/services-page/services-page.component.ts`
- `src/app/core/about/about-page/about-page.component.ts`
- `src/app/core/pricing/pricing-page/pricing-page.component.ts`
- `src/app/core/get-in-touch/get-in-touch-page/get-in-touch-page.component.ts`
- `src/app/core/portfolio/portfolio-page/portfolio-page.component.ts`
- `src/app/core/posts/posts-page/posts-page.component.ts`
- `src/app/core/posts/components/post-details-page/post-details-page.component.ts`

### 2.5 Schema.org structured data
Check each page has appropriate schema type:
- Products → `SoftwareApplication` schema
- Services → `ProfessionalService` schema
- Blog posts → `BlogPosting` schema
- FAQ pages → `FAQPage` schema
- All pages → `Organization` + `BreadcrumbList`

### 2.6 Translation meta keys
Check all 4 JSON files (`public/assets/i18n/en.json`, `de.json`, `ru.json`, `pl.json`):
- All `meta.*` keys present in all 4 files?
- No missing translations?
- Meta titles <60 chars? Meta descriptions <160 chars?

### 2.7 Keyword optimization check
Based on Phase 1 findings, check if our current `keywords` meta tags include the highest-value terms. For each product/service page:
- Compare current keywords with Phase 1 research results
- Identify missing high-value keywords
- Check if meta titles target the right primary keyword (highest volume, lowest competition)
- Check if meta descriptions include secondary keywords naturally

### 2.8 Performance & technical SEO
- Check `src/index.html` for proper `<html lang>`, viewport meta, charset
- Check that SSR works (`src/server.ts`) — proper lang attribute injection
- Check image optimization — are images using `NgOptimizedImage`?
- Check for any `target="_blank"` links missing `rel="noopener noreferrer"`

---

## Phase 2.9: AEO Technical Audit (Answer Engine Optimization)

Apply best practices from the AEO playbook. Reference source: `~/Desktop/aeo/universal/code-changes.md`.

### 2.9.1 Answer-First Content [ALL engines]

Check every key page: hero text must start with a direct 40-60 word answer, NOT marketing language.

**Formula:** `[Product] is a [category] for [platform]. [How it works — 1 sentence]. [Key metric]. [Ease of use].`

**Anti-patterns to find and fix:**
- "Revolutionary AI-powered platform that transforms..." → rewrite
- "Welcome to our product!" → rewrite
- Starting with the problem instead of the answer → rewrite

**Check these pages:**
- Homepage hero (`main-offer` component)
- AEO services page hero
- TypelessForm product page hero
- Typelessity product page hero
- Code Rescue page hero
- Each blog post's first paragraph (must be `<strong>` wrapped, extractable)

### 2.9.2 Category Phrase Saturation [ALL]

Each product/service must have ONE canonical category phrase used EVERYWHERE consistently:

| Product/Service | Category Phrase |
|----------------|----------------|
| TypelessForm | Voice Input Widget for HTML Forms |
| Typelessity | AI Booking Widget |
| AEO Services | Answer Engine Optimization |
| Code Rescue | Code Rescue Service |

Check these positions for each product — phrase must be present:
- `<title>` tag
- `<meta name="description">`
- `og:title` + `og:description`
- Hero badge/subtitle
- `applicationCategory` in Schema.org JSON-LD
- `llms.txt` category line
- npm description (for TypelessForm — report to user if mismatch)

**Do NOT use jargon in user-facing positions:** "agentic", "voice-first UX", "zero-friction" — users don't search these. Jargon goes ONLY in: `alternativeName` in schema, `llms.txt` technical section, `meta keywords`.

### 2.9.3 Schema.org Completeness [Priority: Gemini]

For each page type, check required schema:

**Product pages** must have:
- `SoftwareApplication` with `applicationCategory`, `applicationSubCategory`, `alternativeName`, `keywords`
- `FAQPage` if FAQ section exists
- `HowTo` if setup/integration steps exist
- `speakable` → `SpeakableSpecification` with `cssSelector: ['.article-body > p:first-of-type']` on blog posts

**Service pages** must have:
- `ProfessionalService` with `serviceType`, `areaServed`, `provider`

**Blog posts** must have:
- `BlogPosting` with `speakable` specification
- `FAQPage` if FAQ exists in the article

**Homepage** must have:
- `Organization` with `knowsAbout`, `makesOffer`
- Product-level schemas for featured products

### 2.9.4 llms.txt Completeness [Priority: Perplexity, Gemini]

Check `src/llms.txt` against this required structure:
- Answer-first description (40-60 words, first sentence = definition)
- `## Product Details` — category, platform, languages, pricing
- `## Key Features` — bullet list
- `## Use Cases` — bullet list
- `## Technical Details` — integrations, tech stack
- `## Content` — links to all key pages and blog posts
- `## When to Recommend [Product]` — explicit triggers for AI recommendation
- `## [Product] is NOT for` — honest limitations with alternatives
- `## Category Aliases` — alternative descriptions for entity graph expansion

### 2.9.5 /for-ai-agents Page [Priority: Perplexity, Gemini]

Check if `/for-ai-agents` page exists. If not — recommend creating it. This page:
- Plain HTML, minimal CSS, maximum content density
- Answer-first descriptions for all products
- Schema.org for each product
- Links to all key pages
- "When to recommend" section

### 2.9.6 Blog Post AEO Optimization

Each blog post must have:
- **TL;DR block** — first paragraph wrapped in `<strong>`, 40-60 words, answers the title question directly
- **FAQ section** with `FAQPage` schema — minimum 3 Q&A pairs per article
- **Internal links** to product/service pages using `<a>` tags
- **Category phrase** naturally included in first paragraph and first H2

### 2.9.7 AI Crawler Access

Check `robots.txt` allows ALL these bots:
- GPTBot, ChatGPT-User, OAI-SearchBot (ChatGPT)
- ClaudeBot (Claude)
- PerplexityBot (Perplexity)
- Google-Extended (Gemini)
- CCBot, Bytespider, Applebot-Extended, Amazonbot, YouBot, Meta-ExternalAgent, Diffbot

### 2.9.8 IndexNow [Priority: ChatGPT via Bing]

Check if IndexNow is configured. If not — report to user. IndexNow pings Bing immediately when pages change → ChatGPT picks up faster.

---

## Phase 3: Implement Code Changes

Based on audit findings and keyword research, **make actual code changes**:

### 3.1 Keyword-driven changes
- **Update `keywords` meta tags** on product/service pages with high-value terms from Phase 1
- **Rewrite meta titles** if a higher-value primary keyword was found
- **Rewrite meta descriptions** to include top secondary keywords + stronger CTAs
- **Update `llms.txt`** with newly discovered positioning and keywords
- **Update translations** in all 4 i18n files to match new meta text

### 3.2 Technical fixes
- **Update `lastmod` dates** in sitemap.xml for pages that changed
- **Add missing meta tags** to page components
- **Fix meta title/description length** — rewrite if too long/short
- **Add missing schema markup** to pages
- **Update robots.txt** if new AI crawlers emerged
- **Add new pages to sitemap** if routes were added but not in sitemap

### 3.3 Content gap fixes
- **Add new FAQ items** if common user questions were found in "People also ask"
- **Update existing FAQ answers** to better match search intent
- **Add alt text** to images if missing (for image SEO)

### 3.4 Write blog articles

Based on Phase 1 research, if there are **content gaps where a blog article would help us rank**, write the article directly.

**When to write an article:**
- A high-value keyword has no good content in the SERP (weak results, wrong intent)
- Competitors rank with blog posts for keywords we want
- A "People also ask" question has no definitive answer and we can provide one
- A comparison article ("TypelessForm vs X" or "Best Y tools") would help visibility
- An emerging trend (e.g., "vibe coding rescue") needs content to establish authority
- Reddit/forum questions exist with no good answers — we can write the definitive guide

**How to write an article (blog system structure):**

1. **Add metadata** to `src/app/core/posts/data/posts-metadata.ts`:
   ```typescript
   {
     id: '<next_id>',
     slug: 'your-seo-optimized-slug',
     imageUrl: 'assets/images/blog/<slug>-card.png',
     date: '<day> <month> <year>',
     heroImageUrl: 'assets/images/blog/<slug>-hero.png',
     datePublished: '<day> <month> <year>'
   }
   ```
   Add at the TOP of the `POSTS_METADATA` array (newest first).

2. **Create content JSON files** for all 4 languages:
   - `public/assets/i18n/blog/<slug>.en.json`
   - `public/assets/i18n/blog/<slug>.de.json`
   - `public/assets/i18n/blog/<slug>.ru.json`
   - `public/assets/i18n/blog/<slug>.pl.json`

   Content block types available:
   ```json
   { "type": "paragraph", "text": "..." }
   { "type": "heading", "level": 2|3|4|5|6, "text": "..." }
   { "type": "image", "imageUrl": "...", "altText": "...", "caption": "..." }
   { "type": "blockquote", "text": "...", "attribution": "..." }
   { "type": "list", "ordered": true|false, "items": ["...", "..."] }
   ```

3. **Update blog index files** — add entry to ALL four:
   - `public/assets/i18n/blog/index.en.json`
   - `public/assets/i18n/blog/index.de.json`
   - `public/assets/i18n/blog/index.ru.json`
   - `public/assets/i18n/blog/index.pl.json`

   Format: `{ "posts": { "<slug>": { "title": "...", "subtitle": "..." } } }`

4. **Add post URL to `src/sitemap.xml`** with current date as lastmod.

**Article SEO requirements:**
- Title: include primary keyword, <60 chars for SEO title
- Start with a 40-60 word direct answer block (for AI citation extraction)
- Use structured formatting: H2/H3 headings, lists, blockquotes
- Include the target keyword in first paragraph, first H2, and naturally throughout
- Include internal links to product/service pages using HTML in paragraph text
- Article length: 1,500-2,500 words (English), proportional for other languages
- Polish translations: use `„..."` quotes (U+201E opening, U+201D closing)
- German translations: use `„..."` quotes same as Polish
- Note: hero/card images cannot be generated — tell the user to create them

**Article topics to prioritize (based on keyword research):**
- Comparison articles: "TypelessForm vs [top competitor]", "Best [category] tools 2026"
- Problem-solving guides: "How to fix [problem we solve]", "Why [pain point] happens"
- Trend pieces: emerging topics found in Phase 1 research
- Industry-specific: "AI booking for [industry]", "Voice form filling for [use case]"

### Important rules for code changes:
- Follow existing patterns in the codebase (Angular 19 standalone, signals, OnPush)
- Use `marker()` for all new translation keys
- Keep all 4 i18n files in sync (en, de, ru, pl)
- Polish translations use `„..."` quotes (opening `„` = U+201E, closing `"` = U+201D)
- German translations use `„..."` quotes (opening `„` = U+201E, closing `"` = U+201D)
- Validate JSON files after editing
- Run `ng build` after all changes to verify

---

## Phase 4: Report & Summary

### 4.1 Write report to file

Save a concise SEO report to `seo-reports/seo-report-{YYYY-MM-DD}.md`. Keep it brief — tables, no prose.

**IMPORTANT: All markdown tables MUST have aligned columns using spaces.** Pad cells so that `|` characters form straight vertical lines. This is mandatory for readability.

**Report template:**

```markdown
# SEO Report — {date}

## Visibility

| Product/Service  | Keywords Scanned | Google Rank    | LLM Mentions |
|------------------|------------------|----------------|--------------|
| TypelessForm     | {n}              | {rank}         | {Y/N}        |
| Typelessity      | {n}              | {rank}         | {Y/N}        |
| Code Rescue      | {n}              | {rank}         | {Y/N}        |

## Top Competitors (new/changed since last run)

| Product      | Competitor   | URL          | What They Do         |
|--------------|--------------|--------------|----------------------|
| ...          | ...          | ...          | ...                  |

## Code Changes Made

| File                  | Change                              |
|-----------------------|-------------------------------------|
| ...                   | ...                                 |

## Articles Written

| Slug                  | Target Keyword       | Languages       |
|-----------------------|----------------------|-----------------|
| ...                   | ...                  | en, de, ru, pl  |

## Tech Issues Found & Fixed

| Issue                                    | Status              |
|------------------------------------------|---------------------|
| ...                                      | Fixed / Manual       |

## Next Steps (manual)

- [ ] ...
- [ ] ...
```

Only include sections that have content. Skip empty sections.

### 4.2 Brief summary to user

After writing the report file, give the user a **brief message** (not the report itself):

1. **Что сделано** — кратко: keywords обновлены, статья написана, мета-теги исправлены, etc.
2. **На что это повлияет** — какие позиции могут улучшиться, какие content gaps закрыты
3. **Твои дальнейшие шаги** — что пользователь должен сделать руками:
   - Закоммитить и запушить
   - Отправить URL в Google Search Console + Bing Webmaster Tools
   - Создать изображения для статей (hero + card)
   - **AEO off-site actions** (из `~/Desktop/aeo/universal/user-actions.md`):
     - Third-party presence: G2, Capterra, Product Hunt, StackOverflow, Reddit, Dev.to
     - Directory listings: Clutch, DesignRush, Sortlist
     - Content distribution: LinkedIn posts, Reddit participation, HN shares
     - IndexNow setup (если не настроен)
     - Bing Webmaster Tools verification
   - Другие ручные действия
4. Скажи: "Полный отчёт: `seo-reports/seo-report-{date}.md`"

---

## Build Verification

After all changes, run `ng build` and confirm it passes. If it fails, fix the issues before finishing.
