import { Component, inject } from '@angular/core';
import { BookingModalService } from '../../../core/services/booking-modal.service';
@Component({
  selector: 'app-promo-section', standalone: true,
  template: `<section class="promo center"><p class="eyebrow" style="color:#fff">Book Online Now</p><h2>Save up to 20% off</h2>
    <button class="btn outline" (click)="modal.open()">Book Appointment</button></section>`,
  styles: [`.promo{background:linear-gradient(135deg,var(--rose),#6d1236);color:#fff}.promo h2{color:#fff;margin:6px 0 18px;font-size:40px}`]
})
export class PromoSectionComponent { modal = inject(BookingModalService); }
