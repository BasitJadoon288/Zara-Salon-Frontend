import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { compressImage } from '../../../core/utils/image.util';
import { GalleryItem, GalleryPage } from '../../../core/models/models';
import { PaginationComponent } from '../../../shared/components/pagination.component';

@Component({
  selector: 'app-gallery-page', standalone: true, imports: [FormsModule, PaginationComponent],
  template: `
  <div class="adm-head"><h2>Gallery</h2><span class="adm-note">{{ data()?.total ?? 0 }} of {{ data()?.max ?? 500 }} pictures</span></div>

  <div class="adm-card">
    <h3>Add pictures</h3>
    @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
    <div class="adm-form">
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" (change)="onFiles($event)" [disabled]="busy()">
      <span class="adm-note">You can choose many pictures at once. <b>Best size: portrait, about 1000 × 1333 px.</b> JPG, PNG or WEBP. Big pictures are made smaller automatically so the website stays fast. The website shows 20 pictures per page, newest first.</span>
      @if (progress()) { <span class="adm-note"><b>{{ progress() }}</b></span> }
    </div>
  </div>

  <div class="adm-card">
    @if (data(); as d) {
      @if (d.items.length) {
        <div class="bar">
          <label class="adm-chk"><input type="checkbox" [checked]="allChecked()" (change)="toggleAll()">Select all on this page</label>
          @if (selected().size) {
            <span class="adm-note">{{ selected().size }} selected</span>
            <button class="adm-btn ghost sm" (click)="bulk('hide')">Hide</button>
            <button class="adm-btn ghost sm" (click)="bulk('show')">Show</button>
            <button class="adm-btn danger sm" (click)="bulk('delete')">Delete</button>
          }
        </div>
        <div class="grid">
          @for (g of d.items; track g._id) {
            <div class="item" [class.hid]="!g.visible" [class.sel]="selected().has(g._id)">
              <label class="chk"><input type="checkbox" [checked]="selected().has(g._id)" (change)="toggle(g._id)" aria-label="Select picture"></label>
              <img [src]="g.thumbUrl" [alt]="g.caption || 'Gallery picture'" loading="lazy">
              @if (!g.visible) { <span class="badge cancelled hb">Hidden</span> }
              <div class="body">
                @if (editing() === g._id) {
                  <input [(ngModel)]="capText" maxlength="120" placeholder="Caption (optional)" (keyup.enter)="saveCaption(g)">
                  <div class="adm-row"><button class="adm-btn sm" (click)="saveCaption(g)">Save</button><button class="adm-btn ghost sm" (click)="editing.set('')">Cancel</button></div>
                } @else {
                  <div class="cap">{{ g.caption || 'No caption' }}</div>
                  <div class="adm-row">
                    <button class="adm-btn ghost sm" (click)="startEdit(g)">Caption</button>
                    <button class="adm-btn ghost sm" (click)="toggleVisible(g)">{{ g.visible ? 'Hide' : 'Show' }}</button>
                    <button class="adm-btn danger sm" (click)="remove(g)">Delete</button>
                  </div>
                }
              </div>
            </div>
          }
        </div>
        <app-pagination [page]="d.page" [pages]="d.pages" (pageChange)="load($event)" />
      } @else { <div class="adm-empty">No pictures yet. Add your first bridal pictures above.</div> }
    } @else { <div class="adm-empty">Loading...</div> }
  </div>`,
  styles: [`
  .bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
  .item{position:relative;border:1px solid var(--adm-line);border-radius:10px;overflow:hidden;background:var(--surface)}
  .item.sel{outline:2px solid var(--rose)}
  .item img{width:100%;aspect-ratio:3/4;object-fit:cover;display:block;background:var(--soft)}
  .item.hid img{opacity:.45}
  .chk{position:absolute;top:8px;left:8px;background:#fffd;border-radius:6px;padding:4px 6px;display:flex}
  .chk input{width:auto;margin:0}
  .hb{position:absolute;top:8px;right:8px}
  .body{padding:10px;display:grid;gap:8px}
  .cap{font-size:13px;color:var(--adm-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}`]
})
export class GalleryAdminPage {
  private api = inject(SalonApiService);
  data = signal<GalleryPage | null>(null);
  selected = signal<Set<string>>(new Set());
  editing = signal(''); capText = '';
  busy = signal(false); progress = signal(''); msg = signal(''); isErr = signal(false);
  private page = 1;

