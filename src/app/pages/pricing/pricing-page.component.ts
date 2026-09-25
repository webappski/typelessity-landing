import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { faqLd, productLd } from '../../core/seo/schemas';
import { PadNumberPipe } from '../../core/utils/pad-number.pipe';
import { ContactFormComponent } from '../../shared/contact-form/contact-form.component';
import { HOME, pilotSignupUrl } from '../home/home.content';
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
        @for (tier of c.pricing.tiers; track tier.name) {
          <article class="tier" [class.tier--featured]="tier.featured">
            @if (tier.featured) { <span class="tier__badge">Recommended</span> }
            <div class="tier__name">{{ tier.name }}</div>
            <div class="tier__price">{{ tier.price }}</div>
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
    </section>

    <section id="start-pilot" class="vc-wrap pricing-form">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Questions</div>
        <h2>Questions before you start?</h2>
        <p class="vc-section-sub">Write to us and we’ll reply by email.</p>
      </header>
      <app-contact-form />
    </section>

    <section class="vc-wrap pricing-onboarding">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Setup</div>
        <h2>You set it up yourself, in the Webappski portal</h2>
      </header>
      <ol class="onboarding">
        <li>
          <span class="onboarding__day">Step 1</span>
          <strong>Choose a path</strong>
          <p>Step by step — a few short screens — or let your own AI write it: copy our instructions into ChatGPT or Claude with your API docs and paste the answer back.</p>
        </li>
        <li>
          <span class="onboarding__day">Step 2</span>
          <strong>Describe your booking</strong>
          <p>Your business, the questions in the order a customer answers, and where bookings go: an email address or your system’s address.</p>
        </li>
        <li>
          <span class="onboarding__day">Step 3</span>
          <strong>Review and try it</strong>
          <p>Check everything before you publish, and try the widget as a customer. Practice bookings go nowhere and don’t count towards your monthly limit.</p>
        </li>
        <li>
          <span class="onboarding__day">Step 4</span>
          <strong>Install</strong>
          <p>The portal gives you the code for your platform — two lines of HTML that work in plain HTML, WordPress, React or Vue.</p>
        </li>
      </ol>
    </section>

    <section class="vc-wrap pricing-diff">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>What changes at Enterprise</div>
        <h2>Every tier ships the full booking engine</h2>
        <p class="vc-section-sub">Free Pilot, Starter and Pro all include every product feature and the same support by email — they differ in submission volume (see cards above) and the number of websites. Enterprise adds the highest volume, unlimited sites, and contract terms agreed on request.</p>
      </header>
      <table class="pricing-diff__table">
        <thead>
          <tr><th>Capability</th><th>Free Pilot, Starter, Pro</th><th>Enterprise</th></tr>
        </thead>
        <tbody>
          <tr><td>All field types, voice, 25+ languages</td><td>✓</td><td>✓</td></tr>
          <tr><td>Enrichment APIs (up to 5 per config)</td><td>✓</td><td>✓</td></tr>
          <tr><td>Custom branding, webhook integration</td><td>✓</td><td>✓</td></tr>
          <tr><td>Setup wizard in the Webappski portal</td><td>✓</td><td>✓</td></tr>
          <tr><td>Websites (domains) per account</td><td>1 / 5 / 10</td><td>Unlimited</td></tr>
          <tr><td>Service and database in the EU (Frankfurt, Ireland); OpenAI processes in the US under the 2021 SCCs</td><td>✓</td><td>✓</td></tr>
          <tr><td>Hosted by us — there is no on-premise or self-hosted build</td><td>✓</td><td>✓</td></tr>
          <tr><td>AI provider: OpenAI, through our account (no own key or other provider)</td><td>✓</td><td>✓</td></tr>
          <tr><td>Uptime commitment (SLA)</td><td>None</td><td>By contract, on request</td></tr>
          <tr><td>Named contact person</td><td>—</td><td>By contract, on request</td></tr>
          <tr><td>Pricing above 6,000 submissions a month</td><td>—</td><td>By contract, on request</td></tr>
        </tbody>
      </table>
      <p class="pricing-diff__note">
        Free Pilot has no time limit. Upgrade when monthly submissions pass your tier's cap (50 / 500 / 2,000 / 6,000). Contract terms such as an uptime commitment are agreed with Enterprise customers on request.
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
  // Tiers run Free Pilot → Enterprise, the same as on the home page: every tier starts with the free
  // pilot, so it comes first (founder 2026-09-25, A43 — replaces the highest-price-first anchoring order).
  protected readonly signupUrl = pilotSignupUrl;

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
