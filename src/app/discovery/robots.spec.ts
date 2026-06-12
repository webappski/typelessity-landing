import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// robots.txt is served verbatim from public/ (Angular ships public/**/* as assets) and is
// what AI crawlers read to learn which user-agents are welcomed. The explicit AI-crawler
// allow-list must track current engine names and must NOT carry deprecated user-agent names
// (per /seo skill: anthropic-ai and Claude-Web are deprecated). This guard pins the current
// crawler names and fails if a deprecated name reappears — same derive-from-the-shipped-file
// principle as the neighbouring llms-pricing drift guard.

const robots = readFileSync(new URL('../../../public/robots.txt', import.meta.url), 'utf8');

// Current AI-search crawler user-agents that must be explicitly welcomed.
const CURRENT_AI_CRAWLERS = [
  'Claude-SearchBot',
  'Claude-User',
  'Perplexity-User',
];

// Deprecated user-agent names that must never reappear in the allow-list.
const DEPRECATED_AI_CRAWLERS = [
  'anthropic-ai',
  'Claude-Web',
];

test('robots.txt explicitly allows every current AI-search crawler', () => {
  for (const ua of CURRENT_AI_CRAWLERS) {
    assert.ok(
      new RegExp(`^User-agent:\\s*${ua}\\s*$`, 'm').test(robots),
      `robots.txt is missing a "User-agent: ${ua}" block`,
    );
  }
});

test('robots.txt carries no deprecated AI-crawler user-agent names', () => {
  for (const ua of DEPRECATED_AI_CRAWLERS) {
    assert.ok(
      !robots.includes(ua),
      `robots.txt still lists deprecated user-agent "${ua}"`,
    );
  }
});
