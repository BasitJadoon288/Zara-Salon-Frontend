import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { DEFAULT_ABOUT } from '../../../core/config/about.default';
import { AboutInfo } from '../../../core/models/models';

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
      <p class="adm-note">This text appears on the About page and in the About section of the home page.</p>
      <div class="adm-row"><button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save changes' }}</button></div>
    </div>
  </div>`
})
export class AboutPage {
  private api = inject(SalonApiService);
  form: AboutInfo = { ...DEFAULT_ABOUT };
  msg = signal(''); isErr = signal(false); saving = signal(false);

  constructor() { this.api.getAbout().subscribe({ next: a => { if (a) this.form = { ...a }; }, error: () => {} }); }

  save() {
    if (!this.form.title.trim() || !this.form.text.trim()) { this.msg.set('Enter a heading and some text.'); this.isErr.set(true); return; }
    this.saving.set(true);
    this.api.saveAbout(this.form).subscribe({
      next: () => { this.saving.set(false); this.msg.set('About page saved.'); this.isErr.set(false); },
      error: e => { this.saving.set(false); this.msg.set(e.error?.error || 'Could not save the About page.'); this.isErr.set(true); }
    });
  }
}
