import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName = 'chevron-down' | 'arrow-right-small';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (name()) {
      @case ('chevron-down') {
        <svg [class]="className()" [style.width.px]="size()" [style.height.px]="size()"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      }
      @case ('arrow-right-small') {
        <svg [class]="className()" [style.width.px]="size()" [style.height.px]="size()"
             viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6"
                stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      }
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(16);
  readonly className = input<string>('');
}
