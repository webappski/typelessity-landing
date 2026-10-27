import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { softwareApplicationLd } from '../../core/seo/schemas';
import { PadNumberPipe } from '../../core/utils/pad-number.pipe';
import { RouterLink } from '@angular/router';
import { ContactFormComponent } from '../../shared/contact-form/contact-form.component';
import { HOME, pilotSignupUrl } from '../home/home.content';
import { PRICING_FAQ, PRICING_LAST_UPDATED, PRICING_PAGE } from './pricing.content';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContactFormComponent, PadNumberPipe, RouterLink],
  styleUrl: './pricing-page.component.scss',
  template: `
    <section class="vc-wrap pricing-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ p.kicker }}</div>
      <h1>{{ p.h1 }}</h1>
      <p class="vc-section-sub">{{ p.capsule }}</p>
    </section>

    <section class="vc-wrap pricing-tiers">
      <div class="home-tiers">
        @for (tier of c.pricing.tiers; track tier.name) {
          <article class="tier">
            <div class="tier__name">{{ tier.name }}</div>
            <div class="tier__price">{{ tier.price }}@if (hasPeriod(tier)) { <span class="tier__period">{{ tier.period }}</span> }</div>
            <div class="tier__sub">{{ tier.sub }}</div>
            <ul class="tier__bullets">
              @for (b of tier.bullets; track b) { <li>{{ b }}</li> }
            </ul>
            @if (!tier.comingSoon) {
              <a class="vc-btn vc-btn-primary vc-btn-block vc-btn-lg" [href]="signupUrl('pricing', tier.slug)">{{ tier.cta }}</a>
            } @else {
              <span class="vc-btn vc-btn-muted vc-btn-block vc-btn-lg">Coming soon</span>
            }
          </article>
        }
      </div>
      <p class="vc-cta-note vc-cta-note--grid">{{ t.t('nav.getStartedNote') }}</p>
      <p class="pricing-updated">Page last updated {{ lastUpdated }}</p>
    </section>

    <section class="vc-wrap pricing-counts">
      <p>{{ p.pilotLine }}</p>
      <p><strong>{{ p.whatCountsLabel }}</strong> {{ p.whatCounts }}</p>
      <p><strong>{{ p.afterLimitLabel }}</strong> {{ p.afterLimit }}</p>
    </section>

    <section class="vc-wrap pricing-install">
      <a [routerLink]="p.install.href">{{ p.install.label }} →</a>
    </section>

    <section class="vc-wrap pricing-faq">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Questions</div>
        <h2>{{ p.aboutH2 }}</h2>
      </header>
      <div class="faq">
        @for (qa of pricingFaq; track qa.q; let i = $index) {
          <details>
            <summary>
              <span class="faq__i">{{ i + 1 | padNumber }}</span>
              <span class="faq__q">{{ qa.q }}</span>
            </summary>
            <p class="faq__a">{{ qa.a }}</p>
          </details>
        }
      </div>
    </section>

    <section id="start-pilot" class="vc-wrap pricing-form">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Questions</div>
        <h2>Questions before you start?</h2>
        <p class="vc-section-sub">Write to us and we’ll reply by email.</p>
      </header>
      <app-contact-form />
    </section>

    <section class="vc-wrap how-cta">
      <h2>Try it free on your website</h2>
      <div class="how-cta__actions">
        <a class="vc-btn vc-btn-primary vc-btn-lg" [href]="signupUrl('pricing', 'free-pilot')">Get it free</a>
        <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/how-it-works">See how it works</a>
      </div>
      <p class="vc-cta-note">{{ t.t('nav.getStartedNote') }}</p>
    </section>
  `,
})
export class PricingPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);
  protected readonly c = HOME;
  protected readonly pricingFaq = PRICING_FAQ;
  protected readonly p = PRICING_PAGE;
  protected readonly lastUpdated = PRICING_LAST_UPDATED;
  /** «/ month» is drawn for the paid tiers only; the markup carries it for the same tiers (unitCode MON) */
  protected readonly hasPeriod = (tier: object): tier is { period: string } => 'period' in tier;
  // Tiers run Free Pilot → Enterprise, the same as on the home page: every tier starts with the free
  // pilot, so it comes first (founder 2026-09-25, A43 — replaces the highest-price-first anchoring order).
  protected readonly signupUrl = pilotSignupUrl;

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.pricing.title'),
      titleHasBrand: true,
      description: this.t.t('seo.pricing.description'),
      path: '/pricing',
    });
    this.jsonLd.set('software', softwareApplicationLd());
  }
}
