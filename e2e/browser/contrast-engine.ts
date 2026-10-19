// One measure of text contrast for the whole page, shared by gray-text-contrast.pw.ts (every address of the sitemap, both
// themes, both widths), waitlist-form.pw.ts (the notice links) and anything that wants the same rule. Plain JavaScript in a
// string, like COLLECT in width-overflow.pw.ts: it runs inside the page and needs no imports there.
//
// What it does (L3 F1, F2):
//  - it walks EVERY visible text node under the scope, not the nodes of two grey tokens: orange text, errors, links, white
//    text on a card are all measured;
//  - the surface is found as the browser paints it: the colour layers of the element and its ancestors are composited from
//    the page up, and a linear-gradient layer is read AT the text (the point along the gradient line under the left end,
//    the middle and the right end of each line of text), so a button with a gradient fill is measured against what is
//    behind its letters;
//  - the TEXT colour keeps its alpha: rgba(242,244,248,0.60) over a dark card is not #F2F4F8. The old formula threw the
//    alpha away, which made every semi-transparent token look better than it is;
//  - the threshold is WCAG 1.4.3: 4.5:1, or 3:1 for large text (24px, or 18.66px and bold).
//
// Left out, each on purpose (kept short here, the reasons are the ones in the L3 design, B2):
//  - a subtree under aria-hidden="true" (the giant decorative word of the footer);
//  - a colour with alpha 0 (background-clip:text gradient headings paint through the clip, not through the colour);
//  - :disabled controls and .vc-btn-muted (WCAG exempts inactive components);
//  - <option>/<optgroup> (the operating system paints the list), a box of 1px (visually-hidden text).
// A caller may add { selector, why } to opts.exceptions; none is wanted today.
export const CONTRAST_ENGINE = String.raw`(opts) => {
  const scope = opts.scope || 'body';
  const exceptions = opts.exceptions || [];
  const parse = (s) => {
    let m = s.match(/rgba?\(([^)]+)\)/);
    if (m) { const a = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; }
    m = s.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
    if (m) return { r: parseFloat(m[1]) * 255, g: parseFloat(m[2]) * 255, b: parseFloat(m[3]) * 255, a: m[4] === undefined ? 1 : parseFloat(m[4]) };
    return null;
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const x = Math.max(lum(a), lum(b)), y = Math.min(lum(a), lum(b)); return (x + 0.05) / (y + 0.05); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });

  // Split a CSS argument list at the top level (commas inside rgb(...) do not split).
  const split = (s) => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(') depth++; if (ch === ')') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };

  // One linear-gradient(...) of a computed background-image, read at the viewport point (px, py) of the box.
  const gradientAt = (css, box, px, py) => {
    const open = css.indexOf('linear-gradient(');
    if (open < 0) return null;
    let depth = 0, end = -1;
    for (let i = open + 15; i < css.length; i++) { if (css[i] === '(') depth++; if (css[i] === ')') { depth--; if (depth === 0) { end = i; break; } } }
    const args = split(css.slice(open + 16, end));
    let angle = 180;
    const first = args[0];
    if (!/^(rgb|color\()/.test(first)) {
      args.shift();
      const deg = first.match(/^(-?[\d.]+)deg$/);
      if (deg) angle = parseFloat(deg[1]);
      else { const kw = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270, 'to top right': 45, 'to right top': 45, 'to bottom right': 135, 'to right bottom': 135, 'to bottom left': 225, 'to left bottom': 225, 'to top left': 315, 'to left top': 315 }; if (kw[first] !== undefined) angle = kw[first]; }
    }
    const rad = angle * Math.PI / 180, dx = Math.sin(rad), dy = -Math.cos(rad);
    const length = Math.abs(box.width * dx) + Math.abs(box.height * dy) || 1;
    const stops = args.map((a) => { const c = parse(a); const p = a.match(/(-?[\d.]+)(%|px)\s*$/); return { c, at: p ? (p[2] === '%' ? parseFloat(p[1]) / 100 : parseFloat(p[1]) / length) : null }; }).filter((s) => s.c);
    if (stops.length < 2) return stops[0] ? stops[0].c : null;
    if (stops[0].at === null) stops[0].at = 0;
    if (stops[stops.length - 1].at === null) stops[stops.length - 1].at = 1;
    for (let i = 1; i < stops.length; i++) if (stops[i].at !== null && stops[i].at < stops[i - 1].at) stops[i].at = stops[i - 1].at;
    for (let i = 1; i < stops.length - 1; i++) {
      if (stops[i].at !== null) continue;
      let j = i; while (stops[j].at === null) j++;
      for (let k = i; k < j; k++) stops[k].at = stops[i - 1].at + (stops[j].at - stops[i - 1].at) * (k - i + 1) / (j - i + 1);
    }
    const t = ((px - (box.left + box.width / 2)) * dx + (py - (box.top + box.height / 2)) * dy) / length + 0.5;
    let lo = stops[0], hi = stops[stops.length - 1];
    if (t <= lo.at) hi = lo; else if (t >= hi.at) lo = hi; else for (let i = 1; i < stops.length; i++) if (t <= stops[i].at) { lo = stops[i - 1]; hi = stops[i]; break; }
    const k = hi.at === lo.at ? 0 : (t - lo.at) / (hi.at - lo.at);
    const a = lo.c.a * (1 - k) + hi.c.a * k;
    if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (x, y) => (x * lo.c.a * (1 - k) + y * hi.c.a * k) / a;
    return { r: mix(lo.c.r, hi.c.r), g: mix(lo.c.g, hi.c.g), b: mix(lo.c.b, hi.c.b), a };
  };

  const root = document.documentElement;
  const canvas = /dark/.test(getComputedStyle(root).colorScheme) ? { r: 18, g: 18, b: 18, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
  // What is behind the point (px, py) of element el: the layers from the element up to <html>, composited over the canvas.
  const surfaceAt = (el, px, py) => {
    const layers = [];
    for (let e = el; e; e = e.parentElement) {
      const style = getComputedStyle(e);
      // A gradient that is only a thin line (the underline of a link in an article: background-size 100% 1.5px) is not a surface.
      const sizeY = style.backgroundSize.split(' ')[1] || '';
      const thin = /calc/.test(style.backgroundSize) || (/px$/.test(sizeY) && parseFloat(sizeY) < e.getBoundingClientRect().height * 0.6);
      if (!thin && /linear-gradient\(/.test(style.backgroundImage)) {
        const g = gradientAt(style.backgroundImage, e.getBoundingClientRect(), px, py);
        if (g && g.a > 0) { layers.push(g); if (g.a >= 1) break; }
      }
      const c = parse(style.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    let eff = layers.length && layers[layers.length - 1].a >= 1 ? layers.pop() : canvas;
    for (let i = layers.length - 1; i >= 0; i--) eff = over(layers[i], eff);
    return eff;
  };

  const bad = [];
  let seen = 0, min = Infinity;
  const done = new Set();
  const roots = Array.from(document.querySelectorAll(scope));
  for (const rootEl of roots) {
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || !n.textContent.trim()) continue;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|OPTION|OPTGROUP)$/.test(el.tagName)) continue;
      if (el.closest('[aria-hidden="true"]') || el.closest('button:disabled, input:disabled, select:disabled, textarea:disabled, .vc-btn-muted')) continue;
      if (exceptions.some((x) => el.matches(x.selector))) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden') continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
      if (!rects.length) continue;
      let opacity = 1;
      for (let e = el; e; e = e.parentElement) opacity *= parseFloat(getComputedStyle(e).opacity);
      const fg = parse(cs.color);
      if (!fg || fg.a === 0 || opacity === 0) continue;
      const key = el;
      const fs = parseFloat(cs.fontSize);
      const large = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700);
      let worst = Infinity, worstBg = null;
      for (const r of rects.slice(0, 6)) {
        for (const px of [r.left + 1, r.left + r.width / 2, r.right - 1]) {
          const py = r.top + r.height / 2;
          const eff = surfaceAt(el, px, py);
          const text = over({ r: fg.r, g: fg.g, b: fg.b, a: fg.a * opacity }, eff);
          const q = ratio(text, eff);
          if (q < worst) { worst = q; worstBg = eff; }
        }
      }
      seen++;
      if (worst < min) min = worst;
      if (worst < (large ? 3 : 4.5) && !done.has(key)) {
        done.add(key);
        bad.push(el.tagName + '.' + String(el.getAttribute('class') || '').slice(0, 30) + ' «' + n.textContent.trim().slice(0, 30) + '» ' + worst.toFixed(2) + ':1 (' + (large ? 'large 3' : '4.5') + ') text ' + cs.color + ' on rgb(' + Math.round(worstBg.r) + ',' + Math.round(worstBg.g) + ',' + Math.round(worstBg.b) + ')');
      }
    }
  }
  return { seen, bad, min: min === Infinity ? null : min };
}`;
