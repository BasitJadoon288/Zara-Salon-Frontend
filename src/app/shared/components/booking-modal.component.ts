import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BookingModalService } from '../../core/services/booking-modal.service';
import { SalonApiService } from '../../core/services/salon-api.service';
import { AppointmentPayload, Availability } from '../../core/models/models';
import { BRANCHES } from '../../core/config/salon.config';
import { endTime, formatDuration, to12h } from '../../core/utils/duration.util';

const empty = (): AppointmentPayload => ({ name: '', phone: '', email: '', branch: '', service: '', date: '', time: '' });
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); // yyyy-mm-dd

@Component({
  selector: 'app-booking-modal', standalone: true, imports: [FormsModule, AsyncPipe],
  template: `@if (modal.isOpen()) {
  <div class="overlay" (click)="modal.close()"><div class="box" (click)="$event.stopPropagation()">
    <h2>Get your appointment</h2>
    @if (message) { <div class="msg" [class.err]="isError">{{ message }}</div> }
    <input placeholder="Full name *" [(ngModel)]="form.name">
    <input placeholder="Phone *" [(ngModel)]="form.phone">
    <input placeholder="Email" [(ngModel)]="form.email">
    <select [ngModel]="form.branch" (ngModelChange)="form.branch = $event; loadSlots()"><option value="">Select Branch *</option>@for (b of branches; track b) { <option>{{ b }}</option> }</select>
    <select [ngModel]="form.service" (ngModelChange)="form.service = $event; loadSlots()"><option value="">Select Service *</option>
      @for (s of (api.services$ | async) ?? []; track s.title) { <option [value]="s.title">{{ s.title }}</option> }</select>
    <input type="date" [min]="today" [ngModel]="form.date" (ngModelChange)="form.date = $event; loadSlots()">

    @if (form.branch && form.service && form.date) {
      <div class="slots-wrap">
        <div class="slots-head">
          <b>Choose a time *</b>
          @if (avail) { <span class="note">This service takes about {{ fmt(avail.duration) }}</span> }
        </div>
        @if (loading) { <div class="note">Checking available times...</div> }
        @else if (slotsError) { <div class="note bad">{{ slotsError }}</div> }
        @else if (avail && !avail.slots.length) { <div class="note bad">No times are available on this day. Please choose another date.</div> }
        @else if (avail) {
          <div class="slots">
            @for (s of avail.slots; track s.time) {
              <button type="button" class="slot" [class.sel]="form.time === s.time" [class.covered]="isCovered(s.time)" [class.taken]="!s.available" [disabled]="!s.available"
                [title]="s.available ? 'Select ' + to12(s.time) : (s.reason === 'past' ? 'This time has passed' : 'Already booked')"
                (click)="form.time = s.time">
                {{ to12(s.time) }}
                @if (!s.available) { <small>{{ s.reason === 'past' ? 'Passed' : 'Booked' }}</small> }
                @else if (form.time === s.time) { <small>Start</small> }
                @else if (isCovered(s.time)) { <small>Reserved</small> }
              </button>
            }
          </div>
          @if (form.time) { <div class="note ok">Your slot: {{ to12(form.time) }} to {{ to12(end(form.time)) }} ({{ fmt(avail.duration) }}). All times in between are reserved for you.</div> }
          @else if (!hasFree()) { <div class="note bad">All times are booked on this day. Please choose another date.</div> }
        }
      </div>
    } @else { <div class="note hint">Select branch, service and date to see available times.</div> }

    <button class="btn" (click)="submit()" [disabled]="sending">{{ sending ? 'Sending...' : 'Submit' }}</button>
    <button class="btn grey" (click)="modal.close()">Close</button>
  </div></div> }`,
  styles: [`
  .overlay{position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
  .box{background:var(--surface);color:var(--text);box-shadow:0 0 0 1px var(--card-ring);padding:30px;border-radius:14px;width:100%;max-width:480px;max-height:92vh;overflow:auto}
  h2{margin-bottom:16px}.grey{background:#999;margin-left:8px}
  .btn[disabled]{opacity:.6;cursor:default}
  .slots-wrap{margin:0 0 16px}
  .slots-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:8px;font-size:14px}
  .note{font-size:13px;color:var(--muted);margin-bottom:8px}
  .note.hint{margin-bottom:14px}
  .note.ok{color:var(--msg-ok-ink);margin:10px 0 0}
  .note.bad{color:var(--msg-bad-ink)}
  .slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
  .slot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:42px;padding:6px 4px;border-radius:8px;
    border:1px solid var(--field-line);background:var(--field-bg);color:var(--text);font:500 13px 'Poppins',sans-serif;cursor:pointer}
  .slot:hover:not(:disabled){border-color:var(--rose-ink);color:var(--rose-ink)}
  .slot.sel{background:var(--rose);border-color:var(--rose);color:#fff}
  .slot.covered:not(.sel){background:var(--soft);border-color:var(--rose);color:var(--rose-ink)}
  .slot.taken{background:var(--msg-bad-bg);border-color:transparent;color:var(--msg-bad-ink);cursor:not-allowed;opacity:.75}
  .slot.taken{text-decoration:line-through}
  .slot small{font-size:10px;text-decoration:none;display:block;letter-spacing:.3px}
  .slot:focus-visible{outline:2px solid var(--rose-ink);outline-offset:1px}`]
})
export class BookingModalComponent {
  modal = inject(BookingModalService); api = inject(SalonApiService);
  branches = BRANCHES; form = empty(); message = ''; isError = false; sending = false;
  today = todayStr();
  avail: Availability | null = null; loading = false; slotsError = '';
  private slotsSub?: Subscription;
  fmt = formatDuration; to12 = to12h;

