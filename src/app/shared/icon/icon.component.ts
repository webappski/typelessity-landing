import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'chevron-down' | 'arrow-right-small'
  | 'arrow' | 'mic' | 'check';

// The stroke icons of the redesign mock (build-lib.mjs ICONS), 24×24, stroke 2: the paths of the names above that are not drawn by hand below.
const STROKE_PATHS: Partial<Record<IconName, string>> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  mic: 'M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
};

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
      @default {
        <svg [class]="className()" [style.width.px]="size()" [style.height.px]="size()"
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path [attr.d]="strokePath()" />
        </svg>
      }
    }
  `,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input<number>(16);
  readonly className = input<string>('');
  protected readonly strokePath = computed(() => STROKE_PATHS[this.name()] ?? '');
}
