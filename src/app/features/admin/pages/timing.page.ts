import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { BreakRule, Closure, TimingSettings } from '../../../core/models/models';
import { to12h } from '../../../core/utils/duration.util';

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];                      // Mon se Sun
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const blankBreak = (): BreakRule => ({ label: '', start: '', end: '', days: [], branch: '' });
const blankClosure = (): Closure => ({ from: '', to: '', branch: '', reason: '' });
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });

@Component({
  selector: 'app-timing-page', standalone: true, imports: [FormsModule],
  template: `
  <div class="adm-head"><h2>Timing</h2></div>
  @if (msg()) { <div class="msg" [class.err]="isErr()">{{ msg() }}</div> }

  @if (cfg(); as c) {
    @if (affected(); as a) {
      @if (a.count) {
        <div class="adm-card warn">
          <b>{{ a.count }} upcoming appointment(s) fall in a closed or break time.</b>
          <p class="adm-note">They were not changed. Please contact these customers, or move them from the Appointments page.</p>
          <ul>@for (x of a.items; track $index) { <li>{{ x.name }} - {{ x.date }} at {{ t12(x.time) }} ({{ x.branch }}): {{ x.issue }}</li> }</ul>
          @if (a.count > a.items.length) { <p class="adm-note">...and {{ a.count - a.items.length }} more.</p> }
        </div>
      }
    }

    <!-- 1. Salon timing -->
    <div class="adm-card">
      <h3>Salon timing</h3>
      <p class="adm-note sp">Customers can only book inside these timings. How long each service takes is set on the <b>Services</b> page. Changes apply to new bookings only; appointments already taken stay as they are.</p>
      <div class="adm-form">
        <div class="two">
          <div><label>Salon opens at</label><input type="time" [(ngModel)]="c.openTime"></div>
          <div><label>Salon closes at</label><input type="time" [(ngModel)]="c.closeTime"></div>
        </div>
        <span class="adm-note">Customers will see times from {{ t12(c.openTime) }} to {{ t12(c.closeTime) }}. A service can only be booked if it finishes before closing time.</span>

        <label>Gap between booking times</label>
        <select [(ngModel)]="c.slotStep">@for (s of steps(); track s) { <option [ngValue]="s">Every {{ s }} minutes</option> }</select>
        <span class="adm-note">Example: customers will see {{ example() }} and so on.</span>

        <label>Appointments allowed at the same time (in one branch)</label>
        <input type="number" min="1" [max]="maxChairs()" step="1" [(ngModel)]="c.chairs">
        <span class="adm-note">Used for a branch whose seats are not set in the <b>Seats in each branch</b> section below.</span>

        <label>Weekly off days</label>
        <div class="chips">@for (d of order; track d) { <label class="adm-chk"><input type="checkbox" [checked]="c.closedDays.includes(d)" (change)="toggle(c.closedDays, d)">{{ names[d] }}</label> }</div>
        <span class="adm-note">The salon is closed on the ticked days (for example Sunday).</span>
      </div>
    </div>

    <!-- Har branch ki seats -->
    <div class="adm-card">
      <h3>Seats in each branch</h3>
      <p class="adm-note sp">Appointments are booked against these seats. When all seats of a branch are taken at a time, that time shows as booked.</p>
      <div class="adm-form">
        @for (b of branchNames(); track b) {
          <label>{{ b }}</label>
          <input type="number" min="1" [max]="maxChairs()" step="1" [placeholder]="'Default: ' + c.chairs" [(ngModel)]="c.seats[b]">
        }
      </div>
    </div>

    <!-- 2. Branch ki alag timing -->
    <div class="adm-card">
      <h3>Different timing for a branch</h3>
      <p class="adm-note sp">Tick a branch only if it works differently from the timing above.</p>
      @for (b of branchNames(); track b) {
        <div class="branch">
          <label class="adm-chk"><input type="checkbox" [checked]="!!c.branches[b]" (change)="toggleBranch(b)"><b>{{ b }}</b></label>
          @if (c.branches[b]; as bt) {
            <div class="adm-form sub">
              <div class="two">
                <div><label>Opens at</label><input type="time" [(ngModel)]="bt.openTime"></div>
                <div><label>Closes at</label><input type="time" [(ngModel)]="bt.closeTime"></div>
              </div>
              <label>Weekly off days</label>
              <div class="chips">@for (d of order; track d) { <label class="adm-chk"><input type="checkbox" [checked]="bt.closedDays.includes(d)" (change)="toggle(bt.closedDays, d)">{{ names[d] }}</label> }</div>
            </div>
          }
        </div>
      }
    </div>

    <!-- 3. Break / namaz -->
    <div class="adm-card">
      <h3>Breaks and prayer times</h3>
      <p class="adm-note sp">Customers cannot book any service that overlaps these times (for example Jumma namaz, lunch).</p>
      @if (c.breaks.length) {
        <div class="adm-scroll"><table class="adm-table">
          <tr><th>Name</th><th>From</th><th>To</th><th>Days</th><th>Branch</th><th></th></tr>
          @for (b of c.breaks; track $index) {
            <tr><td>{{ b.label }}</td><td>{{ t12(b.start) }}</td><td>{{ t12(b.end) }}</td><td>{{ dayList(b.days) }}</td><td>{{ b.branch || 'All branches' }}</td>
              <td><button class="adm-btn sm danger" (click)="c.breaks.splice($index, 1)">Remove</button></td></tr>
          }
        </table></div>
      } @else { <div class="adm-empty">No breaks added.</div> }

      <div class="adm-form add">
        <b>Add a break</b>
        <div class="adm-row">
          <button class="adm-btn sm ghost" type="button" (click)="preset('jumma')">Jumma namaz</button>
          <button class="adm-btn sm ghost" type="button" (click)="preset('namaz')">Daily namaz</button>
          <button class="adm-btn sm ghost" type="button" (click)="preset('lunch')">Lunch break</button>
        </div>
        <label>Name</label><input [(ngModel)]="nb.label" maxlength="40" placeholder="e.g. Jumma namaz">
        <div class="two">
          <div><label>From</label><input type="time" [(ngModel)]="nb.start"></div>
          <div><label>To</label><input type="time" [(ngModel)]="nb.end"></div>
        </div>
        <label>Days</label>
        <div class="chips">@for (d of order; track d) { <label class="adm-chk"><input type="checkbox" [checked]="nb.days.includes(d)" (change)="toggle(nb.days, d)">{{ names[d] }}</label> }</div>
        <span class="adm-note">Leave all unticked for every day.</span>
        <label>Branch</label>
        <select [(ngModel)]="nb.branch"><option value="">All branches</option>@for (b of branchNames(); track b) { <option>{{ b }}</option> }</select>
        <div><button class="adm-btn" type="button" (click)="addBreak()">Add break</button></div>
      </div>
    </div>

    <!-- 4. Chhutti ke din -->
    <div class="adm-card">
      <h3>Closed dates (holidays)</h3>
      <p class="adm-note sp">The salon takes no bookings on these dates (for example Eid, a family event).</p>
      @if (c.closures.length) {
        <div class="adm-scroll"><table class="adm-table">
          <tr><th>From</th><th>To</th><th>Branch</th><th>Reason</th><th></th></tr>
          @for (x of c.closures; track $index) {
            <tr><td>{{ x.from }}</td><td>{{ x.to }}</td><td>{{ x.branch || 'All branches' }}</td><td>{{ x.reason || '-' }}</td>
              <td><button class="adm-btn sm danger" (click)="c.closures.splice($index, 1)">Remove</button></td></tr>
          }
        </table></div>
      } @else { <div class="adm-empty">No closed dates added.</div> }

      <div class="adm-form add">
        <b>Add closed dates</b>
        <div class="two">
          <div><label>From</label><input type="date" [min]="today" [(ngModel)]="nc.from"></div>
          <div><label>To (optional)</label><input type="date" [min]="nc.from || today" [(ngModel)]="nc.to"></div>
        </div>
        <span class="adm-note">Leave "To" empty for a single day.</span>
        <label>Branch</label>
        <select [(ngModel)]="nc.branch"><option value="">All branches</option>@for (b of branchNames(); track b) { <option>{{ b }}</option> }</select>
        <label>Reason (optional)</label><input [(ngModel)]="nc.reason" maxlength="60" placeholder="e.g. Eid ul Fitr">
        <div><button class="adm-btn" type="button" (click)="addClosure()">Add closed dates</button></div>
      </div>
    </div>

    <!-- 5. Booking ki hifazat -->
    <div class="adm-card">
      <h3>Booking protection</h3>
      <p class="adm-note sp">These settings stop fake bookings from blocking your time.</p>
      <div class="adm-form">
        <label>Hold an unconfirmed booking for (hours)</label>
        <input type="number" min="0" max="720" step="1" [(ngModel)]="c.holdHours">
        <span class="adm-note">A booking that stays "Pending" for longer than this stops blocking its time, so someone else can book it. Confirmed bookings are never released. Use 0 to hold pending bookings forever.</span>

        <label>Upcoming bookings allowed per phone number</label>
        <input type="number" min="0" max="20" step="1" [(ngModel)]="c.maxActivePerPhone">
        <span class="adm-note">Stops one person from taking many slots. Use 0 for no limit.</span>

        <label class="adm-chk"><input type="checkbox" [(ngModel)]="c.requireEmailOtp" [disabled]="!emailReady()">Customer must verify their email with a 6 digit code</label>
        @if (!emailReady()) { <span class="adm-note">Not available yet: email is not set up on the server (add EMAIL_USER and EMAIL_PASS in the backend .env).</span> }
        @else { <span class="adm-note">Customers must enter their email and the code we send before they can book.</span> }

        <label class="adm-chk"><input type="checkbox" [(ngModel)]="c.customerChanges">Customers can change or cancel their own appointment</label>
        <label>Customers can change up to (hours before the appointment)</label>
        <input type="number" min="0" max="168" step="1" [(ngModel)]="c.changeCutoffHours" [disabled]="!c.customerChanges">
      </div>
    </div>

    <!-- 6. Yaad-dahani email -->
    <div class="adm-card">
      <h3>Reminder emails</h3>
      <p class="adm-note sp">Customers get a friendly reminder email one day before their appointment, with a link to change or cancel it.</p>
      <div class="adm-form">
        <label class="adm-chk"><input type="checkbox" [(ngModel)]="c.reminderEmail">Send a reminder email 1 day before the appointment</label>
        <span class="adm-note">Sent every morning at about 10:00 AM for <b>tomorrow's</b> appointments. Only <b>confirmed</b> appointments whose customer gave an email get a reminder, and each appointment gets it only once. If you move an appointment to a new day, the reminder is sent again for the new day.</span>
        @if (!emailReady()) { <span class="adm-note" style="color:var(--msg-bad-ink)">Email is not set up on the server yet, so no reminders can be sent (add EMAIL_USER and EMAIL_PASS in the backend settings).</span> }
        <div class="adm-row">
          <button class="adm-btn ghost" type="button" (click)="sendReminders()" [disabled]="reminding() || !emailReady()">{{ reminding() ? 'Sending...' : "Send tomorrow's reminders now" }}</button>
        </div>
        <span class="adm-note">Save your changes first. This button sends the reminders right now (for example to test it). Anyone who already got a reminder is skipped.</span>
        @if (reminderMsg()) { <div class="msg" [class.err]="reminderErr()">{{ reminderMsg() }}</div> }
      </div>
    </div>

    <div class="adm-row"><button class="adm-btn" (click)="save()" [disabled]="saving()">{{ saving() ? 'Saving...' : 'Save timing' }}</button></div>
  } @else { <div class="adm-empty">Loading...</div> }`,
  styles: [`
  .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.two label{display:block;margin-bottom:6px}
  .chips{display:flex;flex-wrap:wrap;gap:6px 18px}
  .sp{margin-bottom:14px}
  .branch{padding:10px 0;border-top:1px solid var(--adm-line-2)}.branch:first-of-type{border-top:0}
  .sub{margin:10px 0 4px 26px}
  .add{margin-top:18px;padding-top:16px;border-top:1px solid var(--adm-line-2)}
  .warn{border-color:#d9a21b}.warn ul{margin:8px 0 0 18px}`]
})
export class TimingPage {
  private api = inject(SalonApiService);
  order = DAY_ORDER; names = DAY_NAMES; today = todayStr(); t12 = (t: string) => t ? to12h(t) : '--';
  cfg = signal<TimingSettings | null>(null);
  steps = signal<number[]>([10, 15, 20, 30, 45, 60]); maxChairs = signal(20); branchNames = signal<string[]>([]); emailReady = signal(false);
  affected = signal<TimingSettings['affected'] | null>(null);
  saving = signal(false); msg = signal(''); isErr = signal(false);
  reminding = signal(false); reminderMsg = signal(''); reminderErr = signal(false);
  nb: BreakRule = blankBreak(); nc: Closure = blankClosure();

