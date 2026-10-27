// The words of /install (L5). The facts under them are read from the code of the other side by e2e/install-facts.spec.ts:
// the headers, the retries and the HTTPS rule from the product, the policy lines from the portal that hands out the Install step.
// TY-INSTALL (founder 26.10): the config of the site comes first, the code after it. The code is the same for every site; the widget finds
// the config by the address of the page, and with no config for that address the API answers 404 (e2e/install-config-first.spec.ts reads it).

export const INSTALL = {
  kicker: 'Install',
  h1: 'Add Typelessity to your website',
  // seo-lead §2.3 opened with «paste two lines of HTML»; founder 26.10 moved the config in front of the code.
  capsule:
    'Start with your site’s config in the Webappski portal: set it up yourself in simple steps, or we set it up with you for free. Then paste the code from the portal’s Install step, and receive booking requests by email or straight into your booking system. You need access to your site’s HTML, an address that should receive the requests, and your site must use HTTPS.',

  configFirst: {
    h2: 'First: your site’s config (required)',
    lead: 'The widget works on your site only after your site’s config is set up and published in the Webappski portal. Two ways to get there:',
    self: {
      h3: 'Yourself, in simple steps',
      b: 'Create a free account in the Webappski portal, choose Typelessity and go through the setup steps; the last step, Install, gives you the code.',
      cta: 'Get it free',
    },
    withUs: {
      h3: 'With us, for free',
      b: 'Write what your site is and how bookings work today. We set up the config with you for free: we reply by email and arrange a call.',
      cta: 'Write to us',
    },
  },

  requirements: {
    h2: 'What you need',
    items: [
      'Your site’s config in the Webappski portal: a free account, set up by you or with us.',
      'Access to the HTML of your website, to paste the code from the Install step into a page.',
      'Where the requests should go: an email address, or the address of your own endpoint (REST).',
      'A website on HTTPS. Browsers allow the microphone only on a secure page, so on plain HTTP the voice input does not work.',
    ],
  },

  stepsH2: 'Three steps',
  steps: [
    {
      h: 'Account and site config — required',
      link: 'Create a free account in the Webappski portal',
      b: 'Then go step by step: Your business → Questions → Data & delivery → Messages → Review → Install. Or let your own AI write it: copy our instructions into ChatGPT or Claude with your API docs and paste the answer back.',
    },
    {
      h: 'Paste the code from the Install step',
      b: 'The Install step shows the exact code for your platform. Before you publish, you can try the widget as a customer.',
    },
    {
      h: 'Receive the requests',
      b: 'Each request arrives by email, or as JSON at your own endpoint (REST), shaped by the field mapping in your config.',
    },
  ] as readonly { h: string; b: string; link?: string }[],

  code: {
    h2: 'The code',
    note: 'Example. The Install step in your portal shows this code for your platform. It works on your site only after your site’s config is published there: the widget finds the config by your site’s address.',
  },

  where: {
    h2: 'Where the requests go',
    email: {
      h3: 'By email',
      b: [
        'The email goes to the address you set. The subject is “New lead from <your business name>”, and the body has one line per detail: the field’s key and its value, for example date: 2026-10-20.',
        'The request is saved before it is sent. If the email cannot be sent, it is retried once a day, up to 5 attempts.',
      ],
    },
    rest: {
      h3: 'To your endpoint (REST)',
      b: [
        'The booking details go to your address as JSON: POST, or PUT if you set it. Only HTTPS addresses are used, and private network addresses are blocked.',
        'Every request carries the headers you set, plus Content-Type, X-Idempotency-Key and X-Request-ID. The X-Idempotency-Key is the same on every retry of one request, so your system can tell a repeat from a new booking.',
        'A 502, 503 or 504 answer, or a network error, is retried 3 times by default, with exponential backoff.',
        'An example body; the shape follows your field mapping:',
      ],
      example: `{ "service": "Balayage + haircut",
  "hair_length": "Long",
  "date": "2026-10-20",
  "time_window": "Morning",
  "stylist": "Anna K. · Colour · Tue 09:30",
  "name": "Kasia",
  "phone": "+48 500 100 200" }`,
    },
  },

  sees: {
    h2: 'What your customer sees',
    b: 'If your system accepted the request, the customer sees a confirmation with the ID your system returned. If it went by email, the customer sees “Request Received” and that you will contact them to confirm.',
  },

  csp: {
    h2: 'If your site sets a Content-Security-Policy',
    b: 'Allow these in the policy of your site. The addresses are the ones shown in the Install step.',
    permissions: 'And this header, so the browser lets the widget use the microphone:',
    permissionsValue: 'Permissions-Policy: microphone=(self)',
    why: 'Without img-src data: the consent checkmarks do not show.',
    fonts: 'Until the next widget release the widget requests Google Fonts unless your Content-Security-Policy blocks it; the CSP above blocks it.',
  },

  form: {
    kicker: 'Questions',
    h2: 'Questions before you start?',
    sub: 'Tell us what your site is and how bookings work today. We set up your config with you for free: we reply by email and arrange a call.',
  },

  cta: { title: 'Try it free on your website', primary: 'Get it free', secondary: 'See how it works' },
} as const;
