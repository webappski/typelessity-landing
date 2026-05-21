import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { faqLd, organizationLd, softwareApplicationLd, websiteLd } from '../../core/seo/schemas';
import { EMBED_SNIPPET } from '../../core/integrations/embed-snippet';
import { PadNumberPipe } from '../../core/utils/pad-number.pipe';
import { IconComponent } from '../../shared/icon/icon.component';
import { LiveDemoComponent } from '../../widgets/live-demo/live-demo.component';
import { ALL_INDUSTRIES } from '../../lib/industries';
import { HOME } from './home.content';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LiveDemoComponent, PadNumberPipe, IconComponent],
  styleUrl: './home.component.scss',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);
  protected readonly c = HOME;
  protected readonly industriesCount = ALL_INDUSTRIES.length;
  protected readonly embedSnippet = EMBED_SNIPPET;
  protected readonly faqPreview = HOME.faq.filter((qa) => qa.category === 'Product');

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.home.title'),
      description: this.t.t('seo.home.description'),
      path: '/',
    });
    this.jsonLd.set('org', organizationLd());
    this.jsonLd.set('website', websiteLd());
    this.jsonLd.set('app', softwareApplicationLd());
    this.jsonLd.set('faq', faqLd(this.c.faq.map(({ q, a }) => ({ q, a }))));
  }
}
