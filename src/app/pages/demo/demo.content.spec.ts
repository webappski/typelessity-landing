import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEMO_BUTTON, DEMO_CARDS, MEDBOOK_NOTE, demoButton, demoCopy, demoHost } from './demo.content';

// TY-DEMO (25.10), TYL-DEMO-LIVE (28.10). The cards of /demo are scenarios with the picture of their demo site on top; the button to the site
// stands on every card (founder 28.10: «the full layout must be there already»), no flag switches it. The page as built is held by
// e2e/demo-page-dist.spec.ts, the behaviour of a person by e2e/browser/demo-cards.pw.ts.

test('DEMO_CARDS: the four demos in the order of the mock, one address each', () => {
  assert.deepEqual(DEMO_CARDS.map((c) => c.id), ['glow', 'autopro', 'transedge', 'medbook']);
  assert.deepEqual(DEMO_CARDS.map((c) => new URL(c.liveUrl).hostname), [
    'glow-studio-demo.netlify.app', 'autopro-service-demo.netlify.app', 'transedge-freight.netlify.app', 'medbook-vue.netlify.app',
  ]);
  assert.deepEqual(DEMO_CARDS.map(demoHost), [
    'glow-studio-demo.netlify.app', 'autopro-service-demo.netlify.app', 'transedge-freight.netlify.app', 'medbook-vue.netlify.app',
  ]);
});

test('demoButton: every card gets the address of its site with the utm of the page, and a label that names the brand and the new tab', () => {
  for (const card of DEMO_CARDS) {
    const button = demoButton(card);
    const url = new URL(button.href);
    assert.equal(url.origin, new URL(card.liveUrl).origin);
    assert.deepEqual([...url.searchParams], [['utm_source', 'typelessity.com'], ['utm_medium', 'demo-page'], ['utm_content', card.id]]);
    assert.equal(button.label, 'Open the demo site');
    assert.equal(button.label, DEMO_BUTTON);
    assert.equal(button.srLabel, `${card.name} (opens in a new tab)`);
  }
});

test('the template links each card to its site twice — the picture and the button — in a new tab with rel=noopener, and only the button is in the tab order', () => {
  const html = readFileSync(new URL('./demo-page.component.html', import.meta.url), 'utf8');
  const anchors = [...html.matchAll(/<a\b[^>]*\[href\]="b\.href"[^>]*>/g)].map((m) => m[0]);
  assert.equal(anchors.length, 2, 'the demo-site link is printed twice per card: the picture and the button');
  for (const a of anchors) {
    assert.match(a, /target="_blank"/);
    assert.match(a, /rel="noopener"/);
  }
  const [shot, button] = anchors as [string, string];
  assert.match(shot, /class="card__shot"/, 'the first link is the picture');
  assert.match(shot, /tabindex="-1"/, 'a picture in the tab order would be a second stop on one address');
  assert.match(shot, /aria-hidden="true"/, 'a screen reader would read one address twice');
  assert.doesNotMatch(button, /tabindex|aria-hidden/, 'the button is the link a keyboard and a screen reader meet');
  assert.doesNotMatch(html, /@if \(button\(card\)/, 'the button must not wait for a flag');
  assert.doesNotMatch(html, /netlify\.app/, 'a literal demo address in the template');
  assert.doesNotMatch(html, /class="jump"|demo-sites/, 'the link «Try it on a demo website» of the hero and the separate block of sites are not part of the layout');
});

test('demoCopy: one set of words, the scenario words, whatever a card says — nothing in the header of the page sends the reader to a site before the cards do', () => {
  const copy = demoCopy();
  assert.equal(copy.eyebrow, 'Demo scenarios');
  assert.equal(copy.h1, 'See how a booking goes in the chat.');
  assert.doesNotMatch([copy.eyebrow, copy.h1, copy.h1Accent, copy.lead].join(' '), /\bLive\b|\bTry it\b|\bOpen\b|on their sites/i);
  assert.equal(copy.fine, 'Each site opens in a new tab. The businesses are made up, so use made-up details.');
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
  const words = [
    ...DEMO_CARDS.flatMap((c) => [c.kind, c.name, c.says, c.asks, ...(c.picks ?? []), c.requestTitle, ...c.request.flat(), ...(c.note ? Object.values(c.note) : [])]),
    demoCopy().fine, DEMO_BUTTON,
  ].join('\n');
  assert.doesNotMatch(words, /for clinics|\b(in|under|within) \d+ minutes\b|unlimited|prototype|HIPAA|GDPR-compliant/i);
  assert.doesNotMatch(words, /allerg|dietary|Botox|prenatal|trimester|cardiolog|dentist|dental/i);
  assert.doesNotMatch(words, /Anna K|GET \/stylists|confirmed/i, 'the script of the home page, or a booking that is confirmed — the flow ends at a request (#27)');
});
