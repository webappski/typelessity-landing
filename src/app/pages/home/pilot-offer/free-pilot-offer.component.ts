import { ChangeDetectionStrategy, Component, afterNextRender, computed, inject, signal } from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { EntryUtmSource } from '../../../core/pilot-offer/entry-utm-source';
import { SOURCE_A, detectPilotSource, type PilotSource } from '../../../core/pilot-offer/pilot-offer-source';

const UTM = 'utm_source=typelessity.com&utm_campaign=free-pilot&utm_medium=banner';

/**
 * The Webappski strip of the home page (L17 D4): the look and the states of the strip of typelessform.com (rev. 10, approved there 19.10), on the tokens of this
 * landing, inside the hero after the demo and before «Behind the chat». The server and the prerender always draw state a; in the browser the source is picked
 * once, after hydration, from document.referrer and the utm_source of the entry address, and the text and both addresses follow. There is no height reserve
 * (founder 22.10): the strip stands below the first screen at every width, so a change of text happens out of sight and counts as no layout shift; a visitor
 * who has already scrolled to it before hydration sees the text change under their eyes (accepted).
 */
@Component({
  selector: 'app-free-pilot-offer',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './free-pilot-offer.component.html',
  styleUrl: './free-pilot-offer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FreePilotOfferComponent {
  protected readonly source = signal<PilotSource>(SOURCE_A);
  protected readonly isB = computed(() => this.source().state === 'b');
  /** The assistant's name in state b; empty otherwise. */
  protected readonly sourceName = computed(() => {
    const source = this.source();
    return source.state === 'b' ? source.name : '';
  });
  /** Who «your customers ask» in line 2: the named assistant in b, «AI» in a. */
  protected readonly assistant = computed(() => this.sourceName() || 'AI');
  protected readonly buttonHref = computed(() => `https://webappski.com/en/free-aeo-pilot?${UTM}&utm_content=${this.source().state}`);
  protected readonly nameHref = computed(() => `https://webappski.com/en?${UTM}&utm_content=${this.source().state}-name`);

  constructor() {
    const doc = inject(DOCUMENT);
    const entry = inject(EntryUtmSource);
    afterNextRender(() => this.source.set(detectPilotSource(entry.value, doc.referrer)));
  }
}
