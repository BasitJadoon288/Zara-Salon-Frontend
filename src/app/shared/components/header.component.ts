import { Component, inject, signal, HostListener } from '@angular/core';
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
        <a routerLink="/" class="logo" (click)="closeMenu()">
          @if (showLogo) {
            <img src="assets/images/logo.jpg" [alt]="brand" (error)="showLogo = false">
          } @else {
            <span class="stylish-brand">{{ brand }}</span>
          }
        </a>

        <button
          class="menu-toggle"
          type="button"
          [class.open]="menuOpen()"
          (click)="toggleMenu()"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="main-nav"
          aria-label="Toggle navigation menu">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav id="main-nav" [class.open]="menuOpen()">
          <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">Home</a>
          <a routerLink="/about" routerLinkActive="on" (click)="closeMenu()">About Us</a>
          <a routerLink="/services" routerLinkActive="on" (click)="closeMenu()">Services</a>
          <a routerLink="/contact" routerLinkActive="on" (click)="closeMenu()">Contact</a>
          <button class="btn" type="button" (click)="bookAppointment()">Appointment</button>
        </nav>
      </div>
    </header>
  `,
  styles: [`
    /* Google Fonts Direct Import */
    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Dancing+Script:wght@600&display=swap');

    header {
      position: sticky;
      top: 0;
      background: #fff;
      box-shadow: 0 2px 12px #0001;
      z-index: 50;
    }

    .bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 78px;
      gap: 10px;
      position: relative;
    }

    .logo { display: flex; align-items: center; text-decoration: none; }
    .logo img { height: 56px; width: auto; max-width: 100%; }

    .stylish-brand {
      font-family: 'Great Vibes', 'Dancing Script', cursive !important;
      font-size: 38px !important;
      font-weight: 500 !important;
      color: var(--rose, #b02a5b) !important;
      letter-spacing: 1px;
      line-height: 1;
      display: inline-block;
    }

    nav { display: flex; gap: 22px; align-items: center; }
    nav a {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-decoration: none;
      color: #333;
    }
    nav a.on, nav a:hover { color: var(--rose, #b02a5b); }

    /* Hamburger button - hidden on desktop */
    .menu-toggle {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 44px;
      height: 44px;
      padding: 10px;
      background: none;
      border: 0;
      cursor: pointer;
      border-radius: 8px;
    }
    .menu-toggle span {
      display: block;
      height: 2px;
      width: 100%;
      background: #333;
      border-radius: 2px;
      transition: transform .3s ease, opacity .3s ease;
    }
    .menu-toggle.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .menu-toggle.open span:nth-child(2) { opacity: 0; }
    .menu-toggle.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    /* Tablet & Mobile */
    @media (max-width: 768px) {
      .bar { min-height: 64px; }
      .logo img { height: 44px; }
      .stylish-brand { font-size: 30px !important; }

      .menu-toggle { display: flex; }

      nav {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        background: #fff;
        box-shadow: 0 10px 20px #0002;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        visibility: hidden;
        transition: max-height .35s ease, opacity .25s ease, visibility .35s;
      }
      nav.open {
        max-height: 420px;
        opacity: 1;
        visibility: visible;
      }

      nav a {
        padding: 16px 20px;
        font-size: 15px;
        border-bottom: 1px solid #f0f0f0;
      }

      nav .btn {
        margin: 16px 20px;
        padding: 12px;
        text-align: center;
      }
    }

    @media (max-width: 380px) {
      .stylish-brand { font-size: 26px !important; }
    }
  `]
})
export class HeaderComponent {
  modal = inject(BookingModalService);
  brand = SALON.name;

  // Agar aap logo image ki jagah direct text dikhana chahte hain toh ise false rakhein:
  showLogo = false;

  menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update(v => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  bookAppointment() {
    this.closeMenu();
    this.modal.open();
  }

  // Escape press karne par menu band ho jaye
  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMenu();
  }

  // Desktop size par resize ho to menu state reset ho jaye
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth > 768 && this.menuOpen()) {
      this.closeMenu();
    }
  }
}