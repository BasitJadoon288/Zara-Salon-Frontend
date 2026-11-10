import { Component, OnDestroy, effect, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BookingModalService } from '../../core/services/booking-modal.service';
import { SalonApiService } from '../../core/services/salon-api.service';
import { AppointmentPayload, BookingResult, BookingRules, StylistLite } from '../../core/models/models';
import { BRANCHES } from '../../core/config/salon.config';
import { SlotPickerComponent } from './slot-picker.component';

const empty = (): AppointmentPayload => ({ name: '', phone: '', email: '', branch: '', service: '', date: '', time: '', stylistId: '', otp: '' });
const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' }); // yyyy-mm-dd

@Component({
  selector: 'app-booking-modal', standalone: true, imports: [FormsModule, AsyncPipe, RouterLink, SlotPickerComponent],
  template: `@if (modal.isOpen()) {
  <div class="overlay" (click)="close()"><div class="box" (click)="$event.stopPropagation()">
    @if (done) {
      <h2>Request sent</h2>
      <div class="msg">Your appointment request was sent{{ done.stylistName ? ' with ' + done.stylistName : '' }}.</div>
      <p class="lead">Your booking code</p>
      <div class="code">{{ done.code }}</div>
      <button class="btn small" type="button" (click)="copy(done.code)">{{ copied ? 'Copied!' : 'Copy code' }}</button>
      <p class="fine">Please save this code. You can change or cancel your appointment with it{{ form.email ? ' (we also emailed it to you)' : '' }}.</p>
      @if (done.status === 'pending') {
        <p class="fine">The salon will confirm your request soon.{{ done.holdHours ? ' If it is not confirmed within ' + done.holdHours + ' hours, this time may be given to someone else.' : '' }}</p>
      }
      <a class="manage" [routerLink]="['/manage', done.code]" (click)="close()">Change or cancel this appointment</a>
      <button class="btn" type="button" (click)="again()">Book another</button>
      <button class="btn grey" type="button" (click)="close()">Close</button>
    } @else {
    <h2>Get your appointment</h2>
    @if (message) { <div class="msg" [class.err]="isError">{{ message }}</div> }
    <input placeholder="Full name *" [(ngModel)]="form.name">
    <input placeholder="Phone *" [(ngModel)]="form.phone">
    <input [placeholder]="rules?.requireEmailOtp ? 'Email *' : 'Email'" [(ngModel)]="form.email">
    <select [ngModel]="form.branch" (ngModelChange)="form.branch = $event; changed()"><option value="">Select Branch *</option>@for (b of branches; track b) { <option>{{ b }}</option> }</select>
    <select [ngModel]="form.service" (ngModelChange)="form.service = $event; changed()"><option value="">Select Service *</option>
      @for (s of (api.services$ | async) ?? []; track s.title) { <option [value]="s.title">{{ s.title }}</option> }</select>
    @if (stylists.length) {
      <select [(ngModel)]="form.stylistId" (ngModelChange)="form.time = ''"><option value="">Any available stylist</option>
        @for (s of stylists; track s._id) { <option [value]="s._id">{{ s.name }}</option> }</select>
    }
    <input type="date" [min]="today" [ngModel]="form.date" (ngModelChange)="form.date = $event; form.time = ''">

    <app-slot-picker [branch]="form.branch" [service]="form.service" [date]="form.date" [stylist]="form.stylistId || ''"
      [time]="form.time" [reload]="reloadSlots" (timeChange)="form.time = $event" />

    @if (rules?.requireEmailOtp) {
      <div class="otp">
        <div class="note">To keep bookings genuine, we send a 6 digit code to your email.</div>
        <button class="btn small" type="button" (click)="sendCode()" [disabled]="otpBusy || cooldown > 0">
          {{ otpBusy ? 'Sending...' : cooldown > 0 ? 'Resend in ' + cooldown + 's' : (otpSent ? 'Resend code' : 'Send code to my email') }}</button>
        @if (otpSent) { <div class="note ok">Code sent. Check your inbox (and spam folder).</div> }
        <input placeholder="6 digit code *" inputmode="numeric" maxlength="6" [(ngModel)]="form.otp">
      </div>
    }

    <button class="btn" (click)="submit()" [disabled]="sending">{{ sending ? 'Sending...' : 'Submit' }}</button>
    <button class="btn grey" (click)="close()">Close</button>
    <a class="manage" routerLink="/manage" (click)="close()">Already booked? Change or cancel</a>
    }
  </div></div> }`,
  styles: [`
  .overlay{position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
  .box{background:var(--surface);color:var(--text);box-shadow:0 0 0 1px var(--card-ring);padding:30px;border-radius:14px;width:100%;max-width:480px;max-height:92vh;overflow:auto}
  h2{margin-bottom:16px}.grey{background:#999;margin-left:8px}
  .btn[disabled]{opacity:.6;cursor:default}
  .btn.small{padding:8px 16px;font-size:13px;margin-bottom:12px}
  .note{font-size:13px;color:var(--muted);margin-bottom:8px}.note.ok{color:var(--msg-ok-ink)}
  .otp{margin:0 0 16px}.otp input{margin-top:8px}
  .lead{margin:14px 0 6px;color:var(--muted);font-size:13px}
  .code{animation:popIn .5s var(--ease-spring) .15s backwards;font:700 26px 'Poppins',sans-serif;letter-spacing:4px;margin-bottom:10px;color:var(--rose-ink);word-break:break-all}
  .fine{font-size:13px;color:var(--muted);margin:0 0 10px}
  .manage{display:block;margin:12px 0;font-size:13px;color:var(--rose-ink);text-decoration:underline}`]
})
export class BookingModalComponent implements OnDestroy {
  modal = inject(BookingModalService); api = inject(SalonApiService);
  branches = BRANCHES; form = empty(); message = ''; isError = false; sending = false;
  today = todayStr(); reloadSlots = 0;
  rules: BookingRules | null = null; stylists: StylistLite[] = [];
  done: BookingResult | null = null; copied = false;
  otpSent = false; otpBusy = false; cooldown = 0; private timer?: ReturnType<typeof setInterval>;

