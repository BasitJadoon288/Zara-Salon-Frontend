// import { Component } from '@angular/core';
// import { RouterLink } from '@angular/router';
// import { SectionTitleComponent } from '../../../shared/components/section-title.component';

// @Component({
//   selector: 'app-about-section', standalone: true, imports: [RouterLink, SectionTitleComponent],
//   template: `<section class="container wrap">
//     @if (showImage) {
//       <img class="pic" src="assets/images/services/about.jpg" alt="Our salon" (error)="showImage = false">
//     } @else {
//       <div class="pic emoji">🌹</div>
//     }
//     <div>
//       <app-section-title eyebrow="About" title="Zara Beauty Studio" />
//       <p>Zara Beauty Studio is a full-service salon offering bridal makeup, hair, skin and body care. Our trained team focuses on hygiene, quality products and a relaxing experience.</p><br>
//       <a routerLink="/about" class="btn">Learn more</a>
//     </div></section>`,
//   styles: [`
//   .wrap{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
//   .pic{width:100%;height:380px;object-fit:cover;border-radius:20px}
//   .emoji{display:flex;align-items:center;justify-content:center;font-size:150px;background:var(--soft)}
//   @media(max-width:760px){.wrap{grid-template-columns:1fr}.pic{height:260px}}`]
// })
// export class AboutSectionComponent {
//   showImage = true;
// }
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SectionTitleComponent } from '../../../shared/components/section-title.component';

@Component({
  selector: 'app-about-section',
  standalone: true,
  imports: [RouterLink, SectionTitleComponent],
  template: `
    <section class="container wrap">
      @if (showImage) {
        <img class="pic" src="assets/images/services/about.jpg" alt="Our salon" (error)="showImage = false">
      } @else {
        <div class="pic emoji">🌹</div>
      }
      <div>
        <!-- Option A: Title me stylish text -->
        <app-section-title eyebrow="About" title="Zara Beauty Studio" />
        
        <p>
          <span class="stylish-brand">Zara Beauty Studio</span> is a full-service salon offering bridal makeup, hair, skin and body care. Our trained team focuses on hygiene, quality products and a relaxing experience.
        </p>
        <br>
        <a routerLink="/about" class="btn">Learn more</a>
      </div>
    </section>
  `,
  styles: [`
    /* Google Fonts Direct Import */
    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600&display=swap');

    .wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
    .pic { width: 100%; height: 380px; object-fit: cover; border-radius: 20px; }
    .emoji { display: flex; align-items: center; justify-content: center; font-size: 150px; background: var(--soft); }
    
    /* Paragraph ke andar Zara Beauty Studio ka stylish font */
    .stylish-brand {
      font-family: 'Great Vibes', 'Dancing Script', cursive !important;
      font-size: 1.35em !important;
      font-weight: 600 !important;
      color: var(--rose, #b02a5b) !important;
      display: inline-block;
      vertical-align: middle;
      padding: 0 3px;
    }

    /* Section title ki heading par bhi stylish font apply karne ke liye */
    ::ng-deep app-section-title h2,
    ::ng-deep app-section-title .title {
      font-family: 'Great Vibes', 'Dancing Script', cursive !important;
      font-size: 42px !important;
      color: var(--rose, #b02a5b) !important;
      font-weight: 500 !important;
    }

    @media(max-width: 760px) {
      .wrap { grid-template-columns: 1fr; }
      .pic { height: 260px; }
    }
  `]
})
export class AboutSectionComponent {
  showImage = true;
}