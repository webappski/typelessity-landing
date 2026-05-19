import { Directive, HostListener, Input } from '@angular/core';

const CAL_LINK = 'typelessity/demo';

type CalFn = (...args: unknown[]) => unknown;

@Directive({
  selector: '[appCalCom]',
  standalone: true,
})
export class CalComDirective {
  @Input('appCalCom') calLink = CAL_LINK;

  @HostListener('click', ['$event'])
  async onClick(event: Event): Promise<void> {
    event.preventDefault();
    const mod = await import('@calcom/embed-snippet');
    const Cal = mod.default as unknown as CalFn;
    Cal('init', { origin: 'https://cal.com' });
    Cal('ui', {
      theme: 'light',
      styles: { branding: { brandColor: '#5b53ff' } },
      hideEventTypeDetails: false,
    });
    Cal('modal', { calLink: this.calLink });
  }
}
