import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService, type SeoLocale } from '../../core/seo/seo.service';

@Component({
  selector: 'app-for-ai-agents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './for-ai-agents.component.html',
  styleUrl: './for-ai-agents.component.scss',
})
export class ForAiAgentsComponent implements OnInit {
  protected readonly t = inject(TranslationService);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.forAiAgents.title'),
      description: this.t.t('seo.forAiAgents.description'),
      path: '/for-ai-agents',
      locale: this.t.lang() as SeoLocale,
    });
  }

  protected readonly sessionSchema = `{
  "id": "ses_a8f3e1",
  "config": "your-config-id",
  "lang": "en",
  "fields": { "<field>": "<value>", ... },
  "_meta": { "mf": ["<field>"], "correction": null },
  "createdAt": "<ISO-8601>",
  "completed": false
}`;

  protected readonly bookingSchema = `{
  "bookingId": "bk_a8f3e1",
  "sessionId": "ses_a8f3e1",
  "fields": { ... },
  "submittedAt": "<ISO-8601>",
  "status": "confirmed | pending | failed"
}`;

  protected readonly agentRequest = `POST /agent/turn
Content-Type: application/json

{
  "session": "ses_a8f3e1",
  "input": "<natural-language string>",
  "lang": "en"
}`;

  protected readonly agentResponse = `200 OK
{
  "session": "ses_a8f3e1",
  "fields": { "<field>": "<value>", ... },
  "reply": "<assistant text>",
  "needs": ["<missing-field>", ...],
  "completed": false
}`;
}
