# Blog hero image prompts (Nano Banana / Gemini)

11 prompts for blog post hero images. **Output spec:** 16:9, 1600×900px (high-DPR friendly), photorealistic 3D render or abstract composition. **No text. No logos. No UI mockups.** Blog template overlays the title.

**Output files:** `public/og/blog/<slug>.png`

After generation, restore the `ogImage:` line in each MDX frontmatter:
```yaml
ogImage: "/og/blog/<slug>.png"
```

---

## 1. single-gpt-call.png

`Why we replaced the booking form with a single GPT call`

```
Photorealistic 3D render of a single luminous beam of warm amber light passing through a hovering glass prism, refracting into a clean spectrum on the right side that resolves into a precise grid of small structured tokens. The left side is a single, undivided beam — clean, focused, deliberate. The right side shows the beam neatly subdivided into discrete cells of equal weight. Studio lighting, three-point softbox, deep navy background, subtle volumetric haze. Macro depth-of-field on the prism, the spectrum cells in sharp focus. Color palette: amber, cyan, deep navy, soft white. Clean composition with negative space on the upper-left for title overlay. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 2. cascade-corrections.png

`Cascade-aware corrections: how to handle field dependencies`

```
Photorealistic 3D render of a chain of brushed-aluminum cascading water trays arranged at descending heights, where amber liquid in the topmost tray has visibly changed color from blue to amber, and the change is propagating downward through three connected lower trays — the second tray mid-transition, the third still blue. Each tray rests on a thin glass platform, connected by visible siphons and small valve mechanisms. Studio lighting from upper right, hard shadows showing the descent. Industrial-design aesthetic, precision engineering. Color palette: brushed aluminum, electric blue, warm amber, soft cream background. Clean composition, the topmost tray in the upper-third, lower trays trailing into the lower-right. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 3. whisper-vs-webspeech.png

`Whisper vs Web Speech API: voice booking`

```
Photorealistic macro photograph of two studio microphones standing side-by-side on a dark walnut surface — one a vintage condenser microphone with brushed-gold mesh and warm tungsten internal glow (suggesting depth and quality), the other a sleek, ultra-modern wire-frame microphone in cool brushed silver. Both are angled slightly toward each other. Volumetric rim lighting from upper sides creates a clear silhouette of each. Subtle reflections on the walnut surface. Out-of-focus dust motes in the air catch the light. Color palette: warm gold, cool silver, rich walnut, deep charcoal. Clean composition with the two microphones occupying the right two-thirds, negative space on the left for title. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 4. 25-languages-one-prompt.png

`25 languages, one prompt: config-driven extraction`

```
Photorealistic 3D render of a single hovering glass shard at the center, with 25 distinct ribbons of soft pastel light emanating outward from it like a slow-motion explosion, each ribbon a different hue (warm amber, mint, lavender, rose, cyan, gold, etc.). Each ribbon trails toward the edges of the frame and dissolves into clean abstract characters resembling diverse script forms — Latin, Cyrillic, Arabic, Hangul, Kanji, Devanagari, Hebrew — but stylized abstract, not legible text. The central shard is the singular source; the ribbons are the multilingual outcomes. Studio lighting, soft global illumination, gentle volumetric haze. Color palette: full pastel spectrum on charcoal background. Clean composition, central shard at the optical focal point. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 5. forms-vs-conversation-study.png

`Forms vs conversation: funnel-shape difference`

```
Photorealistic 3D render of two transparent glass funnels on a dark slate surface, side by side. The left funnel has a wide top, a narrow neck choked at the second-third (visualized as a tight glass constriction with amber droplets stuck at the choke), and a thin trickle escaping the bottom. The right funnel is shorter, smoother, gently tapered without a constriction, and a confident continuous stream flows from its base. Soft studio lighting, warm key from upper left, cool fill from right. The amber liquid catches light. Subtle depth-of-field. Color palette: glass clear, warm amber, deep slate, soft cream rim light. Clean composition with the funnels occupying the central horizontal band. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 6. latency-budgets.png

`Latency budgets: how to stay under one second`

```
Photorealistic macro photograph of a brushed-steel mechanical stopwatch face with the second hand frozen at the 11-o'clock position (just before the 12), against a deep midnight-blue velvet background. The stopwatch face is in razor-sharp focus; the body of the stopwatch fades softly into the velvet. Warm amber rim light from upper-right, cool blue ambient. The internal mechanism is partially visible through a small cutout, showing precise gear teeth. Subtle reflective highlight on the glass dome. Color palette: brushed steel, deep midnight blue, warm amber, hint of brass. Clean composition with the stopwatch face slightly right-of-center. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 7. gdpr-compliance.png

`GDPR-compliant AI booking: EU contour`

