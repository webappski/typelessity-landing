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
          <label for="cf-plan">Preferred Plan *</label>
          <select id="cf-plan" name="plan" required [(ngModel)]="model.plan">
            <option value="">Select a plan</option>
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
        <div class="cf__row">
          <label>
            <input type="checkbox" name="consent" required />
            <span>I agree to the <a href="https://webappski.com/en/legal/product-privacy" target="_blank" rel="noopener">privacy policy</a> and processing of my data for response purposes.</span>
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
      console.error('Waitlist form submission failed', { message });
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
      `Preferred plan: ${m.plan}`,
      `Industry: ${m.industry || '—'}`,
      note ? `\n${note.length > MAX_MESSAGE_IN_MAILTO ? `${note.slice(0, MAX_MESSAGE_IN_MAILTO)}…` : note}` : '',
    ].join('\n');
    const subject = `Typelessity question — ${m.plan}`;
    return `mailto:${FALLBACK_MAILBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
}
