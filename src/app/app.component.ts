import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header.component';
import { FooterComponent } from './shared/components/footer.component';
import { BookingModalComponent } from './shared/components/booking-modal.component';
import { SocialBarComponent } from './shared/components/social-bar.component';

@Component({
  selector: 'app-root', standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BookingModalComponent, SocialBarComponent],
  template: `<app-header /><router-outlet /><app-footer /><app-booking-modal /><app-social-bar />`
})
export class AppComponent {}