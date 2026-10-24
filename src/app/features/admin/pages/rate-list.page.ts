import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { Promo } from '../../../core/models/models';

@Component({
  selector: 'app-rate-list-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Rate list popup</h2></div>
  <div class="adm-card">
    <p class="adm-note" style="margin-bottom:16px">The picture you upload here opens as a popup when a customer visits the website, and closes by itself after 10 seconds.</p>
    <div class="adm-row" style="align-items:flex-start;gap:28px">
      @if (newImage() || promo()?.image) { <img class="adm-preview" [src]="newImage() || promo()?.image" alt="Rate list preview"> }
      @else { <div class="adm-empty">No rate list uploaded yet.</div> }
      <div class="adm-form">
        @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
        <label>Choose a picture (JPG, PNG or WEBP)</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)">
        <label class="adm-chk"><input type="checkbox" [(ngModel)]="active"> Show to customers</label>
        <div class="adm-row">
          <button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save changes' }}</button>
          @if (promo()?.image) { <button class="adm-btn danger" (click)="remove()">Remove picture</button> }
        </div>
      </div>
    </div>
  </div>`
})
export class RateListPage {
  private api = inject(SalonApiService);
  promo = signal<Promo | null>(null);
  newImage = signal('');
  active = true;
  msg = signal(''); isErr = signal(false); saving = signal(false);

  constructor() { this.api.getPromoAdmin().subscribe(p => { this.promo.set(p); this.active = p?.active ?? true; }); }

  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.show('Please choose an image file.', true); return; }
    this.compress(file).then(url => { this.newImage.set(url); this.msg.set(''); }).catch(() => this.show('Could not read the image.', true));
  }

  save() {
    if (!this.newImage() && !this.promo()?.image) { this.show('Please choose a picture first.', true); return; }
    this.saving.set(true);
    this.api.savePromo({ image: this.newImage() || undefined, active: this.active }).subscribe({
      next: p => { this.promo.set(p); this.newImage.set(''); this.saving.set(false); this.show('Saved.'); },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save.', true); }
    });
  }

  remove() {
    if (!confirm('Remove the rate list picture?')) return;
    this.api.deletePromo().subscribe(() => { this.promo.set(null); this.newImage.set(''); this.show('Picture removed.'); });
  }

  // Picture ko chhota karta hai (max 1400px, JPG) taake database aur website halki rahe
  private compress(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}
