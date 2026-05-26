import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { EMBED_SNIPPET } from '../../core/integrations/embed-snippet';
import { PadNumberPipe } from '../../core/utils/pad-number.pipe';
import { HOME } from '../home/home.content';

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
          <h3 class="how-inside__h">Prompt (≈420 tokens)</h3>
          <pre class="how-inside__code">{{ promptSample }}</pre>
        </div>
        <div>
          <h3 class="how-inside__h">Response (single JSON)</h3>
          <pre class="how-inside__code">{{ responseSample }}</pre>
        </div>
      </div>
      <p class="how-inside__note">
        The <code>_meta.mf</code> array (mentioned-fields) is the anti-hallucination guard:
        a field's value is only committed if its name appears in <code>mf</code>.
        Phantom extractions are filtered before the field reaches the form layer.
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
          <p>Widget falls back to a minimal form path with the same field config. Booking never breaks.</p>
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
          <p>Filtered by <code>_meta.mf</code> guard. Code-side correction guard catches drift.</p>
        </li>
        <li>
          <strong>Submit endpoint 5xx</strong>
          <p>Exponential backoff (3 retries). Final failure surfaces a retry button — session state is preserved.</p>
        </li>
      </ul>
    </section>

    <section class="vc-wrap how-pipeline">
      <header class="vc-section-h">
        <div class="vc-kicker"><span class="vc-kicker-bar"></span>One turn, end to end</div>
        <h2>What happens in a single turn</h2>
        <p class="vc-section-sub">User → widget → API → GPT → enrichment → response. Median 200–800ms.</p>
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
          <div class="pipe-l">/agent/turn</div>
        </div>
        <span class="pipe-arrow">→</span>
        <div class="pipe-node">
          <div class="pipe-t">GPT</div>
          <div class="pipe-l">Single call · 200–800ms</div>
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
        <h2>One line of HTML</h2>
        <p class="vc-section-sub">Drop into any page. React, Vue, plain HTML — same script tag.</p>
      </header>
      <pre class="how-embed__code">{{ embedSnippet }}</pre>
      <p class="how-embed__note">For React, the script auto-mounts to <code>&lt;div id="typelessity-widget"&gt;</code>. Vue and Svelte hooks ship with the same package.</p>
    </section>

    <section class="vc-wrap how-cta">
      <h2>Ready to replace your form?</h2>
      <div class="how-cta__actions">
        <a class="vc-btn vc-btn-primary vc-btn-lg" routerLink="/pricing" fragment="start-pilot">Join Waitlist</a>
        <a class="vc-btn vc-btn-ghost vc-btn-lg" routerLink="/industries">Browse industries</a>
      </div>
    </section>
  `,
})
export class HowItWorksPageComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);
  protected readonly c = HOME;

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
  specialty       (enum: cardiology|dermatology|...)
  preferredDate   (ISO 8601)
  preferredTime   (HH:MM, 24h)
  patientName     (string)
  doctorGender    (enum: M|F|any)

Return JSON: { fields: {...}, _meta: { mf: [...] },
reply: "<assistant text>" }

User: "I need a cardiologist next Tuesday at 2pm,
patient name Robert Smith"`;

  protected readonly responseSample = `{
  "fields": {
    "specialty": "cardiology",
    "preferredDate": "${new Date(Date.now() + 7 * 86400e3).toISOString().slice(0, 10)}",
    "preferredTime": "14:00",
    "patientName": "Robert Smith"
  },
  "_meta": {
    "mf": ["specialty", "preferredDate", "preferredTime", "patientName"],
    "correction": null
  },
  "reply": "Got it — cardiology, next Tuesday at 14:00, for Robert Smith. Any preference for the doctor?"
}`;
}
