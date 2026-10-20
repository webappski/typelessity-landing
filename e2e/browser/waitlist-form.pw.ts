import { test, expect, type Page } from './fixtures';
import { PRE_L11_SELECT_VALUES } from '../retired-industries';
import { BUSINESS_TYPES, EMAIL_PATTERN, INDUSTRY_VALUES } from '../../src/app/shared/contact-form/waitlist-request';
import { CONTRAST_ENGINE } from './contrast-engine';

// A36 (2026-09-25): the question form told every visitor to «check your connection», even when the
// server had answered and a retry would fail the same way — the request was lost. A server refusal
// now points to an email with the request already in it; only a request that got no answer at all
// talks about the connection. /api/contact is stubbed; the page is the real SSR build.

// The industry the tests pick is one the select offers (L11: the list lives in waitlist-request.ts; the site has no industry pages).
const INDUSTRY = { slug: BUSINESS_TYPES[0].value };

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

// R2-W2 (code-review r2, 2026-10-05): the email field had `required` and nothing else, so «abc» plus the box enabled Send, the
// server answered 400 and the visitor read «We couldn't send your request». The field now says what is wrong, where it is.
test('an email that is not an address is stopped at the field: the reason shows, nothing is posted, a fixed address sends', async ({ page }) => {
  const posts: unknown[] = [];
  await page.route('**/api/contact', async (route) => {
    posts.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/pricing');
  const email = page.locator('#cf-email');
  const error = page.locator('#cf-email-error');
  const send = page.locator('.cf button[type=submit]');
  await expect(error, 'no error before the visitor has touched the field').toHaveCount(0);

  // Enter in the field is an attempt to send: with the address wrong the button is off, nothing leaves, and the reason shows at once.
  await email.fill('abc');
  await page.press('#cf-email', 'Enter');
  await expect(error).toBeVisible();
  expect(posts, 'Enter in the field sent «abc»').toHaveLength(0);

  // The input carries the endpoint's own rule, and the white space the endpoint refuses is refused at the field too (W-1): a tab, a
  // no-break space and U+2028 inside an address once passed the form and came back as a 400.
  await expect(email).toHaveAttribute('pattern', EMAIL_PATTERN);
  for (const wrong of ['abc', 'abc@def', 'a\tb@c.co', 'a\u00a0b@c.co', 'a@b.c\u2028d']) {
    await email.fill(wrong);
    await page.check('input[name=consent]'); // the focus leaves the field
    await expect(error).toBeVisible();
    // GOV.UK error message: the sentence says what the format is, and a screen reader hears «Error:» before it (a visually hidden span).
    await expect(error).toHaveText('Error: Enter an email address in the correct format, like name@example.com');
    const hidden = error.locator('.cf__visually-hidden');
    await expect(hidden).toHaveText('Error:');
    expect((await hidden.boundingBox())!.width, 'the «Error:» is hidden, not shown').toBeLessThanOrEqual(1);
    await expect(error).toHaveAttribute('role', 'alert');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    await expect(email).toHaveAttribute('aria-describedby', 'cf-email-error');
    await expect(send).toBeDisabled();
    await send.click({ force: true });
    await page.press('#cf-email', 'Enter');
    await page.waitForTimeout(200);
    expect(posts, `a request left with «${wrong}» as the address`).toHaveLength(0);
    await page.uncheck('input[name=consent]');
  }

  await email.fill('owner@clinic.example');
  await page.check('input[name=consent]');
  await expect(error, 'the error goes as soon as the address is right').toHaveCount(0);
  await expect(email).not.toHaveAttribute('aria-invalid', /.*/);
  await expect(email).not.toHaveAttribute('aria-describedby', /.*/);
  await expect(send).toBeEnabled();
  await send.click();
  await expect(page.locator('.cf__success')).toBeVisible();
  expect(posts).toHaveLength(1);
  expect(posts[0]).toMatchObject({ email: 'owner@clinic.example', consent: true });
});

// T-1 (code-review r2, 2026-10-05): C4 moved the notice links from --accent (4.48:1 on --bg-secondary) to --accent-hover (5.28:1) and
// nothing measured it. The links of the notice are measured as the browser paints them, against the surface of the notice.
// L3 (B4, F1, F2, F7): both themes, and the measure of contrast-engine.ts — the surface is composited layer by layer (so a
// semi-transparent notice is read as painted) and the link colour keeps its alpha. The old assertion that the surface is opaque
// is gone with the formula that needed it.
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test('every link in the privacy notice is 4.5:1 or better on the notice surface', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('/pricing', { waitUntil: 'networkidle' });
      const { seen, bad } = (await page.evaluate(`(${CONTRAST_ENGINE})(${JSON.stringify({ scope: '#cf-notice a' })})`)) as { seen: number; bad: string[] };
      expect(seen, 'the notice carries its links: info@, the adequacy decision, both DPAs').toBeGreaterThanOrEqual(4);
      expect(bad).toEqual([]);
    });
  });
}

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
  for (const part of [/Controller/, /info@webappski\.com/, /Art\. 6\(1\)\(a\)/, /Resend/, /Vercel/, /Cloudflare/, /Google/, /Standard Contractual Clauses/, /Data Privacy Framework/, /adequacy decision of 10 July 2023/, /A copy is available from info@webappski\.com/, /does not affect processing before the withdrawal/, /30 days/, /erasure/, /UODO/, /voluntary/]) {
    await expect(notice).toContainText(part);
  }
  await expect(notice.locator('a[href="https://resend.com/legal/dpa"]')).toHaveCount(1);
  await expect(notice.locator('a[href="https://www.cloudflare.com/cloudflare-customer-dpa/"]')).toHaveCount(1);
  await expect(notice.locator('a[href*="eu-us-data-transfers_en"]')).toHaveCount(1);
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

