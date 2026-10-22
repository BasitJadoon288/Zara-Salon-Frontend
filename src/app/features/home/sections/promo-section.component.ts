import { Component, inject } from '@angular/core';
import { BookingModalService } from '../../../core/services/booking-modal.service';

@Component({
  selector: 'app-promo-section', standalone: true,
  template: `<section class="promo center" [style.background]="bg">
    <p class="eyebrow" style="color:#fff">Book Online Now</p>
    <h2>Save up to 20% off</h2>
    <button class="btn outline" (click)="modal.open()">Book Appointment</button>
  </section>`,
  styles: [`
  .promo{color:#fff;padding:100px 0}
  .promo h2{color:#fff;margin:6px 0 18px;font-size:40px}
  @media(max-width:760px){.promo{padding:70px 0}.promo h2{font-size:30px}}`]
})
export class PromoSectionComponent {
  modal = inject(BookingModalService);

  // 3 layers: andhera overlay (text padhne ke liye), picture, aur picture na mile to gulabi gradient
  bg = "linear-gradient(#0009,#0009), url('assets/images/promo.jpg') center/cover no-repeat, linear-gradient(135deg,#b0285a,#6d1236)";
}