import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { compressImage } from '../../../core/utils/image.util';
import { Slide, SlidePayload } from '../../../core/models/models';

const MAX_SLIDES = 8;
const blank = (): Slide => ({ title: '', text: '', visible: true });

@Component({
  selector: 'app-slider-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Home slider</h2><span class="adm-note">{{ items().length }} of ${MAX_SLIDES} slides</span></div>

  <div class="adm-card">
    <h3>{{ form._id ? 'Edit slide' : 'Add a slide' }}</h3>
    @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
    <div class="adm-form">
      <label>Picture {{ form._id ? '' : '(required)' }}</label>
      <div class="pic-row">
        @if (preview()) { <img class="thumb big" [src]="preview()" alt="Preview"> } @else { <div class="thumb big empty">No picture</div> }
        <div class="pic-actions">
          <input type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)">
          <span class="adm-note">Use a wide landscape picture (for example 1920 x 800). It is resized automatically.</span>
        </div>
      </div>
      <label>Heading (optional)</label><input [(ngModel)]="form.title" maxlength="80">
      <label>Small text under the heading (optional)</label><textarea rows="3" [(ngModel)]="form.text" maxlength="200"></textarea>
      <label class="adm-chk"><input type="checkbox" [(ngModel)]="form.visible"> Show on the website</label>
      <div class="adm-row">
        <button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : (form._id ? 'Save changes' : 'Add slide') }}</button>
        @if (form._id) { <button class="adm-btn ghost" (click)="reset()">Cancel</button> }
      </div>
    </div>
  </div>

  <div class="adm-card adm-scroll">
    @if (items().length) {
      <table class="adm-table">
        <tr><th>Order</th><th>Picture</th><th>Heading and text</th><th>On website</th><th></th></tr>
        @for (s of items(); track s._id; let i = $index; let first = $first; let last = $last) {
          <tr>
            <td class="adm-row">
              <button class="adm-btn ghost sm" (click)="move(i, -1)" [disabled]="first" aria-label="Move up">▲</button>
              <button class="adm-btn ghost sm" (click)="move(i, 1)" [disabled]="last" aria-label="Move down">▼</button>
            </td>
            <td>@if (s.imageUrl) { <img class="thumb" [src]="s.imageUrl" alt="Slide"> }</td>
            <td><b>{{ s.title || '(no heading)' }}</b><div class="adm-note">{{ s.text }}</div></td>
            <td><span [class]="'badge ' + (s.visible === false ? 'cancelled' : 'confirmed')">{{ s.visible === false ? 'Hidden' : 'Visible' }}</span></td>
            <td class="adm-row">
              <button class="adm-btn ghost sm" (click)="toggle(s)">{{ s.visible === false ? 'Show' : 'Hide' }}</button>
              <button class="adm-btn ghost sm" (click)="edit(s)">Edit</button>
              <button class="adm-btn danger sm" (click)="remove(s)">Delete</button>
            </td>
          </tr>
        }
      </table>
      <p class="adm-note" style="margin-top:12px">Slides appear on the website from top to bottom. If no slide is visible, the website shows its built-in slides.</p>
    } @else { <div class="adm-empty">No slides yet. Until you add one, the website shows its built-in slides.</div> }
  </div>`,
  styles: [`
  .pic-row{display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap}
  .pic-actions{display:grid;gap:8px;justify-items:start}
  .thumb{width:120px;height:50px;object-fit:cover;border-radius:6px;border:1px solid #efdfe6;display:block}
  .thumb.big{width:300px;height:125px;border-radius:10px}
  .thumb.empty{display:flex;align-items:center;justify-content:center;background:#fdf2f6;color:#8a7580;font-size:13px}`]
})
export class SliderPage {
  private api = inject(SalonApiService);
  items = signal<Slide[]>([]);
  form: Slide = blank();
  newImage = '';
  msg = signal(''); isErr = signal(false); saving = signal(false);

  constructor() { this.load(); }
  private load() { this.api.getSlidesAdmin().subscribe(l => this.items.set(l)); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  preview(): string { return this.newImage || this.form.imageUrl || ''; }

  onFile(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { this.show('Please choose an image file.', true); return; }
    compressImage(file, { maxSide: 1600, maxChars: 900_000 })
      .then(url => { this.newImage = url; this.msg.set(''); })
      .catch(() => this.show('Could not use this picture. Try a smaller one.', true));
    input.value = '';
  }

  reset() { this.form = blank(); this.newImage = ''; }

  save() {
    const f = this.form;
    if (!f._id && !this.newImage) { this.show('Please choose a picture for the slide.', true); return; }
    const payload: SlidePayload = { _id: f._id, title: f.title, text: f.text, visible: f.visible !== false };
    if (this.newImage) payload.image = this.newImage;

    const wasEdit = !!f._id;
    this.saving.set(true);
    this.api.saveSlide(payload).subscribe({
      next: () => { this.saving.set(false); this.reset(); this.load(); this.show(wasEdit ? 'Slide updated.' : 'Slide added.'); },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save the slide.', true); }
    });
  }

  // Ek jagah upar ya neeche
  move(i: number, dir: -1 | 1) {
    const list = [...this.items()];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    this.items.set(list);
    this.api.reorderSlides(list.map(s => s._id!)).subscribe({
      next: l => this.items.set(l),
      error: e => { this.show(e.error?.error || 'Could not change the order.', true); this.load(); }
    });
  }

  // Hide / Show: sirf visible badalta hai, picture waisi hi rehti hai
  toggle(s: Slide) {
    const payload: SlidePayload = { _id: s._id, title: s.title, text: s.text, visible: s.visible === false };
    this.api.saveSlide(payload).subscribe({
      next: () => { this.load(); this.show(payload.visible ? 'Slide is now visible on the website.' : 'Slide is now hidden from the website.'); },
      error: e => this.show(e.error?.error || 'Could not update the slide.', true)
    });
  }

  edit(s: Slide) { this.form = { ...s }; this.newImage = ''; window.scrollTo({ top: 0, behavior: 'smooth' }); }

  remove(s: Slide) {
    if (!confirm('Delete this slide? To only take it off the website, use Hide instead.')) return;
    this.api.deleteSlide(s._id!).subscribe(() => { this.load(); this.show('Slide deleted.'); });
  }
}
