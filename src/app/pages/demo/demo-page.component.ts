import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { pilotSignupUrl } from '../home/home.content';
import { DEMO_CARDS, DEMO_STRIP, SCENE_LABELS, demoButton, demoCopy } from './demo.content';

@Component({
  selector: 'app-demo-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './demo-page.component.scss',
  templateUrl: './demo-page.component.html',
})
export class DemoPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);

  protected readonly cards = DEMO_CARDS;
  protected readonly copy = demoCopy();
  protected readonly labels = SCENE_LABELS;
  protected readonly strip = DEMO_STRIP;
  protected readonly button = demoButton;
  /** the same address as «Get it free» in the header */
  protected readonly signupUrl = pilotSignupUrl('nav', 'free-pilot');

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.demo.title'),
      titleHasBrand: true,
      description: this.t.t('seo.demo.description'),
      path: '/demo',
    });
  }
}
