import { Component } from '@angular/core';
import { SectionTitleComponent } from '../../../shared/components/section-title.component';
import { REVIEWS } from '../home.data';
@Component({
  selector: 'app-reviews-section', standalone: true, imports: [SectionTitleComponent],
  template: `<section class="soft center"><div class="container"><app-section-title eyebrow="Feedback" title="Customer Review" /><br>
    <div class="grid">@for (r of reviews; track r.name) { <div class="card"><p><em>"{{ r.text }}"</em></p><h4>{{ r.name }}</h4></div> }</div></div></section>`,
  styles: [`.soft{background:var(--soft)}.card{background:#fff;padding:26px;border-radius:14px;box-shadow:0 6px 22px #0001}h4{margin-top:10px}`]
})
export class ReviewsSectionComponent { reviews = REVIEWS; }
