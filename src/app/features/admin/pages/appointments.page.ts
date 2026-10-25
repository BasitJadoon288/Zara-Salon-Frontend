import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { SALON } from '../../../core/config/salon.config';
import { Appointment, AppointmentStatus } from '../../../core/models/models';

@Component({
  selector: 'app-appointments-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Appointments</h2><span class="adm-note">{{ filtered().length }} shown</span></div>
  @if (msg()) { <div class="msg err">{{ msg() }}</div> }

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
        <tr><th>Name</th><th>Phone</th><th>Email</th><th>Service</th><th>Branch</th><th>Date</th><th>Time</th><th>Status</th>@if (isAdmin()) { <th>Contact</th> }</tr>
        @for (a of filtered(); track a._id) {
          <tr>
            <td>{{ a.name }}</td><td>{{ a.phone }}</td><td>{{ a.email || '-' }}</td><td>{{ a.service }}</td>
            <td>{{ a.branch }}</td><td>{{ a.date }}</td><td>{{ a.time }}</td>
            <td>
              <select [ngModel]="a.status" (ngModelChange)="setStatus(a, $event)">
                <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
              </select>
              @if (a.statusChangedBy) { <div class="adm-note" style="font-size:12px;margin-top:4px">changed by {{ a.statusChangedBy }}</div> }
            </td>
            @if (isAdmin()) { <td><a class="adm-wa" [href]="waLink(a)" target="_blank" rel="noopener"><i class="fa-brands fa-whatsapp"></i>WhatsApp</a></td> }
          </tr>
        }
      </table>
    } @else { <div class="adm-empty">No appointments match these filters.</div> }
  </div>`
})
export class AppointmentsPage {
  private api = inject(SalonApiService);
  private auth = inject(AuthService);
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

  clear() { this.q.set(''); this.status.set(''); this.date.set(''); }

  // Admin aur staff dono status badal sakte hain
  setStatus(a: Appointment, s: AppointmentStatus) {
    this.msg.set('');
    this.api.updateStatus(a._id, s).subscribe({
      next: () => this.load(), // naya "changed by" bhi dikhe
      error: e => { this.msg.set(e.error?.error || 'Could not update the status.'); this.load(); }
    });
  }

  waLink(a: Appointment): string {
    let n = a.phone.replace(/\D/g, '');
    if (n.startsWith('0')) n = '92' + n.slice(1);
    const detail = `${a.service} at ${a.branch} on ${a.date} at ${a.time}`;
    const text = a.status === 'confirmed'
      ? `Assalam o Alaikum ${a.name}, your appointment for ${detail} is confirmed. - ${SALON.name}`
      : a.status === 'cancelled'
        ? `Assalam o Alaikum ${a.name}, we are sorry, your appointment for ${detail} has been cancelled. Please contact us to reschedule. - ${SALON.name}`
        : `Assalam o Alaikum ${a.name}, we received your appointment request for ${detail}. - ${SALON.name}`;
    return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
  }
}