  constructor() {
    // Form khulte hi rules mangwayen (email code chahiye ya nahi)
    effect(() => { if (this.modal.isOpen()) this.api.getRules().subscribe({ next: r => this.rules = r, error: () => this.rules = null }); });
  }
  ngOnDestroy() { clearInterval(this.timer); }

  // Booking ho chuki ho to band karte waqt form saaf (warna purana, ab booked waqt dobara dikhta). Booking nahi hui to bhari hui fields wahin rehti hain.
  close() {
    if (this.done) { this.form = empty(); this.stylists = []; this.otpSent = false; }
    this.modal.close(); this.done = null; this.message = '';
  }
  again() { const { name, phone, email, branch, service, date } = this.form; this.form = { ...empty(), name, phone, email, branch, service, date }; this.done = null; this.message = ''; this.otpSent = false; this.changed(true); }

  // Branch ya service badalne par us ke stylists mangwayen
  changed(keep = false) {
    this.form.time = ''; if (!keep) this.form.stylistId = '';
    this.stylists = [];
    const { branch, service } = this.form;
    if (branch && service) this.api.getStylists(branch, service).subscribe({ next: l => { if (this.form.branch === branch && this.form.service === service) this.stylists = l; }, error: () => this.stylists = [] });
  }

  copy(code: string) {
    navigator.clipboard?.writeText(code).then(() => { this.copied = true; setTimeout(() => this.copied = false, 2000); }).catch(() => {});
  }

  sendCode() {
    const email = this.form.email.trim();
    if (!email) return this.show('Please enter your email first.', true);
    this.otpBusy = true;
    this.api.requestOtp(email).subscribe({
      next: r => { this.otpBusy = false; this.otpSent = true; this.message = ''; this.startCooldown(r.resendIn || 60); },
      error: e => { this.otpBusy = false; this.show(e.error?.error || 'Could not send the code. Try again.', true); }
    });
  }
  private startCooldown(sec: number) {
    clearInterval(this.timer); this.cooldown = sec;
    this.timer = setInterval(() => { this.cooldown--; if (this.cooldown <= 0) clearInterval(this.timer); }, 1000);
  }

  submit() {
    const f = this.form;
    if (!f.name || !f.phone || !f.date || !f.branch || !f.service) { return this.show('Please fill all required fields.', true); }
    if (!f.time) { return this.show('Please choose an available time.', true); }
    if (this.rules?.requireEmailOtp) {
      if (!f.email) return this.show('Email is required.', true);
      if (!/^\d{6}$/.test(f.otp || '')) return this.show('Enter the 6 digit code sent to your email.', true);
    }
    this.sending = true; this.message = '';
    this.api.bookAppointment({ ...f, stylistId: f.stylistId || undefined, otp: f.otp || undefined }).subscribe({
      next: r => { this.sending = false; this.done = r; this.otpSent = false; },
      error: e => {
        this.sending = false;
        this.show(e.error?.error || 'Something went wrong. Try again.', true);
        if (e.status === 409) { this.form.time = ''; this.reloadSlots++; } // kisi aur ne ye waqt le liya: sirf slots taza karein, baaki fields na chhedein
      }
    });
  }
  private show(m: string, err: boolean) { this.message = m; this.isError = err; }
}
