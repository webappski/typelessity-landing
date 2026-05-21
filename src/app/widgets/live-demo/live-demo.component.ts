// Live demo: per-phrase data-driven (rev 2026-05-20).
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type Phase = 'typing' | 'extracting' | 'done';

interface Result {
  readonly name: string;
  readonly meta: string;
}

interface Demo {
  readonly phrase: string;
  readonly surfaceLabel: string;
  readonly greeting: string;
  readonly endpoint: string;
  readonly extracted: Readonly<Record<string, string>>;
  readonly results: readonly Result[];
}

/** Returns next occurrence of the given weekday (0=Sun..6=Sat) as ISO yyyy-mm-dd. */
function nextWeekdayIso(targetDow: number, now: Date = new Date()): string {
  const d = new Date(now);
  const daysUntil = (targetDow - d.getUTCDay() + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntil);
  return d.toISOString().slice(0, 10);
}

function isoInDays(days: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEMOS: readonly Demo[] = [
  {
    phrase: 'need a cardiologist next tuesday morning, ideally female',
    surfaceLabel: 'MedBook · booking',
    greeting: 'How can I help you today?',
    endpoint: 'GET /doctors',
    extracted: {
      specialty: 'cardiology',
      preferredDate: nextWeekdayIso(2),
      timeWindow: 'morning',
      doctorGender: 'F',
    },
    results: [
      { name: 'Dr. M. Chen', meta: 'Cardiology · Tue 09:30' },
      { name: 'Dr. A. Lopez', meta: 'Cardiology · Tue 11:00' },
      { name: 'Dr. S. Patel', meta: 'Cardiology · Wed 08:15' },
    ],
  },
  {
    phrase: 'book a table for 4 friday 8pm, vegan options please',
    surfaceLabel: 'TastePlace · reservation',
    greeting: 'When would you like the table?',
    endpoint: 'GET /tables',
    extracted: {
      partySize: '4',
      date: nextWeekdayIso(5),
      time: '20:00',
      dietary: 'vegan',
    },
    results: [
      { name: 'Window 2', meta: 'Seats 4 · Fri 20:00' },
      { name: 'Patio 5', meta: 'Seats 4 · Fri 20:15' },
      { name: 'Bar Hi-Top 1', meta: 'Seats 4 · Fri 19:45' },
    ],
  },
  {
    phrase: 'deep clean my 2-bed apartment this saturday morning',
    surfaceLabel: 'CleanCo · service',
    greeting: 'What needs cleaning, and when?',
    endpoint: 'GET /cleaners',
    extracted: {
      service: 'deep_clean',
      bedrooms: '2',
      date: nextWeekdayIso(6),
      timeWindow: 'morning',
    },
    results: [
      { name: 'Team Aurora', meta: '2 cleaners · Sat 09:00' },
      { name: 'Team Vega', meta: '2 cleaners · Sat 10:30' },
      { name: 'Team Orion', meta: '3 cleaners · Sat 08:00' },
    ],
  },
  {
    phrase: 'schedule MOT for my BMW X5, saturday afternoon if possible',
    surfaceLabel: 'AutoPit · workshop',
    greeting: 'What service does your vehicle need?',
    endpoint: 'GET /slots',
    extracted: {
      service: 'MOT',
      vehicleMake: 'BMW',
      vehicleModel: 'X5',
      date: nextWeekdayIso(6),
      timeWindow: 'afternoon',
    },
    results: [
      { name: 'Bay 2', meta: 'MOT · Sat 13:00' },
      { name: 'Bay 4', meta: 'MOT · Sat 14:30' },
      { name: 'Bay 1', meta: 'MOT · Sat 16:00' },
    ],
  },
  {
    phrase: 'italy tourist visa, departure in a month, docs ready',
    surfaceLabel: 'VisaDesk · intake',
    greeting: 'Tell me about your trip.',
    endpoint: 'GET /consultations',
    extracted: {
      visaType: 'IT_tourist',
      departureBy: isoInDays(30),
      docsReady: 'true',
    },
    results: [
      { name: 'Maria L.', meta: 'Visa intake · Mon 11:00' },
      { name: 'Andrei K.', meta: 'Visa intake · Tue 09:30' },
      { name: 'Sofia D.', meta: 'Visa intake · Wed 14:00' },
    ],
  },
] as const;

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
            <span class="ld__h-t">{{ current().surfaceLabel }}</span>
          </div>
          <div class="ld__bubble">{{ current().greeting }}</div>
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
          <pre class="ld__code">{{ extractedJson() }}</pre>
        </div>

        <div class="ld__arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 4v16M6 14l6 6 6-6"/></svg>
        </div>

        <div class="ld__card ld__api" [class.is-active]="phase() === 'done'">
          <div class="ld__h">
            <span class="ld__h-t">{{ current().endpoint }}</span>
            <span class="ld__tag">200</span>
          </div>
          <div class="ld__rows">
            @for (r of current().results; track r.name) {
              <div class="ld__row"><span class="ld__row-d"></span><span>{{ r.name }} · {{ r.meta }}</span></div>
            }
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

  protected current(): Demo {
    return DEMOS[this.phaseIdx()];
  }

  protected extractedJson(): string {
    return JSON.stringify(this.current().extracted, null, 2);
  }

  private timerId: ReturnType<typeof setTimeout> | null = null;

  private schedule(fn: () => void, ms: number): void {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(fn, ms);
  }

  constructor() {
    if (!isPlatformBrowser(this.platform)) {
      // SSR: show first demo fully typed for prerender
      this.typed.set(DEMOS[0].phrase);
      this.phase.set('done');
      return;
    }
    this.tick();
    this.destroyRef.onDestroy(() => {
      if (this.timerId) clearTimeout(this.timerId);
    });
  }

  private tick(): void {
    const target = this.current().phrase;
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
        this.phaseIdx.update((i) => (i + 1) % DEMOS.length);
        this.typed.set('');
        this.phase.set('typing');
        this.tick();
      }, 2400);
    }
  }
}
