import { Component, inject, signal } from '@angular/core';
import { SalonApiService } from '../../core/services/salon-api.service';
import { SectionTitleComponent } from '../../shared/components/section-title.component';
import { DEFAULT_ABOUT } from '../../core/config/about.default';
import { AboutInfo } from '../../core/models/models';

@Component({
  selector: 'app-about', standalone: true, imports: [SectionTitleComponent],
  template: `<section class="container"><app-section-title eyebrow="About Us" [title]="about().title" /><br>
    @for (p of paragraphs(); track $index) { <p style="margin-bottom:14px">{{ p }}</p> }</section>`
})
export class AboutComponent {
  about = signal<AboutInfo>(DEFAULT_ABOUT);

  constructor() {
    inject(SalonApiService).getAbout().subscribe({ next: a => { if (a) this.about.set(a); }, error: () => {} });
  }
  paragraphs() { return this.about().text.split(/\n\s*\n/).filter(p => p.trim()); }
}
