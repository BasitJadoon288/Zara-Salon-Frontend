import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { SalonService, Stylist } from '../../../core/models/models';
import { BRANCHES } from '../../../core/config/salon.config';
import { to12h } from '../../../core/utils/duration.util';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];                      // Mon se Sun
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const blank = (): Stylist => ({ name: '', branch: BRANCHES[0], services: [], workDays: [0, 1, 2, 3, 4, 5, 6], startTime: '', endTime: '', active: true });

@Component({
  selector: 'app-team-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Team</h2><button class="adm-btn" (click)="start()"><i class="fa-solid fa-plus"></i>Add team member</button></div>
  <div class="adm-card"><p class="adm-note">Add your stylists / beauticians here so each person has their own schedule. Customers can then book a specific person, or pick "any available" and the system assigns someone who is free. If a branch has <b>no</b> team members, bookings simply follow "Appointments allowed at the same time" on the Timing page.</p></div>
  @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }

  @if (form(); as f) {
    <div class="adm-card">
      <h3>{{ f._id ? 'Edit team member' : 'New team member' }}</h3>
      <div class="adm-form">
        <label>Name *</label><input [(ngModel)]="f.name" maxlength="60">
        <label>Branch *</label>
        <select [(ngModel)]="f.branch">@for (b of branches; track b) { <option>{{ b }}</option> }</select>

        <label>Services this person does</label>
        <div class="chips">
          @for (s of services(); track s.title) {
            <label class="adm-chk"><input type="checkbox" [checked]="f.services.includes(s.title)" (change)="toggle(f.services, s.title)">{{ s.title }}</label>
          }
        </div>
        <span class="adm-note">Leave all unchecked if this person does every service.</span>

        <label>Working days</label>
        <div class="chips">
          @for (d of order; track d) {
            <label class="adm-chk"><input type="checkbox" [checked]="f.workDays.includes(d)" (change)="toggle(f.workDays, d)">{{ names[d] }}</label>
          }
        </div>

        <div class="two">
          <div><label>Starts at</label><input type="time" [(ngModel)]="f.startTime"></div>
          <div><label>Finishes at</label><input type="time" [(ngModel)]="f.endTime"></div>
        </div>
        <span class="adm-note">Leave both empty to follow the branch opening hours.</span>

        <label class="adm-chk"><input type="checkbox" [(ngModel)]="f.active">Active (can take bookings)</label>
        <div class="adm-row"><button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save' }}</button><button class="adm-btn ghost" (click)="form.set(null)">Cancel</button></div>
      </div>
    </div>
  }

  <div class="adm-card adm-scroll">
    @if (list().length) {
      <table class="adm-table">
        <tr><th>Name</th><th>Branch</th><th>Services</th><th>Days</th><th>Hours</th><th>Status</th><th></th></tr>
        @for (s of list(); track s._id) {
          <tr>
            <td>{{ s.name }}</td><td>{{ s.branch }}</td>
            <td>{{ s.services.length ? s.services.join(', ') : 'All services' }}</td>
            <td>{{ days(s) }}</td>
            <td>{{ s.startTime ? t12(s.startTime) + ' - ' + t12(s.endTime) : 'Branch hours' }}</td>
            <td>{{ s.active ? 'Active' : 'Inactive' }}</td>
            <td class="adm-row"><button class="adm-btn sm ghost" (click)="edit(s)">Edit</button><button class="adm-btn sm danger" (click)="remove(s)">Delete</button></td>
          </tr>
        }
      </table>
    } @else { <div class="adm-empty">No team members yet.</div> }
  </div>`,
  styles: [`.chips{display:flex;flex-wrap:wrap;gap:6px 18px}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.two label{display:block;margin-bottom:6px}`]
})
export class TeamPage {
  private api = inject(SalonApiService);
  branches = BRANCHES; order = DAY_ORDER; names = DAY_NAMES; t12 = to12h;
  list = signal<Stylist[]>([]); services = signal<SalonService[]>([]);
  form = signal<Stylist | null>(null); saving = signal(false);
  msg = signal(''); isErr = signal(false);

  constructor() { this.load(); this.api.getServicesAdmin().subscribe(s => this.services.set(s)); }
  private load() { this.api.getStylistsAdmin().subscribe(l => this.list.set(l)); }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  days(s: Stylist) { return s.workDays.length === 7 ? 'Every day' : DAY_ORDER.filter(d => s.workDays.includes(d)).map(d => DAY_NAMES[d]).join(', '); }
  toggle<T>(arr: T[], v: T) { const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); }

  start() { this.form.set(blank()); this.msg.set(''); }
  edit(s: Stylist) { this.form.set({ ...s, services: [...s.services], workDays: [...s.workDays] }); this.msg.set(''); }

  save() {
    const f = this.form(); if (!f) return;
    if (!f.name.trim()) return this.show('Name is required.', true);
    if (!f.workDays.length) return this.show('Select at least one working day.', true);
    if ((f.startTime || f.endTime) && (!f.startTime || !f.endTime || f.endTime <= f.startTime)) return this.show('Enter both times, and finish time must be after start time (or leave both empty).', true);
    this.saving.set(true);
    this.api.saveStylist({ ...f, name: f.name.trim() }).subscribe({
      next: () => { this.saving.set(false); this.form.set(null); this.show('Saved.'); this.load(); },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save.', true); }
    });
  }

  remove(s: Stylist) {
    if (!s._id || !confirm(`Delete ${s.name}?`)) return;
    this.api.deleteStylist(s._id).subscribe({
      next: () => { this.show('Deleted.'); this.load(); },
      error: e => this.show(e.error?.error || 'Could not delete.', true)
    });
  }
}
