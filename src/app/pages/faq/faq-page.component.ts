import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { slugify } from '../../core/utils/slugify';
import { IconComponent } from '../../shared/icon/icon.component';
import { pilotSignupUrl } from '../home/home.content';
import { FAQ_GROUPS } from './faq.content';

@Component({
  selector: 'app-faq-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, IconComponent],
  styleUrl: './faq-page.component.scss',
  template: `
    <section class="vc-wrap faq-hero">
      <div class="vc-kicker faq-eyebrow"><span class="vc-kicker-bar"></span>FAQ</div>
      <h1>Typelessity FAQ</h1>
      <p class="vc-section-sub">Answers about Typelessity: what it does, AI behaviour, setup, data protection, pricing, security and switching from another booking tool. Every group links to the page that has the full answer.</p>
      <nav class="faq-jump" aria-label="Jump to group">
        @for (g of groups; track g.id) {
          <a [href]="'#' + g.id">{{ g.title }} <span class="faq-jump__count">{{ g.items.length }}</span></a>
        }
      </nav>
    </section>

    @for (g of groups; track g.id) {
      <section class="vc-wrap faq-cat" [id]="g.id">
        <h2>{{ g.title }}</h2>
        <div class="faq-list">
          @for (qa of g.items; track qa.q) {
            <details [id]="slug(qa.q)">
              <summary>
                <span class="faq-list__q">{{ qa.q }}</span>
                <app-icon name="chevron-down" className="faq-list__toggle" />
              </summary>
              <p class="faq-list__a">{{ qa.a }}</p>
            </details>
          }
        </div>
        <p class="faq-cat__more">
          @if (g.more.external) {
            <a class="faq-cat__more-link" [href]="g.more.href">{{ g.more.label }} →</a>
          } @else {
            <a class="faq-cat__more-link" [routerLink]="g.more.href">{{ g.more.label }} →</a>
          }
        </p>
      </section>
    }

    <section class="vc-wrap faq-todo">
      <p>Need a question we missed? <a href="mailto:info&#64;webappski.com">Email us</a>.</p>
    </section>

    <section class="vc-wrap how-cta">
      <h2>Try it free on your website</h2>
      <div class="how-cta__actions">
        <a class="vc-btn vc-btn-primary vc-btn-lg" [href]="signupUrl('faq', 'free-pilot')">Get it free</a>
        <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/how-it-works">See how it works</a>
      </div>
    </section>
  `,
})
export class FaqPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  protected readonly groups = FAQ_GROUPS;
  protected readonly slug = slugify;
  protected readonly signupUrl = pilotSignupUrl;

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.faq.title'),
      titleHasBrand: true,
      description: this.t.t('seo.faq.description'),
      path: '/faq',
    });
  }
}
