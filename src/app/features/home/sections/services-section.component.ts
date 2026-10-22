import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { SectionTitleComponent } from '../../../shared/components/section-title.component';
import { ServiceCardComponent } from '../../../shared/components/service-card.component';
@Component({
  selector: 'app-services-section', standalone: true, imports: [AsyncPipe, SectionTitleComponent, ServiceCardComponent],
  template: `<section class="container center"><app-section-title eyebrow="Services" title="Premium Quality" /><br>
    <div class="grid">@for (s of (api.services$ | async) ?? []; track s.title) { <app-service-card [service]="s" /> }</div></section>`
})
export class ServicesSectionComponent { api = inject(SalonApiService); }
