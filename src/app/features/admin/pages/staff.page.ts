import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { StaffUser } from '../../../core/models/models';

@Component({
  selector: 'app-staff-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Staff accounts</h2></div>
  <div class="adm-card">
    <h3>Add a staff member</h3>
    <p class="adm-note" style="margin-bottom:12px">Staff can sign in, view appointments and confirm, cancel or set them to pending. They cannot change anything else.</p>
    @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
    <div class="adm-form">
      <label>Name</label><input [(ngModel)]="name" maxlength="60">
      <label>Email</label><input type="email" [(ngModel)]="email" maxlength="120" autocomplete="off">
      <label>Password (at least 10 characters)</label><input type="password" [(ngModel)]="password" maxlength="100" autocomplete="new-password">
      <div class="adm-row"><button class="adm-btn" (click)="add()">Add staff member</button></div>
    </div>
  </div>

  <div class="adm-card adm-scroll">
    @if (items().length) {
      <table class="adm-table">
        <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
        @for (u of items(); track u._id) {
          <tr><td>{{ u.name }}</td><td>{{ u.email }}</td><td><span class="badge pending">{{ u.role }}</span></td>
          <td>@if (u.role === 'staff') { <button class="adm-btn danger sm" (click)="remove(u)">Delete</button> }</td></tr>
        }
      </table>
    } @else { <div class="adm-empty">No staff accounts yet.</div> }
  </div>`
})
export class StaffPage {
  private api = inject(SalonApiService);
  items = signal<StaffUser[]>([]);
  name = ''; email = ''; password = '';
  msg = signal(''); isErr = signal(false);

  constructor() { this.load(); }
  private load() { this.api.getUsers().subscribe(l => this.items.set(l)); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  add() {
    if (!this.name.trim() || !this.email.trim()) { this.show('Enter the name and email.', true); return; }
    if (this.password.length < 10) { this.show('The password must be at least 10 characters.', true); return; }
    this.api.addUser({ name: this.name, email: this.email, password: this.password, role: 'staff' }).subscribe({
      next: () => { this.name = ''; this.email = ''; this.password = ''; this.load(); this.show('Staff member added.'); },
      error: e => this.show(e.error?.error || 'Could not add the staff member.', true)
    });
  }
  remove(u: StaffUser) {
    if (!confirm(`Delete the account for ${u.name}?`)) return;
    this.api.deleteUser(u._id).subscribe(() => { this.load(); this.show('Staff member deleted.'); });
  }
}
