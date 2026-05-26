import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { MarkdownComponent } from 'ngx-markdown';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { breadcrumbLd } from '../../core/seo/schemas';


// privacy/terms/dpa/sub-processors are 308-redirected to webappski.com at SSR layer (see app.routes.server.ts).
// This component only renders /legal/security at runtime.
export const LEGAL_DOCS = ['security'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

interface LegalContent {
  title: string;
  body: string;
}

const LEGAL_TEXT: Record<LegalDoc, LegalContent> = {
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

GDPR-aligned data flows.

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
    @let c = content();
    <article class="legal vc-wrap">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>Legal</div>
      <h1>{{ c.title }}</h1>
      <div class="legal__body">
        <markdown [data]="c.body" />
      </div>
      <nav class="legal__nav">
        @for (d of docs; track d) {
          <a [routerLink]="'/legal/' + d" [class.active]="d === doc()">{{ titleOf(d) }}</a>
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
      : 'security' as LegalDoc)),
    { initialValue: 'security' as LegalDoc },
  );

  protected readonly content = computed(() => LEGAL_TEXT[this.doc()]);

  constructor() {
    effect(() => {
      const d = this.doc();
      const c = LEGAL_TEXT[d];
      this.seo.apply({
        title: `${c.title} — Legal`,
        description: c.body.split('\n\n')[0].replace(/[*#]/g, '').slice(0, 200),
        path: `/legal/${d}`,
      });
      this.jsonLd.set('breadcrumb', breadcrumbLd([
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
