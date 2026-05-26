import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { faqLd, productLd } from '../../core/seo/schemas';
import { PadNumberPipe } from '../../core/utils/pad-number.pipe';
import { ContactFormComponent } from '../../shared/contact-form/contact-form.component';
import { HOME } from '../home/home.content';
import { PRICING_FAQ } from './pricing.content';

@Component({
  selector: 'app-pricing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContactFormComponent, PadNumberPipe, RouterLink],
  styleUrl: './pricing-page.component.scss',
  template: `
    <section class="vc-wrap pricing-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>Pricing</div>
      <h1>{{ c.pricing.title }}</h1>
      <p class="vc-section-sub">{{ c.pricing.sub }}</p>
    </section>

    <section class="vc-wrap pricing-tiers">
      <div class="home-tiers">
        @for (tier of tiersByAnchorOrder; track tier.name) {
          <article class="tier" [class.tier--featured]="tier.featured">
            @if (tier.featured) { <span class="tier__badge">Recommended</span> }
            <div class="tier__name">{{ tier.name }}</div>
            <div class="tier__price">{{ tier.price }}</div>
            <div class="tier__sub">{{ tier.sub }}</div>
            <ul class="tier__bullets">
              @for (b of tier.bullets; track b) { <li>{{ b }}</li> }
            </ul>
            @if (!tier.comingSoon) {
              <a class="vc-btn vc-btn-primary vc-btn-block vc-btn-lg" routerLink="/pricing" fragment="start-pilot">{{ tier.cta }}</a>
            } @else {
              <span class="vc-btn vc-btn-muted vc-btn-block vc-btn-lg">Coming soon</span>
            }
          </article>
        }
      </div>
    </section>

    <section id="start-pilot" class="vc-wrap pricing-form">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Waitlist</div>
        <h2>Get notified when Typelessity launches</h2>
        <p class="vc-section-sub">Typelessity is launching soon. Sign up to be notified when it goes live.</p>
      </header>
      <app-contact-form />
    </section>

    <section class="vc-wrap pricing-onboarding">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Onboarding</div>
        <h2>From spec to live in a couple of hours</h2>
      </header>
      <ol class="onboarding">
        <li>
          <span class="onboarding__day">Step 1</span>
          <strong>Client spec interview</strong>
          <p>30-minute call. We capture your fields, options, enrichments, and branding into a structured spec template.</p>
        </li>
        <li>
          <span class="onboarding__day">Step 2</span>
          <strong>Config JSON generated</strong>
          <p>We turn the spec into a versioned config JSON. You review the field list, aiHints, and enrichment endpoints.</p>
        </li>
        <li>
          <span class="onboarding__day">Step 3</span>
          <strong>Embed code on your page</strong>
          <p>One <code>&lt;script&gt;</code> tag added to the page where booking happens. Widget renders against your config.</p>
        </li>
        <li>
          <span class="onboarding__day">Step 4</span>
          <strong>Booking endpoint wired</strong>
          <p>Your existing booking API is mapped to the widget's submit. Test booking. Go live.</p>
        </li>
      </ol>
    </section>

    <section class="vc-wrap pricing-diff">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>What changes at Enterprise</div>
        <h2>Every tier ships the full booking engine</h2>
        <p class="vc-section-sub">Free Pilot, Starter and Pro all include every product feature — the differences are submission volume and support level (see cards above). Enterprise adds operational guarantees and deployment options on top.</p>
      </header>
      <table class="pricing-diff__table">
        <thead>
          <tr><th>Capability</th><th>Free Pilot, Starter, Pro</th><th>Enterprise</th></tr>
        </thead>
        <tbody>
          <tr><td>All field types, voice, 25+ languages</td><td>✓</td><td>✓</td></tr>
          <tr><td>Enrichment APIs (up to 5 per config)</td><td>✓</td><td>✓</td></tr>
          <tr><td>Custom branding, webhook integration</td><td>✓</td><td>✓</td></tr>
          <tr><td>Personal onboarding included</td><td>✓</td><td>✓</td></tr>
          <tr><td>SLA guarantee (99.9% uptime)</td><td>—</td><td>✓</td></tr>
          <tr><td>Dedicated account manager</td><td>—</td><td>✓</td></tr>
          <tr><td>On-premise / self-hosted deployment</td><td>—</td><td>✓</td></tr>
          <tr><td>EU data residency</td><td>—</td><td>✓</td></tr>
          <tr><td>Custom AI provider (Azure OpenAI, etc.)</td><td>—</td><td>✓</td></tr>
          <tr><td>Volume discount on bookings</td><td>—</td><td>✓</td></tr>
        </tbody>
      </table>
      <p class="pricing-diff__note">
        Free Pilot has no time limit. Upgrade once booking volume crosses the next tier's cap or once you need an SLA — typically &gt; 5,000 sessions/month for Enterprise.
      </p>
    </section>

    <section class="vc-wrap pricing-faq">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Pricing FAQ</div>
        <h2>Common pricing questions</h2>
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
  `,
})
export class PricingPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);
  protected readonly c = HOME;
  protected readonly pricingFaq = PRICING_FAQ;
  // CRO display order: highest price first (anchoring bias) — Enterprise → Pro → Starter → Free Pilot.
  // Home page keeps natural ascending order; this reversal is pricing-page-only.
  protected readonly tiersByAnchorOrder = [...HOME.pricing.tiers].reverse();

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.pricing.title'),
      description: this.t.t('seo.pricing.description'),
      path: '/pricing',
    });
    this.jsonLd.set('product', productLd());
    this.jsonLd.set('faq', faqLd(this.pricingFaq.map(({ q, a }) => ({ q, a }))));
  }
}
