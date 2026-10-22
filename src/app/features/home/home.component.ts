import { Component } from '@angular/core';
import { HeroSectionComponent } from './sections/hero-section.component';
import { AboutSectionComponent } from './sections/about-section.component';
import { PromoSectionComponent } from './sections/promo-section.component';
import { ServicesSectionComponent } from './sections/services-section.component';
import { ReviewsSectionComponent } from './sections/reviews-section.component';

@Component({
  selector: 'app-home', standalone: true,
  imports: [HeroSectionComponent, AboutSectionComponent, PromoSectionComponent, ServicesSectionComponent, ReviewsSectionComponent],
  template: `<app-hero-section /><app-about-section /><app-promo-section /><app-services-section /><app-reviews-section />`
})
export class HomeComponent {}