import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header.component';
import { FooterComponent } from './shared/components/footer.component';
import { BookingModalComponent } from './shared/components/booking-modal.component';
import { SocialBarComponent } from './shared/components/social-bar.component';
import { PromoPopupComponent } from './shared/components/promo-popup.component';

@Component({
  selector: 'app-root', standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BookingModalComponent, SocialBarComponent, PromoPopupComponent],
  template: `<app-header /><router-outlet /><app-footer /><app-booking-modal /><app-social-bar /><app-promo-popup />`
})
export class AppComponent {}