import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { SeoService } from '../../core/seo/seo.service';
import { PRIVACY } from './privacy.content';

// The notice for a visitor of this website (L13, G-3). The layout is the one of /legal/security (the same kicker, h1 and body styles): a text page,
// no new pattern. The text is in privacy.content.ts and is a draft for the lawyer.
@Component({
  selector: 'app-privacy-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MarkdownComponent],
  styleUrl: '../legal/legal-page.component.scss',
  template: `
    <article class="legal vc-wrap">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>Legal</div>
      <h1>{{ c.title }}</h1>
      <div class="legal__body">
        <markdown [data]="c.body" />
      </div>
    </article>
  `,
})
export class PrivacyPageComponent implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly c = PRIVACY;

  ngOnInit(): void {
    this.seo.apply({ title: this.c.seoTitle, description: this.c.description, path: this.c.path });
  }
}
