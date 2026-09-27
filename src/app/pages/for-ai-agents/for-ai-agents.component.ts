import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../i18n/translation.service';
import { SeoService } from '../../core/seo/seo.service';
import { JsonLdService } from '../../core/seo/json-ld.service';
import { breadcrumbLd, organizationLd, softwareApplicationLd } from '../../core/seo/schemas';

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
  private readonly jsonLd = inject(JsonLdService);

  ngOnInit(): void {
    this.seo.apply({
      title: this.t.t('seo.forAiAgents.title'),
      description: this.t.t('seo.forAiAgents.description'),
      path: '/for-ai-agents',
    });
    this.jsonLd.set('organization', organizationLd());
    this.jsonLd.set('software', softwareApplicationLd());
    this.jsonLd.set('breadcrumb', breadcrumbLd([
      { name: 'Home', path: '/' },
      { name: 'For AI Agents', path: '/for-ai-agents' },
    ]));
  }

  protected readonly sessionSchema = `{
  "id": "<session id>",
  "configId": "<your config id>",
  "state": "COLLECTING | READY_TO_SUBMIT | … | COMPLETED",
  "extractedData": { "<field>": "<value>", ... },
  "createdAt": "<ISO-8601>",
  "updatedAt": "<ISO-8601>",
  "bookingResult": { ... }
}`;

  protected readonly bookingSchema = `{
  "success": true,
  "bookingId": "<the id your system returned, or bkg_…>",
  "outcome": "booking | request"
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
