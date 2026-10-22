import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, OnInit, PLATFORM_ID, afterNextRender, inject, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { SeoService } from '../../core/seo/seo.service';
import { organizationLd, softwareApplicationLd, websiteLd } from '../../core/seo/schemas';
import { EMBED_SNIPPET } from '../../core/integrations/embed-snippet';
import { LANDING_LANGUAGES } from '../../core/languages/landing-languages';
import { IconComponent } from '../../shared/icon/icon.component';
import { TypelessityWidgetComponent } from '../../widgets/typelessity-widget/typelessity-widget.component';
import { getBlogIndexEntry } from '../../lib/blog-index.generated';
import { FAQ_GROUPS } from '../faq/faq.content';
import { HOME, PILOT_REQUESTS, pilotSignupUrl } from './home.content';
import {
  DEMO_CAPTIONS, DEMO_LANGS, DEMO_TABS, LANGNOTE, LANGS_MORE_COUNT, LANGS_MORE_HEAD, LANGS_MORE_NAMES, LANGS_MORE_TAIL, LANGS_MORE_TITLE,
  SLOT_HEIGHT_MOBILE_PX, SLOT_HEIGHT_PX, staticChain, type SlotState,
} from './demo/demo-labels';
import { DemoSession } from './demo/demo-session';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TypelessityWidgetComponent, IconComponent],
  styleUrl: './home.component.scss',
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  private readonly jsonLd = inject(JsonLdService);
  private readonly doc = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly c = HOME;
  protected readonly signupUrl = pilotSignupUrl;
  protected readonly embedSnippet = EMBED_SNIPPET;
  protected readonly pilotRequests = PILOT_REQUESTS;
  /** the fourth number of «What it is»: the lines of the embed code, counted from the code itself */
  protected readonly embedLines = EMBED_SNIPPET.split('\n').length;

  // ── the demo ──
  /** What the slot says: `prerender` in the HTML, `loading` after hydration, `failed`, `ready` once the widget stands in it. */
  protected readonly slot = signal<SlotState>('prerender');
  protected readonly scenario = signal('salon');
  protected readonly lang = signal('en');
  protected readonly tipsOff = signal(false);
  /** «…+22» is pinned open by a click or Enter (aria-expanded); hover and keyboard focus show the tooltip by CSS alone */
  protected readonly moreOpen = signal(false);
  /** Esc closes the tooltip while the pointer or the focus is still on it (WCAG 1.4.13 dismissible); leaving the button brings it back to normal */
  protected readonly moreDismissed = signal(false);
  protected readonly tabs = DEMO_TABS;
  protected readonly langs = DEMO_LANGS;
  protected readonly cap = DEMO_CAPTIONS;
  protected readonly langnote = LANGNOTE;
  protected readonly moreCount = LANGS_MORE_COUNT;
  protected readonly moreHead = LANGS_MORE_HEAD;
  protected readonly moreNames = LANGS_MORE_NAMES.join(' · ');
  protected readonly moreTail = LANGS_MORE_TAIL;
  protected readonly moreTitle = LANGS_MORE_TITLE;
  /** ONE height for the slot (CLS): the frame holds it from the first paint, the controller fixes the widget panel to it */
  protected readonly slotHeight = `${SLOT_HEIGHT_PX}px`;
  protected readonly slotHeightMobile = `${SLOT_HEIGHT_MOBILE_PX}px`;

  /** The static example of «Behind the chat» before the demo plays: the first scenario, in English. The demo rewrites the cards. */
  protected readonly ex = staticChain();
  protected readonly exJson = this.ex.json
    .map(([k, v], i, all) => `  <span class="j-k">"${esc(k)}"</span>: <span class="j-v">"${esc(v)}"</span>${i < all.length - 1 ? ',' : ''}`)
    .join('\n');
  protected readonly exJsonBody = `<span class="j-k">{</span>\n${this.exJson}\n<span class="j-k">}</span>`;
  protected readonly exRows = this.ex.rows
    .map((r) => `<div class="chain-row"><span class="chain-row__dot"></span><span>${esc(r)}</span></div>`)
    .join('');

  // ── the page ──
  protected readonly languages = LANDING_LANGUAGES;
  protected readonly posts = HOME.blog.slugs.map((slug) => {
    const post = getBlogIndexEntry(slug);
    if (!post) throw new Error(`home: the blog post ${slug} is not in the blog index`);
    return { slug, title: post.title, category: post.category };
  });
  protected readonly languagesArticle = (() => {
    const post = getBlogIndexEntry(HOME.languages.article.slug);
    if (!post) throw new Error(`home: the blog post ${HOME.languages.article.slug} is not in the blog index`);
    return { slug: post.slug, title: post.title };
  })();
  /** D8: six questions of /faq, found by their exact text; the answer is the answer of /faq */
  protected readonly faqItems = HOME.faq.questions.map((q) => {
    const item = FAQ_GROUPS.flatMap((g) => g.items).find((i) => i.q === q);
    if (!item) throw new Error(`home: the FAQ question «${q}» is not on /faq`);
    return item;
  });

  private demo: DemoSession | null = null;

  constructor() {
    afterNextRender(() => this.session()?.begin());
    inject(DestroyRef).onDestroy(() => { this.demo?.destroy(); this.demo = null; });
  }

  /** One session per visit to `/`; browser only. Created by the first door that needs it (an early click is replayed after hydration). */
  private session(): DemoSession | null {
    if (!this.isBrowser) return null;
    return (this.demo ??= new DemoSession(this.host.nativeElement, this.doc, {
      slot: (s) => this.slot.set(s),
      scenario: (id) => this.scenario.set(id),
      lang: (code) => this.lang.set(code),
      tips: (off) => this.tipsOff.set(off),
    }));
  }

  protected pick(id: string): void { this.session()?.pick(id); }
  protected setLang(code: string): void { this.session()?.setLang(code); }
  protected takeOver(): void { this.session()?.takeOver(); }
  protected setTips(off: boolean): void { this.session()?.setTips(off); }
  /** a click or Enter pins the tooltip (or unpins it); after Esc it must show again, so the dismissal is lifted first */
  protected toggleMore(): void { this.moreDismissed.set(false); this.moreOpen.update((v) => !v); }

  @HostListener('document:keydown.escape')
  protected closeMore(): void { this.moreDismissed.set(true); this.moreOpen.set(false); }

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.home.title'),
      description: this.t.t('seo.home.description'),
      path: '/',
    });
    this.jsonLd.set('org', organizationLd());
    this.jsonLd.set('website', websiteLd());
    this.jsonLd.set('app', softwareApplicationLd());
  }
}
