import { Component, ViewEncapsulation, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SALON } from '../../core/config/salon.config';
import { Role } from '../../core/models/models';

interface NavItem { label: string; path: string; icon: string; roles: Role[]; }

const NAV: NavItem[] = [
  { label: 'Dashboard', path: 'dashboard', icon: 'fa-solid fa-gauge', roles: ['admin'] },
  { label: 'Appointments', path: 'appointments', icon: 'fa-solid fa-calendar-check', roles: ['admin', 'staff'] },
  { label: 'Reviews', path: 'reviews', icon: 'fa-solid fa-star', roles: ['admin'] },
  { label: 'Services', path: 'services', icon: 'fa-solid fa-spa', roles: ['admin'] },
  { label: 'About page', path: 'about', icon: 'fa-solid fa-circle-info', roles: ['admin'] },
  { label: 'Rate list popup', path: 'rate-list', icon: 'fa-solid fa-tags', roles: ['admin'] },
  { label: 'Messages', path: 'messages', icon: 'fa-solid fa-envelope', roles: ['admin'] },
  { label: 'Staff accounts', path: 'staff', icon: 'fa-solid fa-user-group', roles: ['admin'] }
];

@Component({
  selector: 'app-admin-layout', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive],
  encapsulation: ViewEncapsulation.None, // is file ki styles poore admin portal par lagti hain
  template: `<div class="adm">
    <aside class="adm-side" [class.open]="open()">
      <div class="adm-brand">{{ salon }}<small>Admin portal</small></div>
      <nav>
        @for (i of items(); track i.path) {
          <a [routerLink]="i.path" routerLinkActive="on" (click)="open.set(false)"><i [class]="i.icon"></i>{{ i.label }}</a>
        }
      </nav>
      <div class="adm-user">
        <b>{{ auth.user()?.name }}</b><span>{{ auth.user()?.role }}</span>
        <button class="adm-btn" (click)="auth.logout()"><i class="fa-solid fa-right-from-bracket"></i>Log out</button>
      </div>
    </aside>
    @if (open()) { <div class="adm-shade" (click)="open.set(false)"></div> }
    <div class="adm-main">
      <header class="adm-top"><button class="adm-btn ghost" (click)="open.set(true)" aria-label="Open menu"><i class="fa-solid fa-bars"></i></button>{{ salon }}</header>
      <main class="adm-page"><router-outlet /></main>
    </div>
  </div>`,
  styles: [`
  app-admin-layout{display:block;flex:1}
  .adm{display:flex;min-height:100vh;background:#faf5f7;color:#3a2a31;font-size:14px}
  .adm-side{width:240px;flex:none;background:var(--dark);color:#e9d6de;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
  .adm-brand{padding:22px 20px;font:700 20px 'Playfair Display',serif;color:#fff;line-height:1.2}
  .adm-brand small{display:block;font:400 12px Poppins,sans-serif;color:#c9a9b6;margin-top:4px}
  .adm-side nav{flex:1;padding:8px 10px;overflow:auto}
  .adm-side nav a{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:10px;color:#e9d6de;margin-bottom:2px}
  .adm-side nav a i{width:18px;text-align:center;opacity:.85}
  .adm-side nav a:hover{background:#ffffff14}
  .adm-side nav a.on{background:var(--rose);color:#fff}
  .adm-user{padding:16px;border-top:1px solid #ffffff1f}
  .adm-user b{display:block;color:#fff}
  .adm-user span{font-size:12px;color:#c9a9b6;text-transform:capitalize}
  .adm-user .adm-btn{width:100%;margin-top:12px;justify-content:center;background:#ffffff14}
  .adm-main{flex:1;min-width:0}
  .adm-top{display:none}
  .adm-page{padding:28px 32px;max-width:1200px}
  .adm-shade{display:none}

  .adm h2{font-size:26px}
  .adm h3{font-size:18px;margin-bottom:12px}
  .adm input,.adm select,.adm textarea{margin:0}
  .adm-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}
  .adm-inline{display:flex;align-items:center;gap:10px}
  .adm-inline input{width:auto}
  .adm-note{color:#8a7580}
  .adm-card{background:#fff;border:1px solid #efdfe6;border-radius:12px;padding:20px;margin-bottom:20px}
  .adm-form{display:grid;gap:12px;max-width:560px}
  .adm-form label{font-size:13px;color:#6b5560;margin-bottom:-6px}
  .adm-row{display:flex;gap:10px;flex-wrap:wrap}
  .adm-filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:center}
  .adm-scroll{overflow:auto}
  .adm-empty{padding:26px;text-align:center;color:#8a7580}

  .adm-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:8px;padding:9px 16px;background:var(--rose);color:#fff;font:500 13px Poppins,sans-serif;cursor:pointer}
  .adm-btn:disabled{opacity:.6;cursor:default}
  .adm-btn.ghost{background:transparent;color:var(--rose);border:1px solid #e3c3d0}
  .adm-btn.danger{background:#a12222}
  .adm-btn.sm{padding:6px 12px}
  .adm-wa{display:inline-flex;align-items:center;gap:6px;background:#25d366;color:#fff;padding:6px 12px;border-radius:8px;font-size:13px;white-space:nowrap}

  .adm-table{width:100%;border-collapse:collapse}
  .adm-table th,.adm-table td{padding:10px 12px;text-align:left;border-bottom:1px solid #f1e5ea;vertical-align:top}
  .adm-table th{font-weight:600;color:#6b5560;background:#fdf2f6;white-space:nowrap}
  .adm-table td select{width:auto}
  .badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:500;text-transform:capitalize}
  .badge.pending{background:#fff3d6;color:#8a5a00}
  .badge.confirmed{background:#dff5e6;color:#1d6b3b}
  .badge.cancelled{background:#fde8e8;color:#a12222}

  .adm-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
  .st{border-left:4px solid #d9c3cc;padding:4px 14px}
  .st b{display:block;font:600 34px 'Playfair Display',serif;line-height:1.15;color:var(--dark)}
  .st span{color:#8a7580}
  .st.warn{border-color:#e0a21b}.st.ok{border-color:#2f9e5a}.st.bad{border-color:#c0392b}
  .adm-bars{display:flex;gap:10px;align-items:flex-end;height:170px;padding-top:10px}
  .adm-bars .bar{flex:1;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}
  .adm-bars .bar i{display:block;width:100%;max-width:46px;background:var(--rose);border-radius:6px 6px 0 0;min-height:3px}
  .adm-bars .bar span{font-size:12px;color:#8a7580;text-align:center}
  .adm-stars{color:#e0a21b;letter-spacing:2px}
  .adm-preview{width:220px;max-height:320px;object-fit:contain;border:1px solid #efdfe6;border-radius:10px;background:#fafafa}
  .adm-chk{display:flex;align-items:center;gap:8px;font-size:14px;color:#3a2a31}
  .adm-chk input{width:auto}

  @media(max-width:860px){
    .adm-side{position:fixed;left:0;top:0;z-index:70;transform:translateX(-100%);transition:transform .2s}
    .adm-side.open{transform:none}
    .adm-shade{display:block;position:fixed;inset:0;background:#0006;z-index:60}
    .adm-top{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#fff;border-bottom:1px solid #efdfe6;font:700 17px 'Playfair Display',serif;color:var(--rose)}
    .adm-page{padding:20px 16px}
  }`]
})
export class AdminLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  salon = SALON.name;
  open = signal(false);
  items = computed(() => { const r = this.auth.role(); return r ? NAV.filter(n => n.roles.includes(r)) : []; });

  constructor() {
    // Logout ya session khatam hone par khud login page par
    effect(() => { if (!this.auth.token()) this.router.navigateByUrl('/admin/login'); });
  }
}
