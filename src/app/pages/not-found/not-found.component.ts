import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  styleUrl: './not-found.component.scss',
  template: `
    <section class="vc-wrap nf">
      <div class="vc-mesh" aria-hidden="true"></div>
      <div class="nf__inner">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>404</div>
        <h1>This page doesn't exist</h1>
        <p class="nf__sub">The link you followed may be broken, or the page may have been moved.</p>
        <div class="nf__actions">
          <a class="vc-btn vc-btn-primary vc-btn-lg" routerLink="/">Go home</a>
          <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/industries">Browse industries</a>
          <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/blog">Blog</a>
        </div>
      </div>
    </section>
  `,
})
export class NotFoundComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      title: '404 — Page not found',
      description: 'The link you followed may be broken, or the page may have been moved.',
      path: '/404',
    });
  }
}
