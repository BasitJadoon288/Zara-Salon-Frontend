import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SalonApiService } from '../../../core/services/salon-api.service';
import { SectionTitleComponent } from '../../../shared/components/section-title.component';
import { DEFAULT_ABOUT } from '../../../core/config/about.default';
import { AboutInfo } from '../../../core/models/models';

@Component({
  selector: 'app-about-section', standalone: true, imports: [RouterLink, SectionTitleComponent],
  template: `<section class="container wrap">
    @if (showImage) {
      <img class="pic" src="assets/images/about.jpg" alt="Our salon" (error)="showImage = false">
    } @else {
      <div class="pic emoji">🌹</div>
    }
    <div>
      <app-section-title eyebrow="About" [title]="about().title" />
      <p>{{ firstParagraph() }}</p><br>
      <a routerLink="/about" class="btn">Learn more</a>
    </div></section>`,
  styles: [`
  .wrap{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
  .pic{width:100%;height:380px;object-fit:cover;border-radius:20px}
  .emoji{display:flex;align-items:center;justify-content:center;font-size:150px;background:var(--soft)}
  @media(max-width:760px){.wrap{grid-template-columns:1fr}.pic{height:260px}}`]
})
export class AboutSectionComponent {
  showImage = true; // about.jpg: assets/images/ mein rakhein (ya apna rasta yahan likhein)
  about = signal<AboutInfo>(DEFAULT_ABOUT);

  constructor() {
    inject(SalonApiService).getAbout().subscribe({ next: a => { if (a) this.about.set(a); }, error: () => {} });
  }
  firstParagraph() { return this.about().text.split(/\n\s*\n/)[0]; }
}
