import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { SalonApiService } from '../../core/services/salon-api.service';

const SHOW_DELAY_MS = 600;     // website khulne ke kitni der baad popup aaye
const SHOW_DURATION_MS = 10000; // popup kitni der dikhe (10 second)

@Component({
  selector: 'app-promo-popup', standalone: true,
  template: `@if (image) {
    <div class="overlay" (click)="close()">
      <div class="box" (click)="$event.stopPropagation()">
        <button class="x" (click)="close()" aria-label="Close">✕</button>
        <img [src]="image" alt="Rate list">
      </div>
    </div> }`,
  styles: [`
  .overlay{position:fixed;inset:0;background:#000b;display:flex;align-items:center;justify-content:center;z-index:120;padding:20px}
  .box{position:relative;line-height:0}
  img{display:block;width:auto;height:auto;max-width:min(92vw,560px);max-height:88vh;border-radius:14px;box-shadow:0 10px 40px #0008}
  .x{position:absolute;top:-14px;right:-14px;width:36px;height:36px;border-radius:50%;border:0;background:var(--rose);color:#fff;font-size:16px;line-height:1;cursor:pointer;z-index:1}`]
})
export class PromoPopupComponent implements OnInit, OnDestroy {
  private api = inject(SalonApiService);
  image = '';
  private showTimer?: ReturnType<typeof setTimeout>;
  private hideTimer?: ReturnType<typeof setTimeout>;

  // Har baar website khulne ya refresh hone par rate list dikhegi, aur 10 second baad khud band
  ngOnInit() {
    this.api.getPromo().subscribe({
      next: p => {
        if (!p?.image) return;
        this.showTimer = setTimeout(() => {
          this.image = p.image;
          this.hideTimer = setTimeout(() => this.close(), SHOW_DURATION_MS);
        }, SHOW_DELAY_MS);
      },
      error: () => {}
    });
  }

  ngOnDestroy() { this.clearTimers(); }

  @HostListener('document:keydown.escape') onEsc() { this.close(); }

  close() { this.image = ''; this.clearTimers(); }

  private clearTimers() {
    clearTimeout(this.showTimer);
    clearTimeout(this.hideTimer);
  }
}