  constructor() {
    this.api.getTiming().subscribe({
      next: t => this.apply(t),
      error: e => this.show(e.error?.error || 'Could not load the timing settings.', true)
    });
  }
  private show(m: string, err = false) { this.msg.set(m); this.isErr.set(err); }

  // Server se aaye settings ko form mein lagayen (copy, taake form ki edit server ke object ko na chhede)
  private apply(t: TimingSettings) {
    const copy: TimingSettings = JSON.parse(JSON.stringify(t));
    copy.branches ||= {}; copy.breaks ||= []; copy.closures ||= []; copy.closedDays ||= []; copy.seats ||= {};
    for (const [name, b] of Object.entries(copy.branches)) {            // purani branch-wali seats ab "Seats in each branch" mein dikhti hain
      if (b.chairs && !copy.seats[name]) copy.seats[name] = b.chairs;
      delete b.chairs;
    }
    this.cfg.set(copy);
    if (t.slotSteps) this.steps.set(t.slotSteps);
    if (t.maxChairs) this.maxChairs.set(t.maxChairs);
    this.branchNames.set(t.branchNames || []);
    this.emailReady.set(!!t.emailReady);
  }

  // Kal ki appointments ki reminder emails abhi bhejna
  sendReminders() {
    if (!confirm("Send reminder emails now to customers who have a confirmed appointment tomorrow?")) return;
    this.reminding.set(true); this.reminderMsg.set('');
    this.api.runReminders().subscribe({
      next: r => {
        this.reminding.set(false); this.reminderErr.set(false);
        this.reminderMsg.set(!r.enabled ? 'Reminder emails are switched off. Tick the box, press Save timing, and try again.'
          : !r.mailReady ? 'Email is not set up on the server.'
          : r.found === 0 ? `Nothing to send for tomorrow (${r.date}): there is no confirmed appointment with an email that has not been reminded yet.`
          : `Tomorrow (${r.date}): ${r.sent} reminder${r.sent === 1 ? '' : 's'} sent` + (r.failed ? `, ${r.failed} could not be sent (they will be tried again)` : '') + (r.remaining ? `, ${r.remaining} more waiting (press the button again)` : '') + '.');
        if (r.failed) this.reminderErr.set(true);
      },
      error: e => { this.reminding.set(false); this.reminderErr.set(true); this.reminderMsg.set(e.error?.error || 'Could not send the reminders.'); }
    });
  }

