import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { DEFAULT_ABOUT } from '../../../core/config/about.default';
import { checkImageSize, compressImage } from '../../../core/utils/image.util';
import { IMAGE_SIZES } from '../../../core/config/image-sizes';
import { AboutInfo, AboutPayload } from '../../../core/models/models';

@Component({
  selector: 'app-about-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>About page</h2></div>
  <div class="adm-card">
    @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
    <div class="adm-form">
      <label>Heading</label><input [(ngModel)]="form.title" maxlength="80">
      <label>Text (leave a blank line between paragraphs)</label>
      <textarea rows="12" [(ngModel)]="form.text" maxlength="3000"></textarea>

      <label>Picture</label>
      <div class="pic-row">
        @if (preview()) { <img class="thumb" [src]="preview()" alt="Preview"> } @else { <div class="thumb empty">No picture</div> }
        <div class="pic-actions">
          <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)">
          @if (preview()) { <button type="button" class="adm-btn ghost sm" (click)="clearPicture()">Remove picture</button> }
          <span class="adm-note"><b>Recommended size: {{ size.label }}</b> ({{ size.shape }}). It is shown beside the About text on the home page, and above the text on the About page.</span>
          <span class="adm-note">JPG, PNG or WEBP. Bigger pictures are made smaller automatically.</span>
          @if (sizeInfo()) { <span class="adm-note" [style.color]="sizeWarn() ? '#a12222' : '#1d6b3b'">{{ sizeInfo() }}</span> }
        </div>
      </div>

      <p class="adm-note">The text and picture appear on the About page and in the About section of the home page.</p>
      <div class="adm-row"><button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save changes' }}</button></div>
    </div>
  </div>`,
  styles: [`
  .pic-row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .pic-actions{display:grid;gap:8px;justify-items:start}
  .thumb{width:220px;height:150px;object-fit:cover;border-radius:10px;border:1px solid #efdfe6;display:block}
  .thumb.empty{display:flex;align-items:center;justify-content:center;background:#fdf2f6;color:#8a7580;font-size:13px}`]
})
export class AboutPage {
  private api = inject(SalonApiService);
  form: AboutInfo = { ...DEFAULT_ABOUT, imageUrl: null };
  newImage = '';
  removeImage = false;
  size = IMAGE_SIZES.about;
  sizeInfo = signal(''); sizeWarn = signal(false);
  msg = signal(''); isErr = signal(false); saving = signal(false);

  constructor() { this.api.getAbout().subscribe({ next: a => { if (a) this.form = { ...a }; }, error: () => {} }); }

  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  preview(): string { return this.newImage || (this.removeImage ? '' : this.form.imageUrl || ''); }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.show('Please choose an image file.', true); return; }
    checkImageSize(file, this.size.minWidth).then(r => { this.sizeInfo.set(r.text); this.sizeWarn.set(r.warn); });
    compressImage(file, { maxSide: 1400, maxChars: 1_300_000 })
      .then(url => { this.newImage = url; this.removeImage = false; this.msg.set(''); })
      .catch(() => this.show('Could not use this picture. Try a smaller one.', true));
    input.value = '';
  }

  clearPicture() { this.newImage = ''; this.removeImage = true; this.sizeInfo.set(''); }

  save() {
    if (!this.form.title.trim() || !this.form.text.trim()) { this.show('Enter a heading and some text.', true); return; }
    const payload: AboutPayload = { title: this.form.title, text: this.form.text };
    if (this.newImage) payload.image = this.newImage;
    else if (this.removeImage && this.form.imageUrl) payload.removeImage = true;

    this.saving.set(true);
    this.api.saveAbout(payload).subscribe({
      next: a => { this.form = { ...a }; this.newImage = ''; this.removeImage = false; this.saving.set(false); this.show('About page saved.'); },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save the About page.', true); }
    });
  }
}
