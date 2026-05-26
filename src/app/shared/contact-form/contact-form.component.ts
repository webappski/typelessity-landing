import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

interface WaitlistPayload {
  email: string;
  website?: string;
  plan: string;
  industry?: string;
  message?: string;
}

type Status = 'idle' | 'sending' | 'success' | 'error';

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
            <option value="starter">Starter ($39/mo)</option>
            <option value="pro">Pro ($149/mo)</option>
            <option value="enterprise">Enterprise ($399/mo)</option>
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
          {{ status() === 'sending' ? 'Submitting…' : 'Join Waitlist' }}
        </button>
        @if (status() === 'error') {
          <p class="cf__msg cf__msg--err">We couldn't submit your request. Please check your connection and try again.</p>
        }
      </form>
    } @else {
      <div class="cf__success" role="status" aria-live="polite">
        <h3>You're on the Waitlist!</h3>
        <p>We'll notify you as soon as Typelessity is available. Thanks for your interest!</p>
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
        this.http.post('/api/contact', {
          ...this.model,
          type: 'waitlist_request',
          product: 'typelessity',
          source: 'typelessity-waitlist-form',
        }),
      );
      this.status.set('success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Waitlist form submission failed', { message });
      this.status.set('error');
    }
  }
}
