import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService, SITE_URL } from '../../core/seo/seo.service';
import { breadcrumbLd, faqLd } from '../../core/seo/schemas';
import { getIndustryBySlug } from '../../lib/industries';

@Component({
  selector: 'app-industry-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, JsonPipe],
  styleUrl: './industry-detail-page.component.scss',
  template: `
    @let i = industry();

    @if (i) {
      <article class="industry vc-wrap">
        <a class="industry__back" routerLink="/industries">← All industries</a>

        <header class="industry__hero">
          @if (i.hero.eyebrow) {
            <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ i.hero.eyebrow }}</div>
          }
          <h1>{{ i.hero.title }}</h1>
          <p class="industry__sub">{{ i.hero.subtitle }}</p>
          @if (i.hero.cta) {
            <div class="industry__cta">
              <a class="vc-btn vc-btn-primary vc-btn-lg" routerLink="/pricing" fragment="start-pilot">{{ i.hero.cta.primary }}</a>
              <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/about">{{ i.hero.cta.secondary }}</a>
            </div>
          }
        </header>

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
            <h2>Why {{ i.name }} needs Typelessity</h2>
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
      </article>
    } @else {
      <section class="vc-wrap" style="padding-block: 80px;">
        <h1>Industry not found</h1>
        <p><a routerLink="/industries">Back to industries</a></p>
      </section>
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

  constructor() {
    effect(() => {
      const i = this.industry();
      if (!i) {
        this.jsonLd.remove('industry');
        this.jsonLd.remove('industry-faq');
        this.jsonLd.remove('breadcrumb');
        return;
      }
      this.seo.apply({
        title: i.hero.title,
        description: i.hero.subtitle,
        path: `/industries/${i.slug}`,
      });
      this.jsonLd.set('industry', i.jsonLd ?? this.buildServiceLd(i.slug, i.name, i.hero.subtitle));
      this.jsonLd.set('breadcrumb', breadcrumbLd([
        { name: 'Home', path: '/' },
        { name: 'Industries', path: '/industries' },
        { name: i.name, path: `/industries/${i.slug}` },
      ]));
      if (i.industryFAQ?.length) {
        this.jsonLd.set('industry-faq', faqLd([...i.industryFAQ]));
      } else {
        this.jsonLd.remove('industry-faq');
      }
    });
  }

  private buildServiceLd(slug: string, name: string, description: string): Record<string, unknown> {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Typelessity for ${name}`,
      description,
      provider: {
        '@type': 'Organization',
        name: 'Typelessity',
        url: SITE_URL,
      },
      url: `${SITE_URL}/industries/${slug}`,
      areaServed: 'Worldwide',
    };
  }
}
