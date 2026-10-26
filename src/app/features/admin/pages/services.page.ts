import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { checkImageSize, compressImage } from '../../../core/utils/image.util';
import { IMAGE_SIZES } from '../../../core/config/image-sizes';
import { SalonService, ServicePayload } from '../../../core/models/models';

const blank = (): SalonService => ({ title: '', description: '', icon: '', visible: true });

@Component({
  selector: 'app-services-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Services</h2></div>

  <div class="adm-card">
    <h3>{{ form._id ? 'Edit service' : 'Add a service' }}</h3>
    @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
    <div class="adm-form">
      <label>Service name</label><input [(ngModel)]="form.title" maxlength="60">
      <label>Short description</label><textarea rows="3" [(ngModel)]="form.description" maxlength="200"></textarea>
      <label>Icon (an emoji, shown when the service has no picture)</label><input [(ngModel)]="form.icon" maxlength="12">

      <label>Picture</label>
      <div class="pic-row">
        @if (preview()) { <img class="thumb big" [src]="preview()" alt="Preview"> } @else { <div class="thumb big empty">No picture</div> }
        <div class="pic-actions">
          <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)">
          @if (preview()) { <button type="button" class="adm-btn ghost sm" (click)="clearPicture()">Remove picture</button> }
          <span class="adm-note"><b>Recommended size: {{ size.label }}</b> ({{ size.shape }}). This picture is shown at the top of the service card on the website. Keep the main subject in the upper half.</span>
          <span class="adm-note">JPG, PNG or WEBP. Bigger pictures are made smaller automatically.</span>
          @if (sizeInfo()) { <span class="adm-note" [style.color]="sizeWarn() ? '#a12222' : '#1d6b3b'">{{ sizeInfo() }}</span> }
        </div>
      </div>

      <label class="adm-chk"><input type="checkbox" [(ngModel)]="form.visible"> Show on the website</label>
      <div class="adm-row">
        <button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : (form._id ? 'Save changes' : 'Add service') }}</button>
        @if (form._id) { <button class="adm-btn ghost" (click)="reset()">Cancel</button> }
      </div>
    </div>
  </div>

  <div class="adm-card adm-scroll">
    @if (items().length) {
      <table class="adm-table">
        <tr><th>Picture</th><th>Name</th><th>Description</th><th>On website</th><th></th></tr>
        @for (s of items(); track s._id) {
          <tr>
            <td>
              @if (s.imageUrl) { <img class="thumb" [src]="s.imageUrl" [alt]="s.title"> }
              @else { <div class="thumb empty">{{ s.icon || '-' }}</div> }
            </td>
            <td>{{ s.title }}</td><td>{{ s.description }}</td>
            <td><span [class]="'badge ' + (s.visible === false ? 'cancelled' : 'confirmed')">{{ s.visible === false ? 'Hidden' : 'Visible' }}</span></td>
            <td class="adm-row">
              <button class="adm-btn ghost sm" (click)="toggle(s)">{{ s.visible === false ? 'Show' : 'Hide' }}</button>
              <button class="adm-btn ghost sm" (click)="edit(s)">Edit</button>
              <button class="adm-btn danger sm" (click)="remove(s)">Delete</button>
            </td>
          </tr>
        }
      </table>
    } @else { <div class="adm-empty">No services yet. Add the first one above.</div> }
  </div>`,
  styles: [`
  .pic-row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .pic-actions{display:grid;gap:8px;justify-items:start}
  .thumb{width:64px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #efdfe6;display:block}
  .thumb.big{width:160px;height:120px;border-radius:10px}
  .thumb.empty{display:flex;align-items:center;justify-content:center;background:#fdf2f6;color:#8a7580;font-size:12px;text-align:center}`]
})
export class ServicesPage {
  private api = inject(SalonApiService);
  items = signal<SalonService[]>([]);
  form: SalonService = blank();
  newImage = '';          // abhi chuni hui nayi picture (chhoti ki hui)
  removeImage = false;    // true = save par purani picture hat jayegi
  size = IMAGE_SIZES.service;
  sizeInfo = signal(''); sizeWarn = signal(false);
  msg = signal(''); isErr = signal(false); saving = signal(false);

  constructor() { this.load(); }
  private load() { this.api.getServicesAdmin().subscribe(l => this.items.set(l)); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  preview(): string { return this.newImage || (this.removeImage ? '' : this.form.imageUrl || ''); }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.show('Please choose an image file.', true); return; }
    checkImageSize(file, this.size.minWidth).then(r => { this.sizeInfo.set(r.text); this.sizeWarn.set(r.warn); });
    compressImage(file, { maxSide: 900, maxChars: 550_000 })
      .then(url => { this.newImage = url; this.removeImage = false; this.msg.set(''); })
      .catch(() => this.show('Could not use this picture. Try a smaller one.', true));
    input.value = '';
  }

  clearPicture() { this.newImage = ''; this.removeImage = true; this.sizeInfo.set(''); }

  reset() { this.form = blank(); this.newImage = ''; this.removeImage = false; this.sizeInfo.set(''); }

  save() {
    const f = this.form;
    if (!f.title.trim() || !f.description.trim()) { this.show('Enter the service name and a short description.', true); return; }
    const payload: ServicePayload = { _id: f._id, title: f.title, description: f.description, icon: f.icon, visible: f.visible !== false };
    if (this.newImage) payload.image = this.newImage;
    else if (this.removeImage && f.imageUrl) payload.removeImage = true;

    const wasEdit = !!f._id;
    this.saving.set(true);
    this.api.saveService(payload).subscribe({
      next: () => { this.saving.set(false); this.reset(); this.load(); this.show(wasEdit ? 'Service updated.' : 'Service added.'); },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save the service.', true); }
    });
  }

  // Hide / Show: sirf visible badalta hai, picture waisi hi rehti hai
  toggle(s: SalonService) {
    const payload: ServicePayload = { _id: s._id, title: s.title, description: s.description, icon: s.icon, visible: s.visible === false };
    this.api.saveService(payload).subscribe({
      next: () => { this.load(); this.show(payload.visible ? `"${s.title}" is now visible on the website.` : `"${s.title}" is now hidden from the website.`); },
      error: e => this.show(e.error?.error || 'Could not update the service.', true)
    });
  }

  edit(s: SalonService) { this.form = { ...s }; this.newImage = ''; this.removeImage = false; this.sizeInfo.set(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  remove(s: SalonService) {
    if (!confirm(`Delete the service "${s.title}"? To only take it off the website, use Hide instead.`)) return;
    this.api.deleteService(s._id!).subscribe(() => { this.load(); this.show('Service deleted.'); });
  }
}