```
Photorealistic 3D render of a single hovering envelope made of polished chrome, partially translucent so subtle wax-seal mechanism is visible inside. The envelope is sealed with an elegant deep-blue wax seal embossed with an abstract circular EU-stars motif (12 small stars in a circular ring). Soft studio lighting from upper-left, blue rim light along the edge. The envelope hovers above a polished marble surface that reflects it faintly. Subtle motion-blur on the wax seal as if newly impressed. Color palette: chrome silver, deep blue (Klein blue), white marble, soft cream highlights. Clean composition, the envelope at the upper-third optical center. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 8. designing-for-ai-agents.png

`Designing for AI agents: machine-readable in 2026`

```
Photorealistic 3D render of an open architectural blueprint scroll laid flat on a dark walnut desk, partially illuminated. Above the scroll, hovering at varying heights, are 6–8 small glass cubes containing visible structured-data lattices (clean geometric arrangements suggesting JSON/schema, but not legible — abstract crystalline structures). Soft amber overhead light catches the cubes; the blueprint surface beneath is in cool blue half-light. The cubes are connected to specific points on the blueprint by thin filaments of soft light. Clean industrial-design aesthetic, precision drawing. Color palette: cool blueprint blue, warm amber light, deep walnut, glass-clear cubes with subtle iridescence. Clean composition, the blueprint horizontal in the lower-third, cubes hovering above. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 9. pricing-ai-products.png

`Pricing AI products: why the pilot is free`

```
Photorealistic 3D render of two hovering metal weighing scales on a dark slate background. The left scale holds a single small glowing seed (representing 'pilot' — modest, pure, latent value), tilted slightly downward. The right scale holds a denser arrangement of intersecting metal cogs and gears (representing 'enterprise' — built-out machinery, heavier), tilted upward. Between them, a thin filament of light connects the seed to the gears, suggesting transformation. Studio lighting, key from upper-left, cool fill from upper-right. Industrial precision aesthetic. Color palette: brushed brass, dark slate, warm amber light from the seed, cool cyan from the cogs. Clean composition with the two scales side-by-side, central horizon line. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 10. what-we-got-wrong.png

`What we got wrong: lessons from building Typelessity`

```
Photorealistic macro photograph of an architect's drafting desk surface, dark walnut, with six small crumpled sheets of high-quality paper scattered across it — five fully crumpled and slightly off-frame, one in the center partially flattened back out, smoothed enough to suggest reflection rather than discard. A brass drafting pencil lies diagonally across the smoothed sheet. Warm tungsten desk lamp from upper-right casts soft directional light, raking across the textures of the paper. Subtle dust motes in the light beam. Color palette: warm walnut, cream paper, polished brass, warm amber light. Clean composition with the central smoothed sheet at the optical focal point. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## 11. best-ai-booking-widgets-2026.png

`Best AI booking widgets 2026 — comparison and decision guide`

**Already exists:** `public/og-blog-best-ai-booking-widgets-2026.png` — keep as-is.

If a new version is desired, prompt:

```
Photorealistic 3D render of five distinct geometric objects on a polished dark surface, arranged in a horizontal row with even spacing — each object representing a different booking-tool category through abstract form alone, not literal product depiction. From left: a single calendar-pin-shape (sleek, minimal), a layered marble platform with multiple thin glass plates stacked (broad), a hexagonal node with branching wire frames (a chatbot-builder lattice), a curved open funnel-shape (lead capture), and at the right, a clear acrylic sphere containing a single glowing extracted-token (the form-replacement model). Studio lighting, three-point softbox, soft volumetric haze. Each object has its own subtle accent color. Color palette: muted but distinct — deep blue, warm gold, mint, rose, amber. Clean composition with all five objects in the horizontal mid-band, generous negative space above and below. Widescreen 16:9. No text, no logos, no UI elements.
```

---

## Generation workflow

1. Pass each prompt to **Gemini Nano Banana** (or any equivalent text-to-image model with strong adherence — Imagen 4, Flux 1.1, GPT-image-1).
2. Generate at native 1600×900px or upscale from 1024×576px → 1600×900px.
3. Save as PNG with sRGB profile (not P3) for maximum cross-platform color match.
4. Optimize via `pngquant --quality=80-95` to bring file size below ~150 KB per image.
5. Place under `public/og/blog/<slug>.png`.
6. Restore the `ogImage:` line in each `.mdx` frontmatter:
   ```yaml
   ogImage: "/og/blog/<slug>.png"
   ```
7. Run `npm run build:blog` to refresh the manifest.
8. Run `npx ng build` to regenerate the prerendered HTML with new OG meta.

## Quality bar

Each image must:
- Read instantly as a single concept (not a busy collage).
- Survive being shrunk to 1200×630px (Twitter / OpenGraph thumbnail size).
- Look distinct from the other 10 (no repeated palette + composition combos).
- Contain zero text, zero logos, zero UI elements (the blog template handles those).

If an image fails any of those four tests after generation, regenerate or pick a different concept. Do not ship an OG image that does not survive thumbnail shrinkage — it is the single most-shared visual asset of each post.
