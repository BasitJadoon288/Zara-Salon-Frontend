import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SALON } from '../../../core/config/salon.config';
import { Appointment, AppointmentPayload, AppointmentStatus, StylistLite } from '../../../core/models/models';
import { BRANCHES } from '../../../core/config/salon.config';
import { AsyncPipe } from '@angular/common';
import { SlotPickerComponent } from '../../../shared/components/slot-picker.component';
import { endTime, formatDuration } from '../../../core/utils/duration.util';

const emptyNew = (): AppointmentPayload => ({ name: '', phone: '', email: '', branch: '', service: '', date: '', time: '', stylistId: '' });
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

@Component({
  selector: 'app-appointments-page', standalone: true, imports: [FormsModule, AsyncPipe, SlotPickerComponent],
  template: `
  <div class="adm-head"><h2>Appointments</h2><span class="adm-note">{{ filtered().length }} shown</span>
    <button class="adm-btn" (click)="toggleAdd()"><i class="fa-solid fa-plus"></i>New appointment</button></div>
  @if (msg()) { <div class="msg" [class.err]="msgErr()">{{ msg() }}</div> }

  @if (adding()) {
    <div class="adm-card">
      <h3>New appointment (phone / walk-in)</h3>
      <div class="adm-form">
        <input placeholder="Customer name *" [(ngModel)]="nf.name">
        <input placeholder="Phone *" [(ngModel)]="nf.phone">
        <input placeholder="Email (optional)" [(ngModel)]="nf.email">
        <select [ngModel]="nf.branch" (ngModelChange)="nf.branch = $event; addChanged()"><option value="">Select branch *</option>@for (b of branches; track b) { <option>{{ b }}</option> }</select>
        <select [ngModel]="nf.service" (ngModelChange)="nf.service = $event; addChanged()"><option value="">Select service *</option>
          @for (s of (api.services$ | async) ?? []; track s.title) { <option [value]="s.title">{{ s.title }}</option> }</select>
        @if (addStylists().length) {
          <select [(ngModel)]="nf.stylistId" (ngModelChange)="nf.time = ''"><option value="">Any available stylist</option>
            @for (s of addStylists(); track s._id) { <option [value]="s._id">{{ s.name }}</option> }</select>
        }
        <input type="date" [min]="today" [ngModel]="nf.date" (ngModelChange)="nf.date = $event; nf.time = ''">
        <app-slot-picker [branch]="nf.branch" [service]="nf.service" [date]="nf.date" [stylist]="nf.stylistId || ''" [time]="nf.time" (timeChange)="nf.time = $event" />
        <label class="adm-chk"><input type="checkbox" [(ngModel)]="nfConfirmed">Mark as confirmed</label>
        <div class="adm-row"><button class="adm-btn" (click)="saveNew()" [disabled]="busy()">{{ busy() ? 'Saving...' : 'Save appointment' }}</button><button class="adm-btn ghost" (click)="adding.set(false)">Cancel</button></div>
      </div>
    </div>
  }

  <div class="adm-card adm-filters">
    <input placeholder="Search name or phone" [ngModel]="q()" (ngModelChange)="q.set($event)">
    <select [ngModel]="status()" (ngModelChange)="status.set($event)">
      <option value="">All statuses</option><option value="pending">Pending</option>
      <option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
    </select>
    <input type="date" [ngModel]="date()" (ngModelChange)="date.set($event)">
    <button class="adm-btn ghost" (click)="clear()">Clear filters</button>
  </div>

  <div class="adm-card adm-scroll">
    @if (filtered().length) {
      <table class="adm-table">
        <tr><th>Name</th><th>Phone</th><th>Email</th><th>Service</th><th>Branch</th><th>Date</th><th>Time</th><th>Stylist</th><th>Status</th>@if (isAdmin()) { <th>Contact</th> }</tr>
        @for (a of filtered(); track a._id) {
          <tr>
            <td>{{ a.name }}@if (a.createdBy === 'admin') { <div class="adm-note" style="font-size:12px">Phone booking</div> }@if (a.code) { <div class="adm-note" style="font-size:12px">Code: {{ a.code }}</div> }</td><td>{{ a.phone }}</td><td>{{ a.email || '-' }}</td><td>{{ a.service }}</td>
            <td>{{ a.branch }}</td><td>{{ a.date }}</td><td>{{ a.time }} - {{ end(a) }}<div class="adm-note" style="font-size:12px">{{ fmt(a.duration || 60) }}</div></td>
            <td>{{ a.stylistName || '-' }}</td>
            <td>
              <select [ngModel]="a.status" (ngModelChange)="setStatus(a, $event)">
                <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
              </select>
              @if (a.reminderSentAt) { <div class="adm-note" style="font-size:12px;margin-top:4px">Reminder email sent</div> }
              @if (a.holdExpired) { <div class="adm-note" style="font-size:12px;margin-top:4px;color:#d9a21b">Not confirmed in time: this slot was released</div> }
              @if (a.statusChangedBy) { <div class="adm-note" style="font-size:12px;margin-top:4px">changed by {{ a.statusChangedBy }}</div> }
              @if (a.status !== 'cancelled') { <button class="adm-btn sm ghost" style="margin-top:6px" (click)="toggleMove(a)">{{ moving() === a._id ? 'Close' : 'Reschedule' }}</button> }
            </td>
            @if (isAdmin()) { <td><a class="adm-wa" [href]="waLink(a)" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i>WhatsApp</a></td> }
          </tr>
          @if (moving() === a._id) {
            <tr><td [attr.colspan]="isAdmin() ? 11 : 10">
              <div class="adm-form">
                <b>Move {{ a.name }}'s {{ a.service }} appointment</b>
                @if (moveStylists().length) {
                  <select [(ngModel)]="mv.stylistId" (ngModelChange)="mv.time = ''"><option value="">Any available stylist</option>
                    @for (s of moveStylists(); track s._id) { <option [value]="s._id">{{ s.name }}</option> }</select>
                }
                <input type="date" [min]="today" [ngModel]="mv.date" (ngModelChange)="mv.date = $event; mv.time = ''">
                <app-slot-picker [branch]="a.branch" [service]="a.service" [date]="mv.date" [stylist]="mv.stylistId" [exclude]="a.code || ''"
                  [time]="mv.time" (timeChange)="mv.time = $event" hint="Pick a date to see available times." />
                <div class="adm-row"><button class="adm-btn" (click)="saveMove(a)" [disabled]="busy() || !mv.time">{{ busy() ? 'Saving...' : 'Move appointment' }}</button></div>
              </div>
            </td></tr>
          }
        }
      </table>
    } @else { <div class="adm-empty">No appointments match these filters.</div> }
  </div>`
})
export class AppointmentsPage {
  api = inject(SalonApiService);
  branches = BRANCHES; today = todayStr();
  adding = signal(false); busy = signal(false); msgErr = signal(true);
  nf: AppointmentPayload = emptyNew(); nfConfirmed = true; addStylists = signal<StylistLite[]>([]);
  moving = signal(''); mv = { date: '', time: '', stylistId: '' }; moveStylists = signal<StylistLite[]>([]);
  private auth = inject(AuthService);
  fmt = formatDuration;
  end = (a: Appointment) => endTime(a.time, a.duration);
  isAdmin = computed(() => this.auth.role() === 'admin');

