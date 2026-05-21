import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { breadcrumbLd } from '../../core/seo/schemas';
import { ALL_INDUSTRIES, getIndustriesByCategory } from '../../lib/industries';

@Component({
  selector: 'app-industries-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, KeyValuePipe],
  styleUrl: './industries-page.component.scss',
  template: `
    <section class="vc-wrap industries-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>Industries</div>
      <h1>AI booking that fits {{ count }} verticals</h1>
      <p class="vc-section-sub">
        Every industry has its own intake fields, urgency signals, and edge cases.
        Typelessity is configured for each — without forms.
      </p>
    </section>

    @for (group of byCategory() | keyvalue; track group.key) {
      <section class="vc-wrap industries-cat">
        <h2>{{ group.key }}</h2>
        <ul class="industries-grid">
          @for (ind of group.value; track ind.slug) {
            <li>
              <a class="industry-card" [routerLink]="'/industries/' + ind.slug">
                <span class="industry-card__name">{{ ind.name }}</span>
                <span class="industry-card__sub">{{ ind.hero.eyebrow ?? ind.category }}</span>
              </a>
            </li>
          }
        </ul>
      </section>
    }
  `,
})
export class IndustriesPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);
  protected readonly byCategory = computed(() => getIndustriesByCategory());
  protected readonly count = ALL_INDUSTRIES.length;

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.industries.title'),
      description: this.t.t('seo.industries.description'),
      path: '/industries',
    });
    this.jsonLd.set('breadcrumb', breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: 'Industries', path: '/industries' },
    ]));
  }
}
