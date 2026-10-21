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
import { provideSiteMarkdown } from '../../shared/site-markdown';
import { PLATFORM_ID } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { articleLd } from '../../core/seo/schemas';
import { getBlogPostBySlug } from '../../lib/blog-manifest.generated';
import { pilotSignupUrl } from '../home/home.content';

const JOURNAL_HEADING = /\n(?=## What changed in this article\s*\n)/;

/** Split an article body before its list of changes. No such heading → the whole body is the text. */
export function splitJournal(body: string): { text: string; journal: string } {
  const at = body.search(JOURNAL_HEADING);
  return at < 0 ? { text: body, journal: '' } : { text: body.slice(0, at), journal: body.slice(at + 1) };
}

@Component({
  selector: 'app-blog-post',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, MarkdownComponent],
  providers: [provideSiteMarkdown()],
  styleUrl: './blog-post.component.scss',
  template: `
    @let p = post();

    <!-- Reading progress bar (CSS-driven via custom prop) -->
    <div class="blog-progress" [style.--read-progress.%]="progress()" aria-hidden="true"></div>

    <article class="blog-post" #articleEl>
      <a class="blog-post__back" routerLink="/blog">
        <span aria-hidden="true">←</span>
        <span>Back to blog</span>
      </a>

      @if (p) {
        <header class="blog-post__head">
          <!-- D8 (FL-14): the separator is glued to the item after it (white-space: nowrap), so a wrapped line never ends on « · ». -->
          <div class="blog-post__meta">
            <span class="blog-post__cat">{{ p.category }}</span>
            &ngsp;<span class="blog-post__item"><span class="blog-post__sep" aria-hidden="true">·</span><time [attr.datetime]="p.publishedAt">{{ p.publishedAt | date:'mediumDate' }}</time></span>
            @if (p.updatedAt && p.updatedAt > p.publishedAt) {
              &ngsp;<span class="blog-post__item"><span class="blog-post__sep" aria-hidden="true">·</span><time [attr.datetime]="p.updatedAt">Updated {{ p.updatedAt | date:'mediumDate' }}</time></span>
            }
            &ngsp;<span class="blog-post__item"><span class="blog-post__sep" aria-hidden="true">·</span><span class="blog-post__readtime">{{ readingTime(p.body) }} min read</span></span>
            &ngsp;<span class="blog-post__item"><span class="blog-post__sep" aria-hidden="true">·</span><a class="blog-post__author" routerLink="/about">{{ p.author }}</a></span>
          </div>
          <h1 class="blog-post__title">{{ p.title }}</h1>
          <p class="blog-post__lede">{{ p.description }}</p>
        </header>

        <div class="blog-post__body">
          <markdown [data]="parts().text" />
        </div>

        <!-- L14 (CRO 4): the end of the text is a next step. The same block as /faq, /pricing, /install and /gdpr, above the list of changes, which stays last (C3). -->
        <section class="blog-post__cta how-cta" data-article-cta aria-labelledby="blog-cta-title">
          <h2 id="blog-cta-title">Try it free on your website</h2>
          <div class="how-cta__actions">
            <a class="vc-btn vc-btn-primary vc-btn-lg" [href]="signupUrl('blog', 'free-pilot')">Get it free</a>
            <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/how-it-works">See how it works</a>
          </div>
        </section>

        @if (parts().journal) {
          <div class="blog-post__body blog-post__body--journal">
            <markdown [data]="parts().journal" />
          </div>
        }

        <footer class="blog-post__footer">
          <a class="blog-post__footer__back" routerLink="/blog">← All posts</a>
          <div class="blog-post__footer__share">
            <a [href]="shareUrl('twitter', p.title, p.slug)" target="_blank" rel="noopener">Twitter</a>
            <a [href]="shareUrl('linkedin', p.title, p.slug)" target="_blank" rel="noopener">LinkedIn</a>
            <a [href]="shareUrl('hn', p.title, p.slug)" target="_blank" rel="noopener">Hacker News</a>
          </div>
        </footer>
      } @else {
        <p>Post not found. <a routerLink="/blog">Back to blog</a>.</p>
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
  protected readonly signupUrl = pilotSignupUrl;
  /** The text of the article and, apart, its list of changes («## What changed in this article», always the last section): the block «Try it free» stands between them. */
  protected readonly parts = computed(() => splitJournal(this.post()?.body ?? ''));

  constructor() {
    effect(() => {
      const p = this.post();
      if (!p) {
        this.jsonLd.remove('article');
        return;
      }
      this.seo.apply({
        title: p.title,
        description: p.description,
        path: `/blog/${p.slug}`,
        ogImage: p.ogImage ? `https://typelessity.com${p.ogImage}` : undefined,
        type: 'article',
        publishedAt: p.publishedAt,
        updatedAt: p.updatedAt,
        author: p.author,
        // Google, «Image SEO best practices» / Discover: a large preview needs the tag (L12, C9). SeoService removes it on every other page.
        robots: 'max-image-preview:large',
      });
      this.jsonLd.set('article', articleLd(p));
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
    const url = `https://typelessity.com/blog/${slug}`;
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
