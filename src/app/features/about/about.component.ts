// import { Component } from '@angular/core';
// import { SectionTitleComponent } from '../../shared/components/section-title.component';

// @Component({
//   selector: 'app-about',
//   standalone: true,
//   imports: [SectionTitleComponent],
//   template: `
//     <section class="container py-12">
//       <app-section-title eyebrow="About Us" title="Our Story" />
      
//       <div class="mt-6 space-y-4 text-gray-700 leading-relaxed max-w-3xl">
//         <p>
//           Founded with a passion for modern elegance and timeless beauty, Zara Beauty Studio was created to offer a world-class sanctuary for women in Karachi. We believe that true beauty shines brightest when you feel relaxed, valued, and genuinely pampered.
//         </p>
//         <p>
//           From our serene ambiance and strict hygiene standards to our team of highly skilled makeup artists, hair specialists, and skincare experts, every detail is crafted to give you an unforgettable luxury experience. Whether you are preparing for your big day with our signature bridal makeover or indulging in routine self-care, we are dedicated to bringing out your best confidence.
//         </p>
//       </div>
//     </section>
//   `
// })
// export class AboutComponent {}
import { Component } from '@angular/core';
import { SectionTitleComponent } from '../../shared/components/section-title.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [SectionTitleComponent],
  template: `
    <section class="container py-12">
      <app-section-title eyebrow="About Us" title="Our Story" />
      
      <div class="mt-6 space-y-4 text-gray-700 leading-relaxed max-w-3xl">
        <p>
          Founded with a passion for modern elegance and timeless beauty, 
          <span class="stylish-brand">Zara Beauty Studio</span> 
          was created to offer a world-class sanctuary for women in Karachi. We believe that true beauty shines brightest when you feel relaxed, valued, and genuinely pampered.
        </p>
        <p>
          From our serene ambiance and strict hygiene standards to our team of highly skilled makeup artists, hair specialists, and skincare experts, every detail is crafted to give you an unforgettable luxury experience. Whether you are preparing for your big day with our signature bridal makeover or indulging in routine self-care, we are dedicated to bringing out your best confidence.
        </p>
      </div>
    </section>
  `,
  styles: [`
    /* Google Fonts Direct Import */
    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600&display=swap');

    /* Stylish Cursive Styling for Brand Name */
    .stylish-brand {
      font-family: 'Great Vibes', 'Dancing Script', cursive !important;
      font-size: 1.4em !important;
      font-weight: 600 !important;
      color: var(--rose, #b02a5b) !important;
      display: inline-block;
      vertical-align: middle;
      padding: 0 4px;
    }
  `]
})
export class AboutComponent {}