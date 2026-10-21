import { test, expect, type Page } from './fixtures';

// L15 «скорость лендинга» (2026-10-21, pending-review/2026-10-21/L15/brief.md): what the speed changes must not cost the visitor,
// read in Chromium from the real SSR build. The node guard e2e/font-coverage.spec.ts holds the bytes (every letter of every page is
// in a font file); this spec holds what the browser really draws and requests.

// ── 1. Montserrat latin-ext is a subset: the letters beyond Latin-1 are still drawn in Montserrat, by the subset file ──
// CDP CSS.getPlatformFontsForNode names every platform font the browser used for the text of a node; a letter missing from the
// subset would show up as a second, fallback family on the same node.
async function fontsOfMarked(page: Page): Promise<Array<{ text: string; fonts: string[] }>> {
  const texts = await page.evaluate(() => {
    const ext = /[Ā-ſȘ-ț]/;
    const out: string[] = [];
    let i = 0;
    for (const el of Array.from(document.querySelectorAll('body *'))) {
      if (!/^Montserrat\b/.test(getComputedStyle(el).fontFamily.replace(/["']/g, ''))) continue;
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent ?? '').join('');
      const r = el.getBoundingClientRect();
      if (!ext.test(own) || r.width < 1 || r.height < 1) continue;
      el.setAttribute('data-ty-ext', String(i++));
      out.push(own.trim().slice(0, 60));
    }
    return out;
  });
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const out: Array<{ text: string; fonts: string[] }> = [];
    for (let i = 0; i < texts.length; i++) {
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-ty-ext="${i}"]` });
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      out.push({ text: texts[i]!, fonts: fonts.map((f) => f.familyName) });
    }
    return out;
  } finally {
    await cdp.detach();
  }
}

for (const path of ['/', '/pricing']) {
  test(`L15-F1 ${path}: every visible text with a Latin Extended-A letter is drawn in Montserrat alone, and the latin-ext file the page fetched is the subset`, async ({ page }) => {
    const fonts: string[] = [];
    page.on('request', (r) => { if (r.resourceType() === 'font') fonts.push(new URL(r.url()).pathname); });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const nodes = await fontsOfMarked(page);
    expect(nodes.length, `${path} must show at least one Latin Extended-A letter (Gdańsk on /, the Polish price note on /pricing)`).toBeGreaterThan(0);
    const fallback = nodes.filter((n) => n.fonts.some((f) => !/^Montserrat\b/.test(f)));
    expect(fallback, 'a node whose letters were partly drawn by another font').toEqual([]);
    expect(fonts.filter((f) => /montserrat-latin-ext-subset-[0-9a-f]{8}\.woff2$/.test(f)), 'the latin-ext subset is fetched once').toHaveLength(1);
    expect(fonts.filter((f) => f.endsWith('/JTUSjIg1_i6t8kCHKm459WdhyyTh89ZNpQ.woff2')), 'the full latin-ext file of Google is not fetched').toEqual([]);
  });
}
