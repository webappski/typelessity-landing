import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { KeyValuePipe } from '@angular/common';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { faqLd } from '../../core/seo/schemas';
import { slugify } from '../../core/utils/slugify';
import { IconComponent } from '../../shared/icon/icon.component';
import { HOME, type FaqCategory } from '../home/home.content';

type FaqItem = { q: string; a: string };

@Component({
  selector: 'app-faq-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KeyValuePipe, IconComponent],
  styleUrl: './faq-page.component.scss',
  template: `
    <section class="vc-wrap faq-hero">
      <div class="vc-kicker faq-eyebrow"><span class="vc-kicker-bar"></span>FAQ</div>
      <h1>Common questions</h1>
      <p class="vc-section-sub">{{ HOME.faq.length }} self-contained answers. First sentence works as a stand-alone citation.</p>
      <nav class="faq-jump" aria-label="Jump to category">
        @for (cat of categoryNav(); track cat.key) {
          <a [href]="'#' + slug(cat.key)">{{ cat.key }} <span class="faq-jump__count">{{ cat.count }}</span></a>
        }
      </nav>
    </section>

    @for (group of grouped() | keyvalue: keepOrder; track group.key) {
      <section class="vc-wrap faq-cat" [id]="slug(group.key)">
        <h2>{{ group.key }}</h2>
        <div class="faq-list">
          @for (qa of group.value; track qa.q) {
            <details [id]="slug(qa.q)">
              <summary>
                <span class="faq-list__q">{{ qa.q }}</span>
                <app-icon name="chevron-down" className="faq-list__toggle" />
              </summary>
              <p class="faq-list__a">{{ qa.a }}</p>
            </details>
          }
        </div>
      </section>
    }

    <section class="vc-wrap faq-todo">
      <p>Need a question we missed? <a href="mailto:hello&#64;typelessity.com">Email us</a>.</p>
    </section>
  `,
})
export class FaqPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.faq.title'),
      description: this.t.t('seo.faq.description'),
      path: '/faq',
    });
    this.jsonLd.set('faq', faqLd(HOME.faq.map(({ q, a }) => ({ q, a }))));
  }

  protected readonly HOME = HOME;

  protected readonly grouped = computed<Record<FaqCategory, FaqItem[]>>(() => {
    const out: Record<FaqCategory, FaqItem[]> = {
      Product: [],
      'AI Behavior': [],
      Integration: [],
      Privacy: [],
      Pricing: [],
      Security: [],
      Compliance: [],
      'For Developers': [],
      'Competitor Migration': [],
    };
    for (const qa of HOME.faq) {
      out[qa.category].push({ q: qa.q, a: qa.a });
    }
    return out;
  });

  protected readonly categoryNav = computed(() =>
    (Object.entries(this.grouped()) as [FaqCategory, FaqItem[]][])
      .filter(([, items]) => items.length > 0)
      .map(([key, items]) => ({ key, count: items.length })),
  );

  protected readonly keepOrder = (): number => 0;
  protected readonly slug = slugify;
}
