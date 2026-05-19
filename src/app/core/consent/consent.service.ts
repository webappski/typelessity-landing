import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

export interface ConsentState {
  required: true;
  functional: boolean;
  analytics: boolean;
  decidedAt: string | null;
}

const STORAGE_KEY = 'typelessity:consent';

const DEFAULT: ConsentState = {
  required: true,
  functional: false,
  analytics: false,
  decidedAt: null,
};

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly doc = inject(DOCUMENT);
  private readonly platform = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platform);

  private readonly state = signal<ConsentState>(this.load());

  readonly current = this.state.asReadonly();
  readonly decided = computed(() => this.state().decidedAt !== null);
  readonly analyticsAllowed = computed(() => this.state().analytics);
  readonly functionalAllowed = computed(() => this.state().functional);

  constructor() {
    effect(() => {
      const s = this.state();
      this.persist(s);
    });
  }

  acceptAll(): void {
    this.state.set({
      required: true,
      functional: true,
      analytics: true,
      decidedAt: new Date().toISOString(),
    });
  }

  rejectOptional(): void {
    this.state.set({
      required: true,
      functional: false,
      analytics: false,
      decidedAt: new Date().toISOString(),
    });
  }

  set(partial: Partial<Pick<ConsentState, 'functional' | 'analytics'>>): void {
    this.state.update((s) => ({
      ...s,
      ...partial,
      decidedAt: new Date().toISOString(),
    }));
  }

  withdraw(): void {
    this.state.set({ ...DEFAULT });
  }

  private load(): ConsentState {
    if (!this.isBrowser) return DEFAULT;
    try {
      const raw = this.doc.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT;
      const parsed = JSON.parse(raw) as ConsentState;
      return { ...DEFAULT, ...parsed, required: true };
    } catch {
      return DEFAULT;
    }
  }

  private persist(state: ConsentState): void {
    if (!this.isBrowser) return;
    try {
      this.doc.defaultView?.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage may be disabled — silent fallback
    }
  }
}
