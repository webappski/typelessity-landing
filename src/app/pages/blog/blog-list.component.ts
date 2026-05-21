import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { BLOG_POSTS } from '../../lib/blog-manifest.generated';
import type { BlogPost } from '../../lib/types';

interface PostGroup {
  category: string;
  posts: BlogPost[];
}

@Component({
  selector: 'app-blog-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, DecimalPipe],
  styleUrl: './blog-list.component.scss',
  template: `
    @let f = featured();

    <section class="blog-hero">
      <div class="blog-hero__inner">
        <div class="blog-hero__kicker">
          <span class="blog-hero__bar"></span>
          <span>The Typelessity Journal</span>
        </div>
        <h1 class="blog-hero__title">
          Field notes on <em>conversational</em> AI&nbsp;booking.
        </h1>
        <p class="blog-hero__sub">
          Architecture decisions, latency math, compliance contours, and category essays from building the AI conversational booking widget.
        </p>
        <div class="blog-hero__stats">
          <div><strong>{{ posts.length }}</strong><span>writeups</span></div>
          <div><strong>{{ totalWords() | number }}</strong><span>words</span></div>
          <div><strong>{{ totalReadMinutes() }}</strong><span>min total read</span></div>
        </div>
      </div>
    </section>

    @if (f) {
      <section class="blog-feature">
        <a class="blog-feature__card" [routerLink]="'/blog/' + f.slug">
          <div class="blog-feature__eyebrow">
            <span class="blog-feature__pulse"></span>
            <span>Featured · {{ f.category }}</span>
          </div>
          <h2 class="blog-feature__title">{{ f.title }}</h2>
          <p class="blog-feature__desc">{{ f.description }}</p>
          <div class="blog-feature__meta">
            <time [attr.datetime]="f.publishedAt">{{ f.publishedAt | date:'longDate' }}</time>
            <span aria-hidden="true">·</span>
            <span>{{ readingTime(f.body) }} min read</span>
            <span aria-hidden="true">·</span>
            <span>{{ f.author }}</span>
          </div>
          <span class="blog-feature__cta">
            <span>Read the comparison</span>
            <span aria-hidden="true">→</span>
          </span>
        </a>
      </section>
    }

    <section class="blog-archive">
      @for (group of groups(); track group.category) {
        <div class="blog-archive__group">
          <header class="blog-archive__head">
            <span class="blog-archive__counter">{{ pad($index + 1) }}</span>
            <h2 class="blog-archive__title">{{ group.category }}</h2>
            <span class="blog-archive__count">{{ group.posts.length }} {{ group.posts.length === 1 ? 'piece' : 'pieces' }}</span>
          </header>

          <ol class="blog-archive__list">
            @for (post of group.posts; track post.slug) {
              <li class="blog-row">
                <a class="blog-row__link" [routerLink]="'/blog/' + post.slug">
                  <time class="blog-row__date" [attr.datetime]="post.publishedAt">
                    {{ post.publishedAt | date:'MMM d, y' }}
                  </time>
                  <h3 class="blog-row__title">{{ post.title }}</h3>
                  <p class="blog-row__desc">{{ post.description }}</p>
                  <span class="blog-row__meta">
                    <span>{{ readingTime(post.body) }} min</span>
                    <span aria-hidden="true">·</span>
                    <span>{{ wordCount(post.body) | number }} words</span>
                    @for (tag of post.tags.slice(0, 2); track tag) {
                      <span aria-hidden="true">·</span>
                      <span class="blog-row__tag">{{ tag }}</span>
                    }
                  </span>
                  <span class="blog-row__arrow" aria-hidden="true">→</span>
                </a>
              </li>
            }
          </ol>
        </div>
      }
    </section>
  `,
})
export class BlogListComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  protected readonly posts = BLOG_POSTS;

  /** Featured = newest Comparison post, fallback to newest overall */
  protected readonly featured = computed<BlogPost | undefined>(() => {
    const comparison = this.posts.find((p) => p.category === 'Comparison');
    return comparison ?? this.posts[0];
  });

  /** Archive = all posts except featured, grouped by category */
  protected readonly groups = computed<PostGroup[]>(() => {
    const featuredSlug = this.featured()?.slug;
    const rest = this.posts.filter((p) => p.slug !== featuredSlug);
    const map = new Map<string, BlogPost[]>();
    for (const p of rest) {
      const key = p.category;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    // Stable, hand-tuned order — most-cited categories first
    const order = ['Comparison', 'Engineering', 'Compliance', 'Product', 'Business', 'AEO', 'Founder'];
    return [...map.entries()]
      .sort((a, b) => {
        const ai = order.indexOf(a[0]);
        const bi = order.indexOf(b[0]);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map(([category, posts]) => ({ category, posts }));
  });

  protected readonly totalWords = computed(() =>
    this.posts.reduce((sum, p) => sum + p.body.trim().split(/\s+/).length, 0),
  );

  protected readonly totalReadMinutes = computed(() =>
    Math.round(this.totalWords() / 230),
  );

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.blog.title'),
      description: this.t.t('seo.blog.description'),
      path: '/blog',
    });
  }

  protected readingTime(body: string): number {
    const words = body.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 230));
  }

  protected wordCount(body: string): number {
    return body.trim().split(/\s+/).length;
  }

  protected pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
