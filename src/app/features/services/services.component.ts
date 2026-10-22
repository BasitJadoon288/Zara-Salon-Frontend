import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { SalonApiService } from '../../core/services/salon-api.service';
import { BookingModalService } from '../../core/services/booking-modal.service';
import { SectionTitleComponent } from '../../shared/components/section-title.component';
import { ServiceCardComponent } from '../../shared/components/service-card.component';
@Component({
  selector: 'app-services', standalone: true, imports: [AsyncPipe, SectionTitleComponent, ServiceCardComponent],
  template: `<section class="container center"><app-section-title eyebrow="Services" title="What We Offer" /><br>
    <div class="grid">@for (s of (api.services$ | async) ?? []; track s.title) { <app-service-card [service]="s" /> }</div><br>
    <button class="btn" (click)="modal.open()">Book now</button></section>`
})
export class ServicesComponent { api = inject(SalonApiService); modal = inject(BookingModalService); }
