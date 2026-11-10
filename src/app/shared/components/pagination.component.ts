import { Component, EventEmitter, Input, Output } from '@angular/core';

// Page ke number: Prev 1 2 3 ... 9 Next. Jahan sirf ek page ho wahan kuch nahi dikhata.
@Component({
  selector: 'app-pagination', standalone: true,
  template: `@if (pages > 1) {
    <nav class="pg" aria-label="Pages">
      <button type="button" (click)="go(page - 1)" [disabled]="page <= 1" aria-label="Previous page">&lsaquo; Prev</button>
      @for (n of list(); track $index) {
        @if (n === 0) { <span class="gap">&hellip;</span> }
        @else { <button type="button" [class.on]="n === page" [attr.aria-current]="n === page ? 'page' : null" (click)="go(n)">{{ n }}</button> }
      }
      <button type="button" (click)="go(page + 1)" [disabled]="page >= pages" aria-label="Next page">Next &rsaquo;</button>
    </nav>
  }`,
  styles: [`
  .pg{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;margin:26px 0 6px}
  button{min-width:38px;height:38px;padding:0 12px;border-radius:8px;border:1px solid var(--field-line);background:var(--field-bg);color:var(--text);font:500 13px 'Poppins',sans-serif;cursor:pointer}
  button{transition:background-color .2s,color .2s,border-color .2s,transform .15s var(--ease)}
  button:active:not(:disabled){transform:scale(.94)}
  button:hover:not(:disabled):not(.on){border-color:var(--rose-ink);color:var(--rose-ink)}
  button.on{background:var(--rose);border-color:var(--rose);color:#fff;cursor:default}
  button:disabled{opacity:.45;cursor:default}
  .gap{color:var(--muted);padding:0 4px}`]
})
export class PaginationComponent {
  @Input() page = 1; @Input() pages = 1;
  @Output() pageChange = new EventEmitter<number>();
  go(n: number) { if (n >= 1 && n <= this.pages && n !== this.page) this.pageChange.emit(n); }
  // 0 = "..." (beech ke page chhupe hue)
  list(): number[] {
    const { page: p, pages: t } = this;
    if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
    const set = new Set([1, 2, t - 1, t, p - 1, p, p + 1].filter(n => n >= 1 && n <= t));
    const sorted = [...set].sort((a, b) => a - b);
    const out: number[] = [];
    sorted.forEach((n, i) => { if (i && n - sorted[i - 1] > 1) out.push(0); out.push(n); });
    return out;
  }
}
