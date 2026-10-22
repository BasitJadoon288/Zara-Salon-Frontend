// import { Component, inject } from '@angular/core';
// import { RouterLink, RouterLinkActive } from '@angular/router';
// import { BookingModalService } from '../../core/services/booking-modal.service';
// import { SALON } from '../../core/config/salon.config';

// @Component({
//   selector: 'app-header', standalone: true, imports: [RouterLink, RouterLinkActive],
//   template: `<header><div class="container bar">
//     <a routerLink="/" class="logo">
//       @if (showLogo) {
//         <img src="assets\images\logo.jpg" [alt]="brand" (error)="showLogo = false">
//       } @else {
//         {{ brand }}
//       }
//     </a>
//     <nav>
//       <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Home</a>
//       <a routerLink="/about" routerLinkActive="on">About Us</a>
//       <a routerLink="/services" routerLinkActive="on">Services</a>
//       <a routerLink="/contact" routerLinkActive="on">Contact</a>
//       <button class="btn" (click)="modal.open()">Appointment</button>
//     </nav></div></header>`,
//   styles: [`
//   header{position:sticky;top:0;background:#fff;box-shadow:0 2px 12px #0001;z-index:50}
//   .bar{display:flex;justify-content:space-between;align-items:center;min-height:78px;flex-wrap:wrap;gap:10px}
//   .logo{font:700 26px 'Playfair Display';color:var(--rose);display:flex;align-items:center}
//   .logo img{height:56px;width:auto}
//   nav{display:flex;gap:22px;align-items:center;flex-wrap:wrap}
//   nav a{font-size:14px;text-transform:uppercase;letter-spacing:1px}nav a.on,nav a:hover{color:var(--rose)}`]
// })
// export class HeaderComponent {
//   modal = inject(BookingModalService);
//   brand = SALON.name;
//   showLogo = true;
// }
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BookingModalService } from '../../core/services/booking-modal.service';
import { SALON } from '../../core/config/salon.config';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header>
      <div class="container bar">
        <a routerLink="/" class="logo">
          @if (showLogo) {
            <img src="assets/images/logo.jpg" [alt]="brand" (error)="showLogo = false">
          } @else {
            <span class="stylish-brand">{{ brand }}</span>
          }
        </a>
        <nav>
          <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/about" routerLinkActive="on">About Us</a>
          <a routerLink="/services" routerLinkActive="on">Services</a>
          <a routerLink="/contact" routerLinkActive="on">Contact</a>
          <button class="btn" (click)="modal.open()">Appointment</button>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    /* Google Fonts Direct Import */
    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600&display=swap');

    header { position: sticky; top: 0; background: #fff; box-shadow: 0 2px 12px #0001; z-index: 50; }
    .bar { display: flex; justify-content: space-between; align-items: center; min-height: 78px; flex-wrap: wrap; gap: 10px; }
    
    .logo { display: flex; align-items: center; text-decoration: none; }
    .logo img { height: 56px; width: auto; }
    
    /* Stylish Cursive Font Forcefully Applied */
    .stylish-brand {
      font-family: 'Great Vibes', 'Dancing Script', cursive !important;
      font-size: 38px !important;
      font-weight: 500 !important;
      color: var(--rose, #b02a5b) !important;
      letter-spacing: 1px;
      line-height: 1;
      display: inline-block;
    }

    nav { display: flex; gap: 22px; align-items: center; flex-wrap: wrap; }
    nav a { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; color: #333; }
    nav a.on, nav a:hover { color: var(--rose, #b02a5b); }
  `]
})
export class HeaderComponent {
  modal = inject(BookingModalService);
  brand = SALON.name;
  
  // Agar aap logo image ki jagah direct text dikhana chahte hain toh ise false rakhein:
  showLogo = false; 
}