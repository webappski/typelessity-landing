import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { EMBED_SNIPPET } from '../../core/integrations/embed-snippet';
import { INSTALL } from '../install/install.content';
import { PadNumberPipe } from '../../core/utils/pad-number.pipe';
import { pilotSignupUrl } from '../home/home.content';
import { HOW } from './how-it-works.content';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PadNumberPipe],
  styleUrl: './how-it-works-page.component.scss',
  template: `

    <section class="vc-wrap how-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>How it works</div>
      <h1>{{ c.title }}</h1>
      <p class="vc-section-sub">{{ c.capsule }}</p>
      <div class="how-say">
        <div class="how-say__card">
          <h2 class="how-say__h">Customer says</h2>
          <p class="how-say__bubble">{{ c.say }}</p>
        </div>
        <div class="how-say__card">
          <h2 class="how-say__h">Typelessity extracts</h2>
          <pre class="how-say__code">{{ c.extracted }}</pre>
        </div>
      </div>
    </section>

    <section class="vc-wrap how-phases-head">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ c.phasesHead.kicker }}</div>
        <h2>{{ c.phasesHead.title }}</h2>
      </header>
    </section>

    @for (p of c.phases; track p.n) {
      <section class="vc-wrap how-phase">
        <header class="how-phase__head">
          <div class="how-phase__num">{{ p.n }}</div>
          <div>
            <h2>{{ p.name }}</h2>
            <p class="how-phase__one">{{ p.oneLine }}</p>
          </div>
        </header>
        <div class="how-phase__grid">
          <p class="how-phase__body">{{ p.body }}</p>
          <aside class="how-phase__example">
            <div class="how-phase__example-l">Input</div>
            <div class="how-phase__example-t">{{ p.example }}</div>
            <ul class="how-phase__ext">
              @for (e of p.extracts; track e) { <li>{{ e }}</li> }
            </ul>
          </aside>
        </div>
      </section>
    }

    <section class="vc-wrap how-arch">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>{{ c.ai.kicker }}</div>
        <h2>{{ c.ai.title }}</h2>
        <p class="vc-section-sub">{{ c.ai.sub }}</p>
      </header>
      <div class="how-arch__grid">
        @for (p of c.ai.pillars; track p.h; let i = $index) {
          <article class="pillar">
            <div class="pillar__num">{{ i + 1 | padNumber }}</div>
            <h3 class="pillar__h">{{ p.h }}</h3>
            <p class="pillar__b">{{ p.b }}</p>
          </article>
        }
      </div>
    </section>

    <section class="vc-wrap how-instead">
      <h2>{{ c.chatInsteadOfForm.h2 }}</h2>
      @for (para of c.chatInsteadOfForm.paragraphs; track para) {
        <p class="how-instead__p">{{ para }}</p>
      }
      <p class="how-instead__p"><a routerLink="/install">{{ c.chatInsteadOfForm.linkText }}</a></p>
    </section>

    <section class="vc-wrap how-edge">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>{{ c.edge.kicker }}</div>
        <h2>{{ c.edge.title }}</h2>
      </header>
      <ul class="edge">
        @for (e of c.edge.items; track e.h) {
          <li>
            <strong>{{ e.h }}</strong>
            <p>{{ e.b }}</p>
          </li>
        }
      </ul>
    </section>

    <section class="vc-wrap how-pipeline">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ c.turn.kicker }}</div>
        <h2>{{ c.turn.title }}</h2>
        <p class="vc-section-sub">{{ c.turn.sub }}</p>
      </header>
      <div class="pipeline">
        @for (n of c.turn.nodes; track n[0]; let last = $last) {
          <div class="pipe-node">
            <div class="pipe-t">{{ n[0] }}</div>
            <div class="pipe-l">{{ n[1] }}</div>
          </div>
          @if (!last) { <span class="pipe-arrow">→</span> }
        }
      </div>
    </section>

    <section class="vc-wrap how-embed">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ c.installTeaser.kicker }}</div>
        <h2>{{ c.installTeaser.title }}</h2>
        <p class="vc-section-sub">{{ c.installTeaser.sub }}</p>
      </header>
      <p class="how-embed__caption">{{ codeNote }}</p>
      <pre class="how-embed__code">{{ embedSnippet }}</pre>
      <p class="how-embed__note"><a routerLink="/install">{{ c.installTeaser.link }}</a></p>
    </section>

    <section class="vc-wrap how-cta">
      <h2>{{ c.cta.title }}</h2>
      <div class="how-cta__actions">
        <a class="vc-btn vc-btn-primary vc-btn-lg" [href]="signupUrl('how-it-works', 'free-pilot')">{{ c.cta.primary }}</a>
        <p class="vc-cta-note">{{ t.t('nav.getStartedNote') }}</p>
        <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/install">{{ c.cta.secondary }}</a>
      </div>
    </section>
  `,
})
export class HowItWorksPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  protected readonly c = HOW;
  protected readonly signupUrl = pilotSignupUrl;
  protected readonly embedSnippet = EMBED_SNIPPET;
  protected readonly codeNote = INSTALL.code.note;

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.howItWorks.title'),
      description: this.t.t('seo.howItWorks.description'),
      path: '/how-it-works',
      titleHasBrand: true,
    });
  }
}
