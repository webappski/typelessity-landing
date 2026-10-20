import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type IconName =
  | 'chevron-down' | 'arrow-right-small'
  | 'arrow' | 'mic' | 'check' | 'scissors' | 'utensils' | 'wrench' | 'yoga' | 'dumbbell' | 'car' | 'book';

// The stroke icons of the redesign mock (build-lib.mjs ICONS), 24×24, stroke 2: the paths of the names above that are not drawn by hand below.
const STROKE_PATHS: Partial<Record<IconName, string>> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  mic: 'M12 2a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12',
  utensils: 'M4 3v7a2 2 0 0 0 2 2h1v9M10 3v7M7 3v7M17 3c-2 2-3 5-3 8h3v10',
  wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  yoga: 'M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM4 21l5-8 3 3 3-3 5 8M9 13l3-5 3 5',
  dumbbell: 'M6.5 6.5l11 11M21 21l-1-1M3 3l1 1M18 22l4-4M2 6l4-4M3 10l7-7M14 21l7-7',
  car: 'M5 17h14M3 13l2-6h14l2 6v4H3v-4zM7 17v2M17 17v2M7 13h.01M17 13h.01',
  book: 'M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4V4zM8 20V8',
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