  toggle<T>(arr: T[], v: T) { const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); }
  dayList(days: number[]) { return days.length ? DAY_ORDER.filter(d => days.includes(d)).map(d => DAY_NAMES[d]).join(', ') : 'Every day'; }

  example() {
    const c = this.cfg(); if (!c?.openTime) return '--';
    const [h, m] = c.openTime.split(':').map(Number); const step = Number(c.slotStep) || 30;
    return [0, 1, 2].map(i => { const t = h * 60 + m + i * step; return to12h(`${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`); }).join(', ');
  }

  toggleBranch(name: string) {
    const c = this.cfg(); if (!c) return;
    if (c.branches[name]) delete c.branches[name];
    else c.branches[name] = { openTime: c.openTime, closeTime: c.closeTime, closedDays: [...c.closedDays] };
  }

  preset(kind: 'jumma' | 'namaz' | 'lunch') {
    this.nb = kind === 'jumma' ? { label: 'Jumma namaz', start: '13:00', end: '14:30', days: [5], branch: '' }
      : kind === 'namaz' ? { label: 'Namaz', start: '13:30', end: '14:00', days: [], branch: '' }
      : { label: 'Lunch break', start: '14:00', end: '15:00', days: [], branch: '' };
  }
  addBreak() {
    const c = this.cfg(); if (!c) return;
    const b = this.nb;
    if (!b.label.trim()) return this.show('Give the break a name (for example Jumma namaz).', true);
    if (!b.start || !b.end || b.end <= b.start) return this.show('Enter the break start and end time (end must be after start).', true);
    if (c.breaks.length >= (this.maxBreaks())) return this.show('You have reached the limit of breaks.', true);
    c.breaks.push({ ...b, label: b.label.trim(), days: [...b.days] });
    this.nb = blankBreak(); this.show('Break added. Press "Save timing" at the bottom to apply it.', false);
  }
  private maxBreaks() { return 20; }

  addClosure() {
    const c = this.cfg(); if (!c) return;
    const x = this.nc;
    if (!x.from) return this.show('Choose the date the salon is closed.', true);
    if (x.to && x.to < x.from) return this.show('The last closed date cannot be before the first.', true);
    c.closures.push({ ...x, to: x.to || x.from, reason: x.reason.trim() });
    c.closures.sort((a, b) => a.from.localeCompare(b.from));
    this.nc = blankClosure(); this.msg.set('');
  }

  save() {
    const c = this.cfg(); if (!c) return;
    if (!c.openTime || !c.closeTime) return this.show('Enter the opening and closing time.', true);
    if (c.closeTime <= c.openTime) return this.show('Closing time must be after opening time.', true);
    for (const [name, b] of Object.entries(c.branches)) {
      if (!b.openTime || !b.closeTime || b.closeTime <= b.openTime) return this.show(`Check the opening and closing time for ${name}.`, true);
    }
    for (const k of ['chairs', 'holdHours', 'maxActivePerPhone', 'changeCutoffHours'] as const) {
      if (!Number.isInteger(Number(c[k]))) return this.show('Please enter whole numbers in the number fields.', true);
    }
    this.saving.set(true); this.affected.set(null);
    this.api.saveTiming(c).subscribe({
      next: t => {
        this.saving.set(false); this.affected.set(t.affected || null); this.apply(t);
        this.show(t.affected?.count ? 'Saved. Some upcoming appointments need your attention (see above).' : 'Saved. New bookings will follow these settings.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: e => { this.saving.set(false); this.show(e.error?.error || 'Could not save the timing.', true); }
    });
  }
}
