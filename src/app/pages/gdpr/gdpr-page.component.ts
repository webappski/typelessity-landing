import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { pilotSignupUrl } from '../home/home.content';
import { GDPR } from './gdpr.content';

@Component({
  selector: 'app-gdpr-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './gdpr-page.component.scss',
  template: `
    <section class="vc-wrap gdpr-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>{{ c.kicker }}</div>
      <h1>{{ c.h1 }}</h1>
      <p class="vc-section-sub">{{ c.capsule }}</p>
    </section>

    <section class="vc-wrap gdpr-block">
      <h2>{{ c.consent.h2 }}</h2>
      <p class="gdpr-p gdpr-p--lead">{{ c.consent.sub }}</p>
      @for (p of c.consent.body; track p) { <p class="gdpr-p">{{ p }}</p> }
    </section>

    <section class="vc-wrap gdpr-block">
      <h2>{{ c.where.h2 }}</h2>
      <table class="gdpr-table">
        <thead>
          <tr>@for (h of c.where.head; track h) { <th scope="col">{{ h }}</th> }</tr>
        </thead>
        <tbody>
          @for (row of c.where.rows; track row[0]) {
            <tr>
              @for (cell of row; track $index) { <td [attr.data-label]="c.where.head[$index]">{{ cell }}</td> }
            </tr>
          }
        </tbody>
      </table>
      <p class="gdpr-note">{{ c.where.note }}</p>
    </section>

    <section class="vc-wrap gdpr-block">
      <h2>{{ c.retention.h2 }}</h2>
      <ul class="gdpr-list">
        @for (item of c.retention.items; track item) { <li>{{ item }}</li> }
      </ul>
    </section>

    <section class="vc-wrap gdpr-block">
      <h2>{{ c.limits.h2 }}</h2>
      <ul class="gdpr-list">
        @for (item of c.limits.items; track item) { <li>{{ item }}</li> }
      </ul>
    </section>

    <section class="vc-wrap gdpr-block">
      <h2>{{ c.checks.h2 }}</h2>
      <ol class="gdpr-checks">
        @for (k of c.checks.items; track k.q) {
          <li><strong class="gdpr-checks__q">{{ k.q }}</strong> <span class="gdpr-checks__a">{{ k.a }}</span></li>
        }
      </ol>
    </section>

    <section class="vc-wrap gdpr-block">
      <h2>{{ c.links.h2 }}</h2>
      <ul class="gdpr-links">
        @for (l of c.links.items; track l.href) {
          <li>
            @if (l.external) {
              <a [href]="l.href" rel="noopener">{{ l.label }}</a>
            } @else {
              <a [routerLink]="path(l.href)" [fragment]="fragment(l.href)">{{ l.label }}</a>
            }
          </li>
        }
      </ul>
    </section>

    <section class="vc-wrap how-cta">
      <h2>{{ c.cta.title }}</h2>
      <div class="how-cta__actions">
        <a class="vc-btn vc-btn-primary vc-btn-lg" [href]="signupUrl('gdpr', 'free-pilot')">{{ c.cta.primary }}</a>
        <p class="vc-cta-note">{{ t.t('nav.getStartedNote') }}</p>
        <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/how-it-works">{{ c.cta.secondary }}</a>
      </div>
    </section>
  `,
})
export class GdprPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  protected readonly c = GDPR;
  protected readonly signupUrl = pilotSignupUrl;

  protected path(href: string): string { return href.split('#')[0]!; }
  protected fragment(href: string): string | undefined { return href.split('#')[1]; }

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.gdpr.title'),
      description: this.t.t('seo.gdpr.description'),
      path: '/gdpr',
      titleHasBrand: true,
    });
  }
}
