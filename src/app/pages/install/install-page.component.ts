import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { EMBED_SNIPPET, WIDGET_CSP } from '../../core/integrations/embed-snippet';
import { pilotSignupUrl } from '../home/home.content';
import { INSTALL } from './install.content';

@Component({
  selector: 'app-install-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './install-page.component.scss',
  template: `
    <section class="vc-wrap install-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ c.kicker }}</div>
      <h1>{{ c.h1 }}</h1>
      <p class="vc-section-sub">{{ c.capsule }}</p>
    </section>

    <section class="vc-wrap install-block">
      <h2>{{ c.requirements.h2 }}</h2>
      <ul class="install-list">
        @for (item of c.requirements.items; track item) { <li>{{ item }}</li> }
      </ul>
    </section>

    <section class="vc-wrap install-block">
      <h2>{{ c.stepsH2 }}</h2>
      <ol class="install-steps">
        @for (s of c.steps; track s.h; let i = $index) {
          <li class="install-step">
            <span class="install-step__n" aria-hidden="true">{{ i + 1 }}</span>
            <h3 class="install-step__h">{{ s.h }}</h3>
            <p class="install-step__b">{{ s.b }}</p>
          </li>
        }
      </ol>
    </section>

    <section class="vc-wrap install-block">
      <h2>{{ c.code.h2 }}</h2>
      <pre class="install-code">{{ embedSnippet }}</pre>
    </section>

    <section class="vc-wrap install-block">
      <h2>{{ c.where.h2 }}</h2>
      <h3>{{ c.where.email.h3 }}</h3>
      @for (p of c.where.email.b; track p) { <p class="install-p">{{ p }}</p> }
      <h3>{{ c.where.rest.h3 }}</h3>
      @for (p of c.where.rest.b; track p) { <p class="install-p">{{ p }}</p> }
      <pre class="install-code">{{ c.where.rest.example }}</pre>
    </section>

    <section class="vc-wrap install-block">
      <h2>{{ c.sees.h2 }}</h2>
      <p class="install-p">{{ c.sees.b }}</p>
    </section>

    <section class="vc-wrap install-block">
      <h2>{{ c.csp.h2 }}</h2>
      <p class="install-p">{{ c.csp.b }}</p>
      <pre class="install-code">{{ cspText }}</pre>
      <p class="install-p">{{ c.csp.why }}</p>
      <p class="install-p">{{ c.csp.fonts }}</p>
      <p class="install-p">{{ c.csp.permissions }}</p>
      <pre class="install-code">{{ c.csp.permissionsValue }}</pre>
    </section>

    <section class="vc-wrap how-cta">
      <h2>{{ c.cta.title }}</h2>
      <div class="how-cta__actions">
        <a class="vc-btn vc-btn-primary vc-btn-lg" [href]="signupUrl('install', 'free-pilot')">{{ c.cta.primary }}</a>
        <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/how-it-works">{{ c.cta.secondary }}</a>
      </div>
    </section>
  `,
})
export class InstallPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  protected readonly c = INSTALL;
  protected readonly signupUrl = pilotSignupUrl;
  protected readonly embedSnippet = EMBED_SNIPPET;
  protected readonly cspText = WIDGET_CSP.map((l) => `${l.directive} ${l.source}`).join('\n');

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.install.title'),
      description: this.t.t('seo.install.description'),
      path: '/install',
    });
  }
}
