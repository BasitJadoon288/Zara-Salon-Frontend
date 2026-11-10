import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

// Scroll karne par cheez narmi se nazar aati hai (fade + halka sa upar uthna).
// Istemal:  <div reveal>   <div reveal="left">   <div reveal="zoom" [revealDelay]="120">
// Styles animations.css mein hain. Agar browser IntersectionObserver na de, ya "Reduce motion" on ho, to cheez seedhi dikhti hai.

type Handler = () => void;
let observer: IntersectionObserver | null = null;
const handlers = new WeakMap<Element, Handler>();

function getObserver(): IntersectionObserver {
  return observer ??= new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      observer!.unobserve(e.target);
      handlers.get(e.target)?.();
    }
  }, { threshold: 0, rootMargin: '0px 0px -8% 0px' });   // thori si andar aane par
}

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

@Directive({ selector: '[reveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  /** '' (neeche se), 'left', 'right' ya 'zoom' */
  @Input() reveal: '' | 'left' | 'right' | 'zoom' | 'up' = '';
  /** Kitni der baad shuru ho (milliseconds), cards ek ke baad ek lane ke liye */
  @Input() revealDelay = 0;

  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private cleanup?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    if (typeof IntersectionObserver === 'undefined' || reducedMotion()) return;
    const el = this.el;
    el.classList.add('reveal-init');
    if (this.reveal && this.reveal !== 'up') el.classList.add('reveal-' + this.reveal);
    if (this.revealDelay) el.style.setProperty('--d', `${this.revealDelay}ms`);

    handlers.set(el, () => {
      el.classList.add('in');
      // Animation khatam hone ke baad extra classes hata do, taake baad ke hover waghera par asar na ho
      this.cleanup = setTimeout(() => {
        el.classList.remove('reveal-init', 'reveal-left', 'reveal-right', 'reveal-zoom', 'in');
        el.style.removeProperty('--d');
      }, 900 + this.revealDelay);
    });
    getObserver().observe(el);
  }

  ngOnDestroy() {
    clearTimeout(this.cleanup);
    observer?.unobserve(this.el);
    handlers.delete(this.el);
  }
}
