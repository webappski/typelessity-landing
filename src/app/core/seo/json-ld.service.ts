import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JsonLdService {
  private readonly doc = inject(DOCUMENT);

  set(id: string, data: Record<string, unknown> | Record<string, unknown>[]): void {
    const head = this.doc.head;
    if (!head) return;

    const elementId = `ld-${id}`;
    const existing = this.doc.getElementById(elementId);
    if (existing) existing.remove();

    const script = this.doc.createElement('script');
    script.id = elementId;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    head.appendChild(script);
  }

  remove(id: string): void {
    const el = this.doc.getElementById(`ld-${id}`);
    if (el) el.remove();
  }
}
