import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
  imports: [ContactFormComponent, PadNumberPipe],
  styleUrl: './pricing-page.component.scss',
  template: `
    <section class="vc-wrap pricing-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>Pricing</div>
      <h1>{{ c.pricing.title }}</h1>
      <p class="vc-section-sub">{{ c.pricing.sub }}</p>
    </section>

    <section class="vc-wrap pricing-tiers">
      <div class="home-tiers">
        @for (tier of c.pricing.tiers; track tier.name) {
          <article class="tier" [class.tier--featured]="tier.featured">
            @if (tier.featured) { <span class="tier__badge">Most popular</span> }
            <div class="tier__name">{{ tier.name }}</div>
            <div class="tier__price">{{ tier.price }}</div>
            <div class="tier__sub">{{ tier.sub }}</div>
            <ul class="tier__bullets">
              @for (b of tier.bullets; track b) { <li>{{ b }}</li> }
            </ul>
            <a class="vc-btn vc-btn-primary vc-btn-block vc-btn-lg" href="https://webappski.com/en/portal" target="_blank" rel="noopener">{{ tier.cta }}</a>
          </article>
        }
      </div>
    </section>

    <section id="start-pilot" class="vc-wrap pricing-form">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Start Pilot</div>
        <h2>Tell us about your booking volume</h2>
        <p class="vc-section-sub">We respond within one business day with a 30-minute intake call to scope your config.</p>
      </header>
      <app-contact-form />
    </section>

    <section class="vc-wrap pricing-onboarding">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Onboarding</div>
        <h2>From spec to live in 1–2 days</h2>
      </header>
      <ol class="onboarding">
        <li>
          <span class="onboarding__day">Day 1 · AM</span>
          <strong>Client spec interview</strong>
          <p>30-minute call. We capture your fields, options, enrichments, and branding into a structured spec template.</p>
        </li>
        <li>
          <span class="onboarding__day">Day 1 · PM</span>
          <strong>Config JSON generated</strong>
          <p>We turn the spec into a versioned config JSON. You review the field list, aiHints, and enrichment endpoints.</p>
        </li>
        <li>
          <span class="onboarding__day">Day 2 · AM</span>
          <strong>Embed code on your page</strong>
          <p>One <code>&lt;script&gt;</code> tag added to the page where booking happens. Widget renders against your config.</p>
        </li>
        <li>
          <span class="onboarding__day">Day 2 · PM</span>
          <strong>Booking endpoint wired</strong>
          <p>Your existing booking API is mapped to the widget's submit. Test booking. Go live.</p>
        </li>
      </ol>
    </section>

    <section class="vc-wrap pricing-diff">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>Pilot vs Enterprise</div>
        <h2>What you get when you upgrade</h2>
        <p class="vc-section-sub">Pilot has every feature for shipping a real booking flow. Enterprise adds operational guarantees and deployment options.</p>
      </header>
      <table class="pricing-diff__table">
        <thead>
          <tr><th>Capability</th><th>Pilot</th><th>Enterprise</th></tr>
        </thead>
        <tbody>
          <tr><td>All field types, voice, 25+ languages</td><td>✓</td><td>✓</td></tr>
          <tr><td>Enrichment APIs (up to 5 per config)</td><td>✓</td><td>✓</td></tr>
          <tr><td>Custom branding, webhook integration</td><td>✓</td><td>✓</td></tr>
          <tr><td>1–2 day personal onboarding</td><td>✓</td><td>✓</td></tr>
          <tr><td>SLA guarantee (99.9% uptime)</td><td>—</td><td>✓</td></tr>
          <tr><td>Dedicated account manager</td><td>—</td><td>✓</td></tr>
          <tr><td>On-premise / self-hosted deployment</td><td>—</td><td>✓</td></tr>
          <tr><td>EU data residency</td><td>—</td><td>✓</td></tr>
          <tr><td>Custom AI provider (Azure OpenAI, etc.)</td><td>—</td><td>✓</td></tr>
          <tr><td>Volume discount on bookings</td><td>—</td><td>✓</td></tr>
        </tbody>
      </table>
      <p class="pricing-diff__note">
        Pilot has no time limit. We invite you to upgrade once booking volume justifies an SLA — typically &gt; 5,000 sessions/month.
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
