# Designer Review — TF → typelessity-landing visual audit

**Дата ревью:** 2026-05-20
**Ветка:** `feat/tf-redesign` (промежуточное состояние, Phase 1 partial)
**Reference SOT:** `/Users/dmitry-isaevski/Projects/typelessform/src/{styles.scss,app/app.scss}`
**Reviewer:** senior design-system engineer
**Verdict (одним словом):** `needs-targeted-fixes`

---

## 1. Verdict overall

Foundation сделана правильно. Tokens (`src/styles/tokens.scss`), typography (`src/styles/typography.scss`), глобальные TF-утилиты (`src/styles.scss:60-257`), header (`header.component.scss`), footer (`footer.component.scss`) и SCSS-shell в `app.scss` — это уже почти 1:1 с TF, где разница только в `--container-pad` (TF: 24px в `styles.scss:67`, target: 40px → 24px → 18px responsive в `tokens.scss:38-73`) и в дополнительных compat-aliases. Это абсолютно SHIP-able foundation.

Но **компонент-scoped SCSS ещё живёт в cream-эре**. Это не «частично не TF» — это **противоположный темплейт** (light cream + graphite ink + magenta accent), пере-aliased на dark токены. Compile проходит, но aesthetic не работает по трём системным причинам:

1. **Cream-калиброванные тени** — `rgba(20, 17, 13, X)` (графит #14110D с low alpha) на `#282838` буквально невидимы. Все «hover-lift», все `box-shadow` карточек, все depth-эффекты — обнулены. Pages выглядят как плоский слой плиток на плоском фоне.
2. **Cream hardcodes** — `#fff`, `#f3f0eb`, `#e8e3da`, `#1a1815`, `#f5efe3`, `#d8d0c0`, `#f4ebd8`, `#c9bfa9` в 15 файлах. Сюда же `--vc-accent: #ff5b1f` (старый magenta-tilted orange) и `rgba(255, 91, 31, X)` — это **НЕ** TF accent (`#FF6B2B / rgba(255, 107, 43, X)`). На dark получается либо явные cream-прямоугольники, либо чужой оранжевый рядом с TF-оранжевым в одном viewport.
3. **Graphite-invert паттерн** — `background: var(--ink); color: var(--paper)` был «dark pill on cream» (контрастная фишка). После alias-remap получается **near-white block** на dark, который кричит громче чем единственный tangerine accent. Это нарушает TF-правило «single accent» и ломает иерархию визуально гораздо сильнее, чем cream-тени.

**Что хорошо работает:** header, footer, hero-typography (`typography.scss`), accent palette в `tokens.scss`. Структурно `home-tiers`, `pillar`, `industry-card`, `pipe-node` — правильные TF-shape карточки, им нужны только color/shadow-правки. FAQ `<details>` структура совпадает с TF почти строка-в-строку.

**Что больше всего ломает aesthetic** (5 главных, что юзер заметит в первые 2 секунды):

1. `home.component.scss:357` `.home-compare__verdict { background: var(--ink); color: var(--paper) }` — огромная near-white плита посреди dark home.
2. `pricing-page.component.scss:273-296` `.pricing-diff__table { background: #fff; border: 1px solid #e8e3da; th { background: #f7f3ec } }` — буквально cream-таблица на dark pricing.
3. `blog-post.component.scss:482` `::ng-deep table thead tr { background: #f4ebd8 }` и 431 `border: 1px solid #d8d0c0` — все статьи блога имеют cream-таблицы, которые в TF нативно решаются `--bg-secondary` хедером.
4. `how-it-works.component.scss:262, 280, 285, 308` — `var(--vc-graphite, #1a1a1a)`, `var(--vc-muted, #555)`, `var(--vc-accent-magenta, #c9277e)` — magenta accent (`#c9277e`) ВПРЯМУЮ на странице, рядом с TF orange. Этот magenta вообще не существует в TF.
5. Все code-blocks (`aiagents-code:62`, `how-embed__code:191`, `home-cta__snippet:578`, `how-inside__code:264`, blog-post `::ng-deep pre:361`) — голые `#1a1815` прямоугольники без mac-traffic-light dots, без `.terminal-window` chrome. TF использует terminal-pattern для всех code inserts (`app.scss:243-310`).

**Структурно home (630 строк) — это не «cream tokens на dark». Это cream-дизайн** (тени, geometry, invert-блоки) с remap'нутыми переменными. Patch-by-patch не вытянет — нужна выборочная переписка нескольких секций (см. P0 ниже). Остальные 14 файлов — mechanical find/replace.

---

## 2. Per-file fix list

### 2.1. `src/app/pages/home/home.component.scss` (630 строк, **P0**)

Самый длинный и самый «cream-by-design» файл. Половина — структура (правильная), половина — colorways (нужна полная замена). Поход-за-поход:

**Hero (lines 5-56):**
- **L34** `color: var(--ink2)` — формально работает через alias, но `--ink2 → --text-secondary` уже корректно. Оставить. Но **L22** `font-size: clamp(36px, 7vw, 98px)` слишком крупно для TF — TF `hero-title` уходит до `52px` max (`app.scss:173`). Должно стать `clamp(32px, 5vw, 52px)`. Это не «деталь стиля», это hierarchy: 98px hero сминает «section-title» (`styles.scss:131-137` clamp 28-42px). Тогда H1 в 2.5× больше H2 — TF выдерживает 1.3×.
- **L26** `letter-spacing: -0.04em` + `font-weight: 600` — TF использует `700` (`app.scss:174`). Поменять `600 → 700`, `letter-spacing: -0.025em`.
- **L50-55** `.home-hero__right { min-height: 560px }` — TF hero-visual не fixed-height, заполняется через `padding-bottom: 56.25%` в `.video-wrapper` (`app.scss:206`). Min-height создаёт мёртвую зону.

**TL;DR / `.home-facts` (lines 79-100):**
- **L85** `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02)` — alpha 0.02 на dark теряется в шум. TF не использует drop-shadow на cards вообще, кроме hero (`app.scss:210` shadow 0.4 alpha). Убрать.
- **L91** `border-bottom: 1px solid var(--line2)` — OK через alias.
- **L98** `color: var(--ink3)` — OK. Но **L99** `dd { color: var(--ink) }` — это `--text-primary` на `--bg-card`, контраст хороший.

**Stats (lines 103-137):**
- **L113** `box-shadow: 0 12px 40px -20px rgba(20, 17, 13, 0.1)` — **МЁРТВЫЙ**. Графит на графите. Заменить либо на TF паттерн `box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4)` (терминал-стиль) либо вообще убрать и положиться на border. Рекомендую убрать.
- **L124** `font-weight: 600` для stat number — TF `.stat-number { font-weight: 700 }` (`app.scss:333`). Поменять.

**How / Phases (lines 140-222):**
- **L153** `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02)` — мёртв, убрать.
- **L162-174** `.phase__num` — это **graphite-invert badge** (`background: var(--ink); color: var(--paper)`). На dark это `#F0F0F5` блок с `#3A3A4C` текстом — выглядит как «огромная белая таблетка» на dark карточке. **СЛОМАНО**. TF аналог: `.i-step-num` (`app.scss:930-944`) — `36×36` круг, `accent-subtle` background, `border 1px solid border-accent`, `color: accent`. Заменить полностью:
  ```
  &__num {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--accent-subtle);
    border: 1px solid var(--border-accent);
    color: var(--accent);
    font-family: var(--font-display);
    font-size: 16px; font-weight: 700;
    display: grid; place-items: center;
  }
  ```
- **L188, 218** `background: var(--bg-soft)` — alias OK, но в контексте `.phase__example` (`bg-card → bg-soft`) получается `--bg-card` на `--bg-secondary` — обратный контраст. На TF code-inserts использует `--bg-code` (`app.scss:246`). Заменить `var(--bg-soft) → var(--bg-code)`.

**Architecture / Pillars (lines 225-272):**
- **L240** `transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s` — OK по структуре, но **L244-246** `box-shadow: 0 12px 32px -16px rgba(20, 17, 13, 0.15)` мёртв, и `border-color: rgba(20, 17, 13, 0.18)` тоже мёртв. Заменить hover на TF паттерн (`app.scss:838-841` `.feature-card:hover`):
  ```
  &:hover {
    border-color: var(--border-accent);
    transform: translateY(-2px);
  }
  ```
  (drop shadow, drop graphite border-color).
- **L255** `background: rgba(20, 17, 13, 0.06)` для `.pillar__num` — невидимая плашка на dark. Заменить на `var(--accent-subtle)` + `color: var(--accent)`.

**Industries grid (lines 275-310):**
- **L294-298** hover — те же мёртвые `rgba(20, 17, 13, X)`. Заменить как pillar.
- **L301-309** `.industries__cell--more` — graphite-invert. **СЛОМАН**. На dark это white block. Заменить:
  ```
  &--more {
    background: var(--accent-subtle);
    border-color: var(--border-accent);
    color: var(--accent);
    font-weight: 500;
    a { color: var(--accent); }
  }
  ```

**Compare table (lines 313-377):**
- **L321** `box-shadow: 0 12px 40px -20px rgba(0, 0, 0, 0.08)` — на dark теряется. Убрать.
- **L341** `background: var(--bg-soft)` для `<th>` — OK (alias правильный).
- **L348** `tr.home-compare__us { background: rgba(20, 17, 13, 0.04) }` — мёртв. Заменить на `background: var(--accent-subtle)` (это «наша» колонка — оправдано как один из accent-spots).
- **L354-376** `&__verdict { background: var(--ink); color: var(--paper) }` — **ГЛАВНАЯ ВИЗУАЛЬНАЯ ПОЛОМКА HOME**. Огромный почти-белый блок на dark. Должен стать TF cta-snippet pattern (`home.component.scss:578` уже близко, но тоже cream):
  ```
  &__verdict {
    margin-top: 32px;
    padding: 28px 32px;
    background: var(--bg-code);
    border: 1px solid var(--border-accent);
    border-radius: var(--radius);
    /* ... */
    p { color: var(--text-secondary); }
  }
  ```
  Tag (`__verdict-tag`) уже `color: var(--accent)` — оставить.

**Tiers (lines 380-463):**
- Базовая структура `.tier` — TF-shape (см. `app.scss:959-982` `.price-card`). Но **L396** `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02)` — мёртв, убрать.
- **L399** `&--featured { border: 1.5px solid var(--ink); box-shadow: 0 24px 60px -24px rgba(20, 17, 13, 0.2) }` — `var(--ink)` border на dark карточке = почти-белый border. **Должно быть** `border: 1px solid var(--accent); background: linear-gradient(180deg, rgba(255, 107, 43, 0.08), var(--bg-card) 40%)` (TF паттерн `app.scss:974-981`).
- **L458** `&::before { color: var(--ink) }` для check-mark — текстовый чек на цвете primary text. TF использует `color: var(--success)` (`app.scss:1068`, зелёный). Заменить.

**FAQ (lines 466-522):**
- **L480-481** `&[open] { border-color: rgba(20, 17, 13, 0.18); box-shadow: 0 6px 20px -8px rgba(20, 17, 13, 0.1) }` — оба мёртвы. TF (`app.scss:1121-1123`): `&[open] { border-color: var(--border-accent) }` (без shadow). Заменить.

**CTA (lines 525-593):**
- **L534** `background: var(--gradient-cta-glow)` — переменная определена в `tokens.scss:60` через `--accent-glow`, так что фактически работает. ОК. Но `.home-cta__bg` лучше заменить на inline radial-gradient как в TF `app.scss:1174-1178`.
- **L548** `color: var(--accent)` для eyebrow — OK (один из accent-spots).
- **L578-591** `&__snippet { background: var(--ink); color: var(--paper); border: 1px solid rgba(255, 255, 255, 0.08) }` — **ГРАФИТ-ИНВЕРТ ОПЯТЬ**. На dark `var(--ink) = --text-primary = #F0F0F5` — это белый блок. **Должно быть terminal-window pattern**:
  ```
  &__snippet {
    background: var(--bg-code);
    color: var(--text-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    /* + mac-dots header через ::before или отдельный wrapper в шаблоне */
  }
  ```
  Идеально — обернуть в `<div class="terminal-window">` + `<div class="terminal-bar">` + 3× `.dot` (см. `app.scss:244-310`), это обяжет правку HTML.

**Responsive (lines 595-613):**
- **L596** `@media (max-width: 980px)` — TF использует 860px (`app.scss:946`). Не критично, но рассогласовано. Привести к 860px.
- **L607-612** `@media (max-width: 600px)` — TF использует 700px / 600px / 540px (`app.scss:352, 800, 1097`). 600px breakpoint совпадает с pricing-grid TF.

**Trim hints (lines 615-630):**
- **L628** `a { color: var(--vc-accent, #ff5b1f) }` — **ЭТО ЧУЖОЙ ОРАНЖЕВЫЙ** (`#ff5b1f` vs TF `#FF6B2B`). Заменить на `var(--accent)`. Убрать fallback hex.

---

### 2.2. `src/app/pages/about/about-page.component.scss` (87 строк, **P1**)

Лёгкий файл. Все color-issues через alias, форма карточек правильная.

- **L48** `border-bottom: 1px solid rgba(20, 17, 13, 0.3)` — на dark невидимо. Заменить на `border-bottom: 1px solid var(--border)` или `var(--border-accent)`.
- **L23, 25** `padding-block: 50px` — TF использует `var(--section-gap)` = 80px (`styles.scss:122`). Не критично (50 vs 80 read как «sparser» — нормально для about), но рассогласовано. Рекомендую `padding-block: var(--section-gap)`.
- **L63-83** `.values li` — `padding: 26px 28px; border-radius: 16px` — TF `feature-card` уже определён в `styles.scss:146-160`. Можно либо унаследовать `.feature-card` в шаблоне, либо подровнять (`padding: 28px 24px; border-radius: var(--radius)`).
- **L68** `strong { font-size: 17px }` — добавить `font-family: var(--font-display)` чтобы matched TF h3 в карточках (`app.scss:854-858`).

---

### 2.3. `src/app/pages/pricing/pricing-page.component.scss` (301 строк, **P0**)

Это duplicate `.tier` стилей из home + критичный косяк в `.pricing-diff__table`.

- **L29-105** дубль `.tier` — идентичен home (`home.component.scss:390-463`) и страдает теми же проблемами:
  - **L35** `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02)` — мёртв.
  - **L39-40** `&--featured { background: var(--paper); border: 1.5px solid var(--ink); box-shadow: 0 24px 60px -24px rgba(20, 17, 13, 0.2) }` — белый border, мёртвая тень. Тот же фикс что home.
  - **L100** `&::before { color: var(--ink) }` — checkmark цвета primary text, должно быть `var(--success)`.
- **L165** `.onboarding__day { background: rgba(20, 17, 13, 0.06) }` — невидимая плашка. Заменить на `var(--accent-subtle)`, `color: var(--accent)`.
- **L191** `.roi__row--accent { background: var(--accent-soft) }` — OK через alias.
- **L226-227** FAQ `&[open] { border-color: rgba(20, 17, 13, 0.25); box-shadow: 0 6px 20px -8px rgba(20, 17, 13, 0.15) }` — оба мёртвы. Заменить как home FAQ.
- **L267-301** `.pricing-diff` — **ЭТО ВТОРАЯ ГЛАВНАЯ ПОЛОМКА**:
  - **L273** `background: #fff` — буквально белый прямоугольник.
  - **L276** `border: 1px solid #e8e3da` — cream border.
  - **L280, 283** `border-bottom: 1px solid #f0ece4` + `background: #f7f3ec` — cream-on-cream.
  - **L301** `color: var(--vc-muted, #555)` — мёртвая переменная + fallback к графиту на dark = серый-серый.
  - Полная замена:
    ```
    .pricing-diff__table {
      background: var(--bg-card);
      border: 1px solid var(--border);
      th, td { border-bottom: 1px solid var(--border); }
      th { background: var(--bg-secondary); color: var(--text-secondary); }
    }
    .pricing-diff__note { color: var(--text-muted); }
    ```

---

### 2.4. `src/app/pages/how-it-works/how-it-works-page.component.scss` (317 строк, **P1**)

Структурно ближе всего к TF (`steps-grid` / `i-step` / `terminal` insert), но color-issues + один magenta-leak.

- **L17** `border-top: 1px solid var(--line2)` — alias OK.
- **L26-37** `.how-phase__num { background: var(--ink); color: #fff }` — **ГРАФИТ-ИНВЕРТ**. На dark = почти-белый круг с белым текстом (невидимая typography). Заменить как home phase__num (см. 2.1) — accent-subtle pill.
- **L102** `background: var(--bg-soft)` — alias OK.
- **L136** `.pillar__num { background: rgba(20, 17, 13, 0.06) }` — мёртв. Заменить на `accent-subtle` + `color: accent`.
- **L189-202** `.how-embed__code` — **голый `#1a1815` блок**. Должно стать `.terminal-window` (TF `app.scss:244-310`):
  - Заменить `background: #1a1815; color: #f7f3ec` → `background: var(--bg-code); color: var(--text-primary); border: 1px solid var(--border); border-radius: var(--radius-lg)`.
  - В шаблоне обернуть в `<div class="terminal-window"><div class="terminal-bar"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><span class="terminal-title">embed.html</span></div><pre>...</pre></div>`.
- **L213** `code { background: var(--bg-soft) }` — alias OK.
- **L248-285** `.how-inside` — **CREAM CODE BLOCK 2**:
  - **L262** `color: var(--vc-graphite, #1a1a1a)` — фолбэк к графиту, мёртвая переменная. Заменить на `color: var(--text-primary)`.
  - **L266-273** `.how-inside__code { background: #0f1115; color: #e6e6e6 }` — оба hex hardcoded. Заменить как `.how-embed__code` → terminal-window.
  - **L278** `color: var(--vc-muted, #555)` — мёртв + fallback графит. → `var(--text-muted)`.
  - **L280-284** `code { background: #f3f0eb }` — **CREAM PILL** на dark абзаце. → `background: var(--bg-code); color: var(--text-primary)`.
- **L287-317** `.how-edge` — **ТРЕТИЙ CREAM BLOCK**:
  - **L299** `background: #fff` — белая карточка.
  - **L300** `border: 1px solid #e8e3da` — cream border.
  - **L308** `color: var(--vc-accent-magenta, #c9277e)` — **MAGENTA**. Это РОЗОВЫЙ (`#c9277e`) на dark рядом с TF orange. Полностью чужой brand color. Заменить на `var(--accent)`.
  - **L310** `color: var(--vc-muted, #555)` — мёртв.
  - **L312** `background: #f3f0eb` — cream code-pill.
  - Полная замена через TF feature-card pattern (`styles.scss:146-160`).
- **L221** `.how-cta { padding: 70px 0 90px }` — заменить на `var(--section-gap)` через `padding-block`.

---

### 2.5. `src/app/pages/industries/industries-page.component.scss` (62 строки, **P1**)

Самый простой файл. Только compat-alias issues + мёртвый hover.

- **L46-48** hover `&:hover { border-color: rgba(20, 17, 13, 0.3); box-shadow: 0 6px 16px -8px rgba(20, 17, 13, 0.2) }` — оба мёртвы. Заменить TF паттерном:
  ```
  &:hover {
    border-color: var(--border-accent);
    transform: translateY(-2px);
  }
  ```
- **L33-42** `.industry-card` — это уже TF-shape. После hover-фикса — ship-ready.
- **L14** `.industries-cat { padding: 32px 0 12px }` — узко. Заменить на `padding-block: 48px 24px`.

---

### 2.6. `src/app/pages/industries/industry-detail-page.component.scss` (190 строк, **P2**)

Сложная страница с conversation-bubbles. Все color-issues через alias, но **L46, 119, 158-159** мёртвы.

- **L46** `border-bottom: 1px solid var(--line)` — OK.
- **L73-78** `.conv__bubble { background: var(--bg-soft) }` — alias OK. Но **L73** `border-right: 1px solid var(--line)` на split-карточке — может стать невидимым. Прижать `border-right-color: var(--border-accent)` или сильнее: `rgba(255, 255, 255, 0.15)`.
- **L118-122** `.chip--magenta` — название `magenta` сейчас рендерится в нейтральный (background через alias). Если эта chip должна быть accent (как «featured industry»), переделать в TF-pill: `background: var(--accent-subtle); border: 1px solid var(--border-accent); color: var(--accent)`. Если просто «другой стиль chip» — оставить, переименовать в `.chip--alt`.
- **L141** `&::before { color: var(--ink) }` для list-marker — поменять на `color: var(--accent)` (это «proof points», маркер — один из 10 accent-spots).
- **L158-159** FAQ open-state `border-color: rgba(20, 17, 13, 0.25); box-shadow: 0 6px 20px -8px rgba(20, 17, 13, 0.15)` — мёртвы. Заменить как home/pricing FAQ.

---

### 2.7. `src/app/pages/faq/faq-page.component.scss` (119 строк, **P1**)

Близко к TF FAQ pattern в `styles.scss:212-249`. Дублирует много логики — можно мигрировать на canonical `.faq-item`.

- **L44-45** open-state `border-color: rgba(20, 17, 13, 0.25); box-shadow: 0 6px 20px -8px rgba(20, 17, 13, 0.15)` — мёртв. TF: `&[open] { border-color: var(--border-accent) }` без shadow.
- **L88** `border-bottom: 1px solid rgba(20, 17, 13, 0.3)` для underline — невидим. Заменить `border-bottom: 1px solid var(--border)`.
- **L93-119** `.faq-jump` — **CREAM CHIPS**:
  - **L105** `background: #fff` — белые pill.
  - **L106** `border: 1px solid #e8e3da` — cream border.
  - **L108** `color: var(--vc-graphite, #1a1a1a)` — мёртвая var + графит-фолбэк.
  - **L112** `border-color: var(--vc-accent, #ff5b1f)` — **ЧУЖОЙ ОРАНЖЕВЫЙ**.
  - **L115** `color: var(--vc-muted, #777)` — мёртв.
  - **L116** `background: #f3f0eb` — cream count-pill.
  - Полная замена:
    ```
    .faq-jump a {
      background: var(--bg-card); border: 1px solid var(--border);
      color: var(--text-primary);
      &:hover { border-color: var(--accent); color: var(--accent); }
    }
    .faq-jump__count { background: var(--accent-subtle); color: var(--accent); }
    ```

---

### 2.8. `src/app/pages/blog/blog-list.component.scss` (454 строки, **P1**)

Editorial-стиль. Структурно — отдельный grid system (`--measure-bleed: 1180px`). Это не противоречит TF (по сути расширенный контейнер для архива), оставить.

- **L138, 166** featured card shadows `0 1px 2px rgba(20, 17, 13, 0.03)`, `0 24px 64px -28px rgba(20, 17, 13, 0.22)` — мёртвы. Заменить либо убрать (`box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4)` если хотим depth) либо опираться на `border-color: var(--border-accent)` на hover.
- **L159** `background: radial-gradient(closest-side, rgba(255, 91, 31, 0.10), transparent 70%)` — **ЧУЖОЙ ОРАНЖЕВЫЙ**. → `var(--accent-glow)` или `rgba(255, 107, 43, 0.10)`.
- **L189** `box-shadow: 0 0 0 4px rgba(255, 91, 31, 0.16)` — ЧУЖОЙ. → `rgba(255, 107, 43, 0.16)`.
- **L247-249** `@keyframes pulseDot` — все три stops используют `rgba(255, 91, 31, X)`. Заменить на `rgba(255, 107, 43, X)`.
- **L362-364** `&::before { background: var(--paper); opacity: 0 }` — на dark это `--bg-card` блок поверх hover row. Структурно работает, но **transition opacity 0 → 1 на `--bg-card`** даёт edge-эффект «row меняет background внутри окружающего contrast». Лучше `background: var(--bg-card-hover)` (специально для этого, `tokens.scss:8`).
- **L434, 437** tag pill `background: rgba(20, 17, 13, 0.04); border: 1px solid rgba(20, 17, 13, 0.05)` — оба невидимы. → `background: var(--bg-card); border: 1px solid var(--border)` или `accent-subtle` если это accent-spot.

---

### 2.9. `src/app/pages/blog/blog-post.component.scss` (631 строка, **P2**)

Самый длинный после home, и самый «cream-by-design». Editorial article — drop cap, blockquote, tables, code blocks. Содержит **5 разных hex-cream значений в таблицах**.

- **L26** `box-shadow: 0 0 12px rgba(255, 91, 31, 0.45)` — ЧУЖОЙ orange. → `rgba(255, 107, 43, 0.45)`.
- **L138** `box-shadow: 0 1px 2px rgba(20, 17, 13, 0.03)` — мёртв. Убрать (article-wide).
- **L166** `box-shadow: 0 1px 2px rgba(20, 17, 13, 0.04), 0 24px 64px -28px rgba(20, 17, 13, 0.22)` — мёртв. Убрать.
- **L184** TL;DR shadow `rgba(20, 17, 13, X)` — мёртв.
- **L341** hover `linear-gradient(rgba(255, 91, 31, 0.18), ...)` — ЧУЖОЙ orange.
- **L351, 355** inline `code { background: rgba(20, 17, 13, 0.06); border: 1px solid rgba(20, 17, 13, 0.04) }` — невидим. → `background: var(--bg-code); border: 1px solid var(--border)`.
- **L361-389** `::ng-deep pre` — code block:
  - **L362** `background: #1a1815; color: #f5efe3` — два хардкода, идеально под terminal-window. Заменить на `var(--bg-code); color: var(--text-primary)`.
  - **L370** `box-shadow: 0 12px 40px -16px rgba(20, 17, 13, 0.4)` — мёртв. Убрать.
- **L395** `border-left: 3px solid var(--ink)` для blockquote — на dark это почти-белая полоса. Заменить на `border-left: 3px solid var(--accent)` (это один из allowed accent-spots).
- **L431** `border: 1px solid #d8d0c0` (table) — cream border. → `var(--border)`.
- **L434** `box-shadow: 0 1px 2px rgba(20, 17, 13, 0.03), 0 18px 48px -32px rgba(20, 17, 13, 0.18)` — мёртв.
- **L448** `border-bottom: 1px solid #d8d0c0` (tbody tr) — cream. → `var(--border)`.
- **L455** `background: rgba(20, 17, 13, 0.025)` (zebra rows) — невидимо. → `background: rgba(255, 255, 255, 0.02)` для dark zebra.
- **L459** `background: rgba(255, 91, 31, 0.06)` (hover row) — ЧУЖОЙ orange. → `rgba(255, 107, 43, 0.06)` или `var(--accent-subtle)`.
- **L482** `background: #f4ebd8` (table thead) — **CREAM**. → `background: var(--bg-secondary)` (TF code uses `--bg-card` for header bars).
- **L490** `border-bottom: 2px solid #c9bfa9` — **CREAM**. → `border-bottom: 2px solid var(--border)`.
- **L501** `border-right: 1px solid #d8d0c0` — **CREAM**. → `var(--border)`.
- **L515** `background: rgba(255, 91, 31, 0.16)` (strong-pill) — ЧУЖОЙ orange. → `var(--accent-subtle)` или `rgba(255, 107, 43, 0.16)`.

Также **L222, 226** drop cap `font-family: var(--font-display-italic)` — `--font-display-italic` через alias → `var(--font-body)`. Italic drop cap из DM Sans Italic — это OK как concept, но `--font-display-italic` теперь dead var (см. секцию 3). Заменить на `font-family: var(--font-body); font-style: italic`.

- **L412** HR `background: linear-gradient(to right, transparent, var(--ink3), transparent)` — на dark корректно (ink3 → text-muted = #7C7C92, видим).

---

### 2.10. `src/app/pages/legal/legal-page.component.scss` (80 строк, **P2**)

Легально-документная страница. Тонкий файл. Главное — текстовая читаемость и table-стиль.

- **L37** `border-bottom: 1px solid rgba(20, 17, 13, 0.3)` для ссылок — невидим. → `border-bottom: 1px solid currentColor; opacity: 0.4`.
- **L40-53** table — `border-bottom: 1px solid var(--line)` (OK через alias), `th { background: var(--bg-soft) }` (OK).
- **L58** `code { background: var(--bg-soft) }` — alias OK, но `--bg-soft = --bg-secondary` = `#313142` — почти неотличим от `--bg-primary` `#282838`. Code pill будет «прозрачным». Заменить на `background: var(--bg-code)` (явно темнее, как pills в TF).

---

### 2.11. `src/app/pages/for-ai-agents/for-ai-agents.component.scss` (124 строки, **P2**)

Deep page. Простая структура. Один critical fix — code block.

- **L62-72** `.aiagents-code { background: #1a1815; color: #f7f3ec }` — **БЛЯ И FCK**, ещё один голый dark-cream code block. Terminal-window pattern (см. 2.4).
- **L23, 58, 88** `background: var(--bg-soft)` для code pills — заменить на `var(--bg-code)` (явный контраст).
- **L118** `border-bottom: 1px solid rgba(20, 17, 13, 0.3)` — невидим. → `var(--border)`.

---

### 2.12. `src/app/pages/not-found/not-found.component.scss` (39 строк, **P2**)

Минимальный файл. Уже почти TF-ready.

- Никаких color hardcodes, только alias-юзаж. `--ink`, `--ink2` работают через compat. **Ship-able as-is.**
- Опционально: добавить TF-стиль `padding-block: var(--section-gap)` вместо `80px`.

---

### 2.13. `src/app/widgets/live-demo/live-demo.component.scss` (205 строк, **P3**)

Сложный animated widget. **Много мёртвых rgba(20, 17, 13, X) + ЧУЖОЙ orange.**

- **L15** `background: linear-gradient(180deg, rgba(20, 17, 13, 0.04), rgba(20, 17, 13, 0.02))` — почти невидимый gradient. Заменить на `background: var(--bg-secondary)` или ничего (let `--bg-primary` show).
- **L17** `box-shadow: 0 30px 80px -32px rgba(20, 17, 13, 0.18)` — мёртв. Если хотим глоу — заменить на `box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4)` или drop.
- **L23** `radial-gradient(..., rgba(255, 91, 31, 0.18), transparent 70%)` — ЧУЖОЙ orange. → `var(--accent-glow)` или `rgba(255, 107, 43, 0.18)`.
- **L39** `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02)` — невидим. Убрать.
- **L68** `border: 1px solid var(--line2)` для bubble — OK.
- **L77** `border: 1.5px solid var(--ink)` для input — почти-белая граница 1.5px. → `border: 1px solid var(--border-accent)` (subtle orange).
- **L83** `box-shadow: 0 0 0 4px rgba(20, 17, 13, 0.06)` — мёртв. → `box-shadow: 0 0 0 4px var(--accent-glow)`.
- **L132** `box-shadow: 0 0 0 4px rgba(255, 91, 31, 0.2)` — ЧУЖОЙ. → `rgba(255, 107, 43, 0.2)`.
- **L146-154** `.ld__tag { background: var(--ink); color: var(--paper) }` — **ГРАФИТ-ИНВЕРТ**. На dark = почти-белый блок с темным текстом. Заменить:
  ```
  background: var(--accent);
  color: #fff;
  ```
  (это «meta-tag», один из 10 accent-spots).
- **L171** `border: 1px solid var(--line2)` — OK.
- **L179** `&__row-d { background: var(--ink) }` — почти-белый круг. → `background: var(--accent)` для первого, `var(--text-secondary)` и `var(--text-muted)` для второго/третьего (уже есть).
- **L199** `@keyframes ld-pulse { box-shadow: 0 0 0 8px rgba(255, 91, 31, 0) }` — ЧУЖОЙ orange transition. → `rgba(255, 107, 43, 0)`.

---

### 2.14. `src/app/shared/contact-form/contact-form.component.scss` (82 строки, **P3**)

Базовая форма. Уже почти TF-shaped.

- **L33** `background: var(--paper)` — alias OK. Но для form-input TF использует `var(--bg-primary)` (`app.scss:738`) — input уходит **глубже** background карточки. Заменить на `background: var(--bg-primary)`.
- **L41-43** focus-state `border-color: var(--ink); box-shadow: 0 0 0 3px rgba(20, 17, 13, 0.15)` — белый border + мёртвая тень. → `border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow)`.
- **L55** `accent-color: var(--ink)` checkbox — на dark `--text-primary` = white-ish checkbox. Заменить на `accent-color: var(--accent)` (TF паттерн `app.scss:786`).
- **L56** `border-bottom: 1px solid rgba(20, 17, 13, 0.3)` — невидим. → `var(--border)`.
- **L67-76** message states `&--ok { color: #047857 }`, `&--err { color: #b91c1c }` — dark green / dark red text на dark bg = плохой контраст. Поправить на `color: var(--success)` (`#34D399`) и `color: #FCA5A5` (light red) соответственно. Background tints `rgba(16, 185, 129, 0.1)` и `rgba(229, 62, 62, 0.08)` могут остаться (alpha-pill на dark читается).

---

### 2.15. `src/app/core/consent/consent-banner.component.scss` (104 строки, **P3**)

Cookie banner. Pop-up, низкий visual weight.

- **L9** `background: var(--paper)` — alias OK.
- **L12** `box-shadow: 0 24px 60px -16px rgba(0, 0, 0, 0.18)` — на dark теряется в фон. Заменить на `box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6)` для явной отделимости от страницы.
- **L41** `border-bottom: 1px solid rgba(20, 17, 13, 0.3)` — невидим. → `var(--border)`.
- **L65** `background: var(--bg-soft)` для tier-card — alias OK, но контраст `--bg-secondary` на `--bg-card` слабый. Заменить на `background: var(--bg-primary)` (явно темнее банера) или `var(--bg-code)`.
- **L83, 89** `accent-color: var(--ink)` — checkbox `--text-primary` = почти-белый. → `var(--accent)`.

---

## 3. Compat-aliases status

### 3.1. Dead vars (можно удалять из `tokens.scss:46-60` после Phase 1-5)

| Variable | Defined at | Used in target | Statement |
|---|---|---|---|
| `--gradient-mesh-hero` | `tokens.scss:57-59` | `styles.scss:405` (`.vc-mesh`), `home.component.html:4` | **STILL USED** — `.vc-mesh` в hero. Но fundamentally TF не использует mesh, hero просто `.hero-bg-grid` (`app.scss:153-161`). Решение: оставить как есть до Phase 1 финальной правки home hero. После — удалить и `.vc-mesh`, и `--gradient-mesh-hero`. |
| `--gradient-cta-glow` | `tokens.scss:60` | `home.component.scss:534` | STILL USED, но один потребитель. После рефактора home CTA на TF inline radial-gradient (`app.scss:1174-1178`) — DEAD. Удалить. |
| `--font-serif` | `tokens.scss:55` | НЕ ИСПОЛЬЗУЕТСЯ нигде в SCSS (grep clean) | **DEAD NOW** — удалить. |
| `--font-display-italic` | `tokens.scss:56` | `blog-list.component.scss:57, 65, 207`, `blog-post.component.scss:220, 396, 566` | STILL USED, но aliased to `var(--font-body)` — это означает что `<em>` в drop-cap, title, byline просто `DM Sans italic`. Это OK (italic есть в DM Sans 400i), но имя misleading. **Рекомендую:** удалить var, заменить usage на прямое `font-family: var(--font-body); font-style: italic`. |
| `--accent-soft` | `tokens.scss:54` | `home.component.scss:552`, `pricing-page.component.scss:192` | STILL USED — но это alias на `--accent-subtle`. Можно либо переименовать usage → `var(--accent-subtle)` (6 строк правки), либо оставить как deprecated alias. |
| `--line2` | `tokens.scss:53` | `home.component.scss:92, 119, 332`, `industries-page.component.scss`... | STILL USED — alias на `--border`. Identical to `--line`, дублирующая семантика. Удалить var, replace_all `var(--line2) → var(--border)`. |

### 3.2. Still-needed (compat для .vc-* классов и крупных файлов)

| Variable | Mapping | Reason |
|---|---|---|
| `--ink` | `→ --text-primary` | 80+ usages across 14 files. Keep until templates переименованы. |
| `--ink2` | `→ --text-secondary` | Same. |
| `--ink3` | `→ --text-muted` | Same. |
| `--paper` | `→ --bg-card` | 60+ usages. Keep. |
| `--line` | `→ --border` | 100+ usages. Keep. |
| `--bg` | `→ --bg-primary` | `live-demo.component.scss:76` etc. Keep. |
| `--bg-soft` | `→ --bg-secondary` | ~20 usages. Keep. |

### 3.3. Dead `vc-*` fallbacks in usage (нужно убрать)

| Pattern | Files | Action |
|---|---|---|
| `var(--vc-accent, #ff5b1f)` | `home.component.scss:628`, `faq-page.component.scss:112` | `var(--vc-accent)` НЕ ОПРЕДЕЛЁН. Fallback `#ff5b1f` (не TF orange). → Заменить на `var(--accent)`. |
| `var(--vc-muted, #555)` / `var(--vc-muted, #777)` | `pricing-page.component.scss:301`, `how-it-works.component.scss:278, 310`, `faq-page.component.scss:115` | НЕ ОПРЕДЕЛЁН. Fallback серый. → `var(--text-muted)`. |
| `var(--vc-graphite, #1a1a1a)` | `how-it-works.component.scss:262`, `faq-page.component.scss:108` | НЕ ОПРЕДЕЛЁН. Fallback графит. → `var(--text-primary)`. |
| `var(--vc-accent-magenta, #c9277e)` | `how-it-works.component.scss:308` | **MAGENTA** — не существует в TF brand. → `var(--accent)`. |

---

## 4. Class-hook migration map

Глобальные TF-utilities уже доступны в `src/styles.scss:60-257`. Шаблоны (`*.component.html`) местами используют `.vc-*`, местами уже скоро готовы к canonical классам. Решение: **НЕ ломать .vc-* aliases сейчас** (32 occurrences в home.html, 90+ в .ts inline-классах в 10 файлах), а постепенно мигрировать.

### 4.1. Safe to switch NOW (тривиальная замена в шаблоне)

| Current class | Target class | Where (template) | Notes |
|---|---|---|---|
| `vc-wrap` | `container` | везде (already dual-defined `styles.scss:42`) | OK — не нужна правка template. |
| `vc-btn vc-btn-accent vc-btn-lg` | `btn btn-primary btn-lg` | `home.component.html:19, 23, 216, 217`, `header.component.html`, многие .ts | Канонические TF классы. **Делать после P0 фиксов**, иначе вообще ничего не поменяется визуально. |
| `vc-btn vc-btn-ghost` | `btn btn-outline` | Same as above | Same. |
| `vc-btn-primary` | `btn-primary` | Header CTA `header.component.html:1-2` | OK. |

### 4.2. Requires more work (новые TF-classes — нужно добавить в `styles.scss`)

| Current pattern | Canonical TF class | Action |
|---|---|---|
| `vc-eyebrow + vc-dot` | `badge` (TF `styles.scss:60-71`) | TF использует `.badge` как унифицированный pill. Шаблонная правка: убрать .vc-dot, использовать `.badge`. |
| `vc-kicker + vc-kicker-bar` | НЕТ прямого аналога в TF | TF не использует kicker pattern. Можно либо оставить `.vc-kicker` (Phase 5 task), либо заменить на `.badge`. Рекомендую оставить — это distinguishing element typelessity. |
| `vc-section-h + vc-section-sub` | `section-header + section-title + section-subtitle` | TF паттерн (`styles.scss:125-144`). Шаблонная замена. |
| `vc-h1-grad + vc-h1-em` | `highlight + <em>` | TF: `.highlight { color: var(--accent) }` (`styles.scss:69-72`). Заменить inline. |

### 4.3. Keep .vc-* indefinitely (специфичные)

- `vc-mesh`, `vc-grain` — overlay-effects, специфичны для home hero. Phase 5 task: уйти на TF `.hero-bg-grid` (`app.scss:153-161`) и удалить.
- Все компонент-specific BEM (`.home-hero__h1`, `.phase__num`, `.industry-card`) — это НЕ `.vc-*`, оставить, только color-правки внутри.

### 4.4. Template-edit count (для P1-5)

- `home.component.html`: 32 `.vc-*` → высокий объём, осторожно (P0).
- `header.component.html`: 2 — тривиально.
- `for-ai-agents.component.html`: 1 — тривиально.
- Inline classes в .ts (90 across 10 files): mostly `.vc-btn`, `.vc-btn-accent`, `.vc-btn-ghost` — массовый sed-replace на `.btn`, `.btn-primary`, `.btn-outline`.

---

## 5. Responsive gaps

TF использует breakpoints **1000px / 860px / 700px / 600px / 540px / 640px** в разных местах (см. `app.scss:221, 352, 450, 590, 800, 867, 946, 1092, 1097, 1268`).

Target tokens (`tokens.scss:66, 72`) определяют только **860px / 540px**.

### Расхождения

| Page | Target breakpoint | TF would use | Issue |
|---|---|---|---|
| `home.component.scss:596, 607` | 980 / 600 | 860 / 700 / 540 | 980 vs 860 → tablet zone остаётся 2-col где TF переключился бы в 1-col. Не катастрофично, но рассогласование. |
| `how-it-works.component.scss:238, 243` | 880 / 600 | 860 / 700 | 880 ≈ 860, OK. |
| `industries.component.scss` | only auto-fill | — | Hidden in CSS Grid auto-fill, нет явных breakpoints. OK для grid, но `.industries-cat h2` не подстраивает font на mobile. |
| `industry-detail.component.scss:181` | 720 | 700 | Близко, OK. |
| `pricing.component.scss:262, 116` | 720 / 720 | 860 / 540 | Pricing-tiers переключается в 1-col на 720, не на 860 — на 760-859px viewport tiers выглядят узко. Поправить → 860. |
| `blog-list.component.scss:18, 124, 258, 343, 451` | 720 / 880 | 860 / 700 | Mixed 720/880 — рассогласовано. Привести к 860. |
| `blog-post.component.scss:37, 69, 102, 127, 160` | 720 | 860 | Mobile typography переключается на 720, не 860 — тексты остаются в desktop-размере до 720px (то есть на iPad portrait 768px). Поправить → 860. |
| `contact-form.scss:80` | 540 | 540 | OK. |
| `consent-banner.scss:100` | 640 | 700 | Close. |

### Critical gap

**Все code-blocks** (`how-embed__code`, `aiagents-code`, `home-cta__snippet`, `how-inside__code`, blog-post `::ng-deep pre`) НЕ имеют mobile-specific font-size reduction. TF делает это для terminal-body (`app.scss:283-292`) implicitly через line-height + padding. Target — голый pre без responsive. На 360px viewport — overflow.

### Recommendation

- **Add tokens var** `--bp-md: 860px`, `--bp-sm: 700px`, `--bp-xs: 540px` в `tokens.scss`.
- **Unify breakpoints to 860 / 700 / 540** across все компоненты.
- Особенно критично — pricing (P0) и blog-post (P2).

---

## 6. Priority order (ranked action list)

### P0 — visual blockers (main funnel)

1. **`home.component.scss`** — fix 12 critical issues:
   - L357 `.home-compare__verdict` graphite-invert → bg-code+border-accent.
   - L578 `.home-cta__snippet` → terminal-window pattern (template edit required).
   - L162-174 `.phase__num` graphite-invert → accent-subtle pill.
   - L301-309 `.industries__cell--more` graphite-invert → accent-subtle pill.
   - L255 `.pillar__num` dead background → accent-subtle.
   - L188, 218 `--bg-soft` → `--bg-code` для code/example inserts.
   - L399 `.tier--featured` border ink → border accent + featured gradient.
   - L458 checkmark color ink → success.
   - L480-481 FAQ open-state dead colors → border-accent only.
   - L113, 153, 244, 321, 396 — drop dead `rgba(20, 17, 13, X)` shadows.
   - L22 hero font-size 98px → 52px max (hierarchy fix).
   - L628 `--vc-accent, #ff5b1f` → `var(--accent)`.
2. **`pricing-page.component.scss`** — fix:
   - L273-296 `.pricing-diff` cream-table — ПОЛНАЯ замена на dark.
   - L39-40 `.tier--featured` graphite-invert → orange accent.
   - L165 `.onboarding__day` dead bg → accent-subtle.
   - L100 checkmark ink → success.
   - L226-227 FAQ dead colors.
   - L301 `--vc-muted, #555` → `--text-muted`.
3. **`styles.scss`** (already done) + verify header/footer.

### P1 — visible discrepancies (frequented pages)

4. **`how-it-works.component.scss`** — fix:
   - L26-37 `.how-phase__num` graphite-invert.
   - L189-202 `.how-embed__code` → terminal-window (template + scss).
   - L248-285 `.how-inside` — три cream-blocks → dark TF.
   - L287-317 `.how-edge` — cream-cards + MAGENTA → dark TF + accent.
   - L136 `.pillar__num` dead bg.
5. **`industries-page.component.scss`** — fix:
   - L46-48 dead hover → TF feature-card hover.
6. **`faq-page.component.scss`** — fix:
   - L44-45 FAQ open-state dead.
   - L88 dead border-bottom.
   - L93-119 `.faq-jump` cream-pills → dark TF.
7. **`blog-list.component.scss`** — fix:
   - L138, 166, 184 dead shadows.
   - L159, 189, 247-249 wrong-orange → TF orange.
   - L362-364 use `--bg-card-hover`.
   - L434, 437 tag pill invisible bg → accent-subtle.
8. **`about-page.component.scss`** — fix:
   - L48 dead border.
   - L23 padding-block → section-gap.
   - L68 add font-display.

### P2 — deep pages

9. **`blog-post.component.scss`** — fix (БОЛЬШОЙ объём):
   - L26, 341 wrong-orange shadow + sweep.
   - L138, 166, 184, 370, 434 — все dead shadows.
   - L351, 355 inline code dead bg.
   - L361-389 pre block → terminal pattern.
   - L395 blockquote border ink → accent.
   - L431, 448, 482, 490, 501, 515 — **5 cream hex values** в table system → dark equivalents.
   - L455, 459 zebra/hover rgba дешёвые.
   - L222, 226 drop cap font-display-italic → font-body + style:italic.
10. **`industry-detail-page.component.scss`** — fix:
    - L141 marker ink → accent.
    - L158-159 FAQ dead.
    - L118-122 `.chip--magenta` — переименовать.
11. **`for-ai-agents.component.scss`** — fix:
    - L62-72 `.aiagents-code` → terminal-window.
    - L23, 58, 88 bg-soft → bg-code для inline-code.
    - L118 dead border.
12. **`legal-page.component.scss`** — fix:
    - L37 dead border.
    - L58 bg-soft → bg-code.
13. **`not-found.component.scss`** — ship-able as-is, опциональная section-gap правка.

### P3 — widgets, consent, contact-form

14. **`live-demo.component.scss`** — fix:
    - L15 invisible gradient → bg-secondary.
    - L17, 39 dead shadows.
    - L23, 132, 199 wrong-orange.
    - L77 white border → border-accent.
    - L83 dead pad → accent-glow.
    - L146-154 `.ld__tag` graphite-invert → accent.
    - L179 row-d ink → accent.
15. **`contact-form.component.scss`** — fix:
    - L33 paper → bg-primary (input depth).
    - L41-43 focus state ink → accent.
    - L55, 83, 89 checkbox accent-color ink → accent.
    - L67-76 error/ok message colors.
16. **`consent-banner.component.scss`** — fix:
    - L12 weak shadow → stronger dark shadow.
    - L41 dead border.
    - L65 bg-soft tier-card → bg-primary.
    - L83 checkbox accent.

---

## 7. Estimated dev-effort per priority tier

| Tier | Hours (realistic, single senior dev) | Breakdown |
|---|---|---|
| **P0** | **7-9h** | home: 5-6h (большой файл, плюс template edits для terminal-window и .verdict block) + pricing: 1.5-2h (cream-table rewrite + tier-featured) + verify header/footer/global utilities: 0.5h |
| **P1** | **5-6h** | how-it-works: 2-2.5h (3 cream-blocks + magenta fix + terminal-window) + blog-list: 2h (mostly find/replace + animation orange) + faq: 0.5h + industries: 0.25h + about: 0.25h |
| **P2** | **5-6h** | blog-post: 3-4h (длинный файл, 5 cream hex values в table system + pre block + drop cap) + industry-detail: 1h + for-ai-agents: 0.5h + legal: 0.5h + not-found: 0.1h |
| **P3** | **2-2.5h** | live-demo: 1.5h (много мест) + contact-form: 0.5h + consent-banner: 0.25h |
| **Cleanup** | **1h** | Dead vars sweep (3.1), `--vc-*` fallbacks sweep (3.3), breakpoint unification |
| **Class-hook migration** (Уровень 3, опционально, можно отложить) | **3-4h** | Template edits .vc-btn → .btn etc. across 10 .ts + 3 .html. Не блокер для visual fix. |
| **TOTAL (visual fixes only)** | **~20-23h** | Без class-hook migration, чисто SCSS+template edits для terminal-window pattern. |
| **TOTAL (visual + class-hook)** | **~24-27h** | С полной миграцией шаблонов на canonical TF utility classes. |

### Reality check

- **Home page alone — half-day минимум**, потому что нужен не просто find/replace, а structural rethink нескольких блоков (`.home-compare__verdict`, `.home-cta__snippet`, all graphite-invert badges).
- **Если бюджет ограничен** — P0 + critical P1 (`how-it-works` для magenta + terminal-windows) = **9-11h**, достаточно для «home + main funnel» ship-able state.
- **Полный TF parity** для всех 15 файлов — **~22h** SCSS работы, не считая QA/screenshot пасса.

---

## Appendix A — Map of cream-contamination

**Files with `rgba(20, 17, 13, X)`** (графит-on-dark = invisible): 9 files
- home, pricing, blog-list, blog-post, how-it-works, about, industries, faq, industry-detail, contact-form, consent, live-demo (12 files если считать все).

**Files with explicit cream hex (`#fff`, `#f3f0eb`, `#e8e3da`, `#1a1815`, `#f7f3ec`, `#0f1115`, `#1a1a1a`, `#d8d0c0`, `#f4ebd8`, `#c9bfa9`, `#f5efe3`, `#c9277e`)**: 8 files
- pricing-page (`#fff`, `#e8e3da`, `#f7f3ec`, `#f0ece4`), blog-list (`#fff` через rgba), blog-post (`#1a1815`, `#f5efe3`, `#d8d0c0`, `#f4ebd8`, `#c9bfa9`), how-it-works (`#1a1815`, `#0f1115`, `#1a1a1a`, `#fff`, `#e8e3da`, `#c9277e`, `#f3f0eb`), faq-page (`#fff`, `#e8e3da`, `#f3f0eb`), for-ai-agents (`#1a1815`, `#f7f3ec`), home (`#ff5b1f` через fallback).

**Files with wrong-orange `rgba(255, 91, 31, X)`**: 3 files
- blog-list (lines 159, 189, 247-249), blog-post (lines 26, 184? — нет, 341, 459, 515), live-demo (23, 132, 199).

**Files using `var(--vc-*)` undefined fallbacks**: 4 files
- pricing-page, how-it-works (magenta!), faq-page, home.

---

## Appendix B — Сравнение ключевых паттернов (target ↔ TF)

| Pattern | TF reference | Target current | Status |
|---|---|---|---|
| Container | `styles.scss:63-67` 1120px / 24px | `tokens.scss:38-39`, `styles.scss:41-45` 1120 / 40 (responsive 24→18) | OK, target padding щедрее, не блокер |
| Section spacing | `app.scss:364-379` `var(--section-gap)` (80px) | mix `padding-block: 50/55/60/70/80px` в каждом файле | Inconsistent — много кастомных |
| Cards radius | `app.scss:404, 689, 833` `var(--radius)` (12px) / `var(--radius-lg)` (20px) | mix 10/12/14/16/18/20/24px hardcoded | Inconsistent — нет нигде `var(--radius)` |
| Buttons radius | `styles.scss:96` 100px | `styles.scss:81, 270` 100px / 999px | OK (functionally same) |
| Hover lift | `app.scss:841` `translateY(-2px)` (cards), `app.scss:414` `translateY(-4px)` (steps) | mix `translateY(-1px / -2px / -4px)` | Mostly OK |
| Box-shadow on cards | `app.scss:210, 249, 370` `0 24px 64px rgba(0, 0, 0, 0.4)` | `rgba(20, 17, 13, X)` мёртв | **Сломано** |
| Code block | `app.scss:244-310` `.terminal-window` + mac-dots + title | hardcoded `#1a1815` `<pre>` | **Сломано — нужен паттерн** |
| Primary button | `styles.scss:102-112` shadow 0.3/0.4 alpha rgba(255,107,43) | `styles.scss:289, 302` shadow rgba(255,107,43,0.55) | Близко, OK |
| Featured price card | `app.scss:974-981` gradient `rgba(255, 107, 43, 0.08)` + accent border | `home/pricing` `border: 1.5px solid var(--ink)` (white!) | **Сломано** |
| Hero font size | `app.scss:173` `clamp(32px, 5vw, 52px)` weight 700 | `home:22` `clamp(36px, 7vw, 98px)` weight 600 | **Слишком большой** |

---

**Конец review.**

Author: senior design-system reviewer
Дата: 2026-05-20
Версия: v1 (ready for implementer agent)
