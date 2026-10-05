import { test, expect, type Page } from '@playwright/test';
import { ALL_INDUSTRIES } from '../../src/app/lib/industries';

// A36 (2026-09-25): the question form told every visitor to «check your connection», even when the
// server had answered and a retry would fail the same way — the request was lost. A server refusal
// now points to an email with the request already in it; only a request that got no answer at all
// talks about the connection. /api/contact is stubbed; the page is the real SSR build.

// The industry the tests pick is one the site has a page for — the select is built from those pages.
const INDUSTRY = ALL_INDUSTRIES[0];

async function fillAndSubmit(page: Page) {
  await page.goto('/pricing');
  await page.fill('#cf-email', 'owner@clinic.example');
  await page.fill('#cf-website', 'https://clinic.example');
  await page.selectOption('#cf-plan', 'pro');
  await page.selectOption('#cf-industry', INDUSTRY.slug);
  await page.fill('#cf-message', 'Two locations, about 300 bookings a month.');
  await page.check('input[name=consent]');
  await page.click('.cf button[type=submit]');
}

// c8 2026-10-03 (legal + CRO verdicts on the landing release): the consent box was decorative — an
// unticked form was sent — and the plan select forced a visitor with a question to claim a paid plan.
// The box now blocks the send, the endpoint refuses a body without it, and a plan is optional.
test('the send button stays off and nothing is posted until the consent box is ticked', async ({ page }) => {
  const posts: unknown[] = [];
  await page.route('**/api/contact', async (route) => {
    posts.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/pricing');
  await page.fill('#cf-email', 'owner@clinic.example');
  const send = page.locator('.cf button[type=submit]');
  await expect(page.locator('input[name=consent]')).not.toBeChecked();
  await expect(send).toBeDisabled();
  // Neither a forced click nor Enter in a field can send a form whose consent box is empty.
  await send.click({ force: true });
  await page.press('#cf-email', 'Enter');
  await page.waitForTimeout(300);
  expect(posts, 'a request left without the consent box ticked').toHaveLength(0);

  await page.check('input[name=consent]');
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.locator('.cf__success')).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0]).toMatchObject({ email: 'owner@clinic.example', consent: true, plan: '', type: 'waitlist_request' });

});

test('a visitor with only a question needs no plan, and unticking the box switches the button off again', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('#cf-plan')).not.toHaveAttribute('required', /.*/);
  await expect(page.locator('label[for=cf-plan]')).not.toContainText('*');
  await page.fill('#cf-email', 'owner@clinic.example');
  await page.check('input[name=consent]');
  await expect(page.locator('.cf button[type=submit]')).toBeEnabled();
  await page.uncheck('input[name=consent]');
  await expect(page.locator('.cf button[type=submit]')).toBeDisabled();
});

test('the privacy notice is on the form and says who, why, on what basis, to whom, how long and which rights', async ({ page }) => {
  await page.goto('/pricing');
  const notice = page.locator('#cf-notice');
  await expect(notice).toBeVisible();
  for (const part of [/Controller/, /info@webappski\.com/, /Art\. 6\(1\)\(a\)/, /Resend/, /Standard Contractual Clauses/, /Cloudflare and Google/, /A copy of the safeguards is available from info@webappski\.com/, /does not affect processing before the withdrawal/, /30 days/, /erasure/, /UODO/, /voluntary/]) {
    await expect(notice).toContainText(part);
  }
  await expect(notice.locator('a[href="https://resend.com/legal/dpa"]')).toHaveCount(1);
  await expect(notice.locator('a[href*="dpa-typelessity"]'), 'the notice does not send the visitor to the processor agreement').toHaveCount(0);
  await expect(page.locator('.cf')).not.toContainText(/waitlist/i);
  await expect(page.locator('.cf a[href*="product-privacy"]')).toHaveCount(0);
});

test('a server refusal offers an email with the request already in it', async ({ page }) => {
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"error":"not configured"}' }),
  );
  await fillAndSubmit(page);

  const error = page.locator('.cf__msg--err');
  await expect(error).toContainText('Please email us at info@webappski.com');
  await expect(error).not.toContainText(/connection/i);

  const href = await error.getByRole('link', { name: 'info@webappski.com' }).getAttribute('href');
  expect(href).toMatch(/^mailto:info@webappski\.com\?/);
  const params = new URLSearchParams(href!.slice(href!.indexOf('?') + 1));
  expect(params.get('subject')).toBe('Typelessity question — pro');
  const body = params.get('body') ?? '';
  for (const value of ['owner@clinic.example', 'https://clinic.example', 'pro', INDUSTRY.slug, 'Two locations, about 300 bookings a month.']) {
    expect(body).toContain(value);
  }
});

test('a request that gets no answer asks to check the connection', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.abort('internetdisconnected'));
  await fillAndSubmit(page);

  const error = page.locator('.cf__msg--err');
  await expect(error).toContainText('check your connection');
  await expect(error.getByRole('link')).toHaveCount(0);
});

// CRO r2 (2026-10-04, R2-N1): the form still offered Hospitality / Transfers / Freight, a list from the waitlist era, while
// the site has 36 industry pages and no Transfers or Freight among them. The select is built from the pages.
test('the industry select offers every industry page of the site, grouped as /industries groups them, plus «Other» — nothing else', async ({ page }) => {
  await page.goto('/pricing');
  const options = await page.locator('#cf-industry option').evaluateAll((nodes) =>
    nodes.map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? '').trim() })),
  );
  const real = options.filter((o) => o.value && o.value !== 'other');
  expect(real.map((o) => o.value).sort()).toEqual(ALL_INDUSTRIES.map((i) => i.slug).sort());
  for (const o of real) expect(o.label).toBe(ALL_INDUSTRIES.find((i) => i.slug === o.value)!.name);
  expect(options.filter((o) => o.value === 'other')).toHaveLength(1);
  expect(options.map((o) => o.label).join(' | ')).not.toMatch(/Transfers|Freight|Hospitality & Restaurants/);
  const groups = await page.locator('#cf-industry optgroup').evaluateAll((nodes) => nodes.map((n) => (n as HTMLOptGroupElement).label));
  expect(groups.length).toBeGreaterThan(1);
  expect(new Set(groups).size).toBe(groups.length);
});
