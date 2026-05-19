import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

interface ContactPayload {
  email: string;
  company: string;
  industry: string;
  monthlyBookings: string;
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
    <form class="cf" (ngSubmit)="submit()" #f="ngForm" novalidate>
      <div class="cf__row">
        <label for="cf-email">Work email</label>
        <input id="cf-email" name="email" type="email" required autocomplete="email" [(ngModel)]="model.email" />
      </div>
      <div class="cf__grid">
        <div class="cf__row">
          <label for="cf-company">Company</label>
          <input id="cf-company" name="company" type="text" required [(ngModel)]="model.company" />
        </div>
        <div class="cf__row">
          <label for="cf-industry">Industry</label>
          <input id="cf-industry" name="industry" type="text" required [(ngModel)]="model.industry" placeholder="Dental, Auto, Hotel, …" />
        </div>
      </div>
      <div class="cf__row">
        <label for="cf-volume">Monthly bookings volume</label>
        <select id="cf-volume" name="monthlyBookings" required [(ngModel)]="model.monthlyBookings">
          <option value="">Select…</option>
          <option value="0-100">Under 100</option>
          <option value="100-1000">100 – 1,000</option>
          <option value="1000-10000">1,000 – 10,000</option>
          <option value="10000+">10,000+</option>
        </select>
      </div>
      <div class="cf__row">
        <label>
          <input type="checkbox" name="consent" required />
          <span>I agree to the <a href="/en/legal/privacy">privacy policy</a> and processing of my data for response purposes.</span>
        </label>
      </div>
      <button type="submit" class="vc-btn vc-btn-primary vc-btn-lg vc-btn-block" [disabled]="status() === 'sending' || !f.valid">
        {{ status() === 'sending' ? 'Sending…' : 'Start Pilot' }}
      </button>
      @if (status() === 'success') {
        <p class="cf__msg cf__msg--ok">Thanks — we'll reach out within one business day.</p>
      }
      @if (status() === 'error') {
        <p class="cf__msg cf__msg--err">Something went wrong. Email <a href="mailto:hello&#64;typelessity.com">hello&#64;typelessity.com</a> directly.</p>
      }
    </form>
  `,
})
export class ContactFormComponent {
  private readonly http = inject(HttpClient);

  protected readonly model: ContactPayload = {
    email: '',
    company: '',
    industry: '',
    monthlyBookings: '',
    message: '',
  };

  protected readonly status = signal<Status>('idle');

  protected async submit(): Promise<void> {
    if (this.status() === 'sending') return;
    this.status.set('sending');
    try {
      await firstValueFrom(this.http.post('/api/contact', this.model));
      this.status.set('success');
    } catch {
      this.status.set('error');
    }
  }
}
