import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { getIndustriesByCategory } from '../../lib/industries';
import { EMAIL_PATTERN, WaitlistPayload, waitlistRequestBody } from './waitlist-request';


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
            <!-- The pattern is the endpoint's own rule (EMAIL_PATTERN, one constant for both): what the form lets through the server accepts. -->
            <input id="cf-email" name="email" type="email" required [pattern]="emailPattern" maxlength="254" autocomplete="email" placeholder="your@email.com"
              [(ngModel)]="model.email" #email="ngModel" (keydown.enter)="email.control.markAsTouched()"
              [class.invalid]="email.invalid && email.touched" [attr.aria-invalid]="email.invalid && email.touched ? 'true' : null"
              [attr.aria-describedby]="email.invalid && email.touched ? 'cf-email-error' : null" />
            @if (email.invalid && email.touched) {
              <div class="cf__error" id="cf-email-error" role="alert"><span class="cf__visually-hidden">Error: </span>Enter an email address in the correct format, like name@example.com</div>
            }
          </div>
          <div class="cf__row">
            <label for="cf-website">Website URL (optional)</label>
            <input id="cf-website" name="website" type="url" maxlength="2048" autocomplete="url" placeholder="https://yourwebsite.com" [(ngModel)]="model.website" />
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
            @for (group of industryGroups; track group.category) {
              <optgroup [label]="group.category">
                @for (industry of group.industries; track industry.slug) {
                  <option [value]="industry.slug">{{ industry.name }}</option>
                }
              </optgroup>
            }
            <option value="other">Other</option>
          </select>
        </div>
        <div class="cf__row">
          <label for="cf-message">Message (optional)</label>
          <textarea id="cf-message" name="message" rows="3" maxlength="5000" placeholder="Tell us about your booking flow or requirements" [(ngModel)]="model.message"></textarea>
        </div>
        <div class="cf__notice" id="cf-notice" role="note" aria-labelledby="cf-notice-h">
          <h3 id="cf-notice-h">Privacy notice for this form</h3>
          <p>
            <strong>Controller:</strong> Victoria Isayeuskaya, sole proprietorship (jednoosobowa działalność gospodarcza), the owner of webappski.com,
            ul. Staniszewskiego 19b, 81-603 Gdynia, Poland, VAT ID (EU): PL5862405795.
            Contact: <a href="mailto:info&#64;webappski.com">info&#64;webappski.com</a>.
          </p>
          <p>
            <strong>Why:</strong> we use the email address, website, plan, industry and message you enter only to answer your question and to continue the conversation if you write again within the period under «How long».
            <strong>Basis:</strong> your consent (Art. 6(1)(a) GDPR), given by ticking the box below. You can withdraw it at any time by writing to
            info&#64;webappski.com; this does not affect processing before the withdrawal.
          </p>
          <p>
            <strong>Who receives it:</strong>
            Resend, which delivers the message (Plus Five Five, Inc., United States);
            Vercel, which runs the form's function and so reads your request (Vercel Inc., United States; the region is not fixed);
            Cloudflare, which routes our mail (Cloudflare, Inc., United States);
            Google, which holds our mailbox (Google may process it in the United States).
            <strong>Transfers to the United States</strong> rest on the European Commission's
            <a href="https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/eu-us-data-transfers_en" target="_blank" rel="noopener">adequacy decision of 10 July 2023</a>
            for the EU-US Data Privacy Framework (Art. 45 GDPR): Resend, Vercel, Cloudflare and Google LLC state that they are certified under it.
            Resend and Cloudflare also apply the EU Standard Contractual Clauses (Art. 46 GDPR). A copy is available from info&#64;webappski.com,
            and both publish them in their DPAs: <a href="https://resend.com/legal/dpa" target="_blank" rel="noopener">Resend's DPA</a>,
            <a href="https://www.cloudflare.com/cloudflare-customer-dpa/" target="_blank" rel="noopener">Cloudflare's DPA</a>.
            <strong>How long:</strong> we keep the details you send (email address, website, plan, industry and message) until your question is answered and for 12 months after our last message,
            then delete them; if you withdraw consent we delete them sooner. Resend keeps a delivery log for 30 days.
          </p>
          <p>
            <strong>Your rights:</strong> access, correction, erasure, restriction, portability and objection — write to
            info&#64;webappski.com. You can complain to the Polish supervisory authority, UODO (uodo.gov.pl), or to your own.
            Giving us this data is voluntary; without an email address we cannot reply. No automated decisions are made.
            Notice of 5 October 2026.
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

  protected readonly emailPattern = EMAIL_PATTERN;

  protected readonly status = signal<Status>('idle');

  // The industries the site has a page for, grouped as /industries groups them — the list cannot drift from the pages.
  protected readonly industryGroups = Object.entries(getIndustriesByCategory()).map(([category, industries]) => ({ category, industries }));

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
