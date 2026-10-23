import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { SalonApiService } from '../../core/services/salon-api.service';
import { BookingModalService } from '../../core/services/booking-modal.service';
import { SectionTitleComponent } from '../../shared/components/section-title.component';
import { ServiceCardComponent } from '../../shared/components/service-card.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [AsyncPipe, SectionTitleComponent, ServiceCardComponent],
  template: `
    <section class="container center">
      <app-section-title eyebrow="Services" title="What We Offer" />
      <div class="grid">
        @for (s of (api.services$ | async) ?? []; track s.title) {
          <app-service-card [service]="s" />
        }
      </div>
      <button class="btn book-btn" (click)="modal.open()">Book now</button>
    </section>
  `,
  styles: [`
    .grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      width: 100%;
      max-width: 1100px;
      margin: 24px auto;
      padding: 0 16px;
      box-sizing: border-box;
    }
    .book-btn { margin-top: 8px; }

    @media (max-width: 992px) {
      .grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .grid { grid-template-columns: repeat(2, 1fr); gap: 14px; padding: 0 12px; }
    }
    @media (max-width: 400px) {
      .grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ServicesComponent {
  api = inject(SalonApiService);
  modal = inject(BookingModalService);
}