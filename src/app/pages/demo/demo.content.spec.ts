import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEMO_CARDS, MEDBOOK_NOTE, demoButton, demoCopy, type DemoCard } from './demo.content';

// TY-DEMO (25.10). The cards of /demo are scenarios; a button to a demo site stands only while the card is switched on (`live`),
// because on 25.10 the widget answers on none of the four sites. The page as built is held by e2e/demo-page-dist.spec.ts.

const withLive = (card: DemoCard, live: boolean): DemoCard => ({ ...card, live });

test('DEMO_CARDS: the four demos in the order of the mock, one address each, none of them switched on yet', () => {
  assert.deepEqual(DEMO_CARDS.map((c) => c.id), ['glow', 'autopro', 'transedge', 'medbook']);
  assert.deepEqual(DEMO_CARDS.map((c) => new URL(c.liveUrl).hostname), [
    'glow-studio-demo.netlify.app', 'autopro-service-demo.netlify.app', 'transedge-freight.netlify.app', 'medbook-vue.netlify.app',
  ]);
  // The flag is the founder's: it goes to true one card at a time, after a live conversation on that site (BRIEF §0, APPROVED p.1).
  assert.deepEqual(DEMO_CARDS.filter((c) => c.live).map((c) => c.id), []);
});

test('demoButton: no button while the card is off — nothing on the page can lead to a demo site', () => {
  for (const card of DEMO_CARDS) assert.equal(demoButton(withLive(card, false)), null, `${card.id} prints a button while live is false`);
});

test('demoButton: a card that is on gets the address of its site with the utm of the page, and a label that names the brand and the new tab', () => {
  for (const card of DEMO_CARDS) {
    const button = demoButton(withLive(card, true));
    assert.ok(button, `${card.id}: no button while live is true`);
    const url = new URL(button.href);
    assert.equal(url.origin, new URL(card.liveUrl).origin);
    assert.deepEqual([...url.searchParams], [['utm_source', 'typelessity.com'], ['utm_medium', 'demo-page'], ['utm_content', card.id]]);
    assert.equal(button.label, 'Open the demo site');
    assert.equal(button.srLabel, `${card.name} (opens in a new tab)`);
  }
});

test('the template opens the button in a new tab with rel=noopener, and prints the link nowhere else', () => {
  const html = readFileSync(new URL('./demo-page.component.html', import.meta.url), 'utf8');
  const anchors = [...html.matchAll(/<a\b[^>]*\[href\]="b\.href"[^>]*>/g)].map((m) => m[0]);
  assert.equal(anchors.length, 1, 'the demo-site link is printed once, from the button');
  assert.match(anchors[0]!, /target="_blank"/);
  assert.match(anchors[0]!, /rel="noopener"/);
  const before = html.slice(0, html.indexOf(anchors[0]!));
  assert.match(before.slice(before.lastIndexOf('@if')), /@if \(button\(card\); as b\)/, 'the link is not inside the @if of the button');
  assert.doesNotMatch(html, /netlify\.app/, 'a literal demo address in the template');
});

test('demoCopy: the words that send the reader to a demo site are used only when a card is on', () => {
  const off = demoCopy(DEMO_CARDS);
  const text = [off.eyebrow, off.h1, off.h1Accent, off.lead, off.fine ?? ''].join(' ');
  assert.doesNotMatch(text, /\bLive\b|\bTry it\b|\bOpen\b|new tab|on their sites/i, 'a promise of a working demo while none is on');
  assert.equal(off.fine, null);
  const on = demoCopy([withLive(DEMO_CARDS[0]!, true), ...DEMO_CARDS.slice(1)]);
  assert.equal(on.eyebrow, 'Live demos');
  assert.equal(on.h1, 'Try it on a demo website.');
  assert.match(on.lead, /Open one and send a request in the chat/);
  assert.match(on.fine ?? '', /Each site opens in a new tab\./);
});

test('MedBook: the only card with a mark, and the mark is the founder\'s sense — an example, not offered to medical practices, no real health data', () => {
  assert.deepEqual(DEMO_CARDS.filter((c) => c.note).map((c) => c.id), ['medbook']);
  assert.equal(DEMO_CARDS.find((c) => c.id === 'medbook')!.note, MEDBOOK_NOTE);
  assert.equal(MEDBOOK_NOTE.lead, 'Just an example.');
  assert.match(MEDBOOK_NOTE.body, /^Typelessity is not available to medical practices\. /);
  assert.equal(MEDBOOK_NOTE.warning, 'Do not enter real health data.');
  // «No pilot, no soon, no contact us» for a medical business (task.md, Borders; owner-typelessity §3): the mark promises nothing.
  assert.doesNotMatch(Object.values(MEDBOOK_NOTE).join(' '), /pilot|soon|contact|will be|for clinics|GDPR-compliant/i);
});

test('the words of the cards keep clear of the claim classes of the site: no timing, no «for clinics», no health-data invitation, no scripted-home words', () => {
  const words = DEMO_CARDS.flatMap((c) => [c.kind, c.name, c.says, c.asks, ...(c.picks ?? []), c.requestTitle, ...c.request.flat(), ...(c.note ? Object.values(c.note) : [])]).join('\n');
  assert.doesNotMatch(words, /for clinics|\b(in|under|within) \d+ minutes\b|unlimited|prototype|HIPAA|GDPR-compliant/i);
  assert.doesNotMatch(words, /allerg|dietary|Botox|prenatal|trimester|cardiolog|dentist|dental/i);
  assert.doesNotMatch(words, /Anna K|GET \/stylists|confirmed/i, 'the script of the home page, or a booking that is confirmed — the flow ends at a request (#27)');
});
