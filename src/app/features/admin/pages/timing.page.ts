import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { TimingSettings } from '../../../core/models/models';
import { to12h } from '../../../core/utils/duration.util';

@Component({
  selector: 'app-timing-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Timing</h2></div>

  <div class="adm-card">
    <h3>Appointment timing</h3>
    <p class="adm-note" style="margin-bottom:14px">Customers can only book inside these timings. How long each service takes is set on the <b>Services</b> page. Changes apply to new bookings only; appointments already taken stay as they are.</p>
    @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }
    @if (loaded()) {
      <div class="adm-form">
        <div class="two">
          <div><label>Salon opens at</label><input type="time" [(ngModel)]="form.openTime"></div>
          <div><label>Salon closes at</label><input type="time" [(ngModel)]="form.closeTime"></div>
        </div>
        <span class="adm-note">Customers will see times from {{ t12(form.openTime) }} to {{ t12(form.closeTime) }}. A service can only be booked if it finishes before closing time.</span>

        <label>Gap between booking times</label>
        <select [(ngModel)]="form.slotStep">
          @for (s of steps(); track s) { <option [ngValue]="s">Every {{ s }} minutes</option> }
        </select>
        <span class="adm-note">Example: customers will see {{ example() }} and so on.</span>

        <label>Appointments allowed at the same time (in one branch)</label>
        <input type="number" min="1" [max]="maxChairs()" step="1" [(ngModel)]="form.chairs">
        <span class="adm-note">1 means one customer at a time in a branch. Increase it if you have more staff or chairs working together.</span>

        <div class="adm-row"><button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save timing' }}</button></div>
      </div>
    } @else { <div class="adm-empty">Loading...</div> }
  </div>`,
  styles: [`.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.two label{display:block;margin-bottom:6px}`]
})
export class TimingPage {
  private api = inject(SalonApiService);
  form: TimingSettings = { openTime: '10:00', closeTime: '20:00', slotStep: 30, chairs: 1 };
  loaded = signal(false); saving = signal(false);
  steps = signal<number[]>([10, 15, 20, 30, 45, 60]); maxChairs = signal(20);
  msg = signal(''); isErr = signal(false);

  constructor() {
    this.api.getTiming().subscribe({
      next: t => {
        this.form = { openTime: t.openTime, closeTime: t.closeTime, slotStep: t.slotStep, chairs: t.chairs };
        if (t.slotSteps) this.steps.set(t.slotSteps);
        if (t.maxChairs) this.maxChairs.set(t.maxChairs);
        this.loaded.set(true);
      },
      error: e => { this.show(e.error?.error || 'Could not load the timing settings.', true); }
    });
  }

  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }
  // Chune hue gap ke hisaab se pehle 3 times, jaise "10:00 AM, 10:15 AM, 10:30 AM"
  example() {
    if (!this.form.openTime) return '--';
    const [h, m] = this.form.openTime.split(':').map(Number);
    const step = Number(this.form.slotStep) || 30;
    return [0, 1, 2].map(i => { const t = h * 60 + m + i * step; return to12h(`${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`); }).join(', ');
  }
  // time khali ho to khali dikhaye, warna "10:00 AM"
  t12(t: string) { return t ? to12h(t) : '--'; }

  save() {
    const f = this.form;
    if (!f.openTime || !f.closeTime) { this.show('Enter the opening and closing time.', true); return; }
    if (f.closeTime <= f.openTime) { this.show('Closing time must be after opening time.', true); return; }
    if (!Number.isInteger(Number(f.chairs)) || f.chairs < 1) { this.show('Appointments at the same time must be a whole number, 1 or more.', true); return; }
    this.saving.set(true);
    this.api.saveTiming({ ...f, chairs: Number(f.chairs) }).subscribe({
      next: () => { this.saving.set(false); this.show('Timing saved. New bookings will follow it.'); },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save the timing.', true); }
    });
  }
}
