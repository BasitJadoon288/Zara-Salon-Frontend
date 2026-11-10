import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SalonApiService } from '../../core/services/salon-api.service';
import { RevealDirective } from '../../core/directives/reveal.directive';
import { ManageAppointment } from '../../core/models/models';
import { SALON } from '../../core/config/salon.config';
import { SectionTitleComponent } from '../../shared/components/section-title.component';
import { SlotPickerComponent } from '../../shared/components/slot-picker.component';
import { endTime, formatDuration, to12h } from '../../core/utils/duration.util';

const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

// Customer apne booking code se appointment dekh sakta hai, waqt badal sakta hai ya cancel kar sakta hai
@Component({
  selector: 'app-manage', standalone: true, imports: [FormsModule, SectionTitleComponent, SlotPickerComponent, RevealDirective],
  template: `<section class="container"><app-section-title eyebrow="Your booking" title="Manage your appointment" /><br>
    <div class="box" reveal>
      @if (message) { <div class="msg" [class.err]="isError">{{ message }}</div> }

      @if (!appt) {
        <p class="fine">Enter the booking code you received after booking (it is also in your confirmation email).</p>
        <input placeholder="Booking code" [(ngModel)]="code" (keyup.enter)="find()" autocapitalize="characters" maxlength="12">
        <button class="btn" (click)="find()" [disabled]="busy">{{ busy ? 'Searching...' : 'Find my appointment' }}</button>
      } @else {
        <div class="card">
          <div class="top"><b>{{ appt.service }}</b><span class="badge" [class]="appt.status">{{ label() }}</span></div>
          <p>{{ appt.branch }}</p>
          <p>{{ appt.date }}, {{ to12(appt.time) }} to {{ to12(end()) }} ({{ fmt(appt.duration) }})</p>
          @if (appt.stylistName) { <p>Stylist: {{ appt.stylistName }}</p> }
          <p class="fine">Name: {{ appt.name }} &middot; Code: {{ appt.code }}</p>
          @if (appt.waiting === 'pending') { <p class="fine">Waiting for the salon to confirm.</p> }
          @if (appt.waiting === 'expired') { <p class="fine">This request has not been confirmed yet and its time may have been released. Please call the salon to confirm.</p> }
        </div>

        @if (appt.canChange) {
          @if (mode === '') {
            <button class="btn" (click)="mode = 'move'">Change date or time</button>
            <button class="btn grey" (click)="mode = 'cancel'">Cancel appointment</button>
          }
          @if (mode === 'move') {
            <h3>Choose a new date and time</h3>
            <input type="date" [min]="today" [ngModel]="date" (ngModelChange)="date = $event; time = ''">
            <app-slot-picker [branch]="appt.branch" [service]="appt.service" [date]="date" [stylist]="appt.pickedStylistId"
              [exclude]="appt.code" [time]="time" (timeChange)="time = $event" hint="Pick a date to see available times." />
            <button class="btn" (click)="move()" [disabled]="busy || !time">{{ busy ? 'Saving...' : 'Confirm new time' }}</button>
            <button class="btn grey" (click)="mode = ''">Back</button>
          }
          @if (mode === 'cancel') {
            <p>Are you sure you want to cancel this appointment?</p>
            <button class="btn danger" (click)="cancel()" [disabled]="busy">{{ busy ? 'Cancelling...' : 'Yes, cancel it' }}</button>
            <button class="btn grey" (click)="mode = ''">Keep it</button>
          }
        } @else if (appt.whyNot) {
          <p class="fine">{{ appt.whyNot }}</p>
          <p class="fine">📞 {{ salon.phone }}</p>
        }
        <button class="link" (click)="reset()">Look up another booking</button>
      }
    </div></section>`,
  styles: [`
  .box{max-width:520px;margin:0 auto}
  .card{background:var(--surface);box-shadow:0 0 0 1px var(--card-ring);border-radius:12px;padding:18px;margin-bottom:18px}
  .card p{margin:4px 0}.top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}
  .badge{font-size:12px;padding:3px 10px;border-radius:20px;background:var(--soft);color:var(--rose-ink);text-transform:capitalize}
  .badge.confirmed{background:var(--msg-ok-bg);color:var(--msg-ok-ink)}.badge.cancelled{background:var(--msg-bad-bg);color:var(--msg-bad-ink)}
  .fine{font-size:13px;color:var(--muted)}
  .grey{background:#999;margin-left:8px}.danger{background:#a12222}
  .btn[disabled]{opacity:.6;cursor:default}
  h3{margin:6px 0 12px}
  .link{background:none;border:0;color:var(--rose-ink);text-decoration:underline;cursor:pointer;margin-top:16px;font:inherit;font-size:13px;display:block}`]
})
export class ManageComponent {
  private api = inject(SalonApiService);
  salon = SALON; today = todayStr(); fmt = formatDuration; to12 = to12h;
  code = ''; appt: ManageAppointment | null = null; mode: '' | 'move' | 'cancel' = '';
  date = ''; time = ''; busy = false; message = ''; isError = false;

  constructor() {
    const c = inject(ActivatedRoute).snapshot.paramMap.get('code');
    if (c) { this.code = c; this.find(); }
  }

  end() { return endTime(this.appt!.time, this.appt!.duration); }
  label() { const s = this.appt!.status; return s === 'pending' && this.appt!.waiting === 'expired' ? 'Not confirmed' : s; }
  reset() { this.appt = null; this.mode = ''; this.message = ''; this.code = ''; }

  find() {
    const code = this.code.trim().toUpperCase();
    if (!code) return this.show('Please enter your booking code.', true);
    this.busy = true; this.message = '';
    this.api.getManage(code).subscribe({
      next: a => { this.busy = false; this.appt = a; this.mode = ''; },
      error: e => { this.busy = false; this.show(e.error?.error || 'Something went wrong. Please try again.', true); }
    });
  }
  move() {
    if (!this.appt || !this.date || !this.time) return;
    this.busy = true; this.message = '';
    this.api.manageReschedule(this.appt.code, this.date, this.time).subscribe({
      next: a => { this.busy = false; this.appt = a; this.mode = ''; this.date = ''; this.time = ''; this.show('Your appointment has been moved.', false); },
      error: e => { this.busy = false; this.show(e.error?.error || 'Could not change the time. Please try again.', true); }
    });
  }
  cancel() {
    if (!this.appt) return;
    this.busy = true; this.message = '';
    this.api.manageCancel(this.appt.code).subscribe({
      next: a => { this.busy = false; this.appt = a; this.mode = ''; this.show('Your appointment has been cancelled.', false); },
      error: e => { this.busy = false; this.show(e.error?.error || 'Could not cancel. Please try again.', true); }
    });
  }
  private show(m: string, err: boolean) { this.message = m; this.isError = err; }
}
