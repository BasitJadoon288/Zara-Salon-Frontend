import { Component, inject, signal } from '@angular/core';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { SectionTitleComponent } from '../../../shared/components/section-title.component';
import { Review } from '../../../core/models/models';
import { REVIEWS } from '../home.data';

@Component({
  selector: 'app-reviews-section', standalone: true, imports: [SectionTitleComponent],
  template: `<section class="soft center"><div class="container"><app-section-title eyebrow="Feedback" title="Customer Review" /><br>
    <div class="grid">@for (r of reviews(); track $index) {
      <div class="card"><div class="stars">{{ '★'.repeat(r.rating) }}</div><p><em>"{{ r.text }}"</em></p><h4>{{ r.name }}</h4></div>
    }</div></div></section>`,
  styles: [`.soft{background:var(--soft)}.card{background:#fff;padding:26px;border-radius:14px;box-shadow:0 6px 22px #0001}h4{margin-top:10px}.stars{color:#e0a21b;letter-spacing:3px;margin-bottom:8px}`]
})
export class ReviewsSectionComponent {
  // Backend se na mile to purane example reviews dikhte hain
  reviews = signal<Review[]>(REVIEWS.map(r => ({ ...r, rating: 5, visible: true })));

  constructor() {
    inject(SalonApiService).getReviews().subscribe({ next: l => { if (l.length) this.reviews.set(l); }, error: () => {} });
  }
}
