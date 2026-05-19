import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { fromEvent, map } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';
import { PLATFORM_ID } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService, type SeoLocale } from '../../core/seo/seo.service';
import { articleLd, breadcrumbLd, faqLd } from '../../core/seo/schemas';
import { getBlogPostBySlug } from '../../lib/blog-manifest.generated';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MarkdownComponent],
  styleUrl: './blog-post.component.scss',
  template: `
    @let p = post();

    <!-- Reading progress bar (CSS-driven via custom prop) -->
    <div class="blog-progress" [style.--read-progress.%]="progress()" aria-hidden="true"></div>

    <article class="blog-post" #articleEl>
      <a class="blog-post__back" [routerLink]="'/' + t.lang() + '/blog'">
        <span aria-hidden="true">←</span>
        <span>Back to blog</span>
      </a>

      @if (p) {
        <header class="blog-post__head">
          <div class="blog-post__meta">
            <span class="blog-post__cat">{{ p.category }}</span>
            <span class="blog-post__sep" aria-hidden="true">/</span>
            <time [attr.datetime]="p.publishedAt">{{ p.publishedAt | date:'mediumDate' }}</time>
            <span class="blog-post__sep" aria-hidden="true">/</span>
            <span class="blog-post__readtime">{{ readingTime(p.body) }} min read</span>
            <span class="blog-post__sep" aria-hidden="true">/</span>
            <span>{{ p.author }}</span>
          </div>
          <h1 class="blog-post__title">{{ p.title }}</h1>
          <p class="blog-post__lede">{{ p.description }}</p>
        </header>

        <div class="blog-post__body">
          <markdown [data]="p.body" />
        </div>

        <footer class="blog-post__footer">
          <a class="blog-post__footer__back" [routerLink]="'/' + t.lang() + '/blog'">← All posts</a>
          <div class="blog-post__footer__share">
            <a [href]="shareUrl('twitter', p.title, p.slug)" target="_blank" rel="noopener">Twitter</a>
            <a [href]="shareUrl('linkedin', p.title, p.slug)" target="_blank" rel="noopener">LinkedIn</a>
            <a [href]="shareUrl('hn', p.title, p.slug)" target="_blank" rel="noopener">Hacker News</a>
          </div>
        </footer>
      } @else {
        <p>Post not found. <a [routerLink]="'/' + t.lang() + '/blog'">Back to blog</a>.</p>
      }
    </article>
  `,
})
export class BlogPostComponent implements AfterViewInit {
  protected readonly t = inject(TranslationService);
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly slug = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')),
    { initialValue: '' },
  );

  protected readonly post = computed(() => getBlogPostBySlug(this.slug()));
  protected readonly progress = signal(0);

  constructor() {
    effect(() => {
      const p = this.post();
      const locale = this.t.lang() as SeoLocale;
      if (!p) {
        this.jsonLd.remove('article');
        this.jsonLd.remove('breadcrumb');
        this.jsonLd.remove('article-faq');
        return;
      }
      this.seo.apply({
        title: p.title,
        description: p.description,
        path: `/blog/${p.slug}`,
        locale,
        ogImage: p.ogImage ? `https://typelessity.com${p.ogImage}` : undefined,
        type: 'article',
        publishedAt: p.publishedAt,
        updatedAt: p.updatedAt,
        author: p.author,
      });
      this.jsonLd.set('article', articleLd(p, locale));
      this.jsonLd.set('breadcrumb', breadcrumbLd(locale, [
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: p.title, path: `/blog/${p.slug}` },
      ]));
      if (p.faqs && p.faqs.length > 0) {
        this.jsonLd.set('article-faq', faqLd(p.faqs));
      } else {
        this.jsonLd.remove('article-faq');
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    fromEvent(window, 'scroll', { passive: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docH > 0 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 0;
        this.progress.set(pct);
      });
  }

  /** Approximate reading time at ~230 wpm (industry standard for technical longform). */
  protected readingTime(body: string): number {
    const words = body.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 230));
  }

  protected shareUrl(network: 'twitter' | 'linkedin' | 'hn', title: string, slug: string): string {
    const url = `https://typelessity.com/${this.t.lang()}/blog/${slug}`;
    const t = encodeURIComponent(title);
    const u = encodeURIComponent(url);
    switch (network) {
      case 'twitter':
        return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
      case 'hn':
        return `https://news.ycombinator.com/submitlink?u=${u}&t=${t}`;
    }
  }
}
