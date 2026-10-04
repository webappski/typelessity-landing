import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { WaitlistPayload, waitlistRequestBody } from './waitlist-request';


// 'offline' — no response reached us (status 0): retrying on a working connection can help.
// 'rejected' — the server answered with an error: retrying gives the same answer, so the
// visitor gets the one path that always works — an email with their request already in it.
type Status = 'idle' | 'sending' | 'success' | 'offline' | 'rejected';

const FALLBACK_MAILBOX = 'info@webappski.com';
// Browsers and mail clients cut long mailto: links; the rest of a long message is typed again.
const MAX_MESSAGE_IN_MAILTO = 1000;

@Component({
  selector: 'app-contact-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  styleUrl: './contact-form.component.scss',
  template: `
    @if (status() !== 'success') {
      <form class="cf" (ngSubmit)="submit()" #f="ngForm" novalidate>
        <div class="cf__grid">
          <div class="cf__row">
            <label for="cf-email">Email *</label>
            <input id="cf-email" name="email" type="email" required autocomplete="email" placeholder="your@email.com" [(ngModel)]="model.email" />
          </div>
          <div class="cf__row">
            <label for="cf-website">Website URL (optional)</label>
            <input id="cf-website" name="website" type="url" autocomplete="url" placeholder="https://yourwebsite.com" [(ngModel)]="model.website" />
          </div>
        </div>
        <div class="cf__row">
          <label for="cf-plan">Plan you are asking about (optional)</label>
          <select id="cf-plan" name="plan" [(ngModel)]="model.plan">
            <option value="">Just a question, no plan yet</option>
            <option value="starter">Starter (€39/mo)</option>
            <option value="pro">Pro (€149/mo)</option>
            <option value="enterprise">Enterprise (€399/mo)</option>
          </select>
        </div>
        <div class="cf__row">
          <label for="cf-industry">Industry / Use Case (optional)</label>
          <select id="cf-industry" name="industry" [(ngModel)]="model.industry">
            <option value="">Select your industry</option>
            <option value="hospitality">Hospitality & Restaurants</option>
            <option value="transfer">Transfers & Mobility</option>
            <option value="freight">Freight & Logistics</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="cf__row">
          <label for="cf-message">Message (optional)</label>
          <textarea id="cf-message" name="message" rows="3" placeholder="Tell us about your booking flow or requirements" [(ngModel)]="model.message"></textarea>
        </div>
        <div class="cf__notice" id="cf-notice" role="note" aria-labelledby="cf-notice-h">
          <h3 id="cf-notice-h">Privacy notice for this form</h3>
          <p>
            <strong>Controller:</strong> Webappski, ul. Staniszewskiego 19b, 81-603 Gdynia, Poland — the operator named in the
            <a href="https://webappski.com/en/legal/dpa-typelessity" target="_blank" rel="noopener">Typelessity DPA</a>.
            Contact: <a href="mailto:info&#64;webappski.com">info&#64;webappski.com</a>.
          </p>
          <p>
            <strong>Why:</strong> we use the email address, website, plan, industry and message you enter only to answer your question.
            <strong>Basis:</strong> your consent (Art. 6(1)(a) GDPR), given by ticking the box below; you can withdraw it at any time by writing to us.
          </p>
          <p>
            <strong>Who receives it:</strong> Resend, which delivers the message (United States, under Standard Contractual Clauses),
            and our email hosting provider.
            <strong>How long:</strong> as long as needed to deal with your question; Resend keeps a delivery log for 30 days.
          </p>
          <p>
            <strong>Your rights:</strong> access, correction, erasure, restriction, portability and objection — write to
            info&#64;webappski.com. You can complain to the Polish supervisory authority, UODO (uodo.gov.pl), or to your own.
            Giving us this data is voluntary; without an email address we cannot reply. No automated decisions are made.
            Notice of 3 October 2026.
          </p>
        </div>
        <div class="cf__row">
          <label for="cf-consent">
            <input id="cf-consent" type="checkbox" name="consent" required [(ngModel)]="model.consent" />
            <span>I agree that Webappski uses these details to answer my question, as set out in the privacy notice above.&nbsp;*</span>
          </label>
        </div>
        <button type="submit" class="vc-btn vc-btn-primary vc-btn-lg vc-btn-block" [disabled]="status() === 'sending' || !f.valid">
          {{ status() === 'sending' ? 'Sending…' : 'Send' }}
        </button>
        @if (status() === 'offline') {
          <p class="cf__msg cf__msg--err" role="alert">We couldn't reach our server. Please check your connection and try again.</p>
        }
        @if (status() === 'rejected') {
          <p class="cf__msg cf__msg--err" role="alert">We couldn't send your request. Please email us at <a [href]="mailtoHref()">info&#64;webappski.com</a> — your details are already in the email.</p>
        }
      </form>
    } @else {
      <div class="cf__success" role="status" aria-live="polite">
        <h3>Thanks — we’ll reply by email.</h3>
      </div>
    }
  `,
})
export class ContactFormComponent {
  private readonly http = inject(HttpClient);

  protected readonly model: WaitlistPayload = {
    email: '',
    website: '',
    plan: '',
    industry: '',
    message: '',
    consent: false,
  };

  protected readonly status = signal<Status>('idle');

  protected async submit(): Promise<void> {
    if (this.status() === 'sending') return;
    this.status.set('sending');
    try {
      await firstValueFrom(
        this.http.post('/api/contact', waitlistRequestBody(this.model)),
      );
      this.status.set('success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Question form submission failed', { message });
      const noResponse = error instanceof HttpErrorResponse && error.status === 0;
      this.status.set(noResponse ? 'offline' : 'rejected');
    }
  }

  protected mailtoHref(): string {
    const m = this.model;
    const note = (m.message ?? '').trim();
    const body = [
      'Question about Typelessity',
      '',
      `Email: ${m.email}`,
      `Website: ${m.website || '—'}`,
      `Plan: ${m.plan || '—'}`,
      `Industry: ${m.industry || '—'}`,
      note ? `\n${note.length > MAX_MESSAGE_IN_MAILTO ? `${note.slice(0, MAX_MESSAGE_IN_MAILTO)}…` : note}` : '',
    ].join('\n');
    const subject = m.plan ? `Typelessity question — ${m.plan}` : 'Typelessity question';
    return `mailto:${FALLBACK_MAILBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