// CRO r2 (2026-10-04, R2-N1): the form still offered Hospitality / Transfers / Freight, a list from the waitlist era. L11 (2026-10-20): the site
// has no industry pages; the select is a flat list of business types kept in waitlist-request.ts, and the endpoint accepts exactly that list.
test('the industry select offers the business types of waitlist-request.ts plus «Other» and the empty choice — the values the endpoint accepts, flat, nothing from the waitlist era', async ({ page }) => {
  await page.goto('/pricing');
  const options = await page.locator('#cf-industry option').evaluateAll((nodes) =>
    nodes.map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? '').trim() })),
  );
  expect(options.map((o) => o.value).sort(), 'the select and the endpoint disagree about the values').toEqual([...INDUSTRY_VALUES].sort());
  const real = options.filter((o) => o.value && o.value !== 'other');
  expect(real, 'the order and the words of the business types').toEqual(BUSINESS_TYPES.map((t) => ({ value: t.value, label: t.label })));
  expect(options.filter((o) => o.value === 'other')).toHaveLength(1);
  expect(options.map((o) => o.label).join(' | ')).not.toMatch(/Transfers|Freight|Hospitality & Restaurants/);
  await expect(page.locator('#cf-industry optgroup'), 'the select is a flat list').toHaveCount(0);
});

// L11 (R67 п.3): a tab opened before the release holds the select of that day; each value of it is still on the select, can be chosen, and goes to
// the endpoint as the value (the endpoint takes it: contact-endpoint.spec.ts runs the real handler on the same frozen list).
test('every value the select had before L11 is still a choice, and the body posted carries it', async ({ page }) => {
  const posted: string[] = [];
  await page.route('**/api/contact', (route) => { posted.push(String(JSON.parse(route.request().postData() ?? '{}').industry)); return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  for (const value of PRE_L11_SELECT_VALUES) {
    await page.goto('/pricing');
    await page.fill('#cf-email', 'owner@clinic.example');
    await page.selectOption('#cf-industry', value);
    await page.check('input[name=consent]');
    await page.click('.cf button[type=submit]');
    await expect(page.locator('.cf__success')).toBeVisible();
  }
  expect(posted).toEqual(PRE_L11_SELECT_VALUES);
});
