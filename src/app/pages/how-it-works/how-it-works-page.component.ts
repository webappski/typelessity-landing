import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { EMBED_SNIPPET } from '../../core/integrations/embed-snippet';
import { PadNumberPipe } from '../../core/utils/pad-number.pipe';
import { HOME, pilotSignupUrl } from '../home/home.content';

@Component({
  selector: 'app-how-it-works-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PadNumberPipe],
  styleUrl: './how-it-works-page.component.scss',
  template: `

    <section class="vc-wrap how-hero">
      <div class="vc-kicker"><span class="vc-kicker-bar"></span>How it works</div>
      <h1>{{ c.howItWorks.title }}</h1>
      <p class="vc-section-sub">{{ c.howItWorks.sub }}</p>
    </section>

    @for (p of c.howItWorks.phases; track p.n) {
      <section class="vc-wrap how-phase">
        <header class="how-phase__head">
          <div class="how-phase__num">{{ p.n }}</div>
          <div>
            <h2>{{ p.name }}</h2>
            <p class="how-phase__one">{{ p.oneLine }}</p>
          </div>
        </header>
        <div class="how-phase__grid">
          <p class="how-phase__body">{{ p.body }}</p>
          <aside class="how-phase__example">
            <div class="how-phase__example-l">Input</div>
            <div class="how-phase__example-t">{{ p.example }}</div>
            <ul class="how-phase__ext">
              @for (e of p.extracts; track e) { <li>{{ e }}</li> }
            </ul>
          </aside>
        </div>
      </section>
    }

    <section class="vc-wrap how-arch">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>Architecture</div>
        <h2>{{ c.architecture.title }}</h2>
        <p class="vc-section-sub">{{ c.architecture.sub }}</p>
      </header>
      <div class="how-arch__grid">
        @for (p of c.architecture.pillars; track p.h; let i = $index) {
          <article class="pillar">
            <div class="pillar__num">{{ i + 1 | padNumber }}</div>
            <h3 class="pillar__h">{{ p.h }}</h3>
            <p class="pillar__b">{{ p.b }}</p>
          </article>
        }
      </div>
    </section>

    <section class="vc-wrap how-inside">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Inside one GPT call</div>
        <h2>What the prompt looks like</h2>
        <p class="vc-section-sub">One unified prompt extracts every field, detects corrections, generates the assistant reply, and matches options — no orchestration layer above it.</p>
      </header>
      <div class="how-inside__grid">
        <div>
          <h3 class="how-inside__h">Prompt (excerpt)</h3>
          <pre class="how-inside__code">{{ promptSample }}</pre>
        </div>
        <div>
          <h3 class="how-inside__h">Response (single JSON)</h3>
          <pre class="how-inside__code">{{ responseSample }}</pre>
        </div>
      </div>
      <p class="how-inside__note">
        The <code>_meta.mf</code> array (mentioned fields) is logged for diagnostics; the engine does not drop values by it.
        What acts in code: fields the configuration does not define are dropped, a new value for a filled field
        is treated as a correction, and the visitor reviews every field before the booking is sent.
      </p>
    </section>

    <section class="vc-wrap how-edge">
      <header class="vc-section-h">
        <div class="vc-kicker vc-accent-magenta"><span class="vc-kicker-bar"></span>Edge cases handled</div>
        <h2>What happens when things go wrong</h2>
      </header>
      <ul class="edge">
        <li>
          <strong>GPT outage</strong>
          <p>The model call is retried once. If it still fails, the widget stays in the chat and asks for the next field directly — there is no separate form mode.</p>
        </li>
        <li>
          <strong>Enrichment timeout (10s)</strong>
          <p>Non-fatal. AI continues with partial data and asks the user to confirm what was extracted.</p>
        </li>
        <li>
          <strong>User changes upstream field mid-flow</strong>
          <p>DFS-walk over the dependency graph clears stale downstream fields. Destructive cascades show a confirmation.</p>
        </li>
        <li>
          <strong>GPT hallucinates a value</strong>
          <p>Fields outside the configuration are dropped; a changed value for a filled field is treated as a correction; the visitor reviews every field before sending. <code>_meta.mf</code> is logged, not enforced.</p>
        </li>
        <li>
          <strong>Submit endpoint returns 502, 503 or 504</strong>
          <p>Retried with exponential backoff, 3 retries by default. If it still fails, the widget shows a Retry button and keeps everything the visitor entered.</p>
        </li>
      </ul>
    </section>

    <section class="vc-wrap how-pipeline">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>One turn, end to end</div>
        <h2>What happens in a single turn</h2>
        <p class="vc-section-sub">User → widget → API → GPT → enrichment → response.</p>
      </header>
      <div class="pipeline">
        <div class="pipe-node">
          <div class="pipe-t">User</div>
          <div class="pipe-l">Types or speaks</div>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipe-node">
          <div class="pipe-t">Widget</div>
          <div class="pipe-l">Captures input</div>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipe-node">
          <div class="pipe-t">API</div>
          <div class="pipe-l">Session API</div>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipe-node">
          <div class="pipe-t">GPT</div>
          <div class="pipe-l">Single call</div>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipe-node">
          <div class="pipe-t">Enrichment</div>
          <div class="pipe-l">Optional API · 10s timeout</div>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipe-node">
          <div class="pipe-t">Response</div>
          <div class="pipe-l">Filled fields + reply</div>
        </div>
      </div>
    </section>

    <section class="vc-wrap how-embed">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>Embed</div>
        <h2>Two lines of HTML</h2>
        <p class="vc-section-sub">A web component: the same code works in plain HTML, WordPress, React or Vue.</p>
      </header>
      <pre class="how-embed__code">{{ embedSnippet }}</pre>
      <p class="how-embed__note">The Install step in the Webappski portal shows the exact code for your platform.</p>
    </section>

    <section class="vc-wrap how-cta">
      <h2>Ready to replace your form?</h2>
      <div class="how-cta__actions">
        <a class="vc-btn vc-btn-primary vc-btn-lg" [href]="signupUrl('how-it-works', 'free-pilot')">Start free pilot</a>
        <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/industries">Browse industries</a>
      </div>
    </section>
  `,
})
export class HowItWorksPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  protected readonly c = HOME;
  protected readonly signupUrl = pilotSignupUrl;

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.howItWorks.title'),
      description: this.t.t('seo.howItWorks.description'),
      path: '/how-it-works',
    });
  }

  protected readonly embedSnippet = EMBED_SNIPPET;

  protected readonly promptSample = `You are a booking assistant. Extract values for the
fields below from the user's message. Only commit a
field if you see explicit evidence in the input.

Fields:
  service         (enum: brake_pads|oil_change|...)
  vehicle         (string)
  preferredDate   (ISO 8601)
  preferredTime   (HH:MM, 24h)
  customerName    (string)

Return JSON: { fields: {...}, _meta: { mf: [...] },
reply: "<assistant text>" }

User: "Brake pads for my 2019 RAV4 next Tuesday
at 2pm, name Robert Smith"`;

  protected readonly responseSample = `{
  "fields": {
    "service": "brake_pads",
    "vehicle": "2019 Toyota RAV4",
    "preferredDate": "${new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10)}",
    "preferredTime": "14:00",
    "customerName": "Robert Smith"
  },
  "_meta": {
    "mf": ["service", "vehicle", "preferredDate",
           "preferredTime", "customerName"],
    "correction": null
  },
  "reply": "Brake pads, Tue 14:00. Any mechanic you prefer?"
}`;
}