  constructor() { this.load(1); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  load(page = this.page) {
    this.api.getGalleryAdmin(page).subscribe({
      next: d => { this.page = d.page; this.data.set(d); this.selected.set(new Set()); },
      error: e => this.show(e.error?.error || 'Could not load the gallery.', true)
    });
  }

  // Kai pictures ek saath: har ek ki bari aur chhoti copy bana kar bheji jati hai
  async onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files || []).filter(f => f.type.startsWith('image/'));
    input.value = '';
    if (!files.length) return;
    this.busy.set(true); this.msg.set('');
    files.reverse();   // pehli chuni hui picture sab se upar dikhe
    let ok = 0, failed = 0, lastErr = '';
    for (let i = 0; i < files.length; i++) {
      this.progress.set(`Uploading ${i + 1} of ${files.length}...`);
      try {
        const [image, thumb] = await Promise.all([
          compressImage(files[i], { maxSide: 1400, maxChars: 900_000 }),
          compressImage(files[i], { maxSide: 480, maxChars: 140_000 })
        ]);
        await firstValueFrom(this.api.uploadPhoto({ caption: '', image, thumb }));
        ok++;
      } catch (e: any) {
        failed++; lastErr = e?.error?.error || 'Could not use one of the pictures.';
        if (/full/i.test(lastErr)) break;
      }
    }
    this.busy.set(false); this.progress.set('');
    this.show(`${ok} picture${ok === 1 ? '' : 's'} added.` + (failed ? ` ${failed} failed: ${lastErr}` : ''), failed > 0 && ok === 0);
    this.load(1);
  }

  // ----- Chunna -----
  allChecked() { const d = this.data(); return !!d?.items.length && d.items.every(g => this.selected().has(g._id)); }
  toggleAll() { const d = this.data(); if (!d) return; this.selected.set(this.allChecked() ? new Set() : new Set(d.items.map(g => g._id))); }
  toggle(id: string) { const s = new Set(this.selected()); s.has(id) ? s.delete(id) : s.add(id); this.selected.set(s); }

  bulk(action: 'delete' | 'hide' | 'show') {
    const ids = [...this.selected()];
    if (!ids.length) return;
    if (action === 'delete' && !confirm(`Delete ${ids.length} picture(s)? To only take them off the website, use Hide instead.`)) return;
    this.api.bulkPhotos(action, ids).subscribe({
      next: () => { this.show(action === 'delete' ? 'Deleted.' : action === 'hide' ? 'Hidden from the website.' : 'Now visible on the website.'); this.load(); },
      error: e => this.show(e.error?.error || 'Could not update the pictures.', true)
    });
  }

  // ----- Ek picture -----
  startEdit(g: GalleryItem) { this.editing.set(g._id); this.capText = g.caption; }
  saveCaption(g: GalleryItem) {
    this.api.updatePhoto(g._id, { caption: this.capText.trim() }).subscribe({
      next: () => { this.editing.set(''); this.load(); }, error: e => this.show(e.error?.error || 'Could not save the caption.', true)
    });
  }
  toggleVisible(g: GalleryItem) {
    this.api.updatePhoto(g._id, { visible: !g.visible }).subscribe({
      next: () => this.load(), error: e => this.show(e.error?.error || 'Could not update the picture.', true)
    });
  }
  remove(g: GalleryItem) {
    if (!confirm('Delete this picture? To only take it off the website, use Hide instead.')) return;
    this.api.deletePhoto(g._id).subscribe({ next: () => { this.show('Picture deleted.'); this.load(); }, error: e => this.show(e.error?.error || 'Could not delete.', true) });
  }
}
