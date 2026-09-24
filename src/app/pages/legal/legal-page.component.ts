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

The service runs on Vercel in the EU (Frankfurt, fra1). The database is Supabase Postgres in the EU (AWS eu-west-1, Ireland). OpenAI (conversation understanding and speech-to-text) and Resend (delivery of request emails) process in the United States under the 2021 Standard Contractual Clauses. The full list is Appendix B of the [Typelessity DPA](https://webappski.com/en/legal/dpa-typelessity).

## Encryption

- TLS on every connection the service receives and makes: browser to service, service to database, service to each sub-processor. A booking endpoint must be an https:// URL; plain http:// is refused.
- Database encryption at rest as provided by the database platform. Integration secrets you store carry a second, application-level AES-256-GCM encryption.
- API keys are stored only as hashes; the plaintext key is shown once, at creation.
- Strict CSP, HSTS, X-Frame-Options DENY on all pages of this site.

## Access control

- Configurations, conversations and results are isolated per organisation, and every request is authenticated per organisation.
- The administrative consoles of our providers are reachable only by the proprietor, each behind an individual account.

## Backups

- The service runs on the free tiers of its hosting and database providers. On those tiers there are no automatic backups and no point-in-time recovery; what exists is a database export taken by hand.
- Before the widget is first installed live on a customer's site, or before the first invoice — whichever comes first — both platforms move to plans with automatic daily backups.

## Vulnerability management

- Automated tests run on every change; changes that touch a security boundary carry tests verified to fail when the protection is removed.
- Security reports: info@webappski.com.

## Compliance

GDPR-aligned data flows. The limits above are stated in Appendix A of the Typelessity DPA.

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
