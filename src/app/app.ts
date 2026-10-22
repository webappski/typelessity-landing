import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { GlobalStyles } from './global-styles';
import { EntryUtmSource } from './core/pilot-offer/entry-utm-source';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GlobalStyles, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // built at the start of the application: the strip of the home page needs the utm_source of the ENTRY address, which a visitor who goes on from a blog post no longer has by then
  constructor() { inject(EntryUtmSource); }
}