  all = signal<Appointment[]>([]);
  q = signal(''); status = signal(''); date = signal('');
  msg = signal('');

  filtered = computed(() => {
    const q = this.q().trim().toLowerCase();
    return this.all().filter(a =>
      (!this.status() || a.status === this.status()) &&
      (!this.date() || a.date === this.date()) &&
      (!q || a.name.toLowerCase().includes(q) || a.phone.includes(q)));
  });

  constructor() { this.load(); }
  private load() { this.api.getAppointments().subscribe(a => this.all.set(a)); }

  private ok(m: string) { this.msgErr.set(false); this.msg.set(m); }
  private bad(m: string) { this.msgErr.set(true); this.msg.set(m); }

  // ----- Nayi booking (phone / walk-in) -----
  toggleAdd() { this.adding.update(v => !v); this.msg.set(''); }
  addChanged() {
    this.nf.time = ''; this.nf.stylistId = ''; this.addStylists.set([]);
    const { branch, service } = this.nf;
    if (branch && service) this.api.getStylists(branch, service).subscribe({ next: l => { if (this.nf.branch === branch && this.nf.service === service) this.addStylists.set(l); } });
  }
  saveNew() {
    const f = this.nf;
    if (!f.name.trim() || !f.phone.trim() || !f.branch || !f.service || !f.date) return this.bad('Please fill the name, phone, branch, service and date.');
    if (!f.time) return this.bad('Please choose a time.');
    this.busy.set(true); this.msg.set('');
    this.api.createAppointmentAdmin({ ...f, stylistId: f.stylistId || undefined, status: this.nfConfirmed ? 'confirmed' : 'pending' }).subscribe({
      next: () => { this.busy.set(false); this.adding.set(false); this.nf = emptyNew(); this.addStylists.set([]); this.ok('Appointment saved.'); this.load(); },
      error: e => { this.busy.set(false); this.bad(e.error?.error || 'Could not save the appointment.'); }
    });
  }

  // ----- Waqt badalna -----
  toggleMove(a: Appointment) {
    if (this.moving() === a._id) { this.moving.set(''); return; }
    this.msg.set(''); this.moving.set(a._id);
    this.mv = { date: '', time: '', stylistId: a.stylistPicked && a.stylistId ? a.stylistId : '' };
    this.moveStylists.set([]);
    this.api.getStylists(a.branch, a.service).subscribe({ next: l => { if (this.moving() === a._id) this.moveStylists.set(l); } });
  }
  saveMove(a: Appointment) {
    if (!this.mv.date || !this.mv.time) return;
    this.busy.set(true); this.msg.set('');
    this.api.rescheduleAppointment(a._id, { date: this.mv.date, time: this.mv.time, stylistId: this.mv.stylistId }).subscribe({
      next: () => { this.busy.set(false); this.moving.set(''); this.ok('Appointment moved.'); this.load(); },
      error: e => { this.busy.set(false); this.bad(e.error?.error || 'Could not move the appointment.'); }
    });
  }

  clear() { this.q.set(''); this.status.set(''); this.date.set(''); }

  // Admin aur staff dono status badal sakte hain
  setStatus(a: Appointment, s: AppointmentStatus) {
    this.msg.set('');
    this.api.updateStatus(a._id, s).subscribe({
      next: () => this.load(), // naya "changed by" bhi dikhe
      error: e => { this.bad(e.error?.error || 'Could not update the status.'); this.load(); }
    });
  }

  waLink(a: Appointment): string {
    let n = a.phone.replace(/\D/g, '');
    if (n.startsWith('0')) n = '92' + n.slice(1);
    const detail = `${a.service} at ${a.branch} on ${a.date} from ${a.time} to ${this.end(a)}`;
    const text = a.status === 'confirmed'
      ? `Assalam o Alaikum ${a.name}, your appointment for ${detail} is confirmed. - ${SALON.name}`
      : a.status === 'cancelled'
        ? `Assalam o Alaikum ${a.name}, we are sorry, your appointment for ${detail} has been cancelled. Please contact us to reschedule. - ${SALON.name}`
        : `Assalam o Alaikum ${a.name}, we received your appointment request for ${detail}. - ${SALON.name}`;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }
}