  end(time: string) { return endTime(time, this.avail?.duration); }
  // Chune hue slot ke baad service ke poore time mein jo slots aate hain (wo sab is customer ke liye reserve hongay)
  isCovered(time: string) {
    if (!this.form.time || !this.avail) return false;
    const m = (t: string) => { const [h, mi] = t.split(':').map(Number); return h * 60 + mi; };
    return m(time) >= m(this.form.time) && m(time) < m(this.form.time) + this.avail.duration;
  }
  hasFree() { return !!this.avail?.slots.some(s => s.available); }

  // Branch, service ya date badalne par us din ke slots dobara mangwata hai
  loadSlots() {
    this.slotsSub?.unsubscribe();
    this.form.time = ''; this.avail = null; this.slotsError = '';
    const { branch, service, date } = this.form;
    if (!branch || !service || !date) return;
    if (date < this.today) { this.slotsError = 'Please choose today or a future date.'; return; }
    this.loading = true;
    this.slotsSub = this.api.getAvailability(branch, service, date).subscribe({
      next: a => { this.avail = a; this.loading = false; },
      error: e => { this.slotsError = e.error?.error || 'Could not load available times. Please try again.'; this.loading = false; }
    });
  }

  submit() {
    const f = this.form;
    if (!f.name || !f.phone || !f.date || !f.branch || !f.service) { return this.show('Please fill all required fields.', true); }
    if (!f.time) { return this.show('Please choose an available time.', true); }
    this.sending = true;
    this.api.bookAppointment(f).subscribe({
      next: () => {
        const { branch, service, date } = this.form;
        this.sending = false; this.form = { ...empty(), branch, service, date };
        this.show('Appointment request sent! We will contact you soon.', false);
        this.loadSlots(); // ab wo waqt "Booked" dikhega
      },
      error: e => {
        this.sending = false;
        this.show(e.error?.error || 'Something went wrong. Try again.', true);
        if (e.status === 409) this.loadSlots(); // kisi aur ne ye waqt le liya: taza slots dikhayen
      }
    });
  }
  private show(m: string, err: boolean) { this.message = m; this.isError = err; }
}
