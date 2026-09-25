import { test, expect, type Page } from '@playwright/test';

// A36 (2026-09-25): the waitlist form told every visitor to «check your connection», even when the
// server had answered and a retry would fail the same way — the request was lost. A server refusal
// now points to an email with the request already in it; only a request that got no answer at all
// talks about the connection. /api/contact is stubbed; the page is the real SSR build.

async function fillAndSubmit(page: Page) {
  await page.goto('/pricing');
  await page.fill('#cf-email', 'owner@clinic.example');
  await page.fill('#cf-website', 'https://clinic.example');
  await page.selectOption('#cf-plan', 'pro');
  await page.selectOption('#cf-industry', 'hospitality');
  await page.fill('#cf-message', 'Two locations, about 300 bookings a month.');
  await page.check('input[name=consent]');
  await page.click('.cf button[type=submit]');
}

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
  expect(params.get('subject')).toBe('Typelessity waitlist — pro');
  const body = params.get('body') ?? '';
  for (const value of ['owner@clinic.example', 'https://clinic.example', 'pro', 'hospitality', 'Two locations, about 300 bookings a month.']) {
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
