import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { SalonService } from '../../../core/models/models';

const blank = (): SalonService => ({ title: '', description: '', icon: '' });

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
      <label>Icon (an emoji, shown when the service has no picture)</label><input [(ngModel)]="form.icon" maxlength="4">
      <p class="adm-note">The service picture is read from <b>assets/images/services/</b> using the service name, for example "Hair Styling" uses hair-styling.jpg. If you rename a service, rename its picture too.</p>
      <div class="adm-row">
        <button class="adm-btn" (click)="save()">{{ form._id ? 'Save changes' : 'Add service' }}</button>
        @if (form._id) { <button class="adm-btn ghost" (click)="form = blank()">Cancel</button> }
      </div>
    </div>
  </div>

  <div class="adm-card adm-scroll">
    @if (items().length) {
      <table class="adm-table">
        <tr><th>Icon</th><th>Name</th><th>Description</th><th></th></tr>
        @for (s of items(); track s._id) {
          <tr>
            <td>{{ s.icon }}</td><td>{{ s.title }}</td><td>{{ s.description }}</td>
            <td class="adm-row">
              <button class="adm-btn ghost sm" (click)="edit(s)">Edit</button>
              <button class="adm-btn danger sm" (click)="remove(s)">Delete</button>
            </td>
          </tr>
        }
      </table>
    } @else { <div class="adm-empty">No services yet. Add the first one above.</div> }
  </div>`
})
export class ServicesPage {
  private api = inject(SalonApiService);
  items = signal<SalonService[]>([]);
  form: SalonService = blank();
  msg = signal(''); isErr = signal(false);
  blank = blank;

  constructor() { this.load(); }
  private load() { this.api.getServicesFresh().subscribe(l => this.items.set(l)); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  save() {
    if (!this.form.title.trim() || !this.form.description.trim()) { this.show('Enter the service name and a short description.', true); return; }
    const wasEdit = !!this.form._id;
    this.api.saveService(this.form).subscribe({
      next: () => { this.form = blank(); this.load(); this.show(wasEdit ? 'Service updated.' : 'Service added.'); },
      error: e => this.show(e.error?.error || 'Could not save the service.', true)
    });
  }
  edit(s: SalonService) { this.form = { ...s }; window.scrollTo({ top: 0, behavior: 'smooth' }); }
  remove(s: SalonService) {
    if (!confirm(`Delete the service "${s.title}"?`)) return;
    this.api.deleteService(s._id!).subscribe(() => { this.load(); this.show('Service deleted.'); });
  }
}
