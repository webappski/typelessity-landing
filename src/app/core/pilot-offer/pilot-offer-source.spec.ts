import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectPilotSource, SOURCE_A } from './pilot-offer-source';

// L17 D4 (class «logic»: the definition of the source). Ported from typelessform/e2e/free-pilot-offer.spec.ts (the cases of «Source detection»), with ONE
// difference decided by the founder on 22.10: there is no state g — a visitor from Google search sees a, like everyone else. The cases are written out here
// (the whitelist is the code under test; a case read from it would agree with it).

const A = SOURCE_A;
const b = (name: 'ChatGPT' | 'Claude' | 'Gemini' | 'Perplexity') => ({ state: 'b', name });

test('a Google search referrer is a — Typelessity has no measurement behind «Gemini named us too» (founder 22.10)', () => {
  for (const referrer of ['https://www.google.com/', 'https://www.google.de/', 'https://google.co.uk/', 'https://www.google.com/search?q=ai+booking+widget']) {
    assert.deepEqual(detectPilotSource(null, referrer), A, referrer);
  }
});

test('an AI assistant referrer is b with its name; gemini.google.com is the assistant, not the search', () => {
  const cases: [string, ReturnType<typeof b>][] = [
    ['https://chatgpt.com/', b('ChatGPT')], ['https://chat.openai.com/', b('ChatGPT')], ['https://claude.ai/', b('Claude')],
    ['https://gemini.google.com/app', b('Gemini')], ['https://www.perplexity.ai/', b('Perplexity')], ['https://perplexity.ai/', b('Perplexity')],
    ['https://chatgpt.com/c/abc?x=1', b('ChatGPT')], ['http://claude.ai/new', b('Claude')],
  ];
  for (const [referrer, want] of cases) assert.deepEqual(detectPilotSource(null, referrer), want, referrer);
});

test('utm_source=chatgpt.com, perplexity and perplexity.ai name the assistant with no referrer; the case and the spaces do not matter', () => {
  assert.deepEqual(detectPilotSource('chatgpt.com', ''), b('ChatGPT'));
  assert.deepEqual(detectPilotSource('ChatGPT.com', ''), b('ChatGPT'));
  assert.deepEqual(detectPilotSource(' chatgpt.com ', ''), b('ChatGPT'));
  assert.deepEqual(detectPilotSource('perplexity', ''), b('Perplexity'));
  assert.deepEqual(detectPilotSource('perplexity.ai', ''), b('Perplexity'));
});

test('a whitelisted utm_source beats every referrer; a foreign utm_source overrides nothing', () => {
  assert.deepEqual(detectPilotSource('chatgpt.com', 'https://www.google.com/'), b('ChatGPT'));
  assert.deepEqual(detectPilotSource('perplexity', 'https://chatgpt.com/'), b('Perplexity'));
  assert.deepEqual(detectPilotSource('newsletter', 'https://www.google.com/'), A);
  assert.deepEqual(detectPilotSource('newsletter', 'https://claude.ai/'), b('Claude'));
});

test('utm_source is the visitor\'s: names that exist on every object are not whitelist entries (constructor, __proto__, toString … in any spelling)', () => {
  for (const utm of ['constructor', '__proto__', 'toString', 'valueOf', 'hasOwnProperty', 'Constructor', '__PROTO__', ' constructor ', 'isPrototypeOf']) {
    assert.deepEqual(detectPilotSource(utm, ''), A, utm);
    assert.deepEqual(detectPilotSource(utm, 'https://www.google.com/'), A, `${utm} + Google`);
  }
  // the URL parser decodes %20 before the string gets here; the trim still has to hold for the padded forms
  assert.deepEqual(detectPilotSource(decodeURIComponent('%20constructor%20'), ''), A);
});

test('look-alike hosts, other sites, an empty or application referrer are a', () => {
  for (const referrer of [
    'https://chatgpt.com.evil.example/', 'https://notclaude.ai/', 'https://evilchatgpt.com/', 'https://myperplexity.ai/', 'https://notgoogle.com/',
    'https://google.com.evil.example/', 'https://mail.google.com/', 'https://news.google.com/', 'https://accounts.google.com/', 'https://www.bing.com/',
    'https://duckduckgo.com/', 'https://github.com/', 'https://www.npmjs.com/package/typelessity-widget', '', 'not a url',
    'android-app://com.google.android.googlequicksearchbox/', 'android-app://www.google.com/', 'android-app://com.openai.chatgpt/', 'about:blank', 'file:///chatgpt.com',
  ]) {
    assert.deepEqual(detectPilotSource(null, referrer), A, referrer || '(empty)');
  }
  assert.deepEqual(detectPilotSource(null, ''), A);
  assert.deepEqual(detectPilotSource('', ''), A);
});

test('a subdomain of an assistant host is that assistant (the match is "the host or a subdomain of it")', () => {
  assert.deepEqual(detectPilotSource(null, 'https://www.chatgpt.com/'), b('ChatGPT'));
  assert.deepEqual(detectPilotSource(null, 'https://beta.claude.ai/'), b('Claude'));
});

test('the source is not a chosen state of g: the module has no google state at all', () => {
  const states = new Set(['https://www.google.com/', 'https://chatgpt.com/', 'https://x.example/'].map((r) => detectPilotSource(null, r).state));
  assert.deepEqual([...states].sort(), ['a', 'b']);
});
