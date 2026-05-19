# Senior Review (Round 2) — Content & AEO Plan v2 (Typelessity, Redesign 2026-05)

**Reviewer:** Independent senior SEO/AEO/content-strategy reviewer (round-2 pass)
**Date:** 2026-05-19
**Document under review:** `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/01-content-aeo-plan.md` (1095 lines, v2)
**Round-1 review:** `/Users/dmitry-isaevski/Projects/typelessity-landing/docs/redesign-2026-05/01-content-aeo-plan.review.md`
**Method:** For every claim-of-fix in the v2 Changelog, I re-opened the cited source file or grepped, and grepped the plan document itself to detect any v1 numbers/strings that should have been deleted but weren't. Coverage section claims were checked by enumerating section headers. Statistics were re-counted via grep on priority markers.

---

## 1. Verdict

# SHIP

The v2 plan closes every required edit from round-1, applies the 12-item checklist in §10 of the round-1 review, lands new §3.11 / §4.4a / §5.0 / §5.1 with real substance, and re-verifies the §4.6 phrase-saturation counts with hard numbers. Every spot-checked file:line citation is correct. The two "verified, kept" defences (P0 #6 llms-full.txt, P0 #10 status badge) are legitimate arguments, not silent reversals. Stats arithmetic checks out (14 + 26 + 27 + 7 = 74). Founder open-questions are honestly partitioned (9 truly need founder; 6 closed or partially closed by analyst with explicit proposed values).

The plan is implementation-ready. Hand to the implementer; do the two minor narrative polish items below in parallel.

---

## 2. Round-1 fix verification — 9 / 9 applied

For each claim in the v2 Changelog `[fixed]` section, I verified the inline edit and grepped for stale v1 strings.

| # | Round-1 claim | v2 fix | Applied? | Verifier |
|---|---|---|---|---|
| 1 | §3.4 — 11 industries with `exampleConversations` should be 8 | "8 industries total" + "7 mid-tier" + "35 skeletons (81%)" inline at §3.4 lines 167-171, 182; cascaded to P0 #17 (line 802), Appendix A (line 965), Changelog (line 1007) | ✅ | `grep -n exampleConversations src/app/lib/industries/*.ts` → 8 matches; `grep -in '11 industries\|11 verticals' plan` → only in changelog reference to v1 |
| 2 | §3.8 — "every blog post's ogImage is comparison card" should be 4/14 + 10 fallback | "Only 4 of 14 posts have `ogImage` set" + "other 10 fall back to /og-image.jpg" at lines 320, 748-749, 756, 842, 1008 | ✅ | `grep -c ogImage src/app/lib/blog-manifest.generated.ts` → 4; no stale "every blog post ogImage" claim remains |
| 3 | §4.8 — robots.txt has 14 AI bots, not 13 | "14 explicit AI-bot allows (re-counted v2)" at line 739; "(v1 said 13; reviewer correct, fixed)" | ✅ | `grep -c '^User-agent' public/robots.txt` → 15 (1 wildcard + 14 explicit); `grep '13 bot\|13 explicit\|13 AI' plan` → only in changelog reference to v1 |
| 4 | §3.3 — schemas.ts line drift (was :65-72) | Line ranges corrected to `:58-73` for softwareApplicationLd (highPrice on line 69) and `:143-159` for productLd (highPrice on line 155) at lines 144, 820 | ✅ | `grep -n 'softwareApplicationLd\|highPrice' src/app/core/seo/schemas.ts` → 58, 69, 143, 155 — exact match |
| 5 | §3.9 — legal-page description logic on `:233` should be `:232` | Corrected to `:232` at lines 342, 883 | ✅ | Read legal-page.component.ts:232 → `description: c.body.split(...)` confirmed |
| 6 | §4.1 — "9 categories" but listed 10 | "**10 categories**" + explicit list at line 562; consistent with grep | ✅ | `grep 'category:' lib/industries/*.ts \| awk '...'  \| sort -u` → 10 distinct categories |
| 7 | §4.8 — sitemap-build wiring was wrong (said unwired; actually wired) | "exists and IS wired as `postbuild` in `package.json:11`" + correct action ("delete `public/sitemap.xml` stub") at lines 742, 815, 862 | ✅ | `grep postbuild package.json` → `"postbuild": "npm run build:sitemap"` |
| 8 | §3.8 — blog-manifest is auto-generated, so hand-editing it is wrong | "Do NOT manually edit `blog-manifest.generated.ts` — it is auto-generated and would be overwritten" at line 842; fix re-pointed to `tools/build-blog-index.ts` + MDX frontmatter | ✅ | `package.json:8` shows `"build:blog": "tsx tools/build-blog-index.ts"` + `"prebuild": "npm run build:blog"` — confirms generation pipeline |
| 9 | §3.9 — "no detailed cookie banner copy" was partly wrong (banner exists) | New §3.11.6 confirms banner exists with 3-tier preferences UI; gaps reframed as (a) lang-aware link, (b) per-cookie list, (c) withdraw affordance; v1 §3.9 superseded by new framing | ✅ | `ls src/app/core/consent/` → consent-banner.component.ts + consent.service.ts exist; `grep '/en/legal/privacy' consent-banner.component.ts` → hard-coded EN link confirmed (line 19) |

**Tally: 9 / 9 fixes applied with full cascade through the document. No stale numbers detected by grep audit.**

---

## 3. New §3.11 / §4.4a / §5.0 / §5.1 coverage check

### §3.11 — Cross-cutting surfaces

11 sub-sections, all present, all with substantive audit body:

| Sub | File:line | Audit shape | Quality |
|---|---|---|---|
| 3.11.1 | components/header/ (line 369) | Purpose/Wins/Cuts/Gaps/Rewrites/AEO | OK — notes For-AI-Agents missing from nav |
| 3.11.2 | components/footer/ (line 386) | full shape | OK — flags `footer.parentBrand` cross-brand surface, escalated to P0 A3 |
| 3.11.3 | language-switcher (line 406) | full shape | **Strong** — explicit load-bearing note for §4.7 multilingual decision; ties options A/B/C to switcher behaviour |
| 3.11.4 | widgets/live-demo/ (line 428) | full shape + re-verification | **Strong** — A2 closure documented; reviewer's worry tested against source (lines 13-17 of component) and dismissed |
| 3.11.5 | shared/contact-form/ (line 443) | full shape | OK — flags hard-coded `/en/legal/privacy` (verified at line 51 of source); escalated to P1 A4'' |
| 3.11.6 | core/consent/ (line 465) | full shape | **Strong** — reframes v1 §3.9 ("no banner copy") with actual banner audit; escalated to P1 A4' |
| 3.11.7 | core/seo/json-ld.service.ts (line 484) | full shape | OK — proposes `setWithId(key, ld)` helper supporting P0 A1 |
| 3.11.8 | core/integrations/embed-snippet.ts (line 500) | full shape | OK — ties to founder Q7 (CDN status) |
| 3.11.9 | public/IndexNow key (line 515) | full shape | OK — flags 2-URL scope of indexnow.sh (verified at lines 22-23 of script); escalated to P1 A8 |
| 3.11.10 | manifest.webmanifest absent (line 531) | absence verified | OK — `ls public/` confirms absence; escalated to P2 A11 |
| 3.11.11 | translations.{de,pl,ru}.ts coverage (line 537) | re-verification | **Strong** — verifies chrome keys parity (confirmed by grep on `footer.parentBrand` across 4 locales — present in all four); precisifies "facade" diagnosis to "chrome OK, body EN-only"; escalated to P1 A5 |

§3.11 is the largest single addition and the round-1 reviewer's biggest coverage complaint. v2 closes it cleanly.

### §4.4a — llms.txt internal contradictions

Present at lines 619-637. Captures the line-11-vs-line-67 latency split (`p50 320ms, p95 780ms` vs `200–800ms p95 on gpt-4.1-nano`) — both verified directly against `public/llms.txt`. Adds two more within-file conflicts (line 10 vs 39 industry count; line 41 FAQ count). Provides explicit fix instructions. Quality: high.

### §5.0 — Dependency order

Present at lines 766-779. 8-row table sequencing: multilingual decision → numbers → industries → sitemap → llms.txt → schema → legal (parallel) → facts.ts. No cycles. Maps directly to the §7 dependency analysis in round-1 review. Quality: high.

### §5.1 — Action class taxonomy

Present at lines 781-789. P0-content / P0-process / P0-schema / P0-discovery distinctions. Editor-actionable items are clearly separated from founder-decision / lawyer-process items. Quality: high.

**All four new structural elements (§3.11, §4.4a, §5.0, §5.1) are present, substantive, and cross-link correctly with the rest of the document.**

---

## 4. New priority items A1–A12 + #61

12 new items added per round-1 review §9. Verified each appears in the prioritized list with appropriate tier:

| ID | Tier | Topic | Found at |
|---|---|---|---|
| A1 | P0-schema | FAQPage / Article / Service `@id` URIs | line 824 |
| A2 | P0 (closed-no-action) | live-demo cycling phrases — re-verified clean | line 826 |
| A3 | P0-content | Footer Webappski/TypelessForm disambiguation | line 828 |
| A4 | (moved to P1) | Consent banner — split to A4'/A4'' | line 830 |
| A4' | P1 | Lang-aware consent privacy link + per-cookie list + withdraw affordance | line 870 |
| A4'' | P1 | Lang-aware contact-form privacy link + i18n keys | line 872 |
| A5 | P1 | translations.{de,pl,ru} key-parity CI typecheck | line 860 |
| A6 | P1 | build-sitemap.ts validation step | line 862 |
| A7 | P1 | verify-jsonld.ts CI wiring | line 864 |
| A8 | P1 | IndexNow extend + post-deploy wiring | line 866 |
| A9 | P1 | Home FAQ schema-vs-visible-content policy doc | line 868 |
| A10 | P2 | Blog hreflang skip | line 901 |
| A11 | P2 | manifest.webmanifest generation | line 903 |
| A12 | P2 | For-AI-Agents in primary nav | line 905 |
| #61 | P3 | SiteNavigationElement LD | line 915 |

All present. **Taxonomically, A4 is annotated as moved to P1 but appears in the P0 section** — minor presentation oddity (it's effectively a "P0 closed → see P1 A4'/A4''" pointer). Not a bug; just a navigational quirk for an implementer doing tier-by-tier reading. Mention only as polish.

---

## 5. Priority reclassification check — all 10 moves applied

| Move | v1 | v2 | Applied? | Where in doc |
|---|---|---|---|---|
| Industries quality | P1 #17 | P0-content | ✅ | line 802 (P0 section), reclass table line 1033 |
| FAQ growth 19→45 | P1 #21 | P0-content | ✅ | line 806 (P0 section), reclass table line 1034 |
| `facts.ts` SOT | P0 #11 | P1 | ✅ | line 834 (P1 section), reclass table line 1029 |
| Legal review | P0 #4 | P0-process (split) | ✅ | line 810 (P0-process), reclass table line 1031 |
| Multilingual decision | P0 #8 | P0-process (split) | ✅ | line 811 (P0-process), reclass table line 1032 |
| /trust page | P2 #44 | P1 #44' | ✅ | line 856 (P1 section), reclass table line 1035 |
| `.aeo-tracker.json` brand | P2 #51 | P1 #51' | ✅ | line 858 (P1 section), reclass table line 1036 |
| Status badge /agent | P0 #10 | P0 (kept) + P1' fallback | ✅ | line 798 (P0) + line 854 (P1' fallback); reclass table line 1037 |
| Per-post OG | P1 #19 | P1 (kept) + reframed | ✅ | line 842 (P1, with corrected diagnosis); reclass table line 1038 |
| `llms-full.txt` | P0 #6 | P0-discovery (kept) | ✅ | line 816 (P0-discovery); reclass table line 1030 |

10/10 reclassifications applied. The P0 #10 and P0 #6 "kept" decisions are reasoned defences (see §6 below), not silent reversals.

---

## 6. "Verified, kept" defences — legitimate or dressed-up reversals?

Five items where v2 declined the reviewer's suggestion. Re-read each defence for legitimacy:

| Defended item | Reviewer position | v2 defence | Legitimate? |
|---|---|---|---|
| **P0 #10 status badge** | Move to P1 — "in development" badge can ship same week | "Page is currently AEO-active and shipping fictional contracts misinforms LLM training corpora **right now**, so it is a launch-blocker even if the endpoint itself is post-launch." Verified: `/agent` route does not exist in `app.routes.ts`; `for-ai-agents.component.html:24-43` describes the contract as if live. | **Legitimate.** Founder-state of an endpoint being post-launch doesn't change the AEO-citation harm being now. Belt-and-braces fallback P1 #10' added in case it slips. |
| **P0 #6 llms-full.txt** | Move to P1 — net-new infrastructure | "Brief explicitly references it; 1-day script realistic; deferring leaves a known-missing asset documented in the brief." | **Legitimate.** Mandated by the engagement brief; if it's a 1-day deliverable, P0 is reasonable. |
| **§3.4 81%** | Reviewer flagged the 75% number; v2 worsened it | "v1 underreported the problem; v2 worsens the number rather than weakening the call to action." Verified directly. | **Legitimate.** Empirical correction, not a defence. |
| **Live-demo cycling phrases** | Reviewer suspected they might contain numeric drift | "Re-verified v2: the 5 phrases do not contain numeric claims (verified directly — see §3.11.4)." Source confirms `live-demo.component.ts:13-17` is 5 pure-input strings; only number on widget is `25 lang` at line 51, which matches site-wide. | **Legitimate.** Empirical verification, not dismissal. |
| **DE/PL/RU translation files** | Reviewer flagged uncertainty about key parity | "Today they are [consistent]; v2 P1 A5 adds CI typecheck so future drift fails the build." Verified by spot-check on `footer.parentBrand` key (present in all 4 locales). | **Legitimate.** Confirmed parity + added regression guard. |

**None of the 5 "verified, kept" items is a dressed-up reversal.** Each engages the reviewer's argument and either supplies empirical evidence (live-demo, translations, §3.4) or supplies a substantive justification (P0 #10, P0 #6). The author explicitly acknowledges the reviewer's position in each case and answers it.

---

## 7. Statistics re-count

Counted independently via grep on priority markers `**P0`, `**P1`, `**P2`, `**P3` within each tier section.

| Tier | v2 claim | My count | Match? |
|---|---|---|---|
| P0 actionable | 14 | 14 (P0-content #1, #2, #3, #9, #10, #17, #21; P0-process #4, #8; P0-discovery #5, #6; P0-schema #7, A1; P0-content A3 = 14; A2 is closed-no-action; A4 moved to P1) | ✅ |
| P1 | 26 | 26 (grep on `**P1` in P1 section: 26 matches) | ✅ |
| P2 | 27 | 27 (grep on `**P2` in P2 section: 27 matches) | ✅ |
| P3 | 7 | 7 (grep on `**P3` in P3 section: 7 matches) | ✅ |
| **Total** | **74** | **14 + 26 + 27 + 7 = 74** | ✅ |

| Open questions | v2 claim | My count | Match? |
|---|---|---|---|
| Founder-blocked | 9 (§6.1) | 9 (Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q10, Q12) | ✅ |
| Closed by analyst | 4 fully + 2 partial (§6.3) | 4 (Q8 high-conf, Q11, Q14, Q15) + 2 (Q9, Q13) = 6 | ✅ |
| Total | 15 | 9 + 6 = 15 | ✅ |

Statistics check out cleanly.

**Minor narrative inconsistency, polish only:** §6.3 line 947 counts Q8 within "**4 of 15** fully closed by analyst"; v2 Changelog line 1083 separates Q8 as "**1 closed with high confidence**" distinct from "**3 fully closed**". Same math (6 of 15 freed from founder) but different prose taxonomy. No action required.

---

## 8. New issues introduced in v2

v2 is 60% larger than v1 (684 → 1095 lines). Per round-1 brief's concern about drift introduced by large edits, I checked for: internal contradictions, duplicate priority items, broken file:line citations, numbers that don't match between sections, circular dependencies.

| Risk | Found? | Note |
|---|---|---|
| v1 numbers leaking through (32, 75%, 11, 13) | ❌ | Only mentioned in v2 Changelog where reference to v1 is correct context |
| Duplicate priority items (same fix in P0 and P1) | ❌ | Closest is P0 #10 + P1 #10' which is explicitly a conditional fallback |
| Broken file:line citations | ❌ | Spot-checked: home.content.ts:11/22/33 (correct), home.content.ts:97-112 (correct), schemas.ts:58-73/143-159 (correct), legal-page.component.ts:232 (correct), package.json:11 (correct), consent-banner.component.ts:19 (correct), contact-form.component.ts:51 (correct), live-demo.component.ts:13-17 (correct), indexnow.sh:22-23 (correct) |
| Number mismatch between sections | ❌ | 35 skeletons / 81% / 7 mid-tier / 8 with-examples appear consistently in §3.4, P0 #17, Appendix A, Changelog, reclass table |
| Cycles in §5.0 dependency order | ❌ | Linear chain: multilingual → numbers → industries → sitemap → llms.txt → schema → SOT; legal in parallel |
| Phrase-saturation grep numbers self-consistent | ✅ | Spot-checked: "AI conversational booking widget" = 12 (matches v2); "AI booking widget" raw = 73 (v2 says 61 non-overlapping, which = 73 - 12 = correct); "conversational booking" = 46 (matches v2); "Chat-based booking" = 1, "AI appointment intake" = 1, "LLM-powered booking" = 1 (all match v2) |

**One narrative polish item only:**
- §6.3 line 947 "4 fully closed" vs Changelog line 1083 "3 fully closed + 1 high-confidence" — same math, different prose taxonomy.

**One presentation oddity (not a bug):**
- A4 appears in the P0 section (line 830) as "DONE v2 — moved to P1", which is correct semantically but means a reader strictly counting P0 items must know to skip it. The Changelog (line 1070) makes this explicit: "P0 deferred actions moved to P1 — A4". Could be cleaner but is documented.

No substantive new issues. The v2 large-edit pass did **not** introduce drift.

---

## 9. Open questions audit

| Q | v2 status | My check | Verdict |
|---|---|---|---|
| Q1–Q7, Q10, Q12 | Founder-blocked | All 9 are strategy/roadmap/brand/customer-permission calls that genuinely need founder | **Correctly classified** |
| Q8 (.aeo-tracker.json) | Closed high-conf — copy-paste error | `cat .aeo-tracker.json` not run here but v1 review and v2 both confirm `brand: "typelessform"`; founder confirms only | **OK** |
| Q9 (founding date) | Partially closed — proposes 2024-12 based on first blog publishedAt 2025-02 | Reasonable inferred-from-evidence proposal; founder confirms month only | **OK** |
| Q11 (25 languages) | Fully closed — take 15 named + commit to "+10 supported on request" | Editor-resolvable; no founder dependency | **OK** |
| Q13 (FAQ growth 19→45) | Partially closed — analyst pre-drafts 26 net-new Q&As covering §3.5 gaps | Lower-friction reframe ("approve this draft" vs "do you want this") | **OK** |
| Q14 (per-post OG) | Fully closed — automated via tools/build-blog-index.ts extension | Editor-resolvable | **OK** |
| Q15 (blog tag pages) | Fully closed — default "yes, generate" | Editor-resolvable | **OK** |

6 of 15 freed from founder review without sleight of hand. Each closure is either (a) editor-resolvable from existing tools/data, or (b) reduced to a low-friction "confirm value X" rather than open-ended "do you want this?"

---

## 10. Minor optional polish (for SHIP)

These can be fixed in the implementation pass or skipped entirely. They do not block.

1. **§6.3 vs Changelog narrative inconsistency on Q8.** §6.3 line 947 counts Q8 in "4 fully closed by analyst" with parenthetical "(high confidence)"; Changelog line 1083 separates Q8 as a third category "1 closed with high confidence" distinct from "3 fully closed". Same math. Pick one prose form to avoid future confusion.

2. **A4 navigational placement.** A4 (line 830) is in the P0 section but explicitly marked "Actions move to P1." A reader counting P0 items must know to skip it. Consider moving the explanation block to the P1 section (with a forward reference from the P0 section) or annotating with a clearer "→ see A4'/A4''" pointer.

3. **The "Most popular badge" rec is in three places** (home.content.ts:149, Appendix A line 959, P1 #13 line 837). Not a bug — Appendix A is by design a deletion catalogue cross-referencing P0/P1 — but worth checking that no implementer reads Appendix A as a separate item.

---

## 11. Implementation readiness assessment

Every P0-content item has an editable file:line target. Every P0-schema item has the JSON-LD edit specified. Every P0-discovery item has the build-script or asset path. The two P0-process items (legal review, multilingual decision) are correctly flagged as external-party blockers — an implementer can start everything else in parallel.

The 9 founder-blocked open questions block ~7 P1 items but no P0-content edits (since v2 has split decisions out from edits). An implementer can hand-edit the canonical-number P0s with placeholder numbers and tighten once founder responds; the splits in §5.1 make this safe.

The dependency order in §5.0 is correct and linear: multilingual decision → numbers → industries → sitemap → llms.txt → schema. Legal can run in parallel.

---

## Closing

v2 is a substantively improved document. Every required edit landed. New coverage closed the biggest gap. The two "verified, kept" defences are reasoned, not silent. Statistics re-count cleanly. Spot-checked file:line citations all correct. The 60%-larger document did not introduce drift.

Ship to the implementer.

— Independent round-2 review, 2026-05-19
