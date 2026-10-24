import { Component, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter } from "rxjs";
import { HeaderComponent } from "./shared/components/header.component";
import { FooterComponent } from "./shared/components/footer.component";
import { BookingModalComponent } from "./shared/components/booking-modal.component";
import { SocialBarComponent } from "./shared/components/social-bar.component";
import { PromoPopupComponent } from "./shared/components/promo-popup.component";

@Component({
  selector: "app-root", standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, BookingModalComponent, SocialBarComponent, PromoPopupComponent],
  template: `
    @if (!isAdmin()) { <app-header /> }
    <router-outlet />
    @if (!isAdmin()) { <app-footer /><app-booking-modal /><app-social-bar /><app-promo-popup /> }`
})
export class AppComponent {
  // Admin portal par website ka header, footer, popup waghera nahi dikhte
  isAdmin = signal(window.location.pathname.startsWith("/admin"));

  constructor() {
    inject(Router).events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(e => this.isAdmin.set(e.urlAfterRedirects.startsWith("/admin")));
  }
}
