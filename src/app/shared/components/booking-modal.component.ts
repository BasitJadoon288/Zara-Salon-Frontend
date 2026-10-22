import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingModalService } from '../../core/services/booking-modal.service';
import { SalonApiService } from '../../core/services/salon-api.service';
import { AppointmentPayload } from '../../core/models/models';
import { BRANCHES } from '../../core/config/salon.config';

const empty = (): AppointmentPayload => ({ name: '', phone: '', email: '', branch: '', service: '', date: '', time: '' });

@Component({
  selector: 'app-booking-modal', standalone: true, imports: [FormsModule, AsyncPipe],
  template: `@if (modal.isOpen()) {
  <div class="overlay" (click)="modal.close()"><div class="box" (click)="$event.stopPropagation()">
    <h2>Get your appointment</h2>
    @if (message) { <div class="msg" [class.err]="isError">{{ message }}</div> }
    <input placeholder="Full name *" [(ngModel)]="form.name">
    <input placeholder="Phone *" [(ngModel)]="form.phone">
    <input placeholder="Email" [(ngModel)]="form.email">
    <div class="two"><input type="date" [(ngModel)]="form.date"><input type="time" [(ngModel)]="form.time"></div>
    <select [(ngModel)]="form.branch"><option value="">Select Branch *</option>@for (b of branches; track b) { <option>{{ b }}</option> }</select>
    <select [(ngModel)]="form.service"><option value="">Select Service *</option>
      @for (s of (api.services$ | async) ?? []; track s.title) { <option>{{ s.title }}</option> }</select>
    <button class="btn" (click)="submit()">Submit</button>
    <button class="btn grey" (click)="modal.close()">Close</button>
  </div></div> }`,
  styles: [`
  .overlay{position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
  .box{background:#fff;padding:30px;border-radius:14px;width:100%;max-width:480px;max-height:92vh;overflow:auto}
  h2{margin-bottom:16px}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grey{background:#999;margin-left:8px}`]
})
export class BookingModalComponent {
  modal = inject(BookingModalService); api = inject(SalonApiService);
  branches = BRANCHES; form = empty(); message = ''; isError = false;

  submit() {
    const f = this.form;
    if (!f.name || !f.phone || !f.date || !f.time || !f.branch || !f.service) { return this.show('Please fill all required fields.', true); }
    this.api.bookAppointment(f).subscribe({
      next: () => { this.form = empty(); this.show('Appointment request sent! We will contact you soon.', false); },
      error: () => this.show('Something went wrong. Try again.', true)
    });
  }
  private show(m: string, err: boolean) { this.message = m; this.isError = err; }
}
