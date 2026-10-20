import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService, SITE_URL } from '../../core/seo/seo.service';
import { breadcrumbLd, orgRef } from '../../core/seo/schemas';
import { ALL_INDUSTRIES, getIndustryBySlug } from '../../lib/industries';
import { NotFoundComponent } from '../not-found/not-found.component';

@Component({
  selector: 'app-industry-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, JsonPipe, NotFoundComponent],
  styleUrl: './industry-detail-page.component.scss',
  template: `
    @let i = industry();

    @if (i) {
      <article class="industry vc-wrap">
        <header class="industry__hero">
          @if (i.hero.eyebrow) {
            <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ i.hero.eyebrow }}</div>
          }
          <h1>AI booking assistant for {{ i.audience }}</h1>
          @if (i.quote) {
            <p class="industry__quote">“{{ i.quote }}”</p>
          }
          <p class="industry__sub">{{ i.hero.subtitle }}</p>
          @if (i.hero.cta) {
            <div class="industry__cta">
              <a class="vc-btn vc-btn-primary vc-btn-lg" routerLink="/pricing" fragment="start-pilot">{{ i.hero.cta.primary }}</a>
              <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/about">{{ i.hero.cta.secondary }}</a>
            </div>
          }
        </header>

        @if (i.challenges?.length) {
          <section class="industry__section">
            <h2>What gets in the way</h2>
            <ul class="proof-list">
              @for (c of i.challenges; track c) {
                <li>{{ c }}</li>
              }
            </ul>
          </section>
        }

        @if (i.exampleConversations?.length) {
          <section class="industry__section">
            <h2>Example conversations</h2>
            <ul class="conv-list">
              @for (c of i.exampleConversations; track $index) {
                <li class="conv">
                  <div class="conv__bubble">
                    <span class="conv__lang">{{ c.lang }}</span>
                    <p>{{ c.user }}</p>
                  </div>
                  <pre class="conv__extracted">{{ c.extracted | json }}</pre>
                </li>
              }
            </ul>
          </section>
        }

        @if (i.fields.length) {
          <section class="industry__section">
            <h2>Fields collected</h2>
            <ul class="chip-list">
              @for (f of i.fields; track f) {
                <li class="chip">{{ f }}</li>
              }
            </ul>
          </section>
        }

        @if (i.enrichments?.length) {
          <section class="industry__section">
            <h2>Enrichments</h2>
            <ul class="chip-list">
              @for (e of i.enrichments; track e) {
                <li class="chip chip--magenta">{{ e }}</li>
              }
            </ul>
          </section>
        }

        @if (i.proofPoints.length) {
          <section class="industry__section">
            <h2>Why Typelessity fits</h2>
            <ul class="proof-list">
              @for (p of i.proofPoints; track p) {
                <li>{{ p }}</li>
              }
            </ul>
          </section>
        }

        @if (i.industryFAQ?.length) {
          <section class="industry__section">
            <h2>FAQ</h2>
            <div class="faq">
              @for (qa of i.industryFAQ; track qa.q) {
                <details>
                  <summary>{{ qa.q }}</summary>
                  <p>{{ qa.a }}</p>
                </details>
              }
            </div>
          </section>
        }

        <section class="industry__section">
          <h2>Read next</h2>
          <ul class="industry__links">
            <li><a [routerLink]="'/blog/' + i.article.slug">{{ i.article.title }}</a></li>
            <li><a routerLink="/how-it-works">How Typelessity works</a></li>
          </ul>
        </section>

        <section class="industry__section">
          <h2>Other industries</h2>
          <ul class="industry__links">
            @for (o of neighbours(); track o.slug) {
              <li><a [routerLink]="'/industries/' + o.slug">{{ o.name }}</a></li>
            }
          </ul>
        </section>

        <div class="industry__final">
          <a class="vc-btn vc-btn-primary vc-btn-lg" routerLink="/install">Add Typelessity to your website</a>
          <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/pricing">See pricing</a>
        </div>
      </article>
    } @else {
      <!-- A taken-down or mistyped address: the same screen a crawler gets with the 404 (the platform answers 410 or 404). -->
      <app-not-found />
    }
  `,
})
export class IndustryDetailPageComponent {
  protected readonly t = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly jsonLd = inject(JsonLdService);
  private readonly seo = inject(SeoService);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' },
  );

  protected readonly industry = computed(() => getIndustryBySlug(this.slug()));
  /** The other pages of the site, in the order of the data, never the page itself (card D7). */
  protected readonly neighbours = computed(() => ALL_INDUSTRIES.filter((o) => o.slug !== this.slug()));

  constructor() {
    effect(() => {
      const i = this.industry();
      if (!i) {
        this.jsonLd.remove('industry');
        this.jsonLd.remove('breadcrumb');
        return;
      }
      // «AI booking widget for <audience> — Typelessity»: the brand is added by SeoService (card D2).
      this.seo.apply({
        title: `AI booking widget for ${i.audience}`,
        description: i.description,
        path: `/industries/${i.slug}`,
      });
      this.jsonLd.set('industry', i.jsonLd ?? this.buildServiceLd(i.slug, i.name, i.description));
      // Home → the trade, as in the mock; the hub is not a step of the path (its fate is the founder's gate, FL-23).
      this.jsonLd.set('breadcrumb', breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: i.name, path: `/industries/${i.slug}` },
      ]));
    });
  }

  private buildServiceLd(slug: string, name: string, description: string): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Typelessity for ${name}`,
      description,
      provider: orgRef(),
      url: `${SITE_URL}/industries/${slug}`,
      areaServed: 'Worldwide',
    };
  }
}
