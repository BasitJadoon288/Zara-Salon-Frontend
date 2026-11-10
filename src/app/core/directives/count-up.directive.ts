import { Directive, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';

// Number 0 se (ya pichli value se) nayi value tak ginti ki tarah chadhta hai.
// Istemal:  <div [countUp]="total"></div>
@Directive({ selector: '[countUp]', standalone: true })
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input() countUp: number | null | undefined = 0;
  @Input() countDuration = 800;   // milliseconds

  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private shown = 0;
  private raf = 0;

  ngOnChanges() {
    const to = Math.round(Number(this.countUp) || 0);
    cancelAnimationFrame(this.raf);
    const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || to === this.shown || this.countDuration <= 0) { this.set(to); return; }

    const from = this.shown, start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / this.countDuration);
      const eased = 1 - Math.pow(1 - t, 3);   // shuru mein tez, aakhir mein dheema
      this.set(Math.round(from + (to - from) * eased));
      if (t < 1) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  ngOnDestroy() { cancelAnimationFrame(this.raf); }

  private set(n: number) { this.shown = n; this.el.textContent = String(n); }
}
