import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { SalonApiService } from '../../core/services/salon-api.service';
import { Availability, TimeSlot } from '../../core/models/models';
import { endTime, formatDuration, to12h } from '../../core/utils/duration.util';

// Time slots ka grid. Booking form, admin ki nayi booking aur reschedule (customer / admin) sab mein yahi use hota hai.
// Branch, service, date ya stylist badalne par khud slots dobara mangwata hai.
@Component({
  selector: 'app-slot-picker', standalone: true,
  template: `
  @if (branch && service && date) {
    <div class="slots-wrap">
      <div class="slots-head">
        <b>Choose a time *</b>
        @if (avail) { <span class="note">This service takes about {{ fmt(avail.duration) }}</span> }
      </div>
      @if (loading) { <div class="note">Checking available times...</div> }
      @else if (error) { <div class="note bad">{{ error }}</div> }
      @else if (avail?.closed) { <div class="note bad">{{ avail!.closedReason }} Please choose another date.</div> }
      @else if (avail?.notice) { <div class="note bad">{{ avail!.notice }}</div> }
      @else if (avail && !avail.slots.length) { <div class="note bad">No times are available on this day. Please choose another date.</div> }
      @else if (avail) {
        <div class="slots">
          @for (s of avail.slots; track s.time) {
            <button type="button" class="slot" [style.--n]="$index" [class.sel]="time === s.time" [class.covered]="isCovered(s.time)" [class.taken]="!s.available" [class.brk]="s.reason === 'break'"
              [disabled]="!s.available" [title]="tip(s)" (click)="pick(s.time)">
              {{ to12(s.time) }}
              @if (!s.available) { <small>{{ tag(s) }}</small> }
              @else if (time === s.time) { <small>Start</small> }
              @else if (isCovered(s.time)) { <small>Reserved</small> }
            </button>
          }
        </div>
        @if (time) { <div class="note ok">Selected: {{ to12(time) }} to {{ to12(end(time)) }} ({{ fmt(avail.duration) }}). All times in between are reserved.</div> }
        @else if (!hasFree()) { <div class="note bad">No free time on this day. Please choose another date.</div> }
      }
    </div>
  } @else { <div class="note hint">{{ hint }}</div> }`,
  styles: [`
  .slots-wrap{margin:0 0 16px}
  .slots-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:8px;font-size:14px}
  .note{font-size:13px;color:var(--muted);margin-bottom:8px}
  .note.hint{margin-bottom:14px}
  .note.ok{color:var(--msg-ok-ink);margin:10px 0 0}
  .note.bad{color:var(--msg-bad-ink)}
  .slots{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px}
  .slot{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-height:42px;padding:6px 4px;border-radius:8px;
    border:1px solid var(--field-line);background:var(--field-bg);color:var(--text);font:500 13px 'Poppins',sans-serif;cursor:pointer}
  .slot{animation:slotIn .35s var(--ease) backwards;animation-delay:calc(min(var(--n,0),24) * 16ms);transition:background-color .2s,border-color .2s,color .2s,transform .15s var(--ease)}
  .slot:hover:not(:disabled){border-color:var(--rose-ink);color:var(--rose-ink);transform:translateY(-2px)}
  .slot:active:not(:disabled){transform:scale(.95)}
  .slot.sel{background:var(--rose);border-color:var(--rose);color:#fff;transform:scale(1.04)}
  .slot.covered:not(.sel){background:var(--soft);border-color:var(--rose);color:var(--rose-ink)}
  .slot.taken{background:var(--msg-bad-bg);border-color:transparent;color:var(--msg-bad-ink);cursor:not-allowed;opacity:.75;text-decoration:line-through}
  .slot.brk{background:var(--soft);color:var(--muted);opacity:.85}
  .slot small{font-size:10px;text-decoration:none;display:block;letter-spacing:.3px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .slot:focus-visible{outline:2px solid var(--rose-ink);outline-offset:1px}`]
})
export class SlotPickerComponent implements OnChanges, OnDestroy {
  private api = inject(SalonApiService);
  @Input() branch = ''; @Input() service = ''; @Input() date = '';
  @Input() stylist = ''; @Input() exclude = '';
  @Input() time = ''; @Output() timeChange = new EventEmitter<string>();
  @Input() hint = 'Select branch, service and date to see available times.';

  avail: Availability | null = null; loading = false; error = '';
  private sub?: Subscription;
  fmt = formatDuration; to12 = to12h;

  ngOnChanges(ch: SimpleChanges) {
    if (['branch', 'service', 'date', 'stylist', 'exclude'].some(k => ch[k])) this.load();
  }
  ngOnDestroy() { this.sub?.unsubscribe(); }

  private load() {
    this.sub?.unsubscribe();
    this.avail = null; this.error = '';
    if (this.time) queueMicrotask(() => this.timeChange.emit(''));   // purana chuna hua waqt hata do
    if (!this.branch || !this.service || !this.date) return;
    this.loading = true;
    this.sub = this.api.getAvailability(this.branch, this.service, this.date, this.stylist, this.exclude).subscribe({
      next: a => { this.avail = a; this.loading = false; },
      error: e => { this.error = e.error?.error || 'Could not load available times. Please try again.'; this.loading = false; }
    });
  }

  pick(t: string) { this.timeChange.emit(t); }
  end(t: string) { return endTime(t, this.avail?.duration); }
  hasFree() { return !!this.avail?.slots.some(s => s.available); }
  // Chune hue slot ke baad service ke poore time mein jo slots aate hain
  isCovered(t: string) {
    if (!this.time || !this.avail) return false;
    const m = (x: string) => { const [h, mi] = x.split(':').map(Number); return h * 60 + mi; };
    return m(t) >= m(this.time) && m(t) < m(this.time) + this.avail.duration;
  }
  tag(s: TimeSlot) {
    switch (s.reason) { case 'past': return 'Passed'; case 'break': return s.label || 'Break'; case 'unavailable': return 'Not working'; default: return 'Booked'; }
  }
  tip(s: TimeSlot) {
    if (s.available) return 'Select ' + to12h(s.time);
    switch (s.reason) {
      case 'past': return 'This time has passed';
      case 'break': return `Not available: ${s.label || 'break'}`;
      case 'unavailable': return 'No stylist is working at this time';
      default: return 'Already booked';
    }
  }
}
