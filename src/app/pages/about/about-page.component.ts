import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { aboutPageLd } from '../../core/seo/schemas';

@Component({
  selector: 'app-about-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './about-page.component.scss',
  template: `

    <section class="vc-wrap about-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>About</div>
      <h1>Forms are an artifact of constrained UI</h1>
      <p class="about-hero__lede">
        Typelessity is built on a single bet: when users describe what they need in their own words, conversion goes up — and the architecture that makes this work is simpler, not more complex, than the form it replaces.
      </p>
    </section>

    <section class="vc-wrap about-mission">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Mission</div>
        <h2>Replace the booking form with one sentence</h2>
        <p class="vc-section-sub">
          Multi-step forms exist because old UI primitives could not parse natural language. They can now. We rebuild the booking surface around that.
        </p>
      </header>
    </section>

    <section class="vc-wrap about-founder">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>Founder</div>
        <h2>Alex Isa</h2>
      </header>
      <div class="founder">
        <p>
          Engineer turned founder. Took Typelessity from specification to first production deploy in
          early 2025 — single-call extraction architecture, config-driven enrichment, anti-hallucination
          guards, 25+ language support out of the box. Background in distributed systems and frontend infrastructure.
        </p>
        <p>
          The thesis: AI didn't just make booking <em>better</em> — it changed what's possible. A user can now say
          "Записаться к стоматологу на пятницу после обеда" and the system extracts specialty, urgency,
          time window, and language preference in 320ms. The form stops being the contract; the conversation is.
        </p>
        <ul class="founder__links">
          <li><a href="mailto:hello&#64;typelessity.com">hello&#64;typelessity.com</a></li>
          <li><a routerLink="/blog">Blog</a></li>
        </ul>
      </div>
    </section>

    <section class="vc-wrap about-parent">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Producer</div>
        <h2>Built by Webappski</h2>
      </header>
      <div class="parent">
        <p>
          Typelessity is a product of <a href="https://webappski.com" rel="noopener">Webappski</a> —
          a small product studio building the next layer of AI-native interfaces for service businesses.
        </p>
        <p>
          Sister product: <a href="https://typelessform.com" rel="noopener">TypelessForm</a> — the same
          conversational-data-collection thesis applied to general-purpose forms (lead capture, support intake,
          onboarding). Typelessity is the booking-specific surface; TypelessForm is the generic one.
        </p>
        <p>
          Engineering, design, and operations across the Webappski portfolio share one codebase pattern,
          one extraction prompt template, and one set of GDPR-native data flows.
        </p>
      </div>
    </section>

    <section class="vc-wrap about-values">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Values</div>
        <h2>How we build</h2>
      </header>
      <ul class="values">
        <li>
          <strong>GPT decides. Code orchestrates.</strong>
          <p>No regex. No hardcoded patterns. The semantic decision layer is GPT, the deterministic layer is code. Every config has the same engine behind it.</p>
        </li>
        <li>
          <strong>Architecture is permanent. GTM is changeable.</strong>
          <p>We over-invested in the architecture early — single-call extraction, unified prompt, config-driven everything. That foundation outlasted three GTM pivots.</p>
        </li>
        <li>
          <strong>Numbers belong with sources.</strong>
          <p>Conversion uplift, latency p95, hallucination rate — every claim points to a benchmark or a dated production telemetry window. No floating numbers, no vendor-deck statistics.</p>
        </li>
        <li>
          <strong>The widget is for humans and agents.</strong>
          <p>The same JSON contract serves a human typing into chat and an autonomous AI agent calling /agent (endpoint shipping Q3 2026). The conversational booking layer for the agent web.</p>
        </li>
      </ul>
    </section>
  `,
})
export class AboutPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.about.title'),
      description: this.t.t('seo.about.description'),
      path: '/about',
    });
    this.jsonLd.set('about', aboutPageLd());
  }
}
