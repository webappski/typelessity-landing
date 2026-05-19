import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const PHRASES = [
  'need a cardiologist next tuesday morning, ideally female',
  'book a table for 4 friday 8pm, vegan options please',
  'deep clean my 2-bed apartment this saturday morning',
  'schedule MOT for my BMW X5, saturday afternoon if possible',
  'italy tourist visa, departure in a month, docs ready',
] as const;

type Phase = 'typing' | 'extracting' | 'done';

function nextTuesdayIso(now: Date = new Date()): string {
  const d = new Date(now);
  const daysUntilTue = (2 - d.getUTCDay() + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilTue);
  return d.toISOString().slice(0, 10);
}

@Component({
  selector: 'app-live-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './live-demo.component.scss',
  template: `
    <div class="ld" role="img" aria-label="Typelessity live demo — typing → extracting → API call">
      <div class="ld__glow" aria-hidden="true"></div>

      <div class="ld__left">
        <div class="ld__card ld__chat">
          <div class="ld__h">
            <span class="ld__h-l" aria-hidden="true">·············</span>
            <span class="ld__h-t">MedBook · booking</span>
          </div>
          <div class="ld__bubble">How can I help you today?</div>
          <div class="ld__input">
            <span class="ld__typed">{{ typed() }}</span>
            <span class="ld__caret" aria-hidden="true"></span>
          </div>
          <div class="ld__mic">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
            <span>voice · 25 lang</span>
          </div>
        </div>
      </div>

      <div class="ld__right">
        <div class="ld__card ld__extract" [class.is-active]="phase() !== 'typing'">
          <div class="ld__h">
            <span class="ld__h-t">extracted.json</span>
            <span class="ld__pulse" aria-hidden="true"></span>
          </div>
          <pre class="ld__code">{{ extractedJson }}</pre>
        </div>

        <div class="ld__arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v16M6 14l6 6 6-6"/></svg>
        </div>

        <div class="ld__card ld__api" [class.is-active]="phase() === 'done'">
          <div class="ld__h">
            <span class="ld__h-t">GET /doctors</span>
            <span class="ld__tag">200</span>
          </div>
          <div class="ld__rows">
            <div class="ld__row"><span class="ld__row-d"></span><span>Dr. M. Chen · Cardiology · Tue 09:30</span></div>
            <div class="ld__row"><span class="ld__row-d"></span><span>Dr. A. Lopez · Cardiology · Tue 11:00</span></div>
            <div class="ld__row"><span class="ld__row-d"></span><span>Dr. S. Patel · Cardiology · Wed 08:15</span></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LiveDemoComponent {
  private readonly platform = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly phaseIdx = signal(0);
  protected readonly typed = signal('');
  protected readonly phase = signal<Phase>('typing');

  protected readonly extractedJson = `{
  "specialty": "cardiology",
  "preferredDate": "${nextTuesdayIso()}",
  "doctorGender": "F"
}`;

  private timerId: ReturnType<typeof setTimeout> | null = null;

  private schedule(fn: () => void, ms: number): void {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(fn, ms);
  }

  constructor() {
    if (!isPlatformBrowser(this.platform)) {
      // SSR: show first phrase already typed for prerender
      this.typed.set(PHRASES[0]);
      this.phase.set('done');
      return;
    }
    this.tick();
    this.destroyRef.onDestroy(() => {
      if (this.timerId) clearTimeout(this.timerId);
    });
  }

  private tick(): void {
    const target = PHRASES[this.phaseIdx()];
    const ph = this.phase();

    if (ph === 'typing') {
      const cur = this.typed();
      if (cur.length < target.length) {
        this.schedule(() => {
          this.typed.set(target.slice(0, cur.length + 1));
          this.tick();
        }, 28 + Math.random() * 30);
      } else {
        this.schedule(() => {
          this.phase.set('extracting');
          this.tick();
        }, 450);
      }
      return;
    }

    if (ph === 'extracting') {
      this.schedule(() => {
        this.phase.set('done');
        this.tick();
      }, 1100);
      return;
    }

    if (ph === 'done') {
      this.schedule(() => {
        this.phaseIdx.update((i) => (i + 1) % PHRASES.length);
        this.typed.set('');
        this.phase.set('typing');
        this.tick();
      }, 2200);
    }
  }
}
