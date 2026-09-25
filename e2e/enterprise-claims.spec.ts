import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// A45 (founder 2026-09-25): typelessity.com sold Enterprise features that neither the code nor
// the contracts back — a 99.9% SLA (terms §2.3 and the DPA say there is none), on-premise and
// self-hosted deployment (no such build exists), an EU data-residency tier (hosting is in the EU
// for every plan, while OpenAI and Resend process in the US), a custom AI provider (the API calls
// OpenAI only), a dedicated manager and a volume discount (nowhere in code or contract). This reads
// what visitors and AI crawlers receive — the prerendered pages, their JSON-LD and the llms files —
// and fails if any of it comes back, and if the truthful line that replaced it is missing.
//
// Run `npm run build` first (it prerenders dist/).

const DIST = new URL('../dist/typelessity-landing/browser/', import.meta.url);

const BANNED: readonly RegExp[] = [
  /99\.9/, /SLA guarantee/i, /on-premise (deployment )?(is )?available/i, /on-premise option/i,
  /self-hosted deployment/i, /EU data residency/i, /data_residency/i, /EU residency tier/i,
  /dedicated (account|success) manager/i, /swapped between OpenAI/i, /Custom AI provider \(Azure/i,
  /volume discount/i, /planned for a future Enterprise/i,
];

// Pages and AI files name the models the engine calls (constants.ts AI.DEFAULT_MODEL, transcribe
// route) and quote no latency or accuracy we have not measured. Blog articles are A45b.
const MODEL_BANNED: readonly RegExp[] = [
  /gpt-4\.1-nano/i, /openai-whisper|OpenAI Whisper|via Whisper|Whisper-based|Whisper, inbound/i,
  /200.800 ?ms/, /p95_latency/, />95%/,
];
const MODEL_CHECKED = new Set(['index.html', 'pricing/index.html', 'faq/index.html', 'for-ai-agents/index.html',
  'how-it-works/index.html', 'llms.txt', 'llms-full.txt']);

// Each surface must still say the truth that replaced the promise — so a wrong path or an empty
// page cannot pass the bans by accident.
const TRUTH: Readonly<Record<string, readonly RegExp[]>> = {
  'index.html': [/6,000 submissions\/month and unlimited sites; a named contact/],
  'pricing/index.html': [/Unlimited sites/, /there is no on-premise or self-hosted build/, /By contract, on request/, /Uptime commitment \(SLA\)<\/td><td[^>]*>None<\/td>/],
  'faq/index.html': [/no on-premise or self-hosted build/],
  'for-ai-agents/index.html': [/hosting_region/, /hosted only, no on-premise build/, /currently gpt-5\.4-mini/, /gpt-4o-mini-transcribe/],
  'llms.txt': [/hosted only, no on-premise build/],
  'llms-full.txt': [/no on-premise or self-hosted build/, /ai_processing_region: US/, /gpt-4o-mini-transcribe/],
  'how-it-works/index.html': [/Single call</],
  'blog/gdpr-compliance/index.html': [/no on-premise or self-hosted build/, /does not allow special-category data/],
  'blog/pricing-ai-products/index.html': [/There is no on-premise or sovereign deployment/],
  'blog/best-ai-booking-widgets-2026/index.html': [/EU hosting and database; OpenAI in the US under SCCs/],
  'blog/best-ai-booking-transfer-services-2026/index.html': [/service and database in the EU; OpenAI processes in the US under SCCs/],
  'blog/whisper-vs-webspeech/index.html': [/there is no on-premise or self-hosted build/],
};

async function read(path: string): Promise<string> {
  try {
    return await readFile(new URL(path, DIST), 'utf8');
  } catch {
    throw new Error(`dist/${path} missing — run \`npm run build\` before this check.`);
  }
}

for (const [path, truths] of Object.entries(TRUTH)) {
  test(`${path}: no Enterprise promise without code or contract, and the truth in its place`, async () => {
    const body = await read(path);
    for (const re of BANNED) assert.doesNotMatch(body, re, `${path} still says ${re}`);
    if (MODEL_CHECKED.has(path)) {
      for (const re of MODEL_BANNED) assert.doesNotMatch(body, re, `${path} still says ${re}`);
    }
    for (const re of truths) assert.match(body, re, `${path} lost the line ${re}`);
  });
}
