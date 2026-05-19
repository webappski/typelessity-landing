import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { MarkdownComponent } from 'ngx-markdown';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService, type SeoLocale } from '../../core/seo/seo.service';
import { breadcrumbLd } from '../../core/seo/schemas';

export const LEGAL_DOCS = ['privacy', 'terms', 'dpa', 'security', 'sub-processors'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

interface LegalContent {
  title: string;
  body: string;
}

const LEGAL_TEXT: Record<LegalDoc, LegalContent> = {
  privacy: {
    title: 'Privacy Policy',
    body: `Effective date: 2025-01-01

Typelessity is operated by Alex Isa, founder of Typelessity ("we", "us"). This policy explains what data we collect when you use the typelessity.com website or the Typelessity widget embedded on a customer site, and how we handle it.

## Data we collect on this website

- **Page analytics** — anonymized via PostHog after cookie consent. Includes pages visited, referrer, approximate location (country level), and session duration. Used solely to improve content.
- **Contact form / Pilot signup** — email, company name, industry, monthly bookings volume. Stored in Supabase. Used to respond to your inquiry and onboard you.
- **Newsletter** — email only, double opt-in, unsubscribe in every message.

## Data the embedded widget processes

When the Typelessity widget runs on a third-party site, the data it processes is governed by that site's privacy policy and the Data Processing Agreement (see /legal/dpa) signed between Typelessity and the site operator. Typelessity does not use widget interactions to train any model.

## Your rights (GDPR)

You can request access, correction, deletion, or portability of your personal data by emailing info@webappski.com. We respond within 30 days.

## Retention

Website analytics: 12 months. Contact submissions: 24 months. Pilot accounts: until you request deletion.

<!-- TODO(content): legal review before production launch — Phase 9 -->
`,
  },
  terms: {
    title: 'Terms of Service',
    body: `Effective date: 2025-01-01

By accessing typelessity.com or using the Typelessity widget you agree to these Terms.

## Service

Typelessity provides an AI conversational booking widget under two plans: Pilot (free) and Enterprise (custom). Plan details at /pricing.

## Acceptable use

You may not (a) use the service to violate any law, (b) attempt to reverse-engineer the underlying models or extract training data, (c) probe or scan service infrastructure for vulnerabilities, or (d) use the service to send spam or phishing.

## Availability

We target 99.5% monthly availability for Pilot and 99.9% for Enterprise (per SLA). Planned maintenance is announced 7 days in advance via email.

## Termination

Either party may terminate the Pilot at any time. Enterprise contracts terminate per the signed agreement.

## Liability

To the maximum extent permitted by law, our aggregate liability is capped at fees paid in the 12 months preceding the claim. We are not liable for indirect or consequential damages.

## Governing law

Polish law. Disputes resolved in courts of Warsaw, Poland, except where mandatory consumer protection law applies.

<!-- TODO(content): legal review before production launch — Phase 9 -->
`,
  },
  dpa: {
    title: 'Data Processing Agreement',
    body: `Effective date: 2025-01-01

This Data Processing Agreement ("DPA") forms part of the Terms between Typelessity ("Processor") and the customer ("Controller") whenever Typelessity processes personal data on behalf of the customer.

## Subject matter

Processing of personal data submitted to the Typelessity widget by end-users of the customer's website.

## Nature & purpose

Field extraction from natural-language input, real-time validation, optional enrichment via customer-defined APIs, submission of structured booking data to the customer's endpoint.

## Categories of data subjects

End-users of customer's website who interact with the Typelessity widget.

## Categories of personal data

Names, contact information (email, phone), service-specific fields (e.g. medical specialty, vehicle type, dietary requirements), free-text input, optional voice transcription.

## Sub-processors

See /legal/sub-processors. Customer is notified 30 days before any sub-processor change.

## Security measures

TLS 1.2+ in transit. AES-256 at rest. EU data residency available. Access via SSO and 2FA. Audit logs retained 12 months. Annual penetration test.

## Data subject rights

Processor assists Controller in responding to access, rectification, erasure, and portability requests within 5 business days.

## Data breach

Processor notifies Controller within 24 hours of becoming aware of a personal data breach.

## Term

Effective for the duration of the Service. On termination, Processor deletes Controller data within 30 days unless legally required to retain.

<!-- TODO(content): legal review before production launch — Phase 9 -->
`,
  },
  security: {
    title: 'Security',
    body: `## Infrastructure

Typelessity runs on Vercel (edge functions, prerendered static assets) and OpenAI (gpt-4.1-nano + Whisper). Database: Supabase (Postgres + Row Level Security). EU region for European customers.

## Encryption

- TLS 1.2+ for all in-transit traffic.
- AES-256 at rest for Supabase storage.
- Strict CSP, HSTS, X-Frame-Options DENY on all pages.

## Access control

- SSO + 2FA required for all employees.
- Least-privilege role model. Production access logged and reviewed monthly.
- Customer data access requires explicit ticket and is fully audited.

## Backups

- Daily automated Postgres snapshots, 30-day retention.
- Point-in-time recovery to any minute within retention window.

## Vulnerability management

- Annual third-party penetration test.
- Dependency scanning on every CI run.
- Responsible disclosure: security@typelessity.com (PGP key on request).

## Compliance

GDPR-aligned data flows. SOC 2 Type II — in progress, target 2026 Q4.

<!-- TODO(content): legal review before production launch — Phase 9 -->
`,
  },
  'sub-processors': {
    title: 'Sub-processors',
    body: `Last updated: 2025-01-01

Typelessity uses the following sub-processors to deliver the service. We notify customers 30 days before any change.

| Sub-processor | Purpose | Region |
|---|---|---|
| OpenAI | LLM (gpt-4.1-nano), Whisper STT | US (with EU API option for Enterprise) |
| Vercel | Hosting, edge functions, prerendered static | Global edge, EU region available |
| Supabase | Postgres database + auth | EU (Frankfurt) |
| Resend | Transactional email | EU |
| PostHog | Product analytics (after cookie consent only) | EU |
| Cal.com | Demo booking scheduling | EU |
| Google Maps Platform | Optional: location enrichment | Global |

## How to subscribe to changes

Email subprocessors@typelessity.com to be added to the change-notification list.

<!-- TODO(content): legal review before production launch — Phase 9 -->
`,
  },
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MarkdownComponent],
  styleUrl: './legal-page.component.scss',
  template: `
    @let lang = t.lang();
    @let c = content();
    <article class="legal vc-wrap">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>Legal</div>
      <h1>{{ c.title }}</h1>
      <div class="legal__body">
        <markdown [data]="c.body" />
      </div>
      <nav class="legal__nav">
        @for (d of docs; track d) {
          <a [routerLink]="'/' + lang + '/legal/' + d" [class.active]="d === doc()">{{ titleOf(d) }}</a>
        }
      </nav>
    </article>
  `,
})
export class LegalPageComponent {
  protected readonly t = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);

  protected readonly docs = LEGAL_DOCS;
  protected readonly doc = toSignal(
    this.route.paramMap.pipe(map((p) => (LEGAL_DOCS as readonly string[]).includes(p.get('doc') ?? '')
      ? (p.get('doc') as LegalDoc)
      : 'privacy' as LegalDoc)),
    { initialValue: 'privacy' as LegalDoc },
  );

  protected readonly content = computed(() => LEGAL_TEXT[this.doc()]);

  constructor() {
    effect(() => {
      const d = this.doc();
      const c = LEGAL_TEXT[d];
      const locale = this.t.lang() as SeoLocale;
      this.seo.apply({
        title: `${c.title} — Legal`,
        description: c.body.split('\n\n')[0].replace(/[*#]/g, '').slice(0, 200),
        path: `/legal/${d}`,
        locale,
      });
      this.jsonLd.set('breadcrumb', breadcrumbLd(locale, [
        { name: 'Home', path: '/' },
        { name: 'Legal', path: `/legal/${d}` },
        { name: c.title, path: `/legal/${d}` },
      ]));
    });
  }

  protected titleOf(d: LegalDoc): string {
    return LEGAL_TEXT[d].title;
  }
}
