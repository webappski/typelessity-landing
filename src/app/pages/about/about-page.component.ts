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
        Typelessity is built on a single bet: let users describe what they need in their own words, and the architecture that makes this work is simpler, not more complex, than the form it replaces.
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
          Engineer turned founder. Started the Typelessity engine in January 2026 and took it from
          specification to the free pilot — single-call extraction architecture, config-driven enrichment, anti-hallucination
          guards, 25+ language support out of the box. Background in distributed systems and frontend infrastructure.
        </p>
        <p>
          The thesis: AI didn't just make booking <em>better</em> — it changed what's possible. A user can now say
          "Записаться на замену тормозных колодок в пятницу после обеда" and the system extracts the service,
          the day, the time window and the language in one AI call. The form stops being the contract; the conversation is.
        </p>
        <ul class="founder__links">
          <li><a href="mailto:info&#64;webappski.com">info&#64;webappski.com</a></li>
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
          Typelessity and TypelessForm are separate codebases with their own prompts. They share the approach —
          the AI reads the field configuration and fills in the fields — and both ask the visitor for consent
          before any AI processing.
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
          <p>We over-invested in the architecture early — single-call extraction, unified prompt, config-driven everything.</p>
        </li>
        <li>
          <strong>Numbers belong with sources.</strong>
          <p>Conversion uplift, latency, extraction accuracy — a number appears only with its source: a benchmark or our own dated measurement. Where we have not measured, we say so. No floating numbers, no vendor-deck statistics.</p>
        </li>
        <li>
          <strong>The widget is for humans and agents.</strong>
          <p>The same JSON contract describes the booking a human makes in chat, and it is the design for an /agent endpoint that autonomous AI agents could call. That endpoint is not built yet and has no release date.</p>
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
