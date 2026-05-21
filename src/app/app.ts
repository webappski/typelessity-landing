import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ConsentBannerComponent } from './core/consent/consent-banner.component';
import { PostHogService } from './core/analytics/posthog.service';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ConsentBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // Bootstrap PostHog (gated by ConsentService.analyticsAllowed).
  private readonly posthog = inject(PostHogService);
}
