import { Component, HostListener, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SalonApiService } from '../../core/services/salon-api.service';
import { GalleryPage } from '../../core/models/models';
import { SectionTitleComponent } from '../../shared/components/section-title.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

// Gallery: bridal pictures, ek page par 20. Picture par click karne se bari ho jati hai.
@Component({
  selector: 'app-gallery', standalone: true, imports: [SectionTitleComponent, PaginationComponent],
  template: `<section class="container"><app-section-title eyebrow="Our work" title="Gallery" /><br>
    @if (error) { <p class="state bad">{{ error }}</p> }
    @else if (!data) { <div class="grid"> @for (n of skeleton; track n) { <div class="cell sk"></div> } </div> }
    @else if (!data.items.length) { <p class="state">Our gallery is coming soon. Please visit again!</p> }
    @else {
      <div class="grid">
        @for (g of data.items; track g._id; let i = $index) {
          <button type="button" class="cell" (click)="open(i)" [attr.aria-label]="g.caption || 'Open picture ' + (i + 1)">
            <img [src]="g.thumbUrl" [alt]="g.caption || 'Bridal look'" loading="lazy" decoding="async">
            @if (g.caption) { <span class="cap">{{ g.caption }}</span> }
          </button>
        }
      </div>
      <app-pagination [page]="data.page" [pages]="data.pages" (pageChange)="goTo($event)" />
      <p class="count">{{ data.total }} picture{{ data.total === 1 ? '' : 's' }}</p>
    }
  </section>

  @if (data && viewing >= 0) {
    <div class="lb" (click)="close()" role="dialog" aria-modal="true" aria-label="Picture viewer">
      <button type="button" class="x" (click)="close()" aria-label="Close">&times;</button>
      @if (data.items.length > 1) {
        <button type="button" class="nav prev" (click)="step(-1); $event.stopPropagation()" aria-label="Previous picture">&lsaquo;</button>
        <button type="button" class="nav next" (click)="step(1); $event.stopPropagation()" aria-label="Next picture">&rsaquo;</button>
      }
      <figure (click)="$event.stopPropagation()">
        <img [src]="data.items[viewing].imageUrl" [alt]="data.items[viewing].caption || 'Bridal look'">
        <figcaption>{{ data.items[viewing].caption }}<small>{{ viewing + 1 }} / {{ data.items.length }}</small></figcaption>
      </figure>
    </div>
  }`,
  styles: [`
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
  .cell{position:relative;padding:0;border:0;border-radius:12px;overflow:hidden;cursor:pointer;aspect-ratio:3/4;background:var(--soft);box-shadow:0 0 0 1px var(--card-ring)}
  .cell img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .3s}
  .cell:hover img{transform:scale(1.04)}
  .cell:focus-visible{outline:2px solid var(--rose-ink);outline-offset:2px}
  .cap{position:absolute;left:0;right:0;bottom:0;padding:22px 10px 9px;background:linear-gradient(transparent,#000a);color:#fff;font-size:13px;text-align:left}
  .sk{animation:pulse 1.2s ease-in-out infinite}@keyframes pulse{50%{opacity:.5}}
  .state{text-align:center;color:var(--muted);padding:40px 0}.state.bad{color:var(--msg-bad-ink)}
  .count{text-align:center;color:var(--muted);font-size:13px;margin-top:8px}
  .lb{position:fixed;inset:0;background:#000d;z-index:120;display:flex;align-items:center;justify-content:center;padding:16px}
  figure{margin:0;max-width:min(92vw,900px);text-align:center}
  figure img{max-width:100%;max-height:80vh;border-radius:10px;display:block;margin:0 auto;background:#111}
  figcaption{color:#fff;margin-top:10px;font-size:15px}figcaption small{display:block;color:#bbb;margin-top:4px;font-size:12px}
  .x{position:absolute;top:12px;right:16px;background:none;border:0;color:#fff;font-size:38px;line-height:1;cursor:pointer}
  .nav{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;border-radius:50%;border:0;background:#ffffff26;color:#fff;font-size:30px;line-height:1;cursor:pointer}
  .nav:hover{background:#ffffff40}.prev{left:12px}.next{right:12px}
  @media(max-width:560px){.grid{grid-template-columns:repeat(2,1fr);gap:10px}.nav{width:38px;height:38px}}`]
})
export class GalleryComponent implements OnDestroy {
  private api = inject(SalonApiService); private route = inject(ActivatedRoute); private router = inject(Router);
  data: GalleryPage | null = null; error = ''; viewing = -1; skeleton = Array.from({ length: 8 }, (_, i) => i);

  constructor() {
    // Page ka number address mein rehta hai (?page=2), is liye refresh ya back karne par wahi page khulta hai
    this.route.queryParamMap.subscribe(q => this.load(Math.max(1, parseInt(q.get('page') || '1', 10) || 1)));
  }

  private load(page: number) {
    this.viewing = -1;
    this.api.getGallery(page).subscribe({
      next: d => { this.data = d; this.error = ''; },
      error: () => { this.error = 'Could not load the gallery. Please try again.'; }
    });
  }
  goTo(page: number) {
    this.router.navigate([], { queryParams: { page: page > 1 ? page : null }, queryParamsHandling: 'merge' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnDestroy() { document.body.style.overflow = ''; }

  open(i: number) { this.viewing = i; document.body.style.overflow = 'hidden'; }
  close() { this.viewing = -1; document.body.style.overflow = ''; }
  step(d: number) { const n = this.data!.items.length; this.viewing = (this.viewing + d + n) % n; }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (this.viewing < 0) return;
    if (e.key === 'Escape') this.close();
    else if (e.key === 'ArrowRight') this.step(1);
    else if (e.key === 'ArrowLeft') this.step(-1);
  }
}